(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
(function(root, factory) {
  if(typeof exports === 'object') {
    module.exports = factory();
  }
  else if(typeof define === 'function' && define.amd) {
    define('GMaps', [], factory);
  }

  root.GMaps = factory();

}(this, function() {

/*!
 * GMaps.js v0.4.18
 * http://hpneo.github.com/gmaps/
 *
 * Copyright 2015, Gustavo Leon
 * Released under the MIT License.
 */

if (!(typeof window.google === 'object' && window.google.maps)) {
  throw 'Google Maps API is required. Please register the following JavaScript library http://maps.google.com/maps/api/js?sensor=true.'
}

var extend_object = function(obj, new_obj) {
  var name;

  if (obj === new_obj) {
    return obj;
  }

  for (name in new_obj) {
    obj[name] = new_obj[name];
  }

  return obj;
};

var replace_object = function(obj, replace) {
  var name;

  if (obj === replace) {
    return obj;
  }

  for (name in replace) {
    if (obj[name] != undefined) {
      obj[name] = replace[name];
    }
  }

  return obj;
};

var array_map = function(array, callback) {
  var original_callback_params = Array.prototype.slice.call(arguments, 2),
      array_return = [],
      array_length = array.length,
      i;

  if (Array.prototype.map && array.map === Array.prototype.map) {
    array_return = Array.prototype.map.call(array, function(item) {
      var callback_params = original_callback_params.slice(0);
      callback_params.splice(0, 0, item);

      return callback.apply(this, callback_params);
    });
  }
  else {
    for (i = 0; i < array_length; i++) {
      callback_params = original_callback_params;
      callback_params.splice(0, 0, array[i]);
      array_return.push(callback.apply(this, callback_params));
    }
  }

  return array_return;
};

var array_flat = function(array) {
  var new_array = [],
      i;

  for (i = 0; i < array.length; i++) {
    new_array = new_array.concat(array[i]);
  }

  return new_array;
};

var coordsToLatLngs = function(coords, useGeoJSON) {
  var first_coord = coords[0],
      second_coord = coords[1];

  if (useGeoJSON) {
    first_coord = coords[1];
    second_coord = coords[0];
  }

  return new google.maps.LatLng(first_coord, second_coord);
};

var arrayToLatLng = function(coords, useGeoJSON) {
  var i;

  for (i = 0; i < coords.length; i++) {
    if (!(coords[i] instanceof google.maps.LatLng)) {
      if (coords[i].length > 0 && typeof(coords[i][0]) === "object") {
        coords[i] = arrayToLatLng(coords[i], useGeoJSON);
      }
      else {
        coords[i] = coordsToLatLngs(coords[i], useGeoJSON);
      }
    }
  }

  return coords;
};


var getElementsByClassName = function (class_name, context) {

    var element,
        _class = class_name.replace('.', '');

    if ('jQuery' in this && context) {
        element = $("." + _class, context)[0];
    } else {
        element = document.getElementsByClassName(_class)[0];
    }
    return element;

};

var getElementById = function(id, context) {
  var element,
  id = id.replace('#', '');

  if ('jQuery' in window && context) {
    element = $('#' + id, context)[0];
  } else {
    element = document.getElementById(id);
  };

  return element;
};

var findAbsolutePosition = function(obj)  {
  var curleft = 0,
      curtop = 0;

  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
  }

  return [curleft, curtop];
};

var GMaps = (function(global) {
  "use strict";

  var doc = document;

  var GMaps = function(options) {
    if (!this) return new GMaps(options);

    options.zoom = options.zoom || 15;
    options.mapType = options.mapType || 'roadmap';

    var self = this,
        i,
        events_that_hide_context_menu = [
          'bounds_changed', 'center_changed', 'click', 'dblclick', 'drag',
          'dragend', 'dragstart', 'idle', 'maptypeid_changed', 'projection_changed',
          'resize', 'tilesloaded', 'zoom_changed'
        ],
        events_that_doesnt_hide_context_menu = ['mousemove', 'mouseout', 'mouseover'],
        options_to_be_deleted = ['el', 'lat', 'lng', 'mapType', 'width', 'height', 'markerClusterer', 'enableNewStyle'],
        identifier = options.el || options.div,
        markerClustererFunction = options.markerClusterer,
        mapType = google.maps.MapTypeId[options.mapType.toUpperCase()],
        map_center = new google.maps.LatLng(options.lat, options.lng),
        zoomControl = options.zoomControl || true,
        zoomControlOpt = options.zoomControlOpt || {
          style: 'DEFAULT',
          position: 'TOP_LEFT'
        },
        zoomControlStyle = zoomControlOpt.style || 'DEFAULT',
        zoomControlPosition = zoomControlOpt.position || 'TOP_LEFT',
        panControl = options.panControl || true,
        mapTypeControl = options.mapTypeControl || true,
        scaleControl = options.scaleControl || true,
        streetViewControl = options.streetViewControl || true,
        overviewMapControl = overviewMapControl || true,
        map_options = {},
        map_base_options = {
          zoom: this.zoom,
          center: map_center,
          mapTypeId: mapType
        },
        map_controls_options = {
          panControl: panControl,
          zoomControl: zoomControl,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle[zoomControlStyle],
            position: google.maps.ControlPosition[zoomControlPosition]
          },
          mapTypeControl: mapTypeControl,
          scaleControl: scaleControl,
          streetViewControl: streetViewControl,
          overviewMapControl: overviewMapControl
        };

      if (typeof(options.el) === 'string' || typeof(options.div) === 'string') {

          if (identifier.indexOf("#") > -1) {
              this.el = getElementById(identifier, options.context);
          } else {
              this.el = getElementsByClassName.apply(this, [identifier, options.context]);
          }

      } else {
          this.el = identifier;
      }

    if (typeof(this.el) === 'undefined' || this.el === null) {
      throw 'No element defined.';
    }

    window.context_menu = window.context_menu || {};
    window.context_menu[self.el.id] = {};

    this.controls = [];
    this.overlays = [];
    this.layers = []; // array with kml/georss and fusiontables layers, can be as many
    this.singleLayers = {}; // object with the other layers, only one per layer
    this.markers = [];
    this.polylines = [];
    this.routes = [];
    this.polygons = [];
    this.infoWindow = null;
    this.overlay_el = null;
    this.zoom = options.zoom;
    this.registered_events = {};

    this.el.style.width = options.width || this.el.scrollWidth || this.el.offsetWidth;
    this.el.style.height = options.height || this.el.scrollHeight || this.el.offsetHeight;

    google.maps.visualRefresh = options.enableNewStyle;

    for (i = 0; i < options_to_be_deleted.length; i++) {
      delete options[options_to_be_deleted[i]];
    }

    if(options.disableDefaultUI != true) {
      map_base_options = extend_object(map_base_options, map_controls_options);
    }

    map_options = extend_object(map_base_options, options);

    for (i = 0; i < events_that_hide_context_menu.length; i++) {
      delete map_options[events_that_hide_context_menu[i]];
    }

    for (i = 0; i < events_that_doesnt_hide_context_menu.length; i++) {
      delete map_options[events_that_doesnt_hide_context_menu[i]];
    }

    this.map = new google.maps.Map(this.el, map_options);

    if (markerClustererFunction) {
      this.markerClusterer = markerClustererFunction.apply(this, [this.map]);
    }

    var buildContextMenuHTML = function(control, e) {
      var html = '',
          options = window.context_menu[self.el.id][control];

      for (var i in options){
        if (options.hasOwnProperty(i)) {
          var option = options[i];

          html += '<li><a id="' + control + '_' + i + '" href="#">' + option.title + '</a></li>';
        }
      }

      if (!getElementById('gmaps_context_menu')) return;

      var context_menu_element = getElementById('gmaps_context_menu');
      
      context_menu_element.innerHTML = html;

      var context_menu_items = context_menu_element.getElementsByTagName('a'),
          context_menu_items_count = context_menu_items.length,
          i;

      for (i = 0; i < context_menu_items_count; i++) {
        var context_menu_item = context_menu_items[i];

        var assign_menu_item_action = function(ev){
          ev.preventDefault();

          options[this.id.replace(control + '_', '')].action.apply(self, [e]);
          self.hideContextMenu();
        };

        google.maps.event.clearListeners(context_menu_item, 'click');
        google.maps.event.addDomListenerOnce(context_menu_item, 'click', assign_menu_item_action, false);
      }

      var position = findAbsolutePosition.apply(this, [self.el]),
          left = position[0] + e.pixel.x - 15,
          top = position[1] + e.pixel.y- 15;

      context_menu_element.style.left = left + "px";
      context_menu_element.style.top = top + "px";

      context_menu_element.style.display = 'block';
    };

    this.buildContextMenu = function(control, e) {
      if (control === 'marker') {
        e.pixel = {};

        var overlay = new google.maps.OverlayView();
        overlay.setMap(self.map);
        
        overlay.draw = function() {
          var projection = overlay.getProjection(),
              position = e.marker.getPosition();
          
          e.pixel = projection.fromLatLngToContainerPixel(position);

          buildContextMenuHTML(control, e);
        };
      }
      else {
        buildContextMenuHTML(control, e);
      }
    };

    this.setContextMenu = function(options) {
      window.context_menu[self.el.id][options.control] = {};

      var i,
          ul = doc.createElement('ul');

      for (i in options.options) {
        if (options.options.hasOwnProperty(i)) {
          var option = options.options[i];

          window.context_menu[self.el.id][options.control][option.name] = {
            title: option.title,
            action: option.action
          };
        }
      }

      ul.id = 'gmaps_context_menu';
      ul.style.display = 'none';
      ul.style.position = 'absolute';
      ul.style.minWidth = '100px';
      ul.style.background = 'white';
      ul.style.listStyle = 'none';
      ul.style.padding = '8px';
      ul.style.boxShadow = '2px 2px 6px #ccc';

      doc.body.appendChild(ul);

      var context_menu_element = getElementById('gmaps_context_menu')

      google.maps.event.addDomListener(context_menu_element, 'mouseout', function(ev) {
        if (!ev.relatedTarget || !this.contains(ev.relatedTarget)) {
          window.setTimeout(function(){
            context_menu_element.style.display = 'none';
          }, 400);
        }
      }, false);
    };

    this.hideContextMenu = function() {
      var context_menu_element = getElementById('gmaps_context_menu');

      if (context_menu_element) {
        context_menu_element.style.display = 'none';
      }
    };

    var setupListener = function(object, name) {
      google.maps.event.addListener(object, name, function(e){
        if (e == undefined) {
          e = this;
        }

        options[name].apply(this, [e]);

        self.hideContextMenu();
      });
    };

    //google.maps.event.addListener(this.map, 'idle', this.hideContextMenu);
    google.maps.event.addListener(this.map, 'zoom_changed', this.hideContextMenu);

    for (var ev = 0; ev < events_that_hide_context_menu.length; ev++) {
      var name = events_that_hide_context_menu[ev];

      if (name in options) {
        setupListener(this.map, name);
      }
    }

    for (var ev = 0; ev < events_that_doesnt_hide_context_menu.length; ev++) {
      var name = events_that_doesnt_hide_context_menu[ev];

      if (name in options) {
        setupListener(this.map, name);
      }
    }

    google.maps.event.addListener(this.map, 'rightclick', function(e) {
      if (options.rightclick) {
        options.rightclick.apply(this, [e]);
      }

      if(window.context_menu[self.el.id]['map'] != undefined) {
        self.buildContextMenu('map', e);
      }
    });

    this.refresh = function() {
      google.maps.event.trigger(this.map, 'resize');
    };

    this.fitZoom = function() {
      var latLngs = [],
          markers_length = this.markers.length,
          i;

      for (i = 0; i < markers_length; i++) {
        if(typeof(this.markers[i].visible) === 'boolean' && this.markers[i].visible) {
          latLngs.push(this.markers[i].getPosition());
        }
      }

      this.fitLatLngBounds(latLngs);
    };

    this.fitLatLngBounds = function(latLngs) {
      var total = latLngs.length,
          bounds = new google.maps.LatLngBounds(),
          i;

      for(i = 0; i < total; i++) {
        bounds.extend(latLngs[i]);
      }

      this.map.fitBounds(bounds);
    };

    this.setCenter = function(lat, lng, callback) {
      this.map.panTo(new google.maps.LatLng(lat, lng));

      if (callback) {
        callback();
      }
    };

    this.getElement = function() {
      return this.el;
    };

    this.zoomIn = function(value) {
      value = value || 1;

      this.zoom = this.map.getZoom() + value;
      this.map.setZoom(this.zoom);
    };

    this.zoomOut = function(value) {
      value = value || 1;

      this.zoom = this.map.getZoom() - value;
      this.map.setZoom(this.zoom);
    };

    var native_methods = [],
        method;

    for (method in this.map) {
      if (typeof(this.map[method]) == 'function' && !this[method]) {
        native_methods.push(method);
      }
    }

    for (i = 0; i < native_methods.length; i++) {
      (function(gmaps, scope, method_name) {
        gmaps[method_name] = function(){
          return scope[method_name].apply(scope, arguments);
        };
      })(this, this.map, native_methods[i]);
    }
  };

  return GMaps;
})(this);

GMaps.prototype.createControl = function(options) {
  var control = document.createElement('div');

  control.style.cursor = 'pointer';
  
  if (options.disableDefaultStyles !== true) {
    control.style.fontFamily = 'Roboto, Arial, sans-serif';
    control.style.fontSize = '11px';
    control.style.boxShadow = 'rgba(0, 0, 0, 0.298039) 0px 1px 4px -1px';
  }

  for (var option in options.style) {
    control.style[option] = options.style[option];
  }

  if (options.id) {
    control.id = options.id;
  }

  if (options.classes) {
    control.className = options.classes;
  }

  if (options.content) {
    if (typeof options.content === 'string') {
      control.innerHTML = options.content;
    }
    else if (options.content instanceof HTMLElement) {
      control.appendChild(options.content);
    }
  }

  if (options.position) {
    control.position = google.maps.ControlPosition[options.position.toUpperCase()];
  }

  for (var ev in options.events) {
    (function(object, name) {
      google.maps.event.addDomListener(object, name, function(){
        options.events[name].apply(this, [this]);
      });
    })(control, ev);
  }

  control.index = 1;

  return control;
};

GMaps.prototype.addControl = function(options) {
  var control = this.createControl(options);
  
  this.controls.push(control);
  this.map.controls[control.position].push(control);

  return control;
};

GMaps.prototype.removeControl = function(control) {
  var position = null,
      i;

  for (i = 0; i < this.controls.length; i++) {
    if (this.controls[i] == control) {
      position = this.controls[i].position;
      this.controls.splice(i, 1);
    }
  }

  if (position) {
    for (i = 0; i < this.map.controls.length; i++) {
      var controlsForPosition = this.map.controls[control.position];

      if (controlsForPosition.getAt(i) == control) {
        controlsForPosition.removeAt(i);

        break;
      }
    }
  }

  return control;
};

GMaps.prototype.createMarker = function(options) {
  if (options.lat == undefined && options.lng == undefined && options.position == undefined) {
    throw 'No latitude or longitude defined.';
  }

  var self = this,
      details = options.details,
      fences = options.fences,
      outside = options.outside,
      base_options = {
        position: new google.maps.LatLng(options.lat, options.lng),
        map: null
      },
      marker_options = extend_object(base_options, options);

  delete marker_options.lat;
  delete marker_options.lng;
  delete marker_options.fences;
  delete marker_options.outside;

  var marker = new google.maps.Marker(marker_options);

  marker.fences = fences;

  if (options.infoWindow) {
    marker.infoWindow = new google.maps.InfoWindow(options.infoWindow);

    var info_window_events = ['closeclick', 'content_changed', 'domready', 'position_changed', 'zindex_changed'];

    for (var ev = 0; ev < info_window_events.length; ev++) {
      (function(object, name) {
        if (options.infoWindow[name]) {
          google.maps.event.addListener(object, name, function(e){
            options.infoWindow[name].apply(this, [e]);
          });
        }
      })(marker.infoWindow, info_window_events[ev]);
    }
  }

  var marker_events = ['animation_changed', 'clickable_changed', 'cursor_changed', 'draggable_changed', 'flat_changed', 'icon_changed', 'position_changed', 'shadow_changed', 'shape_changed', 'title_changed', 'visible_changed', 'zindex_changed'];

  var marker_events_with_mouse = ['dblclick', 'drag', 'dragend', 'dragstart', 'mousedown', 'mouseout', 'mouseover', 'mouseup'];

  for (var ev = 0; ev < marker_events.length; ev++) {
    (function(object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(){
          options[name].apply(this, [this]);
        });
      }
    })(marker, marker_events[ev]);
  }

  for (var ev = 0; ev < marker_events_with_mouse.length; ev++) {
    (function(map, object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(me){
          if(!me.pixel){
            me.pixel = map.getProjection().fromLatLngToPoint(me.latLng)
          }
          
          options[name].apply(this, [me]);
        });
      }
    })(this.map, marker, marker_events_with_mouse[ev]);
  }

  google.maps.event.addListener(marker, 'click', function() {
    this.details = details;

    if (options.click) {
      options.click.apply(this, [this]);
    }

    if (marker.infoWindow) {
      self.hideInfoWindows();
      marker.infoWindow.open(self.map, marker);
    }
  });

  google.maps.event.addListener(marker, 'rightclick', function(e) {
    e.marker = this;

    if (options.rightclick) {
      options.rightclick.apply(this, [e]);
    }

    if (window.context_menu[self.el.id]['marker'] != undefined) {
      self.buildContextMenu('marker', e);
    }
  });

  if (marker.fences) {
    google.maps.event.addListener(marker, 'dragend', function() {
      self.checkMarkerGeofence(marker, function(m, f) {
        outside(m, f);
      });
    });
  }

  return marker;
};

GMaps.prototype.addMarker = function(options) {
  var marker;
  if(options.hasOwnProperty('gm_accessors_')) {
    // Native google.maps.Marker object
    marker = options;
  }
  else {
    if ((options.hasOwnProperty('lat') && options.hasOwnProperty('lng')) || options.position) {
      marker = this.createMarker(options);
    }
    else {
      throw 'No latitude or longitude defined.';
    }
  }

  marker.setMap(this.map);

  if(this.markerClusterer) {
    this.markerClusterer.addMarker(marker);
  }

  this.markers.push(marker);

  GMaps.fire('marker_added', marker, this);

  return marker;
};

GMaps.prototype.addMarkers = function(array) {
  for (var i = 0, marker; marker=array[i]; i++) {
    this.addMarker(marker);
  }

  return this.markers;
};

GMaps.prototype.hideInfoWindows = function() {
  for (var i = 0, marker; marker = this.markers[i]; i++){
    if (marker.infoWindow) {
      marker.infoWindow.close();
    }
  }
};

GMaps.prototype.removeMarker = function(marker) {
  for (var i = 0; i < this.markers.length; i++) {
    if (this.markers[i] === marker) {
      this.markers[i].setMap(null);
      this.markers.splice(i, 1);

      if(this.markerClusterer) {
        this.markerClusterer.removeMarker(marker);
      }

      GMaps.fire('marker_removed', marker, this);

      break;
    }
  }

  return marker;
};

GMaps.prototype.removeMarkers = function (collection) {
  var new_markers = [];

  if (typeof collection == 'undefined') {
    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];
      marker.setMap(null);

      if(this.markerClusterer) {
        this.markerClusterer.removeMarker(marker);
      }

      GMaps.fire('marker_removed', marker, this);
    }
    
    this.markers = new_markers;
  }
  else {
    for (var i = 0; i < collection.length; i++) {
      var index = this.markers.indexOf(collection[i]);

      if (index > -1) {
        var marker = this.markers[index];
        marker.setMap(null);

        if(this.markerClusterer) {
          this.markerClusterer.removeMarker(marker);
        }

        GMaps.fire('marker_removed', marker, this);
      }
    }

    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];
      if (marker.getMap() != null) {
        new_markers.push(marker);
      }
    }

    this.markers = new_markers;
  }
};

GMaps.prototype.drawOverlay = function(options) {
  var overlay = new google.maps.OverlayView(),
      auto_show = true;

  overlay.setMap(this.map);

  if (options.auto_show != null) {
    auto_show = options.auto_show;
  }

  overlay.onAdd = function() {
    var el = document.createElement('div');

    el.style.borderStyle = "none";
    el.style.borderWidth = "0px";
    el.style.position = "absolute";
    el.style.zIndex = 100;
    el.innerHTML = options.content;

    overlay.el = el;

    if (!options.layer) {
      options.layer = 'overlayLayer';
    }
    
    var panes = this.getPanes(),
        overlayLayer = panes[options.layer],
        stop_overlay_events = ['contextmenu', 'DOMMouseScroll', 'dblclick', 'mousedown'];

    overlayLayer.appendChild(el);

    for (var ev = 0; ev < stop_overlay_events.length; ev++) {
      (function(object, name) {
        google.maps.event.addDomListener(object, name, function(e){
          if (navigator.userAgent.toLowerCase().indexOf('msie') != -1 && document.all) {
            e.cancelBubble = true;
            e.returnValue = false;
          }
          else {
            e.stopPropagation();
          }
        });
      })(el, stop_overlay_events[ev]);
    }

    if (options.click) {
      panes.overlayMouseTarget.appendChild(overlay.el);
      google.maps.event.addDomListener(overlay.el, 'click', function() {
        options.click.apply(overlay, [overlay]);
      });
    }

    google.maps.event.trigger(this, 'ready');
  };

  overlay.draw = function() {
    var projection = this.getProjection(),
        pixel = projection.fromLatLngToDivPixel(new google.maps.LatLng(options.lat, options.lng));

    options.horizontalOffset = options.horizontalOffset || 0;
    options.verticalOffset = options.verticalOffset || 0;

    var el = overlay.el,
        content = el.children[0],
        content_height = content.clientHeight,
        content_width = content.clientWidth;

    switch (options.verticalAlign) {
      case 'top':
        el.style.top = (pixel.y - content_height + options.verticalOffset) + 'px';
        break;
      default:
      case 'middle':
        el.style.top = (pixel.y - (content_height / 2) + options.verticalOffset) + 'px';
        break;
      case 'bottom':
        el.style.top = (pixel.y + options.verticalOffset) + 'px';
        break;
    }

    switch (options.horizontalAlign) {
      case 'left':
        el.style.left = (pixel.x - content_width + options.horizontalOffset) + 'px';
        break;
      default:
      case 'center':
        el.style.left = (pixel.x - (content_width / 2) + options.horizontalOffset) + 'px';
        break;
      case 'right':
        el.style.left = (pixel.x + options.horizontalOffset) + 'px';
        break;
    }

    el.style.display = auto_show ? 'block' : 'none';

    if (!auto_show) {
      options.show.apply(this, [el]);
    }
  };

  overlay.onRemove = function() {
    var el = overlay.el;

    if (options.remove) {
      options.remove.apply(this, [el]);
    }
    else {
      overlay.el.parentNode.removeChild(overlay.el);
      overlay.el = null;
    }
  };

  this.overlays.push(overlay);
  return overlay;
};

GMaps.prototype.removeOverlay = function(overlay) {
  for (var i = 0; i < this.overlays.length; i++) {
    if (this.overlays[i] === overlay) {
      this.overlays[i].setMap(null);
      this.overlays.splice(i, 1);

      break;
    }
  }
};

GMaps.prototype.removeOverlays = function() {
  for (var i = 0, item; item = this.overlays[i]; i++) {
    item.setMap(null);
  }

  this.overlays = [];
};

GMaps.prototype.drawPolyline = function(options) {
  var path = [],
      points = options.path;

  if (points.length) {
    if (points[0][0] === undefined) {
      path = points;
    }
    else {
      for (var i = 0, latlng; latlng = points[i]; i++) {
        path.push(new google.maps.LatLng(latlng[0], latlng[1]));
      }
    }
  }

  var polyline_options = {
    map: this.map,
    path: path,
    strokeColor: options.strokeColor,
    strokeOpacity: options.strokeOpacity,
    strokeWeight: options.strokeWeight,
    geodesic: options.geodesic,
    clickable: true,
    editable: false,
    visible: true
  };

  if (options.hasOwnProperty("clickable")) {
    polyline_options.clickable = options.clickable;
  }

  if (options.hasOwnProperty("editable")) {
    polyline_options.editable = options.editable;
  }

  if (options.hasOwnProperty("icons")) {
    polyline_options.icons = options.icons;
  }

  if (options.hasOwnProperty("zIndex")) {
    polyline_options.zIndex = options.zIndex;
  }

  var polyline = new google.maps.Polyline(polyline_options);

  var polyline_events = ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'rightclick'];

  for (var ev = 0; ev < polyline_events.length; ev++) {
    (function(object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(e){
          options[name].apply(this, [e]);
        });
      }
    })(polyline, polyline_events[ev]);
  }

  this.polylines.push(polyline);

  GMaps.fire('polyline_added', polyline, this);

  return polyline;
};

GMaps.prototype.removePolyline = function(polyline) {
  for (var i = 0; i < this.polylines.length; i++) {
    if (this.polylines[i] === polyline) {
      this.polylines[i].setMap(null);
      this.polylines.splice(i, 1);

      GMaps.fire('polyline_removed', polyline, this);

      break;
    }
  }
};

GMaps.prototype.removePolylines = function() {
  for (var i = 0, item; item = this.polylines[i]; i++) {
    item.setMap(null);
  }

  this.polylines = [];
};

GMaps.prototype.drawCircle = function(options) {
  options =  extend_object({
    map: this.map,
    center: new google.maps.LatLng(options.lat, options.lng)
  }, options);

  delete options.lat;
  delete options.lng;

  var polygon = new google.maps.Circle(options),
      polygon_events = ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'rightclick'];

  for (var ev = 0; ev < polygon_events.length; ev++) {
    (function(object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(e){
          options[name].apply(this, [e]);
        });
      }
    })(polygon, polygon_events[ev]);
  }

  this.polygons.push(polygon);

  return polygon;
};

GMaps.prototype.drawRectangle = function(options) {
  options = extend_object({
    map: this.map
  }, options);

  var latLngBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(options.bounds[0][0], options.bounds[0][1]),
    new google.maps.LatLng(options.bounds[1][0], options.bounds[1][1])
  );

  options.bounds = latLngBounds;

  var polygon = new google.maps.Rectangle(options),
      polygon_events = ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'rightclick'];

  for (var ev = 0; ev < polygon_events.length; ev++) {
    (function(object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(e){
          options[name].apply(this, [e]);
        });
      }
    })(polygon, polygon_events[ev]);
  }

  this.polygons.push(polygon);

  return polygon;
};

GMaps.prototype.drawPolygon = function(options) {
  var useGeoJSON = false;

  if(options.hasOwnProperty("useGeoJSON")) {
    useGeoJSON = options.useGeoJSON;
  }

  delete options.useGeoJSON;

  options = extend_object({
    map: this.map
  }, options);

  if (useGeoJSON == false) {
    options.paths = [options.paths.slice(0)];
  }

  if (options.paths.length > 0) {
    if (options.paths[0].length > 0) {
      options.paths = array_flat(array_map(options.paths, arrayToLatLng, useGeoJSON));
    }
  }

  var polygon = new google.maps.Polygon(options),
      polygon_events = ['click', 'dblclick', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'rightclick'];

  for (var ev = 0; ev < polygon_events.length; ev++) {
    (function(object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(e){
          options[name].apply(this, [e]);
        });
      }
    })(polygon, polygon_events[ev]);
  }

  this.polygons.push(polygon);

  GMaps.fire('polygon_added', polygon, this);

  return polygon;
};

GMaps.prototype.removePolygon = function(polygon) {
  for (var i = 0; i < this.polygons.length; i++) {
    if (this.polygons[i] === polygon) {
      this.polygons[i].setMap(null);
      this.polygons.splice(i, 1);

      GMaps.fire('polygon_removed', polygon, this);

      break;
    }
  }
};

GMaps.prototype.removePolygons = function() {
  for (var i = 0, item; item = this.polygons[i]; i++) {
    item.setMap(null);
  }

  this.polygons = [];
};

GMaps.prototype.getFromFusionTables = function(options) {
  var events = options.events;

  delete options.events;

  var fusion_tables_options = options,
      layer = new google.maps.FusionTablesLayer(fusion_tables_options);

  for (var ev in events) {
    (function(object, name) {
      google.maps.event.addListener(object, name, function(e) {
        events[name].apply(this, [e]);
      });
    })(layer, ev);
  }

  this.layers.push(layer);

  return layer;
};

GMaps.prototype.loadFromFusionTables = function(options) {
  var layer = this.getFromFusionTables(options);
  layer.setMap(this.map);

  return layer;
};

GMaps.prototype.getFromKML = function(options) {
  var url = options.url,
      events = options.events;

  delete options.url;
  delete options.events;

  var kml_options = options,
      layer = new google.maps.KmlLayer(url, kml_options);

  for (var ev in events) {
    (function(object, name) {
      google.maps.event.addListener(object, name, function(e) {
        events[name].apply(this, [e]);
      });
    })(layer, ev);
  }

  this.layers.push(layer);

  return layer;
};

GMaps.prototype.loadFromKML = function(options) {
  var layer = this.getFromKML(options);
  layer.setMap(this.map);

  return layer;
};

GMaps.prototype.addLayer = function(layerName, options) {
  //var default_layers = ['weather', 'clouds', 'traffic', 'transit', 'bicycling', 'panoramio', 'places'];
  options = options || {};
  var layer;

  switch(layerName) {
    case 'weather': this.singleLayers.weather = layer = new google.maps.weather.WeatherLayer();
      break;
    case 'clouds': this.singleLayers.clouds = layer = new google.maps.weather.CloudLayer();
      break;
    case 'traffic': this.singleLayers.traffic = layer = new google.maps.TrafficLayer();
      break;
    case 'transit': this.singleLayers.transit = layer = new google.maps.TransitLayer();
      break;
    case 'bicycling': this.singleLayers.bicycling = layer = new google.maps.BicyclingLayer();
      break;
    case 'panoramio':
        this.singleLayers.panoramio = layer = new google.maps.panoramio.PanoramioLayer();
        layer.setTag(options.filter);
        delete options.filter;

        //click event
        if (options.click) {
          google.maps.event.addListener(layer, 'click', function(event) {
            options.click(event);
            delete options.click;
          });
        }
      break;
      case 'places':
        this.singleLayers.places = layer = new google.maps.places.PlacesService(this.map);

        //search, nearbySearch, radarSearch callback, Both are the same
        if (options.search || options.nearbySearch || options.radarSearch) {
          var placeSearchRequest  = {
            bounds : options.bounds || null,
            keyword : options.keyword || null,
            location : options.location || null,
            name : options.name || null,
            radius : options.radius || null,
            rankBy : options.rankBy || null,
            types : options.types || null
          };

          if (options.radarSearch) {
            layer.radarSearch(placeSearchRequest, options.radarSearch);
          }

          if (options.search) {
            layer.search(placeSearchRequest, options.search);
          }

          if (options.nearbySearch) {
            layer.nearbySearch(placeSearchRequest, options.nearbySearch);
          }
        }

        //textSearch callback
        if (options.textSearch) {
          var textSearchRequest  = {
            bounds : options.bounds || null,
            location : options.location || null,
            query : options.query || null,
            radius : options.radius || null
          };

          layer.textSearch(textSearchRequest, options.textSearch);
        }
      break;
  }

  if (layer !== undefined) {
    if (typeof layer.setOptions == 'function') {
      layer.setOptions(options);
    }
    if (typeof layer.setMap == 'function') {
      layer.setMap(this.map);
    }

    return layer;
  }
};

GMaps.prototype.removeLayer = function(layer) {
  if (typeof(layer) == "string" && this.singleLayers[layer] !== undefined) {
     this.singleLayers[layer].setMap(null);

     delete this.singleLayers[layer];
  }
  else {
    for (var i = 0; i < this.layers.length; i++) {
      if (this.layers[i] === layer) {
        this.layers[i].setMap(null);
        this.layers.splice(i, 1);

        break;
      }
    }
  }
};

var travelMode, unitSystem;

GMaps.prototype.getRoutes = function(options) {
  switch (options.travelMode) {
    case 'bicycling':
      travelMode = google.maps.TravelMode.BICYCLING;
      break;
    case 'transit':
      travelMode = google.maps.TravelMode.TRANSIT;
      break;
    case 'driving':
      travelMode = google.maps.TravelMode.DRIVING;
      break;
    default:
      travelMode = google.maps.TravelMode.WALKING;
      break;
  }

  if (options.unitSystem === 'imperial') {
    unitSystem = google.maps.UnitSystem.IMPERIAL;
  }
  else {
    unitSystem = google.maps.UnitSystem.METRIC;
  }

  var base_options = {
        avoidHighways: false,
        avoidTolls: false,
        optimizeWaypoints: false,
        waypoints: []
      },
      request_options =  extend_object(base_options, options);

  request_options.origin = /string/.test(typeof options.origin) ? options.origin : new google.maps.LatLng(options.origin[0], options.origin[1]);
  request_options.destination = /string/.test(typeof options.destination) ? options.destination : new google.maps.LatLng(options.destination[0], options.destination[1]);
  request_options.travelMode = travelMode;
  request_options.unitSystem = unitSystem;

  delete request_options.callback;
  delete request_options.error;

  var self = this,
      service = new google.maps.DirectionsService();

  service.route(request_options, function(result, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      for (var r in result.routes) {
        if (result.routes.hasOwnProperty(r)) {
          self.routes.push(result.routes[r]);
        }
      }

      if (options.callback) {
        options.callback(self.routes);
      }
    }
    else {
      if (options.error) {
        options.error(result, status);
      }
    }
  });
};

GMaps.prototype.removeRoutes = function() {
  this.routes = [];
};

GMaps.prototype.getElevations = function(options) {
  options = extend_object({
    locations: [],
    path : false,
    samples : 256
  }, options);

  if (options.locations.length > 0) {
    if (options.locations[0].length > 0) {
      options.locations = array_flat(array_map([options.locations], arrayToLatLng,  false));
    }
  }

  var callback = options.callback;
  delete options.callback;

  var service = new google.maps.ElevationService();

  //location request
  if (!options.path) {
    delete options.path;
    delete options.samples;

    service.getElevationForLocations(options, function(result, status) {
      if (callback && typeof(callback) === "function") {
        callback(result, status);
      }
    });
  //path request
  } else {
    var pathRequest = {
      path : options.locations,
      samples : options.samples
    };

    service.getElevationAlongPath(pathRequest, function(result, status) {
     if (callback && typeof(callback) === "function") {
        callback(result, status);
      }
    });
  }
};

GMaps.prototype.cleanRoute = GMaps.prototype.removePolylines;

GMaps.prototype.drawRoute = function(options) {
  var self = this;

  this.getRoutes({
    origin: options.origin,
    destination: options.destination,
    travelMode: options.travelMode,
    waypoints: options.waypoints,
    unitSystem: options.unitSystem,
    error: options.error,
    callback: function(e) {
      if (e.length > 0) {
        var polyline_options = {
          path: e[e.length - 1].overview_path,
          strokeColor: options.strokeColor,
          strokeOpacity: options.strokeOpacity,
          strokeWeight: options.strokeWeight
        };

        if (options.hasOwnProperty("icons")) {
          polyline_options.icons = options.icons;
        }

        self.drawPolyline(polyline_options);
        
        if (options.callback) {
          options.callback(e[e.length - 1]);
        }
      }
    }
  });
};

GMaps.prototype.travelRoute = function(options) {
  if (options.origin && options.destination) {
    this.getRoutes({
      origin: options.origin,
      destination: options.destination,
      travelMode: options.travelMode,
      waypoints : options.waypoints,
      unitSystem: options.unitSystem,
      error: options.error,
      callback: function(e) {
        //start callback
        if (e.length > 0 && options.start) {
          options.start(e[e.length - 1]);
        }

        //step callback
        if (e.length > 0 && options.step) {
          var route = e[e.length - 1];
          if (route.legs.length > 0) {
            var steps = route.legs[0].steps;
            for (var i = 0, step; step = steps[i]; i++) {
              step.step_number = i;
              options.step(step, (route.legs[0].steps.length - 1));
            }
          }
        }

        //end callback
        if (e.length > 0 && options.end) {
           options.end(e[e.length - 1]);
        }
      }
    });
  }
  else if (options.route) {
    if (options.route.legs.length > 0) {
      var steps = options.route.legs[0].steps;
      for (var i = 0, step; step = steps[i]; i++) {
        step.step_number = i;
        options.step(step);
      }
    }
  }
};

GMaps.prototype.drawSteppedRoute = function(options) {
  var self = this;
  
  if (options.origin && options.destination) {
    this.getRoutes({
      origin: options.origin,
      destination: options.destination,
      travelMode: options.travelMode,
      waypoints : options.waypoints,
      error: options.error,
      callback: function(e) {
        //start callback
        if (e.length > 0 && options.start) {
          options.start(e[e.length - 1]);
        }

        //step callback
        if (e.length > 0 && options.step) {
          var route = e[e.length - 1];
          if (route.legs.length > 0) {
            var steps = route.legs[0].steps;
            for (var i = 0, step; step = steps[i]; i++) {
              step.step_number = i;
              var polyline_options = {
                path: step.path,
                strokeColor: options.strokeColor,
                strokeOpacity: options.strokeOpacity,
                strokeWeight: options.strokeWeight
              };

              if (options.hasOwnProperty("icons")) {
                polyline_options.icons = options.icons;
              }

              self.drawPolyline(polyline_options);
              options.step(step, (route.legs[0].steps.length - 1));
            }
          }
        }

        //end callback
        if (e.length > 0 && options.end) {
           options.end(e[e.length - 1]);
        }
      }
    });
  }
  else if (options.route) {
    if (options.route.legs.length > 0) {
      var steps = options.route.legs[0].steps;
      for (var i = 0, step; step = steps[i]; i++) {
        step.step_number = i;
        var polyline_options = {
          path: step.path,
          strokeColor: options.strokeColor,
          strokeOpacity: options.strokeOpacity,
          strokeWeight: options.strokeWeight
        };

        if (options.hasOwnProperty("icons")) {
          polyline_options.icons = options.icons;
        }

        self.drawPolyline(polyline_options);
        options.step(step);
      }
    }
  }
};

GMaps.Route = function(options) {
  this.origin = options.origin;
  this.destination = options.destination;
  this.waypoints = options.waypoints;

  this.map = options.map;
  this.route = options.route;
  this.step_count = 0;
  this.steps = this.route.legs[0].steps;
  this.steps_length = this.steps.length;

  var polyline_options = {
    path: new google.maps.MVCArray(),
    strokeColor: options.strokeColor,
    strokeOpacity: options.strokeOpacity,
    strokeWeight: options.strokeWeight
  };

  if (options.hasOwnProperty("icons")) {
    polyline_options.icons = options.icons;
  }

  this.polyline = this.map.drawPolyline(polyline_options).getPath();
};

GMaps.Route.prototype.getRoute = function(options) {
  var self = this;

  this.map.getRoutes({
    origin : this.origin,
    destination : this.destination,
    travelMode : options.travelMode,
    waypoints : this.waypoints || [],
    error: options.error,
    callback : function() {
      self.route = e[0];

      if (options.callback) {
        options.callback.call(self);
      }
    }
  });
};

GMaps.Route.prototype.back = function() {
  if (this.step_count > 0) {
    this.step_count--;
    var path = this.route.legs[0].steps[this.step_count].path;

    for (var p in path){
      if (path.hasOwnProperty(p)){
        this.polyline.pop();
      }
    }
  }
};

GMaps.Route.prototype.forward = function() {
  if (this.step_count < this.steps_length) {
    var path = this.route.legs[0].steps[this.step_count].path;

    for (var p in path){
      if (path.hasOwnProperty(p)){
        this.polyline.push(path[p]);
      }
    }
    this.step_count++;
  }
};

GMaps.prototype.checkGeofence = function(lat, lng, fence) {
  return fence.containsLatLng(new google.maps.LatLng(lat, lng));
};

GMaps.prototype.checkMarkerGeofence = function(marker, outside_callback) {
  if (marker.fences) {
    for (var i = 0, fence; fence = marker.fences[i]; i++) {
      var pos = marker.getPosition();
      if (!this.checkGeofence(pos.lat(), pos.lng(), fence)) {
        outside_callback(marker, fence);
      }
    }
  }
};

GMaps.prototype.toImage = function(options) {
  var options = options || {},
      static_map_options = {};

  static_map_options['size'] = options['size'] || [this.el.clientWidth, this.el.clientHeight];
  static_map_options['lat'] = this.getCenter().lat();
  static_map_options['lng'] = this.getCenter().lng();

  if (this.markers.length > 0) {
    static_map_options['markers'] = [];
    
    for (var i = 0; i < this.markers.length; i++) {
      static_map_options['markers'].push({
        lat: this.markers[i].getPosition().lat(),
        lng: this.markers[i].getPosition().lng()
      });
    }
  }

  if (this.polylines.length > 0) {
    var polyline = this.polylines[0];
    
    static_map_options['polyline'] = {};
    static_map_options['polyline']['path'] = google.maps.geometry.encoding.encodePath(polyline.getPath());
    static_map_options['polyline']['strokeColor'] = polyline.strokeColor
    static_map_options['polyline']['strokeOpacity'] = polyline.strokeOpacity
    static_map_options['polyline']['strokeWeight'] = polyline.strokeWeight
  }

  return GMaps.staticMapURL(static_map_options);
};

GMaps.staticMapURL = function(options){
  var parameters = [],
      data,
      static_root = (location.protocol === 'file:' ? 'http:' : location.protocol ) + '//maps.googleapis.com/maps/api/staticmap';

  if (options.url) {
    static_root = options.url;
    delete options.url;
  }

  static_root += '?';

  var markers = options.markers;
  
  delete options.markers;

  if (!markers && options.marker) {
    markers = [options.marker];
    delete options.marker;
  }

  var styles = options.styles;

  delete options.styles;

  var polyline = options.polyline;
  delete options.polyline;

  /** Map options **/
  if (options.center) {
    parameters.push('center=' + options.center);
    delete options.center;
  }
  else if (options.address) {
    parameters.push('center=' + options.address);
    delete options.address;
  }
  else if (options.lat) {
    parameters.push(['center=', options.lat, ',', options.lng].join(''));
    delete options.lat;
    delete options.lng;
  }
  else if (options.visible) {
    var visible = encodeURI(options.visible.join('|'));
    parameters.push('visible=' + visible);
  }

  var size = options.size;
  if (size) {
    if (size.join) {
      size = size.join('x');
    }
    delete options.size;
  }
  else {
    size = '630x300';
  }
  parameters.push('size=' + size);

  if (!options.zoom && options.zoom !== false) {
    options.zoom = 15;
  }

  var sensor = options.hasOwnProperty('sensor') ? !!options.sensor : true;
  delete options.sensor;
  parameters.push('sensor=' + sensor);

  for (var param in options) {
    if (options.hasOwnProperty(param)) {
      parameters.push(param + '=' + options[param]);
    }
  }

  /** Markers **/
  if (markers) {
    var marker, loc;

    for (var i = 0; data = markers[i]; i++) {
      marker = [];

      if (data.size && data.size !== 'normal') {
        marker.push('size:' + data.size);
        delete data.size;
      }
      else if (data.icon) {
        marker.push('icon:' + encodeURI(data.icon));
        delete data.icon;
      }

      if (data.color) {
        marker.push('color:' + data.color.replace('#', '0x'));
        delete data.color;
      }

      if (data.label) {
        marker.push('label:' + data.label[0].toUpperCase());
        delete data.label;
      }

      loc = (data.address ? data.address : data.lat + ',' + data.lng);
      delete data.address;
      delete data.lat;
      delete data.lng;

      for(var param in data){
        if (data.hasOwnProperty(param)) {
          marker.push(param + ':' + data[param]);
        }
      }

      if (marker.length || i === 0) {
        marker.push(loc);
        marker = marker.join('|');
        parameters.push('markers=' + encodeURI(marker));
      }
      // New marker without styles
      else {
        marker = parameters.pop() + encodeURI('|' + loc);
        parameters.push(marker);
      }
    }
  }

  /** Map Styles **/
  if (styles) {
    for (var i = 0; i < styles.length; i++) {
      var styleRule = [];
      if (styles[i].featureType){
        styleRule.push('feature:' + styles[i].featureType.toLowerCase());
      }

      if (styles[i].elementType) {
        styleRule.push('element:' + styles[i].elementType.toLowerCase());
      }

      for (var j = 0; j < styles[i].stylers.length; j++) {
        for (var p in styles[i].stylers[j]) {
          var ruleArg = styles[i].stylers[j][p];
          if (p == 'hue' || p == 'color') {
            ruleArg = '0x' + ruleArg.substring(1);
          }
          styleRule.push(p + ':' + ruleArg);
        }
      }

      var rule = styleRule.join('|');
      if (rule != '') {
        parameters.push('style=' + rule);
      }
    }
  }

  /** Polylines **/
  function parseColor(color, opacity) {
    if (color[0] === '#'){
      color = color.replace('#', '0x');

      if (opacity) {
        opacity = parseFloat(opacity);
        opacity = Math.min(1, Math.max(opacity, 0));
        if (opacity === 0) {
          return '0x00000000';
        }
        opacity = (opacity * 255).toString(16);
        if (opacity.length === 1) {
          opacity += opacity;
        }

        color = color.slice(0,8) + opacity;
      }
    }
    return color;
  }

  if (polyline) {
    data = polyline;
    polyline = [];

    if (data.strokeWeight) {
      polyline.push('weight:' + parseInt(data.strokeWeight, 10));
    }

    if (data.strokeColor) {
      var color = parseColor(data.strokeColor, data.strokeOpacity);
      polyline.push('color:' + color);
    }

    if (data.fillColor) {
      var fillcolor = parseColor(data.fillColor, data.fillOpacity);
      polyline.push('fillcolor:' + fillcolor);
    }

    var path = data.path;
    if (path.join) {
      for (var j=0, pos; pos=path[j]; j++) {
        polyline.push(pos.join(','));
      }
    }
    else {
      polyline.push('enc:' + path);
    }

    polyline = polyline.join('|');
    parameters.push('path=' + encodeURI(polyline));
  }

  /** Retina support **/
  var dpi = window.devicePixelRatio || 1;
  parameters.push('scale=' + dpi);

  parameters = parameters.join('&');
  return static_root + parameters;
};

GMaps.prototype.addMapType = function(mapTypeId, options) {
  if (options.hasOwnProperty("getTileUrl") && typeof(options["getTileUrl"]) == "function") {
    options.tileSize = options.tileSize || new google.maps.Size(256, 256);

    var mapType = new google.maps.ImageMapType(options);

    this.map.mapTypes.set(mapTypeId, mapType);
  }
  else {
    throw "'getTileUrl' function required.";
  }
};

GMaps.prototype.addOverlayMapType = function(options) {
  if (options.hasOwnProperty("getTile") && typeof(options["getTile"]) == "function") {
    var overlayMapTypeIndex = options.index;

    delete options.index;

    this.map.overlayMapTypes.insertAt(overlayMapTypeIndex, options);
  }
  else {
    throw "'getTile' function required.";
  }
};

GMaps.prototype.removeOverlayMapType = function(overlayMapTypeIndex) {
  this.map.overlayMapTypes.removeAt(overlayMapTypeIndex);
};

GMaps.prototype.addStyle = function(options) {
  var styledMapType = new google.maps.StyledMapType(options.styles, { name: options.styledMapName });

  this.map.mapTypes.set(options.mapTypeId, styledMapType);
};

GMaps.prototype.setStyle = function(mapTypeId) {
  this.map.setMapTypeId(mapTypeId);
};

GMaps.prototype.createPanorama = function(streetview_options) {
  if (!streetview_options.hasOwnProperty('lat') || !streetview_options.hasOwnProperty('lng')) {
    streetview_options.lat = this.getCenter().lat();
    streetview_options.lng = this.getCenter().lng();
  }

  this.panorama = GMaps.createPanorama(streetview_options);

  this.map.setStreetView(this.panorama);

  return this.panorama;
};

GMaps.createPanorama = function(options) {
  var el = getElementById(options.el, options.context);

  options.position = new google.maps.LatLng(options.lat, options.lng);

  delete options.el;
  delete options.context;
  delete options.lat;
  delete options.lng;

  var streetview_events = ['closeclick', 'links_changed', 'pano_changed', 'position_changed', 'pov_changed', 'resize', 'visible_changed'],
      streetview_options = extend_object({visible : true}, options);

  for (var i = 0; i < streetview_events.length; i++) {
    delete streetview_options[streetview_events[i]];
  }

  var panorama = new google.maps.StreetViewPanorama(el, streetview_options);

  for (var i = 0; i < streetview_events.length; i++) {
    (function(object, name) {
      if (options[name]) {
        google.maps.event.addListener(object, name, function(){
          options[name].apply(this);
        });
      }
    })(panorama, streetview_events[i]);
  }

  return panorama;
};

GMaps.prototype.on = function(event_name, handler) {
  return GMaps.on(event_name, this, handler);
};

GMaps.prototype.off = function(event_name) {
  GMaps.off(event_name, this);
};

GMaps.custom_events = ['marker_added', 'marker_removed', 'polyline_added', 'polyline_removed', 'polygon_added', 'polygon_removed', 'geolocated', 'geolocation_failed'];

GMaps.on = function(event_name, object, handler) {
  if (GMaps.custom_events.indexOf(event_name) == -1) {
    if(object instanceof GMaps) object = object.map; 
    return google.maps.event.addListener(object, event_name, handler);
  }
  else {
    var registered_event = {
      handler : handler,
      eventName : event_name
    };

    object.registered_events[event_name] = object.registered_events[event_name] || [];
    object.registered_events[event_name].push(registered_event);

    return registered_event;
  }
};

GMaps.off = function(event_name, object) {
  if (GMaps.custom_events.indexOf(event_name) == -1) {
    if(object instanceof GMaps) object = object.map; 
    google.maps.event.clearListeners(object, event_name);
  }
  else {
    object.registered_events[event_name] = [];
  }
};

GMaps.fire = function(event_name, object, scope) {
  if (GMaps.custom_events.indexOf(event_name) == -1) {
    google.maps.event.trigger(object, event_name, Array.prototype.slice.apply(arguments).slice(2));
  }
  else {
    if(event_name in scope.registered_events) {
      var firing_events = scope.registered_events[event_name];

      for(var i = 0; i < firing_events.length; i++) {
        (function(handler, scope, object) {
          handler.apply(scope, [object]);
        })(firing_events[i]['handler'], scope, object);
      }
    }
  }
};

GMaps.geolocate = function(options) {
  var complete_callback = options.always || options.complete;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      options.success(position);

      if (complete_callback) {
        complete_callback();
      }
    }, function(error) {
      options.error(error);

      if (complete_callback) {
        complete_callback();
      }
    }, options.options);
  }
  else {
    options.not_supported();

    if (complete_callback) {
      complete_callback();
    }
  }
};

GMaps.geocode = function(options) {
  this.geocoder = new google.maps.Geocoder();
  var callback = options.callback;
  if (options.hasOwnProperty('lat') && options.hasOwnProperty('lng')) {
    options.latLng = new google.maps.LatLng(options.lat, options.lng);
  }

  delete options.lat;
  delete options.lng;
  delete options.callback;
  
  this.geocoder.geocode(options, function(results, status) {
    callback(results, status);
  });
};

//==========================
// Polygon containsLatLng
// https://github.com/tparkin/Google-Maps-Point-in-Polygon
// Poygon getBounds extension - google-maps-extensions
// http://code.google.com/p/google-maps-extensions/source/browse/google.maps.Polygon.getBounds.js
if (!google.maps.Polygon.prototype.getBounds) {
  google.maps.Polygon.prototype.getBounds = function(latLng) {
    var bounds = new google.maps.LatLngBounds();
    var paths = this.getPaths();
    var path;

    for (var p = 0; p < paths.getLength(); p++) {
      path = paths.getAt(p);
      for (var i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
    }

    return bounds;
  };
}

if (!google.maps.Polygon.prototype.containsLatLng) {
  // Polygon containsLatLng - method to determine if a latLng is within a polygon
  google.maps.Polygon.prototype.containsLatLng = function(latLng) {
    // Exclude points outside of bounds as there is no way they are in the poly
    var bounds = this.getBounds();

    if (bounds !== null && !bounds.contains(latLng)) {
      return false;
    }

    // Raycast point in polygon method
    var inPoly = false;

    var numPaths = this.getPaths().getLength();
    for (var p = 0; p < numPaths; p++) {
      var path = this.getPaths().getAt(p);
      var numPoints = path.getLength();
      var j = numPoints - 1;

      for (var i = 0; i < numPoints; i++) {
        var vertex1 = path.getAt(i);
        var vertex2 = path.getAt(j);

        if (vertex1.lng() < latLng.lng() && vertex2.lng() >= latLng.lng() || vertex2.lng() < latLng.lng() && vertex1.lng() >= latLng.lng()) {
          if (vertex1.lat() + (latLng.lng() - vertex1.lng()) / (vertex2.lng() - vertex1.lng()) * (vertex2.lat() - vertex1.lat()) < latLng.lat()) {
            inPoly = !inPoly;
          }
        }

        j = i;
      }
    }

    return inPoly;
  };
}

if (!google.maps.Circle.prototype.containsLatLng) {
  google.maps.Circle.prototype.containsLatLng = function(latLng) {
    if (google.maps.geometry) {
      return google.maps.geometry.spherical.computeDistanceBetween(this.getCenter(), latLng) <= this.getRadius();
    }
    else {
      return true;
    }
  };
}

google.maps.LatLngBounds.prototype.containsLatLng = function(latLng) {
  return this.contains(latLng);
};

google.maps.Marker.prototype.setFences = function(fences) {
  this.fences = fences;
};

google.maps.Marker.prototype.addFence = function(fence) {
  this.fences.push(fence);
};

google.maps.Marker.prototype.getId = function() {
  return this['__gm_id'];
};

//==========================
// Array indexOf
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
      "use strict";
      if (this == null) {
          throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;
      if (len === 0) {
          return -1;
      }
      var n = 0;
      if (arguments.length > 1) {
          n = Number(arguments[1]);
          if (n != n) { // shortcut for verifying if it's NaN
              n = 0;
          } else if (n != 0 && n != Infinity && n != -Infinity) {
              n = (n > 0 || -1) * Math.floor(Math.abs(n));
          }
      }
      if (n >= len) {
          return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
          if (k in t && t[k] === searchElement) {
              return k;
          }
      }
      return -1;
  }
}
  
return GMaps;
}));

},{}],2:[function(require,module,exports){
var GMaps;

GMaps = require('gmaps');

module.exports = {
  init: function() {
    if ($('#map').length) {
      return this.initMap();
    }
  },
  initMap: function() {
    this.$map_error = $('#map_error');
    this.$search = $('[name="search_map"]');
    this.infowindow = new google.maps.InfoWindow();
    this.map = new GMaps({
      div: '#map',
      lat: 47.66204,
      lng: -122.33337,
      zoom: 12,
      mapTypeControl: false,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.LEFT_CENTER
      },
      panControl: false,
      streetViewControl: false,
      styles: [
        {
          'featureType': 'all',
          'elementType': 'labels.text.fill',
          'stylers': [
            {
              'saturation': 36
            }, {
              'color': '#000000'
            }, {
              'lightness': 40
            }
          ]
        }, {
          'featureType': 'all',
          'elementType': 'labels.text.stroke',
          'stylers': [
            {
              'visibility': 'on'
            }, {
              'color': '#000000'
            }, {
              'lightness': 16
            }
          ]
        }, {
          'featureType': 'all',
          'elementType': 'labels.icon',
          'stylers': [
            {
              'visibility': 'off'
            }
          ]
        }, {
          'featureType': 'administrative',
          'elementType': 'geometry.fill',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 20
            }
          ]
        }, {
          'featureType': 'administrative',
          'elementType': 'geometry.stroke',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 17
            }, {
              'weight': 1.2
            }
          ]
        }, {
          'featureType': 'landscape',
          'elementType': 'geometry',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 16
            }
          ]
        }, {
          'featureType': 'poi',
          'elementType': 'geometry',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 21
            }
          ]
        }, {
          'featureType': 'road.highway',
          'elementType': 'geometry.fill',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 17
            }
          ]
        }, {
          'featureType': 'road.highway',
          'elementType': 'geometry.stroke',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 29
            }, {
              'weight': 0.2
            }
          ]
        }, {
          'featureType': 'road.arterial',
          'elementType': 'geometry',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 10
            }
          ]
        }, {
          'featureType': 'road.local',
          'elementType': 'geometry',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 13
            }
          ]
        }, {
          'featureType': 'transit',
          'elementType': 'geometry',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 19
            }
          ]
        }, {
          'featureType': 'water',
          'elementType': 'geometry',
          'stylers': [
            {
              'color': '#000000'
            }, {
              'lightness': 7
            }
          ]
        }
      ]
    });
    if (typeof locations !== "undefined" && locations !== null) {
      this.buildMarkers();
    }
    this.listeners();
    return this.geolocate();
  },
  geolocate: function() {
    return GMaps.geolocate({
      success: function(position) {
        return map.setCenter(position.coords.latitude, position.coords.longitude);
      },
      error: function(error) {
        return alert('Geolocation failed: ' + error.message);
      },
      not_supported: function() {
        return alert('Your browser does not support geolocation');
      },
      always: function() {
        return alert('Done!');
      }
    });
  },
  listeners: function() {
    return this.$search.on('keyup', (function(_this) {
      return function() {
        var q;
        _this.$map_error.empty();
        q = _this.$search.val();
        if (q.length > 3) {
          return _this.search(q);
        }
      };
    })(this));
  },
  search: function(q) {
    return GMaps.geocode({
      address: q,
      callback: (function(_this) {
        return function(results, status) {
          var latlng;
          if (status === 'ZERO_RESULTS') {
            _this.notFound();
          }
          if (results) {
            latlng = results[0].geometry.location;
            _this.map.setCenter(latlng.lat(), latlng.lng());
            return _this.map.setZoom(14);
          }
        };
      })(this)
    });
  },
  notFound: function() {
    return this.$map_error.text('nothing found');
  },
  buildMarkers: function() {
    var bounds;
    bounds = new google.maps.LatLngBounds();
    return $.each(locations, (function(_this) {
      return function(i, location) {
        var lat, lng;
        lat = parseFloat(location.lat);
        lng = parseFloat(location.lng);
        bounds.extend(new google.maps.LatLng(lat, lng));
        return _this.map.addMarker({
          lat: lat,
          lng: lng,
          title: "" + location.name,
          infoWindow: {
            content: "<div class='map--name'>" + location.name + "</div><div class='map--url'>" + location.address + "</div><div class='map--url'>" + location.phone + "</div><div class='map--url'><a href='" + location.url + "'>" + location.url + "</div>"
          }
        });
      };
    })(this));
  }
};



},{"gmaps":1}],3:[function(require,module,exports){
var BikeMap;

BikeMap = require('./lib/map');

$(function() {
  var $underlines, $underlines2, scroll_pos;
  BikeMap.init();
  $('.toggle-menu').on('click', function() {
    $('.responsive-nav').toggleClass('active');
    $(".top").toggleClass("animate-top");
    $(".middle").toggleClass("animate-middle");
    return $(".bottom").toggleClass("animate-bottom");
  });
  $('.slider').slick({
    dots: true,
    speed: 600,
    cssEase: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000
  });
  $('.slider--multiple').slick({
    dots: false,
    slidesToShow: 2,
    responsive: [
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });
  $(document).ready(function() {});
  scroll_pos = 0;
  $(document).scroll(function() {
    scroll_pos = $(this).scrollTop();
    if (scroll_pos > 10) {
      return $('.nav-background').css('top', '0');
    } else {
      return $('.nav-background').css('top', '-120px');
    }
  });
  $underlines = $('.underline');
  $underlines2 = $('.underline2');
  $(document).on('mouseenter', '.text-link', function() {
    return dynamics.animate($underlines[$(this).parent().index()], {
      width: '100%'
    }, {
      type: dynamics.spring
    });
  });
  $(document).on('mouseleave', '.text-link', function() {
    return dynamics.animate($underlines[$(this).parent().index()], {
      width: '0'
    }, {
      type: dynamics.spring
    });
  });
  $(document).on('mouseenter', '.top-text-link', function() {
    return dynamics.animate($underlines2[$(this).parent().index()], {
      width: '100%'
    }, {
      type: dynamics.spring
    });
  });
  return $(document).on('mouseleave', '.top-text-link', function() {
    return dynamics.animate($underlines2[$(this).parent().index()], {
      width: '0'
    }, {
      type: dynamics.spring
    });
  });
});



},{"./lib/map":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9pdmFuY3J1ei9Qcm9qZWN0cy9UcmFpdG9yIEN5Y2xlcy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2l2YW5jcnV6L1Byb2plY3RzL1RyYWl0b3IgQ3ljbGVzL25vZGVfbW9kdWxlcy9nbWFwcy9nbWFwcy5qcyIsIi9Vc2Vycy9pdmFuY3J1ei9Qcm9qZWN0cy9UcmFpdG9yIEN5Y2xlcy9zb3VyY2UvYXNzZXRzL2pzL2xpYi9tYXAuY29mZmVlIiwiL1VzZXJzL2l2YW5jcnV6L1Byb2plY3RzL1RyYWl0b3IgQ3ljbGVzL3NvdXJjZS9hc3NldHMvanMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNXBFQSxJQUFBOztBQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7QUFFUixNQUFNLENBQUMsT0FBUCxHQUNFO0VBQUEsSUFBQSxFQUFNLFNBQUE7SUFDSixJQUFjLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxNQUF4QjthQUFBLElBQUMsQ0FBQSxPQUFELENBQUEsRUFBQTs7RUFESSxDQUFOO0VBSUEsT0FBQSxFQUFTLFNBQUE7SUFDUCxJQUFDLENBQUEsVUFBRCxHQUFjLENBQUEsQ0FBRSxZQUFGO0lBQ2QsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFBLENBQUUscUJBQUY7SUFDWCxJQUFDLENBQUEsVUFBRCxHQUFrQixJQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBWixDQUFBO0lBQ2xCLElBQUMsQ0FBQSxHQUFELEdBQVcsSUFBQSxLQUFBLENBQ1Q7TUFBQSxHQUFBLEVBQUssTUFBTDtNQUNBLEdBQUEsRUFBSyxRQURMO01BRUEsR0FBQSxFQUFLLENBQUMsU0FGTjtNQUdBLElBQUEsRUFBTSxFQUhOO01BSUEsY0FBQSxFQUFnQixLQUpoQjtNQUtBLGtCQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFwQztRQUNBLFFBQUEsRUFBVSxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUR0QztPQU5GO01BUUEsVUFBQSxFQUFZLEtBUlo7TUFTQSxpQkFBQSxFQUFtQixLQVRuQjtNQVdBLE1BQUEsRUFBUTtRQUNKO1VBQ0UsYUFBQSxFQUFlLEtBRGpCO1VBRUUsYUFBQSxFQUFlLGtCQUZqQjtVQUdFLFNBQUEsRUFBVztZQUNUO2NBQUUsWUFBQSxFQUFjLEVBQWhCO2FBRFMsRUFFVDtjQUFFLE9BQUEsRUFBUyxTQUFYO2FBRlMsRUFHVDtjQUFFLFdBQUEsRUFBYSxFQUFmO2FBSFM7V0FIYjtTQURJLEVBVUo7VUFDRSxhQUFBLEVBQWUsS0FEakI7VUFFRSxhQUFBLEVBQWUsb0JBRmpCO1VBR0UsU0FBQSxFQUFXO1lBQ1Q7Y0FBRSxZQUFBLEVBQWMsSUFBaEI7YUFEUyxFQUVUO2NBQUUsT0FBQSxFQUFTLFNBQVg7YUFGUyxFQUdUO2NBQUUsV0FBQSxFQUFhLEVBQWY7YUFIUztXQUhiO1NBVkksRUFtQko7VUFDRSxhQUFBLEVBQWUsS0FEakI7VUFFRSxhQUFBLEVBQWUsYUFGakI7VUFHRSxTQUFBLEVBQVc7WUFBRTtjQUFFLFlBQUEsRUFBYyxLQUFoQjthQUFGO1dBSGI7U0FuQkksRUF3Qko7VUFDRSxhQUFBLEVBQWUsZ0JBRGpCO1VBRUUsYUFBQSxFQUFlLGVBRmpCO1VBR0UsU0FBQSxFQUFXO1lBQ1Q7Y0FBRSxPQUFBLEVBQVMsU0FBWDthQURTLEVBRVQ7Y0FBRSxXQUFBLEVBQWEsRUFBZjthQUZTO1dBSGI7U0F4QkksRUFnQ0o7VUFDRSxhQUFBLEVBQWUsZ0JBRGpCO1VBRUUsYUFBQSxFQUFlLGlCQUZqQjtVQUdFLFNBQUEsRUFBVztZQUNUO2NBQUUsT0FBQSxFQUFTLFNBQVg7YUFEUyxFQUVUO2NBQUUsV0FBQSxFQUFhLEVBQWY7YUFGUyxFQUdUO2NBQUUsUUFBQSxFQUFVLEdBQVo7YUFIUztXQUhiO1NBaENJLEVBeUNKO1VBQ0UsYUFBQSxFQUFlLFdBRGpCO1VBRUUsYUFBQSxFQUFlLFVBRmpCO1VBR0UsU0FBQSxFQUFXO1lBQ1Q7Y0FBRSxPQUFBLEVBQVMsU0FBWDthQURTLEVBRVQ7Y0FBRSxXQUFBLEVBQWEsRUFBZjthQUZTO1dBSGI7U0F6Q0ksRUFpREo7VUFDRSxhQUFBLEVBQWUsS0FEakI7VUFFRSxhQUFBLEVBQWUsVUFGakI7VUFHRSxTQUFBLEVBQVc7WUFDVDtjQUFFLE9BQUEsRUFBUyxTQUFYO2FBRFMsRUFFVDtjQUFFLFdBQUEsRUFBYSxFQUFmO2FBRlM7V0FIYjtTQWpESSxFQXlESjtVQUNFLGFBQUEsRUFBZSxjQURqQjtVQUVFLGFBQUEsRUFBZSxlQUZqQjtVQUdFLFNBQUEsRUFBVztZQUNUO2NBQUUsT0FBQSxFQUFTLFNBQVg7YUFEUyxFQUVUO2NBQUUsV0FBQSxFQUFhLEVBQWY7YUFGUztXQUhiO1NBekRJLEVBaUVKO1VBQ0UsYUFBQSxFQUFlLGNBRGpCO1VBRUUsYUFBQSxFQUFlLGlCQUZqQjtVQUdFLFNBQUEsRUFBVztZQUNUO2NBQUUsT0FBQSxFQUFTLFNBQVg7YUFEUyxFQUVUO2NBQUUsV0FBQSxFQUFhLEVBQWY7YUFGUyxFQUdUO2NBQUUsUUFBQSxFQUFVLEdBQVo7YUFIUztXQUhiO1NBakVJLEVBMEVKO1VBQ0UsYUFBQSxFQUFlLGVBRGpCO1VBRUUsYUFBQSxFQUFlLFVBRmpCO1VBR0UsU0FBQSxFQUFXO1lBQ1Q7Y0FBRSxPQUFBLEVBQVMsU0FBWDthQURTLEVBRVQ7Y0FBRSxXQUFBLEVBQWEsRUFBZjthQUZTO1dBSGI7U0ExRUksRUFrRko7VUFDRSxhQUFBLEVBQWUsWUFEakI7VUFFRSxhQUFBLEVBQWUsVUFGakI7VUFHRSxTQUFBLEVBQVc7WUFDVDtjQUFFLE9BQUEsRUFBUyxTQUFYO2FBRFMsRUFFVDtjQUFFLFdBQUEsRUFBYSxFQUFmO2FBRlM7V0FIYjtTQWxGSSxFQTBGSjtVQUNFLGFBQUEsRUFBZSxTQURqQjtVQUVFLGFBQUEsRUFBZSxVQUZqQjtVQUdFLFNBQUEsRUFBVztZQUNUO2NBQUUsT0FBQSxFQUFTLFNBQVg7YUFEUyxFQUVUO2NBQUUsV0FBQSxFQUFhLEVBQWY7YUFGUztXQUhiO1NBMUZJLEVBa0dKO1VBQ0UsYUFBQSxFQUFlLE9BRGpCO1VBRUUsYUFBQSxFQUFlLFVBRmpCO1VBR0UsU0FBQSxFQUFXO1lBQ1Q7Y0FBRSxPQUFBLEVBQVMsU0FBWDthQURTLEVBRVQ7Y0FBRSxXQUFBLEVBQWEsQ0FBZjthQUZTO1dBSGI7U0FsR0k7T0FYUjtLQURTO0lBd0hYLElBQW1CLHNEQUFuQjtNQUFBLElBQUMsQ0FBQSxZQUFELENBQUEsRUFBQTs7SUFDQSxJQUFDLENBQUEsU0FBRCxDQUFBO1dBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBQTtFQTlITyxDQUpUO0VBb0lBLFNBQUEsRUFBVyxTQUFBO1dBQ1QsS0FBSyxDQUFDLFNBQU4sQ0FDRTtNQUFBLE9BQUEsRUFBUyxTQUFDLFFBQUQ7ZUFDUCxHQUFHLENBQUMsU0FBSixDQUFjLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBOUIsRUFBd0MsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUF4RDtNQURPLENBQVQ7TUFHQSxLQUFBLEVBQU8sU0FBQyxLQUFEO2VBQ0wsS0FBQSxDQUFNLHNCQUFBLEdBQXlCLEtBQUssQ0FBQyxPQUFyQztNQURLLENBSFA7TUFNQSxhQUFBLEVBQWUsU0FBQTtlQUNiLEtBQUEsQ0FBTSwyQ0FBTjtNQURhLENBTmY7TUFTQSxNQUFBLEVBQVEsU0FBQTtlQUNOLEtBQUEsQ0FBTSxPQUFOO01BRE0sQ0FUUjtLQURGO0VBRFMsQ0FwSVg7RUFrSkEsU0FBQSxFQUFXLFNBQUE7V0FDVCxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxPQUFaLEVBQXFCLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtBQUNuQixZQUFBO1FBQUEsS0FBQyxDQUFBLFVBQVUsQ0FBQyxLQUFaLENBQUE7UUFDQSxDQUFBLEdBQUksS0FBQyxDQUFBLE9BQU8sQ0FBQyxHQUFULENBQUE7UUFDSixJQUFjLENBQUMsQ0FBQyxNQUFGLEdBQVcsQ0FBekI7aUJBQUEsS0FBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSLEVBQUE7O01BSG1CO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtFQURTLENBbEpYO0VBd0pBLE1BQUEsRUFBUSxTQUFDLENBQUQ7V0FDTixLQUFLLENBQUMsT0FBTixDQUNFO01BQUEsT0FBQSxFQUFTLENBQVQ7TUFDQSxRQUFBLEVBQVUsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE9BQUQsRUFBVSxNQUFWO0FBQ1IsY0FBQTtVQUFBLElBQUcsTUFBQSxLQUFVLGNBQWI7WUFDRSxLQUFDLENBQUEsUUFBRCxDQUFBLEVBREY7O1VBRUEsSUFBRyxPQUFIO1lBQ0UsTUFBQSxHQUFTLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFRLENBQUM7WUFDN0IsS0FBQyxDQUFBLEdBQUcsQ0FBQyxTQUFMLENBQWUsTUFBTSxDQUFDLEdBQVAsQ0FBQSxDQUFmLEVBQTZCLE1BQU0sQ0FBQyxHQUFQLENBQUEsQ0FBN0I7bUJBQ0EsS0FBQyxDQUFBLEdBQUcsQ0FBQyxPQUFMLENBQWEsRUFBYixFQUhGOztRQUhRO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURWO0tBREY7RUFETSxDQXhKUjtFQW1LQSxRQUFBLEVBQVUsU0FBQTtXQUNSLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixlQUFqQjtFQURRLENBbktWO0VBc0tBLFlBQUEsRUFBYyxTQUFBO0FBQ1osUUFBQTtJQUFBLE1BQUEsR0FBYSxJQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWixDQUFBO1dBQ2IsQ0FBQyxDQUFDLElBQUYsQ0FBTyxTQUFQLEVBQWtCLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxDQUFELEVBQUksUUFBSjtBQUNoQixZQUFBO1FBQUEsR0FBQSxHQUFNLFVBQUEsQ0FBVyxRQUFRLENBQUMsR0FBcEI7UUFDTixHQUFBLEdBQU0sVUFBQSxDQUFXLFFBQVEsQ0FBQyxHQUFwQjtRQUNOLE1BQU0sQ0FBQyxNQUFQLENBQWtCLElBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFaLENBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLENBQWxCO2VBRUEsS0FBQyxDQUFBLEdBQUcsQ0FBQyxTQUFMLENBQ0U7VUFBQSxHQUFBLEVBQUssR0FBTDtVQUNBLEdBQUEsRUFBSyxHQURMO1VBRUEsS0FBQSxFQUFPLEVBQUEsR0FBRyxRQUFRLENBQUMsSUFGbkI7VUFHQSxVQUFBLEVBQ0U7WUFBQSxPQUFBLEVBQVMseUJBQUEsR0FBMEIsUUFBUSxDQUFDLElBQW5DLEdBQXdDLDhCQUF4QyxHQUFzRSxRQUFRLENBQUMsT0FBL0UsR0FBdUYsOEJBQXZGLEdBQXFILFFBQVEsQ0FBQyxLQUE5SCxHQUFvSSx1Q0FBcEksR0FBMkssUUFBUSxDQUFDLEdBQXBMLEdBQXdMLElBQXhMLEdBQTRMLFFBQVEsQ0FBQyxHQUFyTSxHQUF5TSxRQUFsTjtXQUpGO1NBREY7TUFMZ0I7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCO0VBRlksQ0F0S2Q7Ozs7OztBQ0hGLElBQUE7O0FBQUEsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQU1WLENBQUEsQ0FBRSxTQUFBO0FBRUEsTUFBQTtFQUFBLE9BQU8sQ0FBQyxJQUFSLENBQUE7RUFFQSxDQUFBLENBQUUsY0FBRixDQUFpQixDQUFDLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFNBQUE7SUFDNUIsQ0FBQSxDQUFFLGlCQUFGLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsUUFBakM7SUFDQSxDQUFBLENBQUUsTUFBRixDQUFTLENBQUMsV0FBVixDQUFzQixhQUF0QjtJQUNBLENBQUEsQ0FBRSxTQUFGLENBQVksQ0FBQyxXQUFiLENBQXlCLGdCQUF6QjtXQUNBLENBQUEsQ0FBRSxTQUFGLENBQVksQ0FBQyxXQUFiLENBQXlCLGdCQUF6QjtFQUo0QixDQUE5QjtFQU1BLENBQUEsQ0FBRSxTQUFGLENBQVksQ0FBQyxLQUFiLENBQ0U7SUFBQSxJQUFBLEVBQU0sSUFBTjtJQUNBLEtBQUEsRUFBTyxHQURQO0lBRUEsT0FBQSxFQUFTLDBDQUZUO0lBR0EsY0FBQSxFQUFnQixDQUhoQjtJQUlBLFFBQUEsRUFBVSxJQUpWO0lBS0EsYUFBQSxFQUFlLElBTGY7R0FERjtFQVFBLENBQUEsQ0FBRSxtQkFBRixDQUFzQixDQUFDLEtBQXZCLENBQ0U7SUFBQSxJQUFBLEVBQU0sS0FBTjtJQUNBLFlBQUEsRUFBYyxDQURkO0lBRUEsVUFBQSxFQUFZO01BQ1Y7UUFDRSxVQUFBLEVBQVksR0FEZDtRQUVFLFFBQUEsRUFDRTtVQUFBLFlBQUEsRUFBYyxDQUFkO1VBQ0EsY0FBQSxFQUFnQixDQURoQjtTQUhKO09BRFU7S0FGWjtHQURGO0VBWUEsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEtBQVosQ0FBa0IsU0FBQSxHQUFBLENBQWxCO0VBQ0EsVUFBQSxHQUFhO0VBQ2IsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLE1BQVosQ0FBbUIsU0FBQTtJQUNqQixVQUFBLEdBQWEsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLFNBQVIsQ0FBQTtJQUNiLElBQUcsVUFBQSxHQUFhLEVBQWhCO2FBQ0UsQ0FBQSxDQUFFLGlCQUFGLENBQW9CLENBQUMsR0FBckIsQ0FBeUIsS0FBekIsRUFBZ0MsR0FBaEMsRUFERjtLQUFBLE1BQUE7YUFHRSxDQUFBLENBQUUsaUJBQUYsQ0FBb0IsQ0FBQyxHQUFyQixDQUF5QixLQUF6QixFQUFnQyxRQUFoQyxFQUhGOztFQUZpQixDQUFuQjtFQU9BLFdBQUEsR0FBYyxDQUFBLENBQUUsWUFBRjtFQUNkLFlBQUEsR0FBZSxDQUFBLENBQUUsYUFBRjtFQUVmLENBQUEsQ0FBRSxRQUFGLENBQVcsQ0FBQyxFQUFaLENBQWUsWUFBZixFQUE2QixZQUE3QixFQUEyQyxTQUFBO1dBQ3pDLFFBQVEsQ0FBQyxPQUFULENBQWlCLFdBQVksQ0FBQSxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsTUFBUixDQUFBLENBQWdCLENBQUMsS0FBakIsQ0FBQSxDQUFBLENBQTdCLEVBQXdEO01BQUMsS0FBQSxFQUFPLE1BQVI7S0FBeEQsRUFBeUU7TUFBQSxJQUFBLEVBQU0sUUFBUSxDQUFDLE1BQWY7S0FBekU7RUFEeUMsQ0FBM0M7RUFFQSxDQUFBLENBQUUsUUFBRixDQUFXLENBQUMsRUFBWixDQUFlLFlBQWYsRUFBNkIsWUFBN0IsRUFBMkMsU0FBQTtXQUN6QyxRQUFRLENBQUMsT0FBVCxDQUFpQixXQUFZLENBQUEsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUFnQixDQUFDLEtBQWpCLENBQUEsQ0FBQSxDQUE3QixFQUF3RDtNQUFFLEtBQUEsRUFBTyxHQUFUO0tBQXhELEVBQXdFO01BQUEsSUFBQSxFQUFNLFFBQVEsQ0FBQyxNQUFmO0tBQXhFO0VBRHlDLENBQTNDO0VBR0EsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEVBQVosQ0FBZSxZQUFmLEVBQTZCLGdCQUE3QixFQUErQyxTQUFBO1dBQzdDLFFBQVEsQ0FBQyxPQUFULENBQWlCLFlBQWEsQ0FBQSxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsTUFBUixDQUFBLENBQWdCLENBQUMsS0FBakIsQ0FBQSxDQUFBLENBQTlCLEVBQXlEO01BQUMsS0FBQSxFQUFPLE1BQVI7S0FBekQsRUFBMEU7TUFBQSxJQUFBLEVBQU0sUUFBUSxDQUFDLE1BQWY7S0FBMUU7RUFENkMsQ0FBL0M7U0FFQSxDQUFBLENBQUUsUUFBRixDQUFXLENBQUMsRUFBWixDQUFlLFlBQWYsRUFBNkIsZ0JBQTdCLEVBQStDLFNBQUE7V0FDN0MsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsWUFBYSxDQUFBLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxNQUFSLENBQUEsQ0FBZ0IsQ0FBQyxLQUFqQixDQUFBLENBQUEsQ0FBOUIsRUFBeUQ7TUFBRSxLQUFBLEVBQU8sR0FBVDtLQUF6RCxFQUF5RTtNQUFBLElBQUEsRUFBTSxRQUFRLENBQUMsTUFBZjtLQUF6RTtFQUQ2QyxDQUEvQztBQWpEQSxDQUFGIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH1cbiAgZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ0dNYXBzJywgW10sIGZhY3RvcnkpO1xuICB9XG5cbiAgcm9vdC5HTWFwcyA9IGZhY3RvcnkoKTtcblxufSh0aGlzLCBmdW5jdGlvbigpIHtcblxuLyohXG4gKiBHTWFwcy5qcyB2MC40LjE4XG4gKiBodHRwOi8vaHBuZW8uZ2l0aHViLmNvbS9nbWFwcy9cbiAqXG4gKiBDb3B5cmlnaHQgMjAxNSwgR3VzdGF2byBMZW9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuaWYgKCEodHlwZW9mIHdpbmRvdy5nb29nbGUgPT09ICdvYmplY3QnICYmIHdpbmRvdy5nb29nbGUubWFwcykpIHtcbiAgdGhyb3cgJ0dvb2dsZSBNYXBzIEFQSSBpcyByZXF1aXJlZC4gUGxlYXNlIHJlZ2lzdGVyIHRoZSBmb2xsb3dpbmcgSmF2YVNjcmlwdCBsaWJyYXJ5IGh0dHA6Ly9tYXBzLmdvb2dsZS5jb20vbWFwcy9hcGkvanM/c2Vuc29yPXRydWUuJ1xufVxuXG52YXIgZXh0ZW5kX29iamVjdCA9IGZ1bmN0aW9uKG9iaiwgbmV3X29iaikge1xuICB2YXIgbmFtZTtcblxuICBpZiAob2JqID09PSBuZXdfb2JqKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIGZvciAobmFtZSBpbiBuZXdfb2JqKSB7XG4gICAgb2JqW25hbWVdID0gbmV3X29ialtuYW1lXTtcbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgcmVwbGFjZV9vYmplY3QgPSBmdW5jdGlvbihvYmosIHJlcGxhY2UpIHtcbiAgdmFyIG5hbWU7XG5cbiAgaWYgKG9iaiA9PT0gcmVwbGFjZSkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBmb3IgKG5hbWUgaW4gcmVwbGFjZSkge1xuICAgIGlmIChvYmpbbmFtZV0gIT0gdW5kZWZpbmVkKSB7XG4gICAgICBvYmpbbmFtZV0gPSByZXBsYWNlW25hbWVdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgYXJyYXlfbWFwID0gZnVuY3Rpb24oYXJyYXksIGNhbGxiYWNrKSB7XG4gIHZhciBvcmlnaW5hbF9jYWxsYmFja19wYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLFxuICAgICAgYXJyYXlfcmV0dXJuID0gW10sXG4gICAgICBhcnJheV9sZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICBpO1xuXG4gIGlmIChBcnJheS5wcm90b3R5cGUubWFwICYmIGFycmF5Lm1hcCA9PT0gQXJyYXkucHJvdG90eXBlLm1hcCkge1xuICAgIGFycmF5X3JldHVybiA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChhcnJheSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdmFyIGNhbGxiYWNrX3BhcmFtcyA9IG9yaWdpbmFsX2NhbGxiYWNrX3BhcmFtcy5zbGljZSgwKTtcbiAgICAgIGNhbGxiYWNrX3BhcmFtcy5zcGxpY2UoMCwgMCwgaXRlbSk7XG5cbiAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzLCBjYWxsYmFja19wYXJhbXMpO1xuICAgIH0pO1xuICB9XG4gIGVsc2Uge1xuICAgIGZvciAoaSA9IDA7IGkgPCBhcnJheV9sZW5ndGg7IGkrKykge1xuICAgICAgY2FsbGJhY2tfcGFyYW1zID0gb3JpZ2luYWxfY2FsbGJhY2tfcGFyYW1zO1xuICAgICAgY2FsbGJhY2tfcGFyYW1zLnNwbGljZSgwLCAwLCBhcnJheVtpXSk7XG4gICAgICBhcnJheV9yZXR1cm4ucHVzaChjYWxsYmFjay5hcHBseSh0aGlzLCBjYWxsYmFja19wYXJhbXMpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXJyYXlfcmV0dXJuO1xufTtcblxudmFyIGFycmF5X2ZsYXQgPSBmdW5jdGlvbihhcnJheSkge1xuICB2YXIgbmV3X2FycmF5ID0gW10sXG4gICAgICBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIG5ld19hcnJheSA9IG5ld19hcnJheS5jb25jYXQoYXJyYXlbaV0pO1xuICB9XG5cbiAgcmV0dXJuIG5ld19hcnJheTtcbn07XG5cbnZhciBjb29yZHNUb0xhdExuZ3MgPSBmdW5jdGlvbihjb29yZHMsIHVzZUdlb0pTT04pIHtcbiAgdmFyIGZpcnN0X2Nvb3JkID0gY29vcmRzWzBdLFxuICAgICAgc2Vjb25kX2Nvb3JkID0gY29vcmRzWzFdO1xuXG4gIGlmICh1c2VHZW9KU09OKSB7XG4gICAgZmlyc3RfY29vcmQgPSBjb29yZHNbMV07XG4gICAgc2Vjb25kX2Nvb3JkID0gY29vcmRzWzBdO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBnb29nbGUubWFwcy5MYXRMbmcoZmlyc3RfY29vcmQsIHNlY29uZF9jb29yZCk7XG59O1xuXG52YXIgYXJyYXlUb0xhdExuZyA9IGZ1bmN0aW9uKGNvb3JkcywgdXNlR2VvSlNPTikge1xuICB2YXIgaTtcblxuICBmb3IgKGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCEoY29vcmRzW2ldIGluc3RhbmNlb2YgZ29vZ2xlLm1hcHMuTGF0TG5nKSkge1xuICAgICAgaWYgKGNvb3Jkc1tpXS5sZW5ndGggPiAwICYmIHR5cGVvZihjb29yZHNbaV1bMF0pID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGNvb3Jkc1tpXSA9IGFycmF5VG9MYXRMbmcoY29vcmRzW2ldLCB1c2VHZW9KU09OKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb29yZHNbaV0gPSBjb29yZHNUb0xhdExuZ3MoY29vcmRzW2ldLCB1c2VHZW9KU09OKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29vcmRzO1xufTtcblxuXG52YXIgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSA9IGZ1bmN0aW9uIChjbGFzc19uYW1lLCBjb250ZXh0KSB7XG5cbiAgICB2YXIgZWxlbWVudCxcbiAgICAgICAgX2NsYXNzID0gY2xhc3NfbmFtZS5yZXBsYWNlKCcuJywgJycpO1xuXG4gICAgaWYgKCdqUXVlcnknIGluIHRoaXMgJiYgY29udGV4dCkge1xuICAgICAgICBlbGVtZW50ID0gJChcIi5cIiArIF9jbGFzcywgY29udGV4dClbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoX2NsYXNzKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG5cbn07XG5cbnZhciBnZXRFbGVtZW50QnlJZCA9IGZ1bmN0aW9uKGlkLCBjb250ZXh0KSB7XG4gIHZhciBlbGVtZW50LFxuICBpZCA9IGlkLnJlcGxhY2UoJyMnLCAnJyk7XG5cbiAgaWYgKCdqUXVlcnknIGluIHdpbmRvdyAmJiBjb250ZXh0KSB7XG4gICAgZWxlbWVudCA9ICQoJyMnICsgaWQsIGNvbnRleHQpWzBdO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIH07XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG52YXIgZmluZEFic29sdXRlUG9zaXRpb24gPSBmdW5jdGlvbihvYmopICB7XG4gIHZhciBjdXJsZWZ0ID0gMCxcbiAgICAgIGN1cnRvcCA9IDA7XG5cbiAgaWYgKG9iai5vZmZzZXRQYXJlbnQpIHtcbiAgICBkbyB7XG4gICAgICBjdXJsZWZ0ICs9IG9iai5vZmZzZXRMZWZ0O1xuICAgICAgY3VydG9wICs9IG9iai5vZmZzZXRUb3A7XG4gICAgfSB3aGlsZSAob2JqID0gb2JqLm9mZnNldFBhcmVudCk7XG4gIH1cblxuICByZXR1cm4gW2N1cmxlZnQsIGN1cnRvcF07XG59O1xuXG52YXIgR01hcHMgPSAoZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBkb2MgPSBkb2N1bWVudDtcblxuICB2YXIgR01hcHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKCF0aGlzKSByZXR1cm4gbmV3IEdNYXBzKG9wdGlvbnMpO1xuXG4gICAgb3B0aW9ucy56b29tID0gb3B0aW9ucy56b29tIHx8IDE1O1xuICAgIG9wdGlvbnMubWFwVHlwZSA9IG9wdGlvbnMubWFwVHlwZSB8fCAncm9hZG1hcCc7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGksXG4gICAgICAgIGV2ZW50c190aGF0X2hpZGVfY29udGV4dF9tZW51ID0gW1xuICAgICAgICAgICdib3VuZHNfY2hhbmdlZCcsICdjZW50ZXJfY2hhbmdlZCcsICdjbGljaycsICdkYmxjbGljaycsICdkcmFnJyxcbiAgICAgICAgICAnZHJhZ2VuZCcsICdkcmFnc3RhcnQnLCAnaWRsZScsICdtYXB0eXBlaWRfY2hhbmdlZCcsICdwcm9qZWN0aW9uX2NoYW5nZWQnLFxuICAgICAgICAgICdyZXNpemUnLCAndGlsZXNsb2FkZWQnLCAnem9vbV9jaGFuZ2VkJ1xuICAgICAgICBdLFxuICAgICAgICBldmVudHNfdGhhdF9kb2VzbnRfaGlkZV9jb250ZXh0X21lbnUgPSBbJ21vdXNlbW92ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInXSxcbiAgICAgICAgb3B0aW9uc190b19iZV9kZWxldGVkID0gWydlbCcsICdsYXQnLCAnbG5nJywgJ21hcFR5cGUnLCAnd2lkdGgnLCAnaGVpZ2h0JywgJ21hcmtlckNsdXN0ZXJlcicsICdlbmFibGVOZXdTdHlsZSddLFxuICAgICAgICBpZGVudGlmaWVyID0gb3B0aW9ucy5lbCB8fCBvcHRpb25zLmRpdixcbiAgICAgICAgbWFya2VyQ2x1c3RlcmVyRnVuY3Rpb24gPSBvcHRpb25zLm1hcmtlckNsdXN0ZXJlcixcbiAgICAgICAgbWFwVHlwZSA9IGdvb2dsZS5tYXBzLk1hcFR5cGVJZFtvcHRpb25zLm1hcFR5cGUudG9VcHBlckNhc2UoKV0sXG4gICAgICAgIG1hcF9jZW50ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMubGF0LCBvcHRpb25zLmxuZyksXG4gICAgICAgIHpvb21Db250cm9sID0gb3B0aW9ucy56b29tQ29udHJvbCB8fCB0cnVlLFxuICAgICAgICB6b29tQ29udHJvbE9wdCA9IG9wdGlvbnMuem9vbUNvbnRyb2xPcHQgfHwge1xuICAgICAgICAgIHN0eWxlOiAnREVGQVVMVCcsXG4gICAgICAgICAgcG9zaXRpb246ICdUT1BfTEVGVCdcbiAgICAgICAgfSxcbiAgICAgICAgem9vbUNvbnRyb2xTdHlsZSA9IHpvb21Db250cm9sT3B0LnN0eWxlIHx8ICdERUZBVUxUJyxcbiAgICAgICAgem9vbUNvbnRyb2xQb3NpdGlvbiA9IHpvb21Db250cm9sT3B0LnBvc2l0aW9uIHx8ICdUT1BfTEVGVCcsXG4gICAgICAgIHBhbkNvbnRyb2wgPSBvcHRpb25zLnBhbkNvbnRyb2wgfHwgdHJ1ZSxcbiAgICAgICAgbWFwVHlwZUNvbnRyb2wgPSBvcHRpb25zLm1hcFR5cGVDb250cm9sIHx8IHRydWUsXG4gICAgICAgIHNjYWxlQ29udHJvbCA9IG9wdGlvbnMuc2NhbGVDb250cm9sIHx8IHRydWUsXG4gICAgICAgIHN0cmVldFZpZXdDb250cm9sID0gb3B0aW9ucy5zdHJlZXRWaWV3Q29udHJvbCB8fCB0cnVlLFxuICAgICAgICBvdmVydmlld01hcENvbnRyb2wgPSBvdmVydmlld01hcENvbnRyb2wgfHwgdHJ1ZSxcbiAgICAgICAgbWFwX29wdGlvbnMgPSB7fSxcbiAgICAgICAgbWFwX2Jhc2Vfb3B0aW9ucyA9IHtcbiAgICAgICAgICB6b29tOiB0aGlzLnpvb20sXG4gICAgICAgICAgY2VudGVyOiBtYXBfY2VudGVyLFxuICAgICAgICAgIG1hcFR5cGVJZDogbWFwVHlwZVxuICAgICAgICB9LFxuICAgICAgICBtYXBfY29udHJvbHNfb3B0aW9ucyA9IHtcbiAgICAgICAgICBwYW5Db250cm9sOiBwYW5Db250cm9sLFxuICAgICAgICAgIHpvb21Db250cm9sOiB6b29tQ29udHJvbCxcbiAgICAgICAgICB6b29tQ29udHJvbE9wdGlvbnM6IHtcbiAgICAgICAgICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlW3pvb21Db250cm9sU3R5bGVdLFxuICAgICAgICAgICAgcG9zaXRpb246IGdvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvblt6b29tQ29udHJvbFBvc2l0aW9uXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IG1hcFR5cGVDb250cm9sLFxuICAgICAgICAgIHNjYWxlQ29udHJvbDogc2NhbGVDb250cm9sLFxuICAgICAgICAgIHN0cmVldFZpZXdDb250cm9sOiBzdHJlZXRWaWV3Q29udHJvbCxcbiAgICAgICAgICBvdmVydmlld01hcENvbnRyb2w6IG92ZXJ2aWV3TWFwQ29udHJvbFxuICAgICAgICB9O1xuXG4gICAgICBpZiAodHlwZW9mKG9wdGlvbnMuZWwpID09PSAnc3RyaW5nJyB8fCB0eXBlb2Yob3B0aW9ucy5kaXYpID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgaWYgKGlkZW50aWZpZXIuaW5kZXhPZihcIiNcIikgPiAtMSkge1xuICAgICAgICAgICAgICB0aGlzLmVsID0gZ2V0RWxlbWVudEJ5SWQoaWRlbnRpZmllciwgb3B0aW9ucy5jb250ZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmVsID0gZ2V0RWxlbWVudHNCeUNsYXNzTmFtZS5hcHBseSh0aGlzLCBbaWRlbnRpZmllciwgb3B0aW9ucy5jb250ZXh0XSk7XG4gICAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZWwgPSBpZGVudGlmaWVyO1xuICAgICAgfVxuXG4gICAgaWYgKHR5cGVvZih0aGlzLmVsKSA9PT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy5lbCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgJ05vIGVsZW1lbnQgZGVmaW5lZC4nO1xuICAgIH1cblxuICAgIHdpbmRvdy5jb250ZXh0X21lbnUgPSB3aW5kb3cuY29udGV4dF9tZW51IHx8IHt9O1xuICAgIHdpbmRvdy5jb250ZXh0X21lbnVbc2VsZi5lbC5pZF0gPSB7fTtcblxuICAgIHRoaXMuY29udHJvbHMgPSBbXTtcbiAgICB0aGlzLm92ZXJsYXlzID0gW107XG4gICAgdGhpcy5sYXllcnMgPSBbXTsgLy8gYXJyYXkgd2l0aCBrbWwvZ2VvcnNzIGFuZCBmdXNpb250YWJsZXMgbGF5ZXJzLCBjYW4gYmUgYXMgbWFueVxuICAgIHRoaXMuc2luZ2xlTGF5ZXJzID0ge307IC8vIG9iamVjdCB3aXRoIHRoZSBvdGhlciBsYXllcnMsIG9ubHkgb25lIHBlciBsYXllclxuICAgIHRoaXMubWFya2VycyA9IFtdO1xuICAgIHRoaXMucG9seWxpbmVzID0gW107XG4gICAgdGhpcy5yb3V0ZXMgPSBbXTtcbiAgICB0aGlzLnBvbHlnb25zID0gW107XG4gICAgdGhpcy5pbmZvV2luZG93ID0gbnVsbDtcbiAgICB0aGlzLm92ZXJsYXlfZWwgPSBudWxsO1xuICAgIHRoaXMuem9vbSA9IG9wdGlvbnMuem9vbTtcbiAgICB0aGlzLnJlZ2lzdGVyZWRfZXZlbnRzID0ge307XG5cbiAgICB0aGlzLmVsLnN0eWxlLndpZHRoID0gb3B0aW9ucy53aWR0aCB8fCB0aGlzLmVsLnNjcm9sbFdpZHRoIHx8IHRoaXMuZWwub2Zmc2V0V2lkdGg7XG4gICAgdGhpcy5lbC5zdHlsZS5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCB0aGlzLmVsLnNjcm9sbEhlaWdodCB8fCB0aGlzLmVsLm9mZnNldEhlaWdodDtcblxuICAgIGdvb2dsZS5tYXBzLnZpc3VhbFJlZnJlc2ggPSBvcHRpb25zLmVuYWJsZU5ld1N0eWxlO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnNfdG9fYmVfZGVsZXRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgZGVsZXRlIG9wdGlvbnNbb3B0aW9uc190b19iZV9kZWxldGVkW2ldXTtcbiAgICB9XG5cbiAgICBpZihvcHRpb25zLmRpc2FibGVEZWZhdWx0VUkgIT0gdHJ1ZSkge1xuICAgICAgbWFwX2Jhc2Vfb3B0aW9ucyA9IGV4dGVuZF9vYmplY3QobWFwX2Jhc2Vfb3B0aW9ucywgbWFwX2NvbnRyb2xzX29wdGlvbnMpO1xuICAgIH1cblxuICAgIG1hcF9vcHRpb25zID0gZXh0ZW5kX29iamVjdChtYXBfYmFzZV9vcHRpb25zLCBvcHRpb25zKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBldmVudHNfdGhhdF9oaWRlX2NvbnRleHRfbWVudS5sZW5ndGg7IGkrKykge1xuICAgICAgZGVsZXRlIG1hcF9vcHRpb25zW2V2ZW50c190aGF0X2hpZGVfY29udGV4dF9tZW51W2ldXTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnRzX3RoYXRfZG9lc250X2hpZGVfY29udGV4dF9tZW51Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZWxldGUgbWFwX29wdGlvbnNbZXZlbnRzX3RoYXRfZG9lc250X2hpZGVfY29udGV4dF9tZW51W2ldXTtcbiAgICB9XG5cbiAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5lbCwgbWFwX29wdGlvbnMpO1xuXG4gICAgaWYgKG1hcmtlckNsdXN0ZXJlckZ1bmN0aW9uKSB7XG4gICAgICB0aGlzLm1hcmtlckNsdXN0ZXJlciA9IG1hcmtlckNsdXN0ZXJlckZ1bmN0aW9uLmFwcGx5KHRoaXMsIFt0aGlzLm1hcF0pO1xuICAgIH1cblxuICAgIHZhciBidWlsZENvbnRleHRNZW51SFRNTCA9IGZ1bmN0aW9uKGNvbnRyb2wsIGUpIHtcbiAgICAgIHZhciBodG1sID0gJycsXG4gICAgICAgICAgb3B0aW9ucyA9IHdpbmRvdy5jb250ZXh0X21lbnVbc2VsZi5lbC5pZF1bY29udHJvbF07XG5cbiAgICAgIGZvciAodmFyIGkgaW4gb3B0aW9ucyl7XG4gICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgdmFyIG9wdGlvbiA9IG9wdGlvbnNbaV07XG5cbiAgICAgICAgICBodG1sICs9ICc8bGk+PGEgaWQ9XCInICsgY29udHJvbCArICdfJyArIGkgKyAnXCIgaHJlZj1cIiNcIj4nICsgb3B0aW9uLnRpdGxlICsgJzwvYT48L2xpPic7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFnZXRFbGVtZW50QnlJZCgnZ21hcHNfY29udGV4dF9tZW51JykpIHJldHVybjtcblxuICAgICAgdmFyIGNvbnRleHRfbWVudV9lbGVtZW50ID0gZ2V0RWxlbWVudEJ5SWQoJ2dtYXBzX2NvbnRleHRfbWVudScpO1xuICAgICAgXG4gICAgICBjb250ZXh0X21lbnVfZWxlbWVudC5pbm5lckhUTUwgPSBodG1sO1xuXG4gICAgICB2YXIgY29udGV4dF9tZW51X2l0ZW1zID0gY29udGV4dF9tZW51X2VsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2EnKSxcbiAgICAgICAgICBjb250ZXh0X21lbnVfaXRlbXNfY291bnQgPSBjb250ZXh0X21lbnVfaXRlbXMubGVuZ3RoLFxuICAgICAgICAgIGk7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjb250ZXh0X21lbnVfaXRlbXNfY291bnQ7IGkrKykge1xuICAgICAgICB2YXIgY29udGV4dF9tZW51X2l0ZW0gPSBjb250ZXh0X21lbnVfaXRlbXNbaV07XG5cbiAgICAgICAgdmFyIGFzc2lnbl9tZW51X2l0ZW1fYWN0aW9uID0gZnVuY3Rpb24oZXYpe1xuICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBvcHRpb25zW3RoaXMuaWQucmVwbGFjZShjb250cm9sICsgJ18nLCAnJyldLmFjdGlvbi5hcHBseShzZWxmLCBbZV0pO1xuICAgICAgICAgIHNlbGYuaGlkZUNvbnRleHRNZW51KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuY2xlYXJMaXN0ZW5lcnMoY29udGV4dF9tZW51X2l0ZW0sICdjbGljaycpO1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGREb21MaXN0ZW5lck9uY2UoY29udGV4dF9tZW51X2l0ZW0sICdjbGljaycsIGFzc2lnbl9tZW51X2l0ZW1fYWN0aW9uLCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwb3NpdGlvbiA9IGZpbmRBYnNvbHV0ZVBvc2l0aW9uLmFwcGx5KHRoaXMsIFtzZWxmLmVsXSksXG4gICAgICAgICAgbGVmdCA9IHBvc2l0aW9uWzBdICsgZS5waXhlbC54IC0gMTUsXG4gICAgICAgICAgdG9wID0gcG9zaXRpb25bMV0gKyBlLnBpeGVsLnktIDE1O1xuXG4gICAgICBjb250ZXh0X21lbnVfZWxlbWVudC5zdHlsZS5sZWZ0ID0gbGVmdCArIFwicHhcIjtcbiAgICAgIGNvbnRleHRfbWVudV9lbGVtZW50LnN0eWxlLnRvcCA9IHRvcCArIFwicHhcIjtcblxuICAgICAgY29udGV4dF9tZW51X2VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgfTtcblxuICAgIHRoaXMuYnVpbGRDb250ZXh0TWVudSA9IGZ1bmN0aW9uKGNvbnRyb2wsIGUpIHtcbiAgICAgIGlmIChjb250cm9sID09PSAnbWFya2VyJykge1xuICAgICAgICBlLnBpeGVsID0ge307XG5cbiAgICAgICAgdmFyIG92ZXJsYXkgPSBuZXcgZ29vZ2xlLm1hcHMuT3ZlcmxheVZpZXcoKTtcbiAgICAgICAgb3ZlcmxheS5zZXRNYXAoc2VsZi5tYXApO1xuICAgICAgICBcbiAgICAgICAgb3ZlcmxheS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHByb2plY3Rpb24gPSBvdmVybGF5LmdldFByb2plY3Rpb24oKSxcbiAgICAgICAgICAgICAgcG9zaXRpb24gPSBlLm1hcmtlci5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgIFxuICAgICAgICAgIGUucGl4ZWwgPSBwcm9qZWN0aW9uLmZyb21MYXRMbmdUb0NvbnRhaW5lclBpeGVsKHBvc2l0aW9uKTtcblxuICAgICAgICAgIGJ1aWxkQ29udGV4dE1lbnVIVE1MKGNvbnRyb2wsIGUpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGJ1aWxkQ29udGV4dE1lbnVIVE1MKGNvbnRyb2wsIGUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnNldENvbnRleHRNZW51ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgd2luZG93LmNvbnRleHRfbWVudVtzZWxmLmVsLmlkXVtvcHRpb25zLmNvbnRyb2xdID0ge307XG5cbiAgICAgIHZhciBpLFxuICAgICAgICAgIHVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG5cbiAgICAgIGZvciAoaSBpbiBvcHRpb25zLm9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMub3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgIHZhciBvcHRpb24gPSBvcHRpb25zLm9wdGlvbnNbaV07XG5cbiAgICAgICAgICB3aW5kb3cuY29udGV4dF9tZW51W3NlbGYuZWwuaWRdW29wdGlvbnMuY29udHJvbF1bb3B0aW9uLm5hbWVdID0ge1xuICAgICAgICAgICAgdGl0bGU6IG9wdGlvbi50aXRsZSxcbiAgICAgICAgICAgIGFjdGlvbjogb3B0aW9uLmFjdGlvblxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdWwuaWQgPSAnZ21hcHNfY29udGV4dF9tZW51JztcbiAgICAgIHVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB1bC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICB1bC5zdHlsZS5taW5XaWR0aCA9ICcxMDBweCc7XG4gICAgICB1bC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3doaXRlJztcbiAgICAgIHVsLnN0eWxlLmxpc3RTdHlsZSA9ICdub25lJztcbiAgICAgIHVsLnN0eWxlLnBhZGRpbmcgPSAnOHB4JztcbiAgICAgIHVsLnN0eWxlLmJveFNoYWRvdyA9ICcycHggMnB4IDZweCAjY2NjJztcblxuICAgICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQodWwpO1xuXG4gICAgICB2YXIgY29udGV4dF9tZW51X2VsZW1lbnQgPSBnZXRFbGVtZW50QnlJZCgnZ21hcHNfY29udGV4dF9tZW51JylcblxuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXIoY29udGV4dF9tZW51X2VsZW1lbnQsICdtb3VzZW91dCcsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICghZXYucmVsYXRlZFRhcmdldCB8fCAhdGhpcy5jb250YWlucyhldi5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjb250ZXh0X21lbnVfZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cbiAgICAgIH0sIGZhbHNlKTtcbiAgICB9O1xuXG4gICAgdGhpcy5oaWRlQ29udGV4dE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjb250ZXh0X21lbnVfZWxlbWVudCA9IGdldEVsZW1lbnRCeUlkKCdnbWFwc19jb250ZXh0X21lbnUnKTtcblxuICAgICAgaWYgKGNvbnRleHRfbWVudV9lbGVtZW50KSB7XG4gICAgICAgIGNvbnRleHRfbWVudV9lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBzZXR1cExpc3RlbmVyID0gZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBpZiAoZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBlID0gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcblxuICAgICAgICBzZWxmLmhpZGVDb250ZXh0TWVudSgpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXAsICdpZGxlJywgdGhpcy5oaWRlQ29udGV4dE1lbnUpO1xuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFwLCAnem9vbV9jaGFuZ2VkJywgdGhpcy5oaWRlQ29udGV4dE1lbnUpO1xuXG4gICAgZm9yICh2YXIgZXYgPSAwOyBldiA8IGV2ZW50c190aGF0X2hpZGVfY29udGV4dF9tZW51Lmxlbmd0aDsgZXYrKykge1xuICAgICAgdmFyIG5hbWUgPSBldmVudHNfdGhhdF9oaWRlX2NvbnRleHRfbWVudVtldl07XG5cbiAgICAgIGlmIChuYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgICAgc2V0dXBMaXN0ZW5lcih0aGlzLm1hcCwgbmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZXYgPSAwOyBldiA8IGV2ZW50c190aGF0X2RvZXNudF9oaWRlX2NvbnRleHRfbWVudS5sZW5ndGg7IGV2KyspIHtcbiAgICAgIHZhciBuYW1lID0gZXZlbnRzX3RoYXRfZG9lc250X2hpZGVfY29udGV4dF9tZW51W2V2XTtcblxuICAgICAgaWYgKG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgICBzZXR1cExpc3RlbmVyKHRoaXMubWFwLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLm1hcCwgJ3JpZ2h0Y2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAob3B0aW9ucy5yaWdodGNsaWNrKSB7XG4gICAgICAgIG9wdGlvbnMucmlnaHRjbGljay5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgfVxuXG4gICAgICBpZih3aW5kb3cuY29udGV4dF9tZW51W3NlbGYuZWwuaWRdWydtYXAnXSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2VsZi5idWlsZENvbnRleHRNZW51KCdtYXAnLCBlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcih0aGlzLm1hcCwgJ3Jlc2l6ZScpO1xuICAgIH07XG5cbiAgICB0aGlzLmZpdFpvb20gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsYXRMbmdzID0gW10sXG4gICAgICAgICAgbWFya2Vyc19sZW5ndGggPSB0aGlzLm1hcmtlcnMubGVuZ3RoLFxuICAgICAgICAgIGk7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBtYXJrZXJzX2xlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmKHR5cGVvZih0aGlzLm1hcmtlcnNbaV0udmlzaWJsZSkgPT09ICdib29sZWFuJyAmJiB0aGlzLm1hcmtlcnNbaV0udmlzaWJsZSkge1xuICAgICAgICAgIGxhdExuZ3MucHVzaCh0aGlzLm1hcmtlcnNbaV0uZ2V0UG9zaXRpb24oKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5maXRMYXRMbmdCb3VuZHMobGF0TG5ncyk7XG4gICAgfTtcblxuICAgIHRoaXMuZml0TGF0TG5nQm91bmRzID0gZnVuY3Rpb24obGF0TG5ncykge1xuICAgICAgdmFyIHRvdGFsID0gbGF0TG5ncy5sZW5ndGgsXG4gICAgICAgICAgYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpLFxuICAgICAgICAgIGk7XG5cbiAgICAgIGZvcihpID0gMDsgaSA8IHRvdGFsOyBpKyspIHtcbiAgICAgICAgYm91bmRzLmV4dGVuZChsYXRMbmdzW2ldKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5tYXAuZml0Qm91bmRzKGJvdW5kcyk7XG4gICAgfTtcblxuICAgIHRoaXMuc2V0Q2VudGVyID0gZnVuY3Rpb24obGF0LCBsbmcsIGNhbGxiYWNrKSB7XG4gICAgICB0aGlzLm1hcC5wYW5UbyhuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGxhdCwgbG5nKSk7XG5cbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmdldEVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmVsO1xuICAgIH07XG5cbiAgICB0aGlzLnpvb21JbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlIHx8IDE7XG5cbiAgICAgIHRoaXMuem9vbSA9IHRoaXMubWFwLmdldFpvb20oKSArIHZhbHVlO1xuICAgICAgdGhpcy5tYXAuc2V0Wm9vbSh0aGlzLnpvb20pO1xuICAgIH07XG5cbiAgICB0aGlzLnpvb21PdXQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZSB8fCAxO1xuXG4gICAgICB0aGlzLnpvb20gPSB0aGlzLm1hcC5nZXRab29tKCkgLSB2YWx1ZTtcbiAgICAgIHRoaXMubWFwLnNldFpvb20odGhpcy56b29tKTtcbiAgICB9O1xuXG4gICAgdmFyIG5hdGl2ZV9tZXRob2RzID0gW10sXG4gICAgICAgIG1ldGhvZDtcblxuICAgIGZvciAobWV0aG9kIGluIHRoaXMubWFwKSB7XG4gICAgICBpZiAodHlwZW9mKHRoaXMubWFwW21ldGhvZF0pID09ICdmdW5jdGlvbicgJiYgIXRoaXNbbWV0aG9kXSkge1xuICAgICAgICBuYXRpdmVfbWV0aG9kcy5wdXNoKG1ldGhvZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IG5hdGl2ZV9tZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAoZnVuY3Rpb24oZ21hcHMsIHNjb3BlLCBtZXRob2RfbmFtZSkge1xuICAgICAgICBnbWFwc1ttZXRob2RfbmFtZV0gPSBmdW5jdGlvbigpe1xuICAgICAgICAgIHJldHVybiBzY29wZVttZXRob2RfbmFtZV0uYXBwbHkoc2NvcGUsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzLCB0aGlzLm1hcCwgbmF0aXZlX21ldGhvZHNbaV0pO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gR01hcHM7XG59KSh0aGlzKTtcblxuR01hcHMucHJvdG90eXBlLmNyZWF0ZUNvbnRyb2wgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBjb250cm9sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgY29udHJvbC5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gIFxuICBpZiAob3B0aW9ucy5kaXNhYmxlRGVmYXVsdFN0eWxlcyAhPT0gdHJ1ZSkge1xuICAgIGNvbnRyb2wuc3R5bGUuZm9udEZhbWlseSA9ICdSb2JvdG8sIEFyaWFsLCBzYW5zLXNlcmlmJztcbiAgICBjb250cm9sLnN0eWxlLmZvbnRTaXplID0gJzExcHgnO1xuICAgIGNvbnRyb2wuc3R5bGUuYm94U2hhZG93ID0gJ3JnYmEoMCwgMCwgMCwgMC4yOTgwMzkpIDBweCAxcHggNHB4IC0xcHgnO1xuICB9XG5cbiAgZm9yICh2YXIgb3B0aW9uIGluIG9wdGlvbnMuc3R5bGUpIHtcbiAgICBjb250cm9sLnN0eWxlW29wdGlvbl0gPSBvcHRpb25zLnN0eWxlW29wdGlvbl07XG4gIH1cblxuICBpZiAob3B0aW9ucy5pZCkge1xuICAgIGNvbnRyb2wuaWQgPSBvcHRpb25zLmlkO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuY2xhc3Nlcykge1xuICAgIGNvbnRyb2wuY2xhc3NOYW1lID0gb3B0aW9ucy5jbGFzc2VzO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuY29udGVudCkge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jb250ZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgY29udHJvbC5pbm5lckhUTUwgPSBvcHRpb25zLmNvbnRlbnQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdGlvbnMuY29udGVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICBjb250cm9sLmFwcGVuZENoaWxkKG9wdGlvbnMuY29udGVudCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdGlvbnMucG9zaXRpb24pIHtcbiAgICBjb250cm9sLnBvc2l0aW9uID0gZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uW29wdGlvbnMucG9zaXRpb24udG9VcHBlckNhc2UoKV07XG4gIH1cblxuICBmb3IgKHZhciBldiBpbiBvcHRpb25zLmV2ZW50cykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgb3B0aW9ucy5ldmVudHNbbmFtZV0uYXBwbHkodGhpcywgW3RoaXNdKTtcbiAgICAgIH0pO1xuICAgIH0pKGNvbnRyb2wsIGV2KTtcbiAgfVxuXG4gIGNvbnRyb2wuaW5kZXggPSAxO1xuXG4gIHJldHVybiBjb250cm9sO1xufTtcblxuR01hcHMucHJvdG90eXBlLmFkZENvbnRyb2wgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBjb250cm9sID0gdGhpcy5jcmVhdGVDb250cm9sKG9wdGlvbnMpO1xuICBcbiAgdGhpcy5jb250cm9scy5wdXNoKGNvbnRyb2wpO1xuICB0aGlzLm1hcC5jb250cm9sc1tjb250cm9sLnBvc2l0aW9uXS5wdXNoKGNvbnRyb2wpO1xuXG4gIHJldHVybiBjb250cm9sO1xufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZUNvbnRyb2wgPSBmdW5jdGlvbihjb250cm9sKSB7XG4gIHZhciBwb3NpdGlvbiA9IG51bGwsXG4gICAgICBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCB0aGlzLmNvbnRyb2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuY29udHJvbHNbaV0gPT0gY29udHJvbCkge1xuICAgICAgcG9zaXRpb24gPSB0aGlzLmNvbnRyb2xzW2ldLnBvc2l0aW9uO1xuICAgICAgdGhpcy5jb250cm9scy5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHBvc2l0aW9uKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMubWFwLmNvbnRyb2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29udHJvbHNGb3JQb3NpdGlvbiA9IHRoaXMubWFwLmNvbnRyb2xzW2NvbnRyb2wucG9zaXRpb25dO1xuXG4gICAgICBpZiAoY29udHJvbHNGb3JQb3NpdGlvbi5nZXRBdChpKSA9PSBjb250cm9sKSB7XG4gICAgICAgIGNvbnRyb2xzRm9yUG9zaXRpb24ucmVtb3ZlQXQoaSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRyb2w7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuY3JlYXRlTWFya2VyID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5sYXQgPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMubG5nID09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnBvc2l0aW9uID09IHVuZGVmaW5lZCkge1xuICAgIHRocm93ICdObyBsYXRpdHVkZSBvciBsb25naXR1ZGUgZGVmaW5lZC4nO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgZGV0YWlscyA9IG9wdGlvbnMuZGV0YWlscyxcbiAgICAgIGZlbmNlcyA9IG9wdGlvbnMuZmVuY2VzLFxuICAgICAgb3V0c2lkZSA9IG9wdGlvbnMub3V0c2lkZSxcbiAgICAgIGJhc2Vfb3B0aW9ucyA9IHtcbiAgICAgICAgcG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5sYXQsIG9wdGlvbnMubG5nKSxcbiAgICAgICAgbWFwOiBudWxsXG4gICAgICB9LFxuICAgICAgbWFya2VyX29wdGlvbnMgPSBleHRlbmRfb2JqZWN0KGJhc2Vfb3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgZGVsZXRlIG1hcmtlcl9vcHRpb25zLmxhdDtcbiAgZGVsZXRlIG1hcmtlcl9vcHRpb25zLmxuZztcbiAgZGVsZXRlIG1hcmtlcl9vcHRpb25zLmZlbmNlcztcbiAgZGVsZXRlIG1hcmtlcl9vcHRpb25zLm91dHNpZGU7XG5cbiAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIobWFya2VyX29wdGlvbnMpO1xuXG4gIG1hcmtlci5mZW5jZXMgPSBmZW5jZXM7XG5cbiAgaWYgKG9wdGlvbnMuaW5mb1dpbmRvdykge1xuICAgIG1hcmtlci5pbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3cob3B0aW9ucy5pbmZvV2luZG93KTtcblxuICAgIHZhciBpbmZvX3dpbmRvd19ldmVudHMgPSBbJ2Nsb3NlY2xpY2snLCAnY29udGVudF9jaGFuZ2VkJywgJ2RvbXJlYWR5JywgJ3Bvc2l0aW9uX2NoYW5nZWQnLCAnemluZGV4X2NoYW5nZWQnXTtcblxuICAgIGZvciAodmFyIGV2ID0gMDsgZXYgPCBpbmZvX3dpbmRvd19ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmluZm9XaW5kb3dbbmFtZV0pIHtcbiAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgb3B0aW9ucy5pbmZvV2luZG93W25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pKG1hcmtlci5pbmZvV2luZG93LCBpbmZvX3dpbmRvd19ldmVudHNbZXZdKTtcbiAgICB9XG4gIH1cblxuICB2YXIgbWFya2VyX2V2ZW50cyA9IFsnYW5pbWF0aW9uX2NoYW5nZWQnLCAnY2xpY2thYmxlX2NoYW5nZWQnLCAnY3Vyc29yX2NoYW5nZWQnLCAnZHJhZ2dhYmxlX2NoYW5nZWQnLCAnZmxhdF9jaGFuZ2VkJywgJ2ljb25fY2hhbmdlZCcsICdwb3NpdGlvbl9jaGFuZ2VkJywgJ3NoYWRvd19jaGFuZ2VkJywgJ3NoYXBlX2NoYW5nZWQnLCAndGl0bGVfY2hhbmdlZCcsICd2aXNpYmxlX2NoYW5nZWQnLCAnemluZGV4X2NoYW5nZWQnXTtcblxuICB2YXIgbWFya2VyX2V2ZW50c193aXRoX21vdXNlID0gWydkYmxjbGljaycsICdkcmFnJywgJ2RyYWdlbmQnLCAnZHJhZ3N0YXJ0JywgJ21vdXNlZG93bicsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnbW91c2V1cCddO1xuXG4gIGZvciAodmFyIGV2ID0gMDsgZXYgPCBtYXJrZXJfZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFt0aGlzXSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKG1hcmtlciwgbWFya2VyX2V2ZW50c1tldl0pO1xuICB9XG5cbiAgZm9yICh2YXIgZXYgPSAwOyBldiA8IG1hcmtlcl9ldmVudHNfd2l0aF9tb3VzZS5sZW5ndGg7IGV2KyspIHtcbiAgICAoZnVuY3Rpb24obWFwLCBvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24obWUpe1xuICAgICAgICAgIGlmKCFtZS5waXhlbCl7XG4gICAgICAgICAgICBtZS5waXhlbCA9IG1hcC5nZXRQcm9qZWN0aW9uKCkuZnJvbUxhdExuZ1RvUG9pbnQobWUubGF0TG5nKVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFttZV0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KSh0aGlzLm1hcCwgbWFya2VyLCBtYXJrZXJfZXZlbnRzX3dpdGhfbW91c2VbZXZdKTtcbiAgfVxuXG4gIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5kZXRhaWxzID0gZGV0YWlscztcblxuICAgIGlmIChvcHRpb25zLmNsaWNrKSB7XG4gICAgICBvcHRpb25zLmNsaWNrLmFwcGx5KHRoaXMsIFt0aGlzXSk7XG4gICAgfVxuXG4gICAgaWYgKG1hcmtlci5pbmZvV2luZG93KSB7XG4gICAgICBzZWxmLmhpZGVJbmZvV2luZG93cygpO1xuICAgICAgbWFya2VyLmluZm9XaW5kb3cub3BlbihzZWxmLm1hcCwgbWFya2VyKTtcbiAgICB9XG4gIH0pO1xuXG4gIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ3JpZ2h0Y2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5tYXJrZXIgPSB0aGlzO1xuXG4gICAgaWYgKG9wdGlvbnMucmlnaHRjbGljaykge1xuICAgICAgb3B0aW9ucy5yaWdodGNsaWNrLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgfVxuXG4gICAgaWYgKHdpbmRvdy5jb250ZXh0X21lbnVbc2VsZi5lbC5pZF1bJ21hcmtlciddICE9IHVuZGVmaW5lZCkge1xuICAgICAgc2VsZi5idWlsZENvbnRleHRNZW51KCdtYXJrZXInLCBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChtYXJrZXIuZmVuY2VzKSB7XG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnZHJhZ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jaGVja01hcmtlckdlb2ZlbmNlKG1hcmtlciwgZnVuY3Rpb24obSwgZikge1xuICAgICAgICBvdXRzaWRlKG0sIGYpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gbWFya2VyO1xufTtcblxuR01hcHMucHJvdG90eXBlLmFkZE1hcmtlciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIG1hcmtlcjtcbiAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnZ21fYWNjZXNzb3JzXycpKSB7XG4gICAgLy8gTmF0aXZlIGdvb2dsZS5tYXBzLk1hcmtlciBvYmplY3RcbiAgICBtYXJrZXIgPSBvcHRpb25zO1xuICB9XG4gIGVsc2Uge1xuICAgIGlmICgob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbGF0JykgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbG5nJykpIHx8IG9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgIG1hcmtlciA9IHRoaXMuY3JlYXRlTWFya2VyKG9wdGlvbnMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRocm93ICdObyBsYXRpdHVkZSBvciBsb25naXR1ZGUgZGVmaW5lZC4nO1xuICAgIH1cbiAgfVxuXG4gIG1hcmtlci5zZXRNYXAodGhpcy5tYXApO1xuXG4gIGlmKHRoaXMubWFya2VyQ2x1c3RlcmVyKSB7XG4gICAgdGhpcy5tYXJrZXJDbHVzdGVyZXIuYWRkTWFya2VyKG1hcmtlcik7XG4gIH1cblxuICB0aGlzLm1hcmtlcnMucHVzaChtYXJrZXIpO1xuXG4gIEdNYXBzLmZpcmUoJ21hcmtlcl9hZGRlZCcsIG1hcmtlciwgdGhpcyk7XG5cbiAgcmV0dXJuIG1hcmtlcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRNYXJrZXJzID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG1hcmtlcjsgbWFya2VyPWFycmF5W2ldOyBpKyspIHtcbiAgICB0aGlzLmFkZE1hcmtlcihtYXJrZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMubWFya2Vycztcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5oaWRlSW5mb1dpbmRvd3MgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG1hcmtlcjsgbWFya2VyID0gdGhpcy5tYXJrZXJzW2ldOyBpKyspe1xuICAgIGlmIChtYXJrZXIuaW5mb1dpbmRvdykge1xuICAgICAgbWFya2VyLmluZm9XaW5kb3cuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVNYXJrZXIgPSBmdW5jdGlvbihtYXJrZXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5tYXJrZXJzW2ldID09PSBtYXJrZXIpIHtcbiAgICAgIHRoaXMubWFya2Vyc1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICB0aGlzLm1hcmtlcnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICBpZih0aGlzLm1hcmtlckNsdXN0ZXJlcikge1xuICAgICAgICB0aGlzLm1hcmtlckNsdXN0ZXJlci5yZW1vdmVNYXJrZXIobWFya2VyKTtcbiAgICAgIH1cblxuICAgICAgR01hcHMuZmlyZSgnbWFya2VyX3JlbW92ZWQnLCBtYXJrZXIsIHRoaXMpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWFya2VyO1xufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZU1hcmtlcnMgPSBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICB2YXIgbmV3X21hcmtlcnMgPSBbXTtcblxuICBpZiAodHlwZW9mIGNvbGxlY3Rpb24gPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2Vyc1tpXTtcbiAgICAgIG1hcmtlci5zZXRNYXAobnVsbCk7XG5cbiAgICAgIGlmKHRoaXMubWFya2VyQ2x1c3RlcmVyKSB7XG4gICAgICAgIHRoaXMubWFya2VyQ2x1c3RlcmVyLnJlbW92ZU1hcmtlcihtYXJrZXIpO1xuICAgICAgfVxuXG4gICAgICBHTWFwcy5maXJlKCdtYXJrZXJfcmVtb3ZlZCcsIG1hcmtlciwgdGhpcyk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMubWFya2VycyA9IG5ld19tYXJrZXJzO1xuICB9XG4gIGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGluZGV4ID0gdGhpcy5tYXJrZXJzLmluZGV4T2YoY29sbGVjdGlvbltpXSk7XG5cbiAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcnNbaW5kZXhdO1xuICAgICAgICBtYXJrZXIuc2V0TWFwKG51bGwpO1xuXG4gICAgICAgIGlmKHRoaXMubWFya2VyQ2x1c3RlcmVyKSB7XG4gICAgICAgICAgdGhpcy5tYXJrZXJDbHVzdGVyZXIucmVtb3ZlTWFya2VyKG1hcmtlcik7XG4gICAgICAgIH1cblxuICAgICAgICBHTWFwcy5maXJlKCdtYXJrZXJfcmVtb3ZlZCcsIG1hcmtlciwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcnNbaV07XG4gICAgICBpZiAobWFya2VyLmdldE1hcCgpICE9IG51bGwpIHtcbiAgICAgICAgbmV3X21hcmtlcnMucHVzaChtYXJrZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubWFya2VycyA9IG5ld19tYXJrZXJzO1xuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd092ZXJsYXkgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBvdmVybGF5ID0gbmV3IGdvb2dsZS5tYXBzLk92ZXJsYXlWaWV3KCksXG4gICAgICBhdXRvX3Nob3cgPSB0cnVlO1xuXG4gIG92ZXJsYXkuc2V0TWFwKHRoaXMubWFwKTtcblxuICBpZiAob3B0aW9ucy5hdXRvX3Nob3cgIT0gbnVsbCkge1xuICAgIGF1dG9fc2hvdyA9IG9wdGlvbnMuYXV0b19zaG93O1xuICB9XG5cbiAgb3ZlcmxheS5vbkFkZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgZWwuc3R5bGUuYm9yZGVyU3R5bGUgPSBcIm5vbmVcIjtcbiAgICBlbC5zdHlsZS5ib3JkZXJXaWR0aCA9IFwiMHB4XCI7XG4gICAgZWwuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgZWwuc3R5bGUuekluZGV4ID0gMTAwO1xuICAgIGVsLmlubmVySFRNTCA9IG9wdGlvbnMuY29udGVudDtcblxuICAgIG92ZXJsYXkuZWwgPSBlbDtcblxuICAgIGlmICghb3B0aW9ucy5sYXllcikge1xuICAgICAgb3B0aW9ucy5sYXllciA9ICdvdmVybGF5TGF5ZXInO1xuICAgIH1cbiAgICBcbiAgICB2YXIgcGFuZXMgPSB0aGlzLmdldFBhbmVzKCksXG4gICAgICAgIG92ZXJsYXlMYXllciA9IHBhbmVzW29wdGlvbnMubGF5ZXJdLFxuICAgICAgICBzdG9wX292ZXJsYXlfZXZlbnRzID0gWydjb250ZXh0bWVudScsICdET01Nb3VzZVNjcm9sbCcsICdkYmxjbGljaycsICdtb3VzZWRvd24nXTtcblxuICAgIG92ZXJsYXlMYXllci5hcHBlbmRDaGlsZChlbCk7XG5cbiAgICBmb3IgKHZhciBldiA9IDA7IGV2IDwgc3RvcF9vdmVybGF5X2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ21zaWUnKSAhPSAtMSAmJiBkb2N1bWVudC5hbGwpIHtcbiAgICAgICAgICAgIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KShlbCwgc3RvcF9vdmVybGF5X2V2ZW50c1tldl0pO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmNsaWNrKSB7XG4gICAgICBwYW5lcy5vdmVybGF5TW91c2VUYXJnZXQuYXBwZW5kQ2hpbGQob3ZlcmxheS5lbCk7XG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGREb21MaXN0ZW5lcihvdmVybGF5LmVsLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgb3B0aW9ucy5jbGljay5hcHBseShvdmVybGF5LCBbb3ZlcmxheV0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcih0aGlzLCAncmVhZHknKTtcbiAgfTtcblxuICBvdmVybGF5LmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJvamVjdGlvbiA9IHRoaXMuZ2V0UHJvamVjdGlvbigpLFxuICAgICAgICBwaXhlbCA9IHByb2plY3Rpb24uZnJvbUxhdExuZ1RvRGl2UGl4ZWwobmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmxhdCwgb3B0aW9ucy5sbmcpKTtcblxuICAgIG9wdGlvbnMuaG9yaXpvbnRhbE9mZnNldCA9IG9wdGlvbnMuaG9yaXpvbnRhbE9mZnNldCB8fCAwO1xuICAgIG9wdGlvbnMudmVydGljYWxPZmZzZXQgPSBvcHRpb25zLnZlcnRpY2FsT2Zmc2V0IHx8IDA7XG5cbiAgICB2YXIgZWwgPSBvdmVybGF5LmVsLFxuICAgICAgICBjb250ZW50ID0gZWwuY2hpbGRyZW5bMF0sXG4gICAgICAgIGNvbnRlbnRfaGVpZ2h0ID0gY29udGVudC5jbGllbnRIZWlnaHQsXG4gICAgICAgIGNvbnRlbnRfd2lkdGggPSBjb250ZW50LmNsaWVudFdpZHRoO1xuXG4gICAgc3dpdGNoIChvcHRpb25zLnZlcnRpY2FsQWxpZ24pIHtcbiAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgIGVsLnN0eWxlLnRvcCA9IChwaXhlbC55IC0gY29udGVudF9oZWlnaHQgKyBvcHRpb25zLnZlcnRpY2FsT2Zmc2V0KSArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIGNhc2UgJ21pZGRsZSc6XG4gICAgICAgIGVsLnN0eWxlLnRvcCA9IChwaXhlbC55IC0gKGNvbnRlbnRfaGVpZ2h0IC8gMikgKyBvcHRpb25zLnZlcnRpY2FsT2Zmc2V0KSArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgZWwuc3R5bGUudG9wID0gKHBpeGVsLnkgKyBvcHRpb25zLnZlcnRpY2FsT2Zmc2V0KSArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHN3aXRjaCAob3B0aW9ucy5ob3Jpem9udGFsQWxpZ24pIHtcbiAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICBlbC5zdHlsZS5sZWZ0ID0gKHBpeGVsLnggLSBjb250ZW50X3dpZHRoICsgb3B0aW9ucy5ob3Jpem9udGFsT2Zmc2V0KSArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgIGVsLnN0eWxlLmxlZnQgPSAocGl4ZWwueCAtIChjb250ZW50X3dpZHRoIC8gMikgKyBvcHRpb25zLmhvcml6b250YWxPZmZzZXQpICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGVsLnN0eWxlLmxlZnQgPSAocGl4ZWwueCArIG9wdGlvbnMuaG9yaXpvbnRhbE9mZnNldCkgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBlbC5zdHlsZS5kaXNwbGF5ID0gYXV0b19zaG93ID8gJ2Jsb2NrJyA6ICdub25lJztcblxuICAgIGlmICghYXV0b19zaG93KSB7XG4gICAgICBvcHRpb25zLnNob3cuYXBwbHkodGhpcywgW2VsXSk7XG4gICAgfVxuICB9O1xuXG4gIG92ZXJsYXkub25SZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWwgPSBvdmVybGF5LmVsO1xuXG4gICAgaWYgKG9wdGlvbnMucmVtb3ZlKSB7XG4gICAgICBvcHRpb25zLnJlbW92ZS5hcHBseSh0aGlzLCBbZWxdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBvdmVybGF5LmVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3ZlcmxheS5lbCk7XG4gICAgICBvdmVybGF5LmVsID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5vdmVybGF5cy5wdXNoKG92ZXJsYXkpO1xuICByZXR1cm4gb3ZlcmxheTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVPdmVybGF5ID0gZnVuY3Rpb24ob3ZlcmxheSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3ZlcmxheXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5vdmVybGF5c1tpXSA9PT0gb3ZlcmxheSkge1xuICAgICAgdGhpcy5vdmVybGF5c1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICB0aGlzLm92ZXJsYXlzLnNwbGljZShpLCAxKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlT3ZlcmxheXMgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGl0ZW07IGl0ZW0gPSB0aGlzLm92ZXJsYXlzW2ldOyBpKyspIHtcbiAgICBpdGVtLnNldE1hcChudWxsKTtcbiAgfVxuXG4gIHRoaXMub3ZlcmxheXMgPSBbXTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3UG9seWxpbmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBwYXRoID0gW10sXG4gICAgICBwb2ludHMgPSBvcHRpb25zLnBhdGg7XG5cbiAgaWYgKHBvaW50cy5sZW5ndGgpIHtcbiAgICBpZiAocG9pbnRzWzBdWzBdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhdGggPSBwb2ludHM7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxhdGxuZzsgbGF0bG5nID0gcG9pbnRzW2ldOyBpKyspIHtcbiAgICAgICAgcGF0aC5wdXNoKG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0bG5nWzBdLCBsYXRsbmdbMV0pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2YXIgcG9seWxpbmVfb3B0aW9ucyA9IHtcbiAgICBtYXA6IHRoaXMubWFwLFxuICAgIHBhdGg6IHBhdGgsXG4gICAgc3Ryb2tlQ29sb3I6IG9wdGlvbnMuc3Ryb2tlQ29sb3IsXG4gICAgc3Ryb2tlT3BhY2l0eTogb3B0aW9ucy5zdHJva2VPcGFjaXR5LFxuICAgIHN0cm9rZVdlaWdodDogb3B0aW9ucy5zdHJva2VXZWlnaHQsXG4gICAgZ2VvZGVzaWM6IG9wdGlvbnMuZ2VvZGVzaWMsXG4gICAgY2xpY2thYmxlOiB0cnVlLFxuICAgIGVkaXRhYmxlOiBmYWxzZSxcbiAgICB2aXNpYmxlOiB0cnVlXG4gIH07XG5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJjbGlja2FibGVcIikpIHtcbiAgICBwb2x5bGluZV9vcHRpb25zLmNsaWNrYWJsZSA9IG9wdGlvbnMuY2xpY2thYmxlO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJlZGl0YWJsZVwiKSkge1xuICAgIHBvbHlsaW5lX29wdGlvbnMuZWRpdGFibGUgPSBvcHRpb25zLmVkaXRhYmxlO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpY29uc1wiKSkge1xuICAgIHBvbHlsaW5lX29wdGlvbnMuaWNvbnMgPSBvcHRpb25zLmljb25zO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJ6SW5kZXhcIikpIHtcbiAgICBwb2x5bGluZV9vcHRpb25zLnpJbmRleCA9IG9wdGlvbnMuekluZGV4O1xuICB9XG5cbiAgdmFyIHBvbHlsaW5lID0gbmV3IGdvb2dsZS5tYXBzLlBvbHlsaW5lKHBvbHlsaW5lX29wdGlvbnMpO1xuXG4gIHZhciBwb2x5bGluZV9ldmVudHMgPSBbJ2NsaWNrJywgJ2RibGNsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJywgJ21vdXNldXAnLCAncmlnaHRjbGljayddO1xuXG4gIGZvciAodmFyIGV2ID0gMDsgZXYgPCBwb2x5bGluZV9ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKHBvbHlsaW5lLCBwb2x5bGluZV9ldmVudHNbZXZdKTtcbiAgfVxuXG4gIHRoaXMucG9seWxpbmVzLnB1c2gocG9seWxpbmUpO1xuXG4gIEdNYXBzLmZpcmUoJ3BvbHlsaW5lX2FkZGVkJywgcG9seWxpbmUsIHRoaXMpO1xuXG4gIHJldHVybiBwb2x5bGluZTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVQb2x5bGluZSA9IGZ1bmN0aW9uKHBvbHlsaW5lKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wb2x5bGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5wb2x5bGluZXNbaV0gPT09IHBvbHlsaW5lKSB7XG4gICAgICB0aGlzLnBvbHlsaW5lc1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICB0aGlzLnBvbHlsaW5lcy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgIEdNYXBzLmZpcmUoJ3BvbHlsaW5lX3JlbW92ZWQnLCBwb2x5bGluZSwgdGhpcyk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZVBvbHlsaW5lcyA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMCwgaXRlbTsgaXRlbSA9IHRoaXMucG9seWxpbmVzW2ldOyBpKyspIHtcbiAgICBpdGVtLnNldE1hcChudWxsKTtcbiAgfVxuXG4gIHRoaXMucG9seWxpbmVzID0gW107XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd0NpcmNsZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9ICBleHRlbmRfb2JqZWN0KHtcbiAgICBtYXA6IHRoaXMubWFwLFxuICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmxhdCwgb3B0aW9ucy5sbmcpXG4gIH0sIG9wdGlvbnMpO1xuXG4gIGRlbGV0ZSBvcHRpb25zLmxhdDtcbiAgZGVsZXRlIG9wdGlvbnMubG5nO1xuXG4gIHZhciBwb2x5Z29uID0gbmV3IGdvb2dsZS5tYXBzLkNpcmNsZShvcHRpb25zKSxcbiAgICAgIHBvbHlnb25fZXZlbnRzID0gWydjbGljaycsICdkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlcicsICdtb3VzZXVwJywgJ3JpZ2h0Y2xpY2snXTtcblxuICBmb3IgKHZhciBldiA9IDA7IGV2IDwgcG9seWdvbl9ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKHBvbHlnb24sIHBvbHlnb25fZXZlbnRzW2V2XSk7XG4gIH1cblxuICB0aGlzLnBvbHlnb25zLnB1c2gocG9seWdvbik7XG5cbiAgcmV0dXJuIHBvbHlnb247XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd1JlY3RhbmdsZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IGV4dGVuZF9vYmplY3Qoe1xuICAgIG1hcDogdGhpcy5tYXBcbiAgfSwgb3B0aW9ucyk7XG5cbiAgdmFyIGxhdExuZ0JvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoXG4gICAgbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmJvdW5kc1swXVswXSwgb3B0aW9ucy5ib3VuZHNbMF1bMV0pLFxuICAgIG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5ib3VuZHNbMV1bMF0sIG9wdGlvbnMuYm91bmRzWzFdWzFdKVxuICApO1xuXG4gIG9wdGlvbnMuYm91bmRzID0gbGF0TG5nQm91bmRzO1xuXG4gIHZhciBwb2x5Z29uID0gbmV3IGdvb2dsZS5tYXBzLlJlY3RhbmdsZShvcHRpb25zKSxcbiAgICAgIHBvbHlnb25fZXZlbnRzID0gWydjbGljaycsICdkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlcicsICdtb3VzZXVwJywgJ3JpZ2h0Y2xpY2snXTtcblxuICBmb3IgKHZhciBldiA9IDA7IGV2IDwgcG9seWdvbl9ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKHBvbHlnb24sIHBvbHlnb25fZXZlbnRzW2V2XSk7XG4gIH1cblxuICB0aGlzLnBvbHlnb25zLnB1c2gocG9seWdvbik7XG5cbiAgcmV0dXJuIHBvbHlnb247XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd1BvbHlnb24gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciB1c2VHZW9KU09OID0gZmFsc2U7XG5cbiAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcInVzZUdlb0pTT05cIikpIHtcbiAgICB1c2VHZW9KU09OID0gb3B0aW9ucy51c2VHZW9KU09OO1xuICB9XG5cbiAgZGVsZXRlIG9wdGlvbnMudXNlR2VvSlNPTjtcblxuICBvcHRpb25zID0gZXh0ZW5kX29iamVjdCh7XG4gICAgbWFwOiB0aGlzLm1hcFxuICB9LCBvcHRpb25zKTtcblxuICBpZiAodXNlR2VvSlNPTiA9PSBmYWxzZSkge1xuICAgIG9wdGlvbnMucGF0aHMgPSBbb3B0aW9ucy5wYXRocy5zbGljZSgwKV07XG4gIH1cblxuICBpZiAob3B0aW9ucy5wYXRocy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKG9wdGlvbnMucGF0aHNbMF0ubGVuZ3RoID4gMCkge1xuICAgICAgb3B0aW9ucy5wYXRocyA9IGFycmF5X2ZsYXQoYXJyYXlfbWFwKG9wdGlvbnMucGF0aHMsIGFycmF5VG9MYXRMbmcsIHVzZUdlb0pTT04pKTtcbiAgICB9XG4gIH1cblxuICB2YXIgcG9seWdvbiA9IG5ldyBnb29nbGUubWFwcy5Qb2x5Z29uKG9wdGlvbnMpLFxuICAgICAgcG9seWdvbl9ldmVudHMgPSBbJ2NsaWNrJywgJ2RibGNsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJywgJ21vdXNldXAnLCAncmlnaHRjbGljayddO1xuXG4gIGZvciAodmFyIGV2ID0gMDsgZXYgPCBwb2x5Z29uX2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkocG9seWdvbiwgcG9seWdvbl9ldmVudHNbZXZdKTtcbiAgfVxuXG4gIHRoaXMucG9seWdvbnMucHVzaChwb2x5Z29uKTtcblxuICBHTWFwcy5maXJlKCdwb2x5Z29uX2FkZGVkJywgcG9seWdvbiwgdGhpcyk7XG5cbiAgcmV0dXJuIHBvbHlnb247XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlUG9seWdvbiA9IGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvbHlnb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMucG9seWdvbnNbaV0gPT09IHBvbHlnb24pIHtcbiAgICAgIHRoaXMucG9seWdvbnNbaV0uc2V0TWFwKG51bGwpO1xuICAgICAgdGhpcy5wb2x5Z29ucy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgIEdNYXBzLmZpcmUoJ3BvbHlnb25fcmVtb3ZlZCcsIHBvbHlnb24sIHRoaXMpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVQb2x5Z29ucyA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMCwgaXRlbTsgaXRlbSA9IHRoaXMucG9seWdvbnNbaV07IGkrKykge1xuICAgIGl0ZW0uc2V0TWFwKG51bGwpO1xuICB9XG5cbiAgdGhpcy5wb2x5Z29ucyA9IFtdO1xufTtcblxuR01hcHMucHJvdG90eXBlLmdldEZyb21GdXNpb25UYWJsZXMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBldmVudHMgPSBvcHRpb25zLmV2ZW50cztcblxuICBkZWxldGUgb3B0aW9ucy5ldmVudHM7XG5cbiAgdmFyIGZ1c2lvbl90YWJsZXNfb3B0aW9ucyA9IG9wdGlvbnMsXG4gICAgICBsYXllciA9IG5ldyBnb29nbGUubWFwcy5GdXNpb25UYWJsZXNMYXllcihmdXNpb25fdGFibGVzX29wdGlvbnMpO1xuXG4gIGZvciAodmFyIGV2IGluIGV2ZW50cykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBldmVudHNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgIH0pO1xuICAgIH0pKGxheWVyLCBldik7XG4gIH1cblxuICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcblxuICByZXR1cm4gbGF5ZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUubG9hZEZyb21GdXNpb25UYWJsZXMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBsYXllciA9IHRoaXMuZ2V0RnJvbUZ1c2lvblRhYmxlcyhvcHRpb25zKTtcbiAgbGF5ZXIuc2V0TWFwKHRoaXMubWFwKTtcblxuICByZXR1cm4gbGF5ZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZ2V0RnJvbUtNTCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHVybCA9IG9wdGlvbnMudXJsLFxuICAgICAgZXZlbnRzID0gb3B0aW9ucy5ldmVudHM7XG5cbiAgZGVsZXRlIG9wdGlvbnMudXJsO1xuICBkZWxldGUgb3B0aW9ucy5ldmVudHM7XG5cbiAgdmFyIGttbF9vcHRpb25zID0gb3B0aW9ucyxcbiAgICAgIGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLkttbExheWVyKHVybCwga21sX29wdGlvbnMpO1xuXG4gIGZvciAodmFyIGV2IGluIGV2ZW50cykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBldmVudHNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgIH0pO1xuICAgIH0pKGxheWVyLCBldik7XG4gIH1cblxuICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcblxuICByZXR1cm4gbGF5ZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUubG9hZEZyb21LTUwgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBsYXllciA9IHRoaXMuZ2V0RnJvbUtNTChvcHRpb25zKTtcbiAgbGF5ZXIuc2V0TWFwKHRoaXMubWFwKTtcblxuICByZXR1cm4gbGF5ZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkTGF5ZXIgPSBmdW5jdGlvbihsYXllck5hbWUsIG9wdGlvbnMpIHtcbiAgLy92YXIgZGVmYXVsdF9sYXllcnMgPSBbJ3dlYXRoZXInLCAnY2xvdWRzJywgJ3RyYWZmaWMnLCAndHJhbnNpdCcsICdiaWN5Y2xpbmcnLCAncGFub3JhbWlvJywgJ3BsYWNlcyddO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIGxheWVyO1xuXG4gIHN3aXRjaChsYXllck5hbWUpIHtcbiAgICBjYXNlICd3ZWF0aGVyJzogdGhpcy5zaW5nbGVMYXllcnMud2VhdGhlciA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLndlYXRoZXIuV2VhdGhlckxheWVyKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjbG91ZHMnOiB0aGlzLnNpbmdsZUxheWVycy5jbG91ZHMgPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy53ZWF0aGVyLkNsb3VkTGF5ZXIoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3RyYWZmaWMnOiB0aGlzLnNpbmdsZUxheWVycy50cmFmZmljID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuVHJhZmZpY0xheWVyKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd0cmFuc2l0JzogdGhpcy5zaW5nbGVMYXllcnMudHJhbnNpdCA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLlRyYW5zaXRMYXllcigpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnYmljeWNsaW5nJzogdGhpcy5zaW5nbGVMYXllcnMuYmljeWNsaW5nID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuQmljeWNsaW5nTGF5ZXIoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3Bhbm9yYW1pbyc6XG4gICAgICAgIHRoaXMuc2luZ2xlTGF5ZXJzLnBhbm9yYW1pbyA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLnBhbm9yYW1pby5QYW5vcmFtaW9MYXllcigpO1xuICAgICAgICBsYXllci5zZXRUYWcob3B0aW9ucy5maWx0ZXIpO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5maWx0ZXI7XG5cbiAgICAgICAgLy9jbGljayBldmVudFxuICAgICAgICBpZiAob3B0aW9ucy5jbGljaykge1xuICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKGxheWVyLCAnY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgb3B0aW9ucy5jbGljayhldmVudCk7XG4gICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5jbGljaztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwbGFjZXMnOlxuICAgICAgICB0aGlzLnNpbmdsZUxheWVycy5wbGFjZXMgPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuUGxhY2VzU2VydmljZSh0aGlzLm1hcCk7XG5cbiAgICAgICAgLy9zZWFyY2gsIG5lYXJieVNlYXJjaCwgcmFkYXJTZWFyY2ggY2FsbGJhY2ssIEJvdGggYXJlIHRoZSBzYW1lXG4gICAgICAgIGlmIChvcHRpb25zLnNlYXJjaCB8fCBvcHRpb25zLm5lYXJieVNlYXJjaCB8fCBvcHRpb25zLnJhZGFyU2VhcmNoKSB7XG4gICAgICAgICAgdmFyIHBsYWNlU2VhcmNoUmVxdWVzdCAgPSB7XG4gICAgICAgICAgICBib3VuZHMgOiBvcHRpb25zLmJvdW5kcyB8fCBudWxsLFxuICAgICAgICAgICAga2V5d29yZCA6IG9wdGlvbnMua2V5d29yZCB8fCBudWxsLFxuICAgICAgICAgICAgbG9jYXRpb24gOiBvcHRpb25zLmxvY2F0aW9uIHx8IG51bGwsXG4gICAgICAgICAgICBuYW1lIDogb3B0aW9ucy5uYW1lIHx8IG51bGwsXG4gICAgICAgICAgICByYWRpdXMgOiBvcHRpb25zLnJhZGl1cyB8fCBudWxsLFxuICAgICAgICAgICAgcmFua0J5IDogb3B0aW9ucy5yYW5rQnkgfHwgbnVsbCxcbiAgICAgICAgICAgIHR5cGVzIDogb3B0aW9ucy50eXBlcyB8fCBudWxsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChvcHRpb25zLnJhZGFyU2VhcmNoKSB7XG4gICAgICAgICAgICBsYXllci5yYWRhclNlYXJjaChwbGFjZVNlYXJjaFJlcXVlc3QsIG9wdGlvbnMucmFkYXJTZWFyY2gpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChvcHRpb25zLnNlYXJjaCkge1xuICAgICAgICAgICAgbGF5ZXIuc2VhcmNoKHBsYWNlU2VhcmNoUmVxdWVzdCwgb3B0aW9ucy5zZWFyY2gpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChvcHRpb25zLm5lYXJieVNlYXJjaCkge1xuICAgICAgICAgICAgbGF5ZXIubmVhcmJ5U2VhcmNoKHBsYWNlU2VhcmNoUmVxdWVzdCwgb3B0aW9ucy5uZWFyYnlTZWFyY2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vdGV4dFNlYXJjaCBjYWxsYmFja1xuICAgICAgICBpZiAob3B0aW9ucy50ZXh0U2VhcmNoKSB7XG4gICAgICAgICAgdmFyIHRleHRTZWFyY2hSZXF1ZXN0ICA9IHtcbiAgICAgICAgICAgIGJvdW5kcyA6IG9wdGlvbnMuYm91bmRzIHx8IG51bGwsXG4gICAgICAgICAgICBsb2NhdGlvbiA6IG9wdGlvbnMubG9jYXRpb24gfHwgbnVsbCxcbiAgICAgICAgICAgIHF1ZXJ5IDogb3B0aW9ucy5xdWVyeSB8fCBudWxsLFxuICAgICAgICAgICAgcmFkaXVzIDogb3B0aW9ucy5yYWRpdXMgfHwgbnVsbFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsYXllci50ZXh0U2VhcmNoKHRleHRTZWFyY2hSZXF1ZXN0LCBvcHRpb25zLnRleHRTZWFyY2gpO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGlmIChsYXllciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBsYXllci5zZXRPcHRpb25zID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGxheWVyLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGF5ZXIuc2V0TWFwID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGxheWVyLnNldE1hcCh0aGlzLm1hcCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxheWVyO1xuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlTGF5ZXIgPSBmdW5jdGlvbihsYXllcikge1xuICBpZiAodHlwZW9mKGxheWVyKSA9PSBcInN0cmluZ1wiICYmIHRoaXMuc2luZ2xlTGF5ZXJzW2xheWVyXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgIHRoaXMuc2luZ2xlTGF5ZXJzW2xheWVyXS5zZXRNYXAobnVsbCk7XG5cbiAgICAgZGVsZXRlIHRoaXMuc2luZ2xlTGF5ZXJzW2xheWVyXTtcbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5sYXllcnNbaV0gPT09IGxheWVyKSB7XG4gICAgICAgIHRoaXMubGF5ZXJzW2ldLnNldE1hcChudWxsKTtcbiAgICAgICAgdGhpcy5sYXllcnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxudmFyIHRyYXZlbE1vZGUsIHVuaXRTeXN0ZW07XG5cbkdNYXBzLnByb3RvdHlwZS5nZXRSb3V0ZXMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHN3aXRjaCAob3B0aW9ucy50cmF2ZWxNb2RlKSB7XG4gICAgY2FzZSAnYmljeWNsaW5nJzpcbiAgICAgIHRyYXZlbE1vZGUgPSBnb29nbGUubWFwcy5UcmF2ZWxNb2RlLkJJQ1lDTElORztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3RyYW5zaXQnOlxuICAgICAgdHJhdmVsTW9kZSA9IGdvb2dsZS5tYXBzLlRyYXZlbE1vZGUuVFJBTlNJVDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2RyaXZpbmcnOlxuICAgICAgdHJhdmVsTW9kZSA9IGdvb2dsZS5tYXBzLlRyYXZlbE1vZGUuRFJJVklORztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0cmF2ZWxNb2RlID0gZ29vZ2xlLm1hcHMuVHJhdmVsTW9kZS5XQUxLSU5HO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICBpZiAob3B0aW9ucy51bml0U3lzdGVtID09PSAnaW1wZXJpYWwnKSB7XG4gICAgdW5pdFN5c3RlbSA9IGdvb2dsZS5tYXBzLlVuaXRTeXN0ZW0uSU1QRVJJQUw7XG4gIH1cbiAgZWxzZSB7XG4gICAgdW5pdFN5c3RlbSA9IGdvb2dsZS5tYXBzLlVuaXRTeXN0ZW0uTUVUUklDO1xuICB9XG5cbiAgdmFyIGJhc2Vfb3B0aW9ucyA9IHtcbiAgICAgICAgYXZvaWRIaWdod2F5czogZmFsc2UsXG4gICAgICAgIGF2b2lkVG9sbHM6IGZhbHNlLFxuICAgICAgICBvcHRpbWl6ZVdheXBvaW50czogZmFsc2UsXG4gICAgICAgIHdheXBvaW50czogW11cbiAgICAgIH0sXG4gICAgICByZXF1ZXN0X29wdGlvbnMgPSAgZXh0ZW5kX29iamVjdChiYXNlX29wdGlvbnMsIG9wdGlvbnMpO1xuXG4gIHJlcXVlc3Rfb3B0aW9ucy5vcmlnaW4gPSAvc3RyaW5nLy50ZXN0KHR5cGVvZiBvcHRpb25zLm9yaWdpbikgPyBvcHRpb25zLm9yaWdpbiA6IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5vcmlnaW5bMF0sIG9wdGlvbnMub3JpZ2luWzFdKTtcbiAgcmVxdWVzdF9vcHRpb25zLmRlc3RpbmF0aW9uID0gL3N0cmluZy8udGVzdCh0eXBlb2Ygb3B0aW9ucy5kZXN0aW5hdGlvbikgPyBvcHRpb25zLmRlc3RpbmF0aW9uIDogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmRlc3RpbmF0aW9uWzBdLCBvcHRpb25zLmRlc3RpbmF0aW9uWzFdKTtcbiAgcmVxdWVzdF9vcHRpb25zLnRyYXZlbE1vZGUgPSB0cmF2ZWxNb2RlO1xuICByZXF1ZXN0X29wdGlvbnMudW5pdFN5c3RlbSA9IHVuaXRTeXN0ZW07XG5cbiAgZGVsZXRlIHJlcXVlc3Rfb3B0aW9ucy5jYWxsYmFjaztcbiAgZGVsZXRlIHJlcXVlc3Rfb3B0aW9ucy5lcnJvcjtcblxuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBzZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLkRpcmVjdGlvbnNTZXJ2aWNlKCk7XG5cbiAgc2VydmljZS5yb3V0ZShyZXF1ZXN0X29wdGlvbnMsIGZ1bmN0aW9uKHJlc3VsdCwgc3RhdHVzKSB7XG4gICAgaWYgKHN0YXR1cyA9PT0gZ29vZ2xlLm1hcHMuRGlyZWN0aW9uc1N0YXR1cy5PSykge1xuICAgICAgZm9yICh2YXIgciBpbiByZXN1bHQucm91dGVzKSB7XG4gICAgICAgIGlmIChyZXN1bHQucm91dGVzLmhhc093blByb3BlcnR5KHIpKSB7XG4gICAgICAgICAgc2VsZi5yb3V0ZXMucHVzaChyZXN1bHQucm91dGVzW3JdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5jYWxsYmFjaykge1xuICAgICAgICBvcHRpb25zLmNhbGxiYWNrKHNlbGYucm91dGVzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy5lcnJvcikge1xuICAgICAgICBvcHRpb25zLmVycm9yKHJlc3VsdCwgc3RhdHVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZVJvdXRlcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJvdXRlcyA9IFtdO1xufTtcblxuR01hcHMucHJvdG90eXBlLmdldEVsZXZhdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBleHRlbmRfb2JqZWN0KHtcbiAgICBsb2NhdGlvbnM6IFtdLFxuICAgIHBhdGggOiBmYWxzZSxcbiAgICBzYW1wbGVzIDogMjU2XG4gIH0sIG9wdGlvbnMpO1xuXG4gIGlmIChvcHRpb25zLmxvY2F0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zWzBdLmxlbmd0aCA+IDApIHtcbiAgICAgIG9wdGlvbnMubG9jYXRpb25zID0gYXJyYXlfZmxhdChhcnJheV9tYXAoW29wdGlvbnMubG9jYXRpb25zXSwgYXJyYXlUb0xhdExuZywgIGZhbHNlKSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGNhbGxiYWNrID0gb3B0aW9ucy5jYWxsYmFjaztcbiAgZGVsZXRlIG9wdGlvbnMuY2FsbGJhY2s7XG5cbiAgdmFyIHNlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMuRWxldmF0aW9uU2VydmljZSgpO1xuXG4gIC8vbG9jYXRpb24gcmVxdWVzdFxuICBpZiAoIW9wdGlvbnMucGF0aCkge1xuICAgIGRlbGV0ZSBvcHRpb25zLnBhdGg7XG4gICAgZGVsZXRlIG9wdGlvbnMuc2FtcGxlcztcblxuICAgIHNlcnZpY2UuZ2V0RWxldmF0aW9uRm9yTG9jYXRpb25zKG9wdGlvbnMsIGZ1bmN0aW9uKHJlc3VsdCwgc3RhdHVzKSB7XG4gICAgICBpZiAoY2FsbGJhY2sgJiYgdHlwZW9mKGNhbGxiYWNrKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCwgc3RhdHVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgLy9wYXRoIHJlcXVlc3RcbiAgfSBlbHNlIHtcbiAgICB2YXIgcGF0aFJlcXVlc3QgPSB7XG4gICAgICBwYXRoIDogb3B0aW9ucy5sb2NhdGlvbnMsXG4gICAgICBzYW1wbGVzIDogb3B0aW9ucy5zYW1wbGVzXG4gICAgfTtcblxuICAgIHNlcnZpY2UuZ2V0RWxldmF0aW9uQWxvbmdQYXRoKHBhdGhSZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQsIHN0YXR1cykge1xuICAgICBpZiAoY2FsbGJhY2sgJiYgdHlwZW9mKGNhbGxiYWNrKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCwgc3RhdHVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLmNsZWFuUm91dGUgPSBHTWFwcy5wcm90b3R5cGUucmVtb3ZlUG9seWxpbmVzO1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd1JvdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy5nZXRSb3V0ZXMoe1xuICAgIG9yaWdpbjogb3B0aW9ucy5vcmlnaW4sXG4gICAgZGVzdGluYXRpb246IG9wdGlvbnMuZGVzdGluYXRpb24sXG4gICAgdHJhdmVsTW9kZTogb3B0aW9ucy50cmF2ZWxNb2RlLFxuICAgIHdheXBvaW50czogb3B0aW9ucy53YXlwb2ludHMsXG4gICAgdW5pdFN5c3RlbTogb3B0aW9ucy51bml0U3lzdGVtLFxuICAgIGVycm9yOiBvcHRpb25zLmVycm9yLFxuICAgIGNhbGxiYWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBwb2x5bGluZV9vcHRpb25zID0ge1xuICAgICAgICAgIHBhdGg6IGVbZS5sZW5ndGggLSAxXS5vdmVydmlld19wYXRoLFxuICAgICAgICAgIHN0cm9rZUNvbG9yOiBvcHRpb25zLnN0cm9rZUNvbG9yLFxuICAgICAgICAgIHN0cm9rZU9wYWNpdHk6IG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSxcbiAgICAgICAgICBzdHJva2VXZWlnaHQ6IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpY29uc1wiKSkge1xuICAgICAgICAgIHBvbHlsaW5lX29wdGlvbnMuaWNvbnMgPSBvcHRpb25zLmljb25zO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5kcmF3UG9seWxpbmUocG9seWxpbmVfb3B0aW9ucyk7XG4gICAgICAgIFxuICAgICAgICBpZiAob3B0aW9ucy5jYWxsYmFjaykge1xuICAgICAgICAgIG9wdGlvbnMuY2FsbGJhY2soZVtlLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUudHJhdmVsUm91dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLm9yaWdpbiAmJiBvcHRpb25zLmRlc3RpbmF0aW9uKSB7XG4gICAgdGhpcy5nZXRSb3V0ZXMoe1xuICAgICAgb3JpZ2luOiBvcHRpb25zLm9yaWdpbixcbiAgICAgIGRlc3RpbmF0aW9uOiBvcHRpb25zLmRlc3RpbmF0aW9uLFxuICAgICAgdHJhdmVsTW9kZTogb3B0aW9ucy50cmF2ZWxNb2RlLFxuICAgICAgd2F5cG9pbnRzIDogb3B0aW9ucy53YXlwb2ludHMsXG4gICAgICB1bml0U3lzdGVtOiBvcHRpb25zLnVuaXRTeXN0ZW0sXG4gICAgICBlcnJvcjogb3B0aW9ucy5lcnJvcixcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vc3RhcnQgY2FsbGJhY2tcbiAgICAgICAgaWYgKGUubGVuZ3RoID4gMCAmJiBvcHRpb25zLnN0YXJ0KSB7XG4gICAgICAgICAgb3B0aW9ucy5zdGFydChlW2UubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9zdGVwIGNhbGxiYWNrXG4gICAgICAgIGlmIChlLmxlbmd0aCA+IDAgJiYgb3B0aW9ucy5zdGVwKSB7XG4gICAgICAgICAgdmFyIHJvdXRlID0gZVtlLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGlmIChyb3V0ZS5sZWdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBzdGVwcyA9IHJvdXRlLmxlZ3NbMF0uc3RlcHM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgc3RlcDsgc3RlcCA9IHN0ZXBzW2ldOyBpKyspIHtcbiAgICAgICAgICAgICAgc3RlcC5zdGVwX251bWJlciA9IGk7XG4gICAgICAgICAgICAgIG9wdGlvbnMuc3RlcChzdGVwLCAocm91dGUubGVnc1swXS5zdGVwcy5sZW5ndGggLSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9lbmQgY2FsbGJhY2tcbiAgICAgICAgaWYgKGUubGVuZ3RoID4gMCAmJiBvcHRpb25zLmVuZCkge1xuICAgICAgICAgICBvcHRpb25zLmVuZChlW2UubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSkge1xuICAgIGlmIChvcHRpb25zLnJvdXRlLmxlZ3MubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN0ZXBzID0gb3B0aW9ucy5yb3V0ZS5sZWdzWzBdLnN0ZXBzO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIHN0ZXA7IHN0ZXAgPSBzdGVwc1tpXTsgaSsrKSB7XG4gICAgICAgIHN0ZXAuc3RlcF9udW1iZXIgPSBpO1xuICAgICAgICBvcHRpb25zLnN0ZXAoc3RlcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd1N0ZXBwZWRSb3V0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBcbiAgaWYgKG9wdGlvbnMub3JpZ2luICYmIG9wdGlvbnMuZGVzdGluYXRpb24pIHtcbiAgICB0aGlzLmdldFJvdXRlcyh7XG4gICAgICBvcmlnaW46IG9wdGlvbnMub3JpZ2luLFxuICAgICAgZGVzdGluYXRpb246IG9wdGlvbnMuZGVzdGluYXRpb24sXG4gICAgICB0cmF2ZWxNb2RlOiBvcHRpb25zLnRyYXZlbE1vZGUsXG4gICAgICB3YXlwb2ludHMgOiBvcHRpb25zLndheXBvaW50cyxcbiAgICAgIGVycm9yOiBvcHRpb25zLmVycm9yLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy9zdGFydCBjYWxsYmFja1xuICAgICAgICBpZiAoZS5sZW5ndGggPiAwICYmIG9wdGlvbnMuc3RhcnQpIHtcbiAgICAgICAgICBvcHRpb25zLnN0YXJ0KGVbZS5sZW5ndGggLSAxXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3N0ZXAgY2FsbGJhY2tcbiAgICAgICAgaWYgKGUubGVuZ3RoID4gMCAmJiBvcHRpb25zLnN0ZXApIHtcbiAgICAgICAgICB2YXIgcm91dGUgPSBlW2UubGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKHJvdXRlLmxlZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHN0ZXBzID0gcm91dGUubGVnc1swXS5zdGVwcztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBzdGVwOyBzdGVwID0gc3RlcHNbaV07IGkrKykge1xuICAgICAgICAgICAgICBzdGVwLnN0ZXBfbnVtYmVyID0gaTtcbiAgICAgICAgICAgICAgdmFyIHBvbHlsaW5lX29wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcGF0aDogc3RlcC5wYXRoLFxuICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiBvcHRpb25zLnN0cm9rZUNvbG9yLFxuICAgICAgICAgICAgICAgIHN0cm9rZU9wYWNpdHk6IG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSxcbiAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpY29uc1wiKSkge1xuICAgICAgICAgICAgICAgIHBvbHlsaW5lX29wdGlvbnMuaWNvbnMgPSBvcHRpb25zLmljb25zO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgc2VsZi5kcmF3UG9seWxpbmUocG9seWxpbmVfb3B0aW9ucyk7XG4gICAgICAgICAgICAgIG9wdGlvbnMuc3RlcChzdGVwLCAocm91dGUubGVnc1swXS5zdGVwcy5sZW5ndGggLSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9lbmQgY2FsbGJhY2tcbiAgICAgICAgaWYgKGUubGVuZ3RoID4gMCAmJiBvcHRpb25zLmVuZCkge1xuICAgICAgICAgICBvcHRpb25zLmVuZChlW2UubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSkge1xuICAgIGlmIChvcHRpb25zLnJvdXRlLmxlZ3MubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN0ZXBzID0gb3B0aW9ucy5yb3V0ZS5sZWdzWzBdLnN0ZXBzO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIHN0ZXA7IHN0ZXAgPSBzdGVwc1tpXTsgaSsrKSB7XG4gICAgICAgIHN0ZXAuc3RlcF9udW1iZXIgPSBpO1xuICAgICAgICB2YXIgcG9seWxpbmVfb3B0aW9ucyA9IHtcbiAgICAgICAgICBwYXRoOiBzdGVwLnBhdGgsXG4gICAgICAgICAgc3Ryb2tlQ29sb3I6IG9wdGlvbnMuc3Ryb2tlQ29sb3IsXG4gICAgICAgICAgc3Ryb2tlT3BhY2l0eTogb3B0aW9ucy5zdHJva2VPcGFjaXR5LFxuICAgICAgICAgIHN0cm9rZVdlaWdodDogb3B0aW9ucy5zdHJva2VXZWlnaHRcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImljb25zXCIpKSB7XG4gICAgICAgICAgcG9seWxpbmVfb3B0aW9ucy5pY29ucyA9IG9wdGlvbnMuaWNvbnM7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLmRyYXdQb2x5bGluZShwb2x5bGluZV9vcHRpb25zKTtcbiAgICAgICAgb3B0aW9ucy5zdGVwKHN0ZXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuR01hcHMuUm91dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHRoaXMub3JpZ2luID0gb3B0aW9ucy5vcmlnaW47XG4gIHRoaXMuZGVzdGluYXRpb24gPSBvcHRpb25zLmRlc3RpbmF0aW9uO1xuICB0aGlzLndheXBvaW50cyA9IG9wdGlvbnMud2F5cG9pbnRzO1xuXG4gIHRoaXMubWFwID0gb3B0aW9ucy5tYXA7XG4gIHRoaXMucm91dGUgPSBvcHRpb25zLnJvdXRlO1xuICB0aGlzLnN0ZXBfY291bnQgPSAwO1xuICB0aGlzLnN0ZXBzID0gdGhpcy5yb3V0ZS5sZWdzWzBdLnN0ZXBzO1xuICB0aGlzLnN0ZXBzX2xlbmd0aCA9IHRoaXMuc3RlcHMubGVuZ3RoO1xuXG4gIHZhciBwb2x5bGluZV9vcHRpb25zID0ge1xuICAgIHBhdGg6IG5ldyBnb29nbGUubWFwcy5NVkNBcnJheSgpLFxuICAgIHN0cm9rZUNvbG9yOiBvcHRpb25zLnN0cm9rZUNvbG9yLFxuICAgIHN0cm9rZU9wYWNpdHk6IG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSxcbiAgICBzdHJva2VXZWlnaHQ6IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0XG4gIH07XG5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpY29uc1wiKSkge1xuICAgIHBvbHlsaW5lX29wdGlvbnMuaWNvbnMgPSBvcHRpb25zLmljb25zO1xuICB9XG5cbiAgdGhpcy5wb2x5bGluZSA9IHRoaXMubWFwLmRyYXdQb2x5bGluZShwb2x5bGluZV9vcHRpb25zKS5nZXRQYXRoKCk7XG59O1xuXG5HTWFwcy5Sb3V0ZS5wcm90b3R5cGUuZ2V0Um91dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB0aGlzLm1hcC5nZXRSb3V0ZXMoe1xuICAgIG9yaWdpbiA6IHRoaXMub3JpZ2luLFxuICAgIGRlc3RpbmF0aW9uIDogdGhpcy5kZXN0aW5hdGlvbixcbiAgICB0cmF2ZWxNb2RlIDogb3B0aW9ucy50cmF2ZWxNb2RlLFxuICAgIHdheXBvaW50cyA6IHRoaXMud2F5cG9pbnRzIHx8IFtdLFxuICAgIGVycm9yOiBvcHRpb25zLmVycm9yLFxuICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJvdXRlID0gZVswXTtcblxuICAgICAgaWYgKG9wdGlvbnMuY2FsbGJhY2spIHtcbiAgICAgICAgb3B0aW9ucy5jYWxsYmFjay5jYWxsKHNlbGYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuXG5HTWFwcy5Sb3V0ZS5wcm90b3R5cGUuYmFjayA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5zdGVwX2NvdW50ID4gMCkge1xuICAgIHRoaXMuc3RlcF9jb3VudC0tO1xuICAgIHZhciBwYXRoID0gdGhpcy5yb3V0ZS5sZWdzWzBdLnN0ZXBzW3RoaXMuc3RlcF9jb3VudF0ucGF0aDtcblxuICAgIGZvciAodmFyIHAgaW4gcGF0aCl7XG4gICAgICBpZiAocGF0aC5oYXNPd25Qcm9wZXJ0eShwKSl7XG4gICAgICAgIHRoaXMucG9seWxpbmUucG9wKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5Sb3V0ZS5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5zdGVwX2NvdW50IDwgdGhpcy5zdGVwc19sZW5ndGgpIHtcbiAgICB2YXIgcGF0aCA9IHRoaXMucm91dGUubGVnc1swXS5zdGVwc1t0aGlzLnN0ZXBfY291bnRdLnBhdGg7XG5cbiAgICBmb3IgKHZhciBwIGluIHBhdGgpe1xuICAgICAgaWYgKHBhdGguaGFzT3duUHJvcGVydHkocCkpe1xuICAgICAgICB0aGlzLnBvbHlsaW5lLnB1c2gocGF0aFtwXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RlcF9jb3VudCsrO1xuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuY2hlY2tHZW9mZW5jZSA9IGZ1bmN0aW9uKGxhdCwgbG5nLCBmZW5jZSkge1xuICByZXR1cm4gZmVuY2UuY29udGFpbnNMYXRMbmcobmV3IGdvb2dsZS5tYXBzLkxhdExuZyhsYXQsIGxuZykpO1xufTtcblxuR01hcHMucHJvdG90eXBlLmNoZWNrTWFya2VyR2VvZmVuY2UgPSBmdW5jdGlvbihtYXJrZXIsIG91dHNpZGVfY2FsbGJhY2spIHtcbiAgaWYgKG1hcmtlci5mZW5jZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZmVuY2U7IGZlbmNlID0gbWFya2VyLmZlbmNlc1tpXTsgaSsrKSB7XG4gICAgICB2YXIgcG9zID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XG4gICAgICBpZiAoIXRoaXMuY2hlY2tHZW9mZW5jZShwb3MubGF0KCksIHBvcy5sbmcoKSwgZmVuY2UpKSB7XG4gICAgICAgIG91dHNpZGVfY2FsbGJhY2sobWFya2VyLCBmZW5jZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUudG9JbWFnZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9LFxuICAgICAgc3RhdGljX21hcF9vcHRpb25zID0ge307XG5cbiAgc3RhdGljX21hcF9vcHRpb25zWydzaXplJ10gPSBvcHRpb25zWydzaXplJ10gfHwgW3RoaXMuZWwuY2xpZW50V2lkdGgsIHRoaXMuZWwuY2xpZW50SGVpZ2h0XTtcbiAgc3RhdGljX21hcF9vcHRpb25zWydsYXQnXSA9IHRoaXMuZ2V0Q2VudGVyKCkubGF0KCk7XG4gIHN0YXRpY19tYXBfb3B0aW9uc1snbG5nJ10gPSB0aGlzLmdldENlbnRlcigpLmxuZygpO1xuXG4gIGlmICh0aGlzLm1hcmtlcnMubGVuZ3RoID4gMCkge1xuICAgIHN0YXRpY19tYXBfb3B0aW9uc1snbWFya2VycyddID0gW107XG4gICAgXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHN0YXRpY19tYXBfb3B0aW9uc1snbWFya2VycyddLnB1c2goe1xuICAgICAgICBsYXQ6IHRoaXMubWFya2Vyc1tpXS5nZXRQb3NpdGlvbigpLmxhdCgpLFxuICAgICAgICBsbmc6IHRoaXMubWFya2Vyc1tpXS5nZXRQb3NpdGlvbigpLmxuZygpXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5wb2x5bGluZXMubGVuZ3RoID4gMCkge1xuICAgIHZhciBwb2x5bGluZSA9IHRoaXMucG9seWxpbmVzWzBdO1xuICAgIFxuICAgIHN0YXRpY19tYXBfb3B0aW9uc1sncG9seWxpbmUnXSA9IHt9O1xuICAgIHN0YXRpY19tYXBfb3B0aW9uc1sncG9seWxpbmUnXVsncGF0aCddID0gZ29vZ2xlLm1hcHMuZ2VvbWV0cnkuZW5jb2RpbmcuZW5jb2RlUGF0aChwb2x5bGluZS5nZXRQYXRoKCkpO1xuICAgIHN0YXRpY19tYXBfb3B0aW9uc1sncG9seWxpbmUnXVsnc3Ryb2tlQ29sb3InXSA9IHBvbHlsaW5lLnN0cm9rZUNvbG9yXG4gICAgc3RhdGljX21hcF9vcHRpb25zWydwb2x5bGluZSddWydzdHJva2VPcGFjaXR5J10gPSBwb2x5bGluZS5zdHJva2VPcGFjaXR5XG4gICAgc3RhdGljX21hcF9vcHRpb25zWydwb2x5bGluZSddWydzdHJva2VXZWlnaHQnXSA9IHBvbHlsaW5lLnN0cm9rZVdlaWdodFxuICB9XG5cbiAgcmV0dXJuIEdNYXBzLnN0YXRpY01hcFVSTChzdGF0aWNfbWFwX29wdGlvbnMpO1xufTtcblxuR01hcHMuc3RhdGljTWFwVVJMID0gZnVuY3Rpb24ob3B0aW9ucyl7XG4gIHZhciBwYXJhbWV0ZXJzID0gW10sXG4gICAgICBkYXRhLFxuICAgICAgc3RhdGljX3Jvb3QgPSAobG9jYXRpb24ucHJvdG9jb2wgPT09ICdmaWxlOicgPyAnaHR0cDonIDogbG9jYXRpb24ucHJvdG9jb2wgKSArICcvL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvc3RhdGljbWFwJztcblxuICBpZiAob3B0aW9ucy51cmwpIHtcbiAgICBzdGF0aWNfcm9vdCA9IG9wdGlvbnMudXJsO1xuICAgIGRlbGV0ZSBvcHRpb25zLnVybDtcbiAgfVxuXG4gIHN0YXRpY19yb290ICs9ICc/JztcblxuICB2YXIgbWFya2VycyA9IG9wdGlvbnMubWFya2VycztcbiAgXG4gIGRlbGV0ZSBvcHRpb25zLm1hcmtlcnM7XG5cbiAgaWYgKCFtYXJrZXJzICYmIG9wdGlvbnMubWFya2VyKSB7XG4gICAgbWFya2VycyA9IFtvcHRpb25zLm1hcmtlcl07XG4gICAgZGVsZXRlIG9wdGlvbnMubWFya2VyO1xuICB9XG5cbiAgdmFyIHN0eWxlcyA9IG9wdGlvbnMuc3R5bGVzO1xuXG4gIGRlbGV0ZSBvcHRpb25zLnN0eWxlcztcblxuICB2YXIgcG9seWxpbmUgPSBvcHRpb25zLnBvbHlsaW5lO1xuICBkZWxldGUgb3B0aW9ucy5wb2x5bGluZTtcblxuICAvKiogTWFwIG9wdGlvbnMgKiovXG4gIGlmIChvcHRpb25zLmNlbnRlcikge1xuICAgIHBhcmFtZXRlcnMucHVzaCgnY2VudGVyPScgKyBvcHRpb25zLmNlbnRlcik7XG4gICAgZGVsZXRlIG9wdGlvbnMuY2VudGVyO1xuICB9XG4gIGVsc2UgaWYgKG9wdGlvbnMuYWRkcmVzcykge1xuICAgIHBhcmFtZXRlcnMucHVzaCgnY2VudGVyPScgKyBvcHRpb25zLmFkZHJlc3MpO1xuICAgIGRlbGV0ZSBvcHRpb25zLmFkZHJlc3M7XG4gIH1cbiAgZWxzZSBpZiAob3B0aW9ucy5sYXQpIHtcbiAgICBwYXJhbWV0ZXJzLnB1c2goWydjZW50ZXI9Jywgb3B0aW9ucy5sYXQsICcsJywgb3B0aW9ucy5sbmddLmpvaW4oJycpKTtcbiAgICBkZWxldGUgb3B0aW9ucy5sYXQ7XG4gICAgZGVsZXRlIG9wdGlvbnMubG5nO1xuICB9XG4gIGVsc2UgaWYgKG9wdGlvbnMudmlzaWJsZSkge1xuICAgIHZhciB2aXNpYmxlID0gZW5jb2RlVVJJKG9wdGlvbnMudmlzaWJsZS5qb2luKCd8JykpO1xuICAgIHBhcmFtZXRlcnMucHVzaCgndmlzaWJsZT0nICsgdmlzaWJsZSk7XG4gIH1cblxuICB2YXIgc2l6ZSA9IG9wdGlvbnMuc2l6ZTtcbiAgaWYgKHNpemUpIHtcbiAgICBpZiAoc2l6ZS5qb2luKSB7XG4gICAgICBzaXplID0gc2l6ZS5qb2luKCd4Jyk7XG4gICAgfVxuICAgIGRlbGV0ZSBvcHRpb25zLnNpemU7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2l6ZSA9ICc2MzB4MzAwJztcbiAgfVxuICBwYXJhbWV0ZXJzLnB1c2goJ3NpemU9JyArIHNpemUpO1xuXG4gIGlmICghb3B0aW9ucy56b29tICYmIG9wdGlvbnMuem9vbSAhPT0gZmFsc2UpIHtcbiAgICBvcHRpb25zLnpvb20gPSAxNTtcbiAgfVxuXG4gIHZhciBzZW5zb3IgPSBvcHRpb25zLmhhc093blByb3BlcnR5KCdzZW5zb3InKSA/ICEhb3B0aW9ucy5zZW5zb3IgOiB0cnVlO1xuICBkZWxldGUgb3B0aW9ucy5zZW5zb3I7XG4gIHBhcmFtZXRlcnMucHVzaCgnc2Vuc29yPScgKyBzZW5zb3IpO1xuXG4gIGZvciAodmFyIHBhcmFtIGluIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcbiAgICAgIHBhcmFtZXRlcnMucHVzaChwYXJhbSArICc9JyArIG9wdGlvbnNbcGFyYW1dKTtcbiAgICB9XG4gIH1cblxuICAvKiogTWFya2VycyAqKi9cbiAgaWYgKG1hcmtlcnMpIHtcbiAgICB2YXIgbWFya2VyLCBsb2M7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgZGF0YSA9IG1hcmtlcnNbaV07IGkrKykge1xuICAgICAgbWFya2VyID0gW107XG5cbiAgICAgIGlmIChkYXRhLnNpemUgJiYgZGF0YS5zaXplICE9PSAnbm9ybWFsJykge1xuICAgICAgICBtYXJrZXIucHVzaCgnc2l6ZTonICsgZGF0YS5zaXplKTtcbiAgICAgICAgZGVsZXRlIGRhdGEuc2l6ZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRhdGEuaWNvbikge1xuICAgICAgICBtYXJrZXIucHVzaCgnaWNvbjonICsgZW5jb2RlVVJJKGRhdGEuaWNvbikpO1xuICAgICAgICBkZWxldGUgZGF0YS5pY29uO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5jb2xvcikge1xuICAgICAgICBtYXJrZXIucHVzaCgnY29sb3I6JyArIGRhdGEuY29sb3IucmVwbGFjZSgnIycsICcweCcpKTtcbiAgICAgICAgZGVsZXRlIGRhdGEuY29sb3I7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmxhYmVsKSB7XG4gICAgICAgIG1hcmtlci5wdXNoKCdsYWJlbDonICsgZGF0YS5sYWJlbFswXS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgZGVsZXRlIGRhdGEubGFiZWw7XG4gICAgICB9XG5cbiAgICAgIGxvYyA9IChkYXRhLmFkZHJlc3MgPyBkYXRhLmFkZHJlc3MgOiBkYXRhLmxhdCArICcsJyArIGRhdGEubG5nKTtcbiAgICAgIGRlbGV0ZSBkYXRhLmFkZHJlc3M7XG4gICAgICBkZWxldGUgZGF0YS5sYXQ7XG4gICAgICBkZWxldGUgZGF0YS5sbmc7XG5cbiAgICAgIGZvcih2YXIgcGFyYW0gaW4gZGF0YSl7XG4gICAgICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KHBhcmFtKSkge1xuICAgICAgICAgIG1hcmtlci5wdXNoKHBhcmFtICsgJzonICsgZGF0YVtwYXJhbV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXJrZXIubGVuZ3RoIHx8IGkgPT09IDApIHtcbiAgICAgICAgbWFya2VyLnB1c2gobG9jKTtcbiAgICAgICAgbWFya2VyID0gbWFya2VyLmpvaW4oJ3wnKTtcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKCdtYXJrZXJzPScgKyBlbmNvZGVVUkkobWFya2VyKSk7XG4gICAgICB9XG4gICAgICAvLyBOZXcgbWFya2VyIHdpdGhvdXQgc3R5bGVzXG4gICAgICBlbHNlIHtcbiAgICAgICAgbWFya2VyID0gcGFyYW1ldGVycy5wb3AoKSArIGVuY29kZVVSSSgnfCcgKyBsb2MpO1xuICAgICAgICBwYXJhbWV0ZXJzLnB1c2gobWFya2VyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogTWFwIFN0eWxlcyAqKi9cbiAgaWYgKHN0eWxlcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3R5bGVSdWxlID0gW107XG4gICAgICBpZiAoc3R5bGVzW2ldLmZlYXR1cmVUeXBlKXtcbiAgICAgICAgc3R5bGVSdWxlLnB1c2goJ2ZlYXR1cmU6JyArIHN0eWxlc1tpXS5mZWF0dXJlVHlwZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0eWxlc1tpXS5lbGVtZW50VHlwZSkge1xuICAgICAgICBzdHlsZVJ1bGUucHVzaCgnZWxlbWVudDonICsgc3R5bGVzW2ldLmVsZW1lbnRUeXBlLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN0eWxlc1tpXS5zdHlsZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGZvciAodmFyIHAgaW4gc3R5bGVzW2ldLnN0eWxlcnNbal0pIHtcbiAgICAgICAgICB2YXIgcnVsZUFyZyA9IHN0eWxlc1tpXS5zdHlsZXJzW2pdW3BdO1xuICAgICAgICAgIGlmIChwID09ICdodWUnIHx8IHAgPT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgcnVsZUFyZyA9ICcweCcgKyBydWxlQXJnLnN1YnN0cmluZygxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3R5bGVSdWxlLnB1c2gocCArICc6JyArIHJ1bGVBcmcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBydWxlID0gc3R5bGVSdWxlLmpvaW4oJ3wnKTtcbiAgICAgIGlmIChydWxlICE9ICcnKSB7XG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCgnc3R5bGU9JyArIHJ1bGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBQb2x5bGluZXMgKiovXG4gIGZ1bmN0aW9uIHBhcnNlQ29sb3IoY29sb3IsIG9wYWNpdHkpIHtcbiAgICBpZiAoY29sb3JbMF0gPT09ICcjJyl7XG4gICAgICBjb2xvciA9IGNvbG9yLnJlcGxhY2UoJyMnLCAnMHgnKTtcblxuICAgICAgaWYgKG9wYWNpdHkpIHtcbiAgICAgICAgb3BhY2l0eSA9IHBhcnNlRmxvYXQob3BhY2l0eSk7XG4gICAgICAgIG9wYWNpdHkgPSBNYXRoLm1pbigxLCBNYXRoLm1heChvcGFjaXR5LCAwKSk7XG4gICAgICAgIGlmIChvcGFjaXR5ID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuICcweDAwMDAwMDAwJztcbiAgICAgICAgfVxuICAgICAgICBvcGFjaXR5ID0gKG9wYWNpdHkgKiAyNTUpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgaWYgKG9wYWNpdHkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgb3BhY2l0eSArPSBvcGFjaXR5O1xuICAgICAgICB9XG5cbiAgICAgICAgY29sb3IgPSBjb2xvci5zbGljZSgwLDgpICsgb3BhY2l0eTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbG9yO1xuICB9XG5cbiAgaWYgKHBvbHlsaW5lKSB7XG4gICAgZGF0YSA9IHBvbHlsaW5lO1xuICAgIHBvbHlsaW5lID0gW107XG5cbiAgICBpZiAoZGF0YS5zdHJva2VXZWlnaHQpIHtcbiAgICAgIHBvbHlsaW5lLnB1c2goJ3dlaWdodDonICsgcGFyc2VJbnQoZGF0YS5zdHJva2VXZWlnaHQsIDEwKSk7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuc3Ryb2tlQ29sb3IpIHtcbiAgICAgIHZhciBjb2xvciA9IHBhcnNlQ29sb3IoZGF0YS5zdHJva2VDb2xvciwgZGF0YS5zdHJva2VPcGFjaXR5KTtcbiAgICAgIHBvbHlsaW5lLnB1c2goJ2NvbG9yOicgKyBjb2xvcik7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuZmlsbENvbG9yKSB7XG4gICAgICB2YXIgZmlsbGNvbG9yID0gcGFyc2VDb2xvcihkYXRhLmZpbGxDb2xvciwgZGF0YS5maWxsT3BhY2l0eSk7XG4gICAgICBwb2x5bGluZS5wdXNoKCdmaWxsY29sb3I6JyArIGZpbGxjb2xvcik7XG4gICAgfVxuXG4gICAgdmFyIHBhdGggPSBkYXRhLnBhdGg7XG4gICAgaWYgKHBhdGguam9pbikge1xuICAgICAgZm9yICh2YXIgaj0wLCBwb3M7IHBvcz1wYXRoW2pdOyBqKyspIHtcbiAgICAgICAgcG9seWxpbmUucHVzaChwb3Muam9pbignLCcpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwb2x5bGluZS5wdXNoKCdlbmM6JyArIHBhdGgpO1xuICAgIH1cblxuICAgIHBvbHlsaW5lID0gcG9seWxpbmUuam9pbignfCcpO1xuICAgIHBhcmFtZXRlcnMucHVzaCgncGF0aD0nICsgZW5jb2RlVVJJKHBvbHlsaW5lKSk7XG4gIH1cblxuICAvKiogUmV0aW5hIHN1cHBvcnQgKiovXG4gIHZhciBkcGkgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuICBwYXJhbWV0ZXJzLnB1c2goJ3NjYWxlPScgKyBkcGkpO1xuXG4gIHBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzLmpvaW4oJyYnKTtcbiAgcmV0dXJuIHN0YXRpY19yb290ICsgcGFyYW1ldGVycztcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRNYXBUeXBlID0gZnVuY3Rpb24obWFwVHlwZUlkLCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiZ2V0VGlsZVVybFwiKSAmJiB0eXBlb2Yob3B0aW9uc1tcImdldFRpbGVVcmxcIl0pID09IFwiZnVuY3Rpb25cIikge1xuICAgIG9wdGlvbnMudGlsZVNpemUgPSBvcHRpb25zLnRpbGVTaXplIHx8IG5ldyBnb29nbGUubWFwcy5TaXplKDI1NiwgMjU2KTtcblxuICAgIHZhciBtYXBUeXBlID0gbmV3IGdvb2dsZS5tYXBzLkltYWdlTWFwVHlwZShvcHRpb25zKTtcblxuICAgIHRoaXMubWFwLm1hcFR5cGVzLnNldChtYXBUeXBlSWQsIG1hcFR5cGUpO1xuICB9XG4gIGVsc2Uge1xuICAgIHRocm93IFwiJ2dldFRpbGVVcmwnIGZ1bmN0aW9uIHJlcXVpcmVkLlwiO1xuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkT3ZlcmxheU1hcFR5cGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiZ2V0VGlsZVwiKSAmJiB0eXBlb2Yob3B0aW9uc1tcImdldFRpbGVcIl0pID09IFwiZnVuY3Rpb25cIikge1xuICAgIHZhciBvdmVybGF5TWFwVHlwZUluZGV4ID0gb3B0aW9ucy5pbmRleDtcblxuICAgIGRlbGV0ZSBvcHRpb25zLmluZGV4O1xuXG4gICAgdGhpcy5tYXAub3ZlcmxheU1hcFR5cGVzLmluc2VydEF0KG92ZXJsYXlNYXBUeXBlSW5kZXgsIG9wdGlvbnMpO1xuICB9XG4gIGVsc2Uge1xuICAgIHRocm93IFwiJ2dldFRpbGUnIGZ1bmN0aW9uIHJlcXVpcmVkLlwiO1xuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlT3ZlcmxheU1hcFR5cGUgPSBmdW5jdGlvbihvdmVybGF5TWFwVHlwZUluZGV4KSB7XG4gIHRoaXMubWFwLm92ZXJsYXlNYXBUeXBlcy5yZW1vdmVBdChvdmVybGF5TWFwVHlwZUluZGV4KTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRTdHlsZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlZE1hcFR5cGUgPSBuZXcgZ29vZ2xlLm1hcHMuU3R5bGVkTWFwVHlwZShvcHRpb25zLnN0eWxlcywgeyBuYW1lOiBvcHRpb25zLnN0eWxlZE1hcE5hbWUgfSk7XG5cbiAgdGhpcy5tYXAubWFwVHlwZXMuc2V0KG9wdGlvbnMubWFwVHlwZUlkLCBzdHlsZWRNYXBUeXBlKTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5zZXRTdHlsZSA9IGZ1bmN0aW9uKG1hcFR5cGVJZCkge1xuICB0aGlzLm1hcC5zZXRNYXBUeXBlSWQobWFwVHlwZUlkKTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5jcmVhdGVQYW5vcmFtYSA9IGZ1bmN0aW9uKHN0cmVldHZpZXdfb3B0aW9ucykge1xuICBpZiAoIXN0cmVldHZpZXdfb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbGF0JykgfHwgIXN0cmVldHZpZXdfb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbG5nJykpIHtcbiAgICBzdHJlZXR2aWV3X29wdGlvbnMubGF0ID0gdGhpcy5nZXRDZW50ZXIoKS5sYXQoKTtcbiAgICBzdHJlZXR2aWV3X29wdGlvbnMubG5nID0gdGhpcy5nZXRDZW50ZXIoKS5sbmcoKTtcbiAgfVxuXG4gIHRoaXMucGFub3JhbWEgPSBHTWFwcy5jcmVhdGVQYW5vcmFtYShzdHJlZXR2aWV3X29wdGlvbnMpO1xuXG4gIHRoaXMubWFwLnNldFN0cmVldFZpZXcodGhpcy5wYW5vcmFtYSk7XG5cbiAgcmV0dXJuIHRoaXMucGFub3JhbWE7XG59O1xuXG5HTWFwcy5jcmVhdGVQYW5vcmFtYSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGVsID0gZ2V0RWxlbWVudEJ5SWQob3B0aW9ucy5lbCwgb3B0aW9ucy5jb250ZXh0KTtcblxuICBvcHRpb25zLnBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmxhdCwgb3B0aW9ucy5sbmcpO1xuXG4gIGRlbGV0ZSBvcHRpb25zLmVsO1xuICBkZWxldGUgb3B0aW9ucy5jb250ZXh0O1xuICBkZWxldGUgb3B0aW9ucy5sYXQ7XG4gIGRlbGV0ZSBvcHRpb25zLmxuZztcblxuICB2YXIgc3RyZWV0dmlld19ldmVudHMgPSBbJ2Nsb3NlY2xpY2snLCAnbGlua3NfY2hhbmdlZCcsICdwYW5vX2NoYW5nZWQnLCAncG9zaXRpb25fY2hhbmdlZCcsICdwb3ZfY2hhbmdlZCcsICdyZXNpemUnLCAndmlzaWJsZV9jaGFuZ2VkJ10sXG4gICAgICBzdHJlZXR2aWV3X29wdGlvbnMgPSBleHRlbmRfb2JqZWN0KHt2aXNpYmxlIDogdHJ1ZX0sIG9wdGlvbnMpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWV0dmlld19ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBkZWxldGUgc3RyZWV0dmlld19vcHRpb25zW3N0cmVldHZpZXdfZXZlbnRzW2ldXTtcbiAgfVxuXG4gIHZhciBwYW5vcmFtYSA9IG5ldyBnb29nbGUubWFwcy5TdHJlZXRWaWV3UGFub3JhbWEoZWwsIHN0cmVldHZpZXdfb3B0aW9ucyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJlZXR2aWV3X2V2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KShwYW5vcmFtYSwgc3RyZWV0dmlld19ldmVudHNbaV0pO1xuICB9XG5cbiAgcmV0dXJuIHBhbm9yYW1hO1xufTtcblxuR01hcHMucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnRfbmFtZSwgaGFuZGxlcikge1xuICByZXR1cm4gR01hcHMub24oZXZlbnRfbmFtZSwgdGhpcywgaGFuZGxlcik7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnRfbmFtZSkge1xuICBHTWFwcy5vZmYoZXZlbnRfbmFtZSwgdGhpcyk7XG59O1xuXG5HTWFwcy5jdXN0b21fZXZlbnRzID0gWydtYXJrZXJfYWRkZWQnLCAnbWFya2VyX3JlbW92ZWQnLCAncG9seWxpbmVfYWRkZWQnLCAncG9seWxpbmVfcmVtb3ZlZCcsICdwb2x5Z29uX2FkZGVkJywgJ3BvbHlnb25fcmVtb3ZlZCcsICdnZW9sb2NhdGVkJywgJ2dlb2xvY2F0aW9uX2ZhaWxlZCddO1xuXG5HTWFwcy5vbiA9IGZ1bmN0aW9uKGV2ZW50X25hbWUsIG9iamVjdCwgaGFuZGxlcikge1xuICBpZiAoR01hcHMuY3VzdG9tX2V2ZW50cy5pbmRleE9mKGV2ZW50X25hbWUpID09IC0xKSB7XG4gICAgaWYob2JqZWN0IGluc3RhbmNlb2YgR01hcHMpIG9iamVjdCA9IG9iamVjdC5tYXA7IFxuICAgIHJldHVybiBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIGV2ZW50X25hbWUsIGhhbmRsZXIpO1xuICB9XG4gIGVsc2Uge1xuICAgIHZhciByZWdpc3RlcmVkX2V2ZW50ID0ge1xuICAgICAgaGFuZGxlciA6IGhhbmRsZXIsXG4gICAgICBldmVudE5hbWUgOiBldmVudF9uYW1lXG4gICAgfTtcblxuICAgIG9iamVjdC5yZWdpc3RlcmVkX2V2ZW50c1tldmVudF9uYW1lXSA9IG9iamVjdC5yZWdpc3RlcmVkX2V2ZW50c1tldmVudF9uYW1lXSB8fCBbXTtcbiAgICBvYmplY3QucmVnaXN0ZXJlZF9ldmVudHNbZXZlbnRfbmFtZV0ucHVzaChyZWdpc3RlcmVkX2V2ZW50KTtcblxuICAgIHJldHVybiByZWdpc3RlcmVkX2V2ZW50O1xuICB9XG59O1xuXG5HTWFwcy5vZmYgPSBmdW5jdGlvbihldmVudF9uYW1lLCBvYmplY3QpIHtcbiAgaWYgKEdNYXBzLmN1c3RvbV9ldmVudHMuaW5kZXhPZihldmVudF9uYW1lKSA9PSAtMSkge1xuICAgIGlmKG9iamVjdCBpbnN0YW5jZW9mIEdNYXBzKSBvYmplY3QgPSBvYmplY3QubWFwOyBcbiAgICBnb29nbGUubWFwcy5ldmVudC5jbGVhckxpc3RlbmVycyhvYmplY3QsIGV2ZW50X25hbWUpO1xuICB9XG4gIGVsc2Uge1xuICAgIG9iamVjdC5yZWdpc3RlcmVkX2V2ZW50c1tldmVudF9uYW1lXSA9IFtdO1xuICB9XG59O1xuXG5HTWFwcy5maXJlID0gZnVuY3Rpb24oZXZlbnRfbmFtZSwgb2JqZWN0LCBzY29wZSkge1xuICBpZiAoR01hcHMuY3VzdG9tX2V2ZW50cy5pbmRleE9mKGV2ZW50X25hbWUpID09IC0xKSB7XG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcihvYmplY3QsIGV2ZW50X25hbWUsIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShhcmd1bWVudHMpLnNsaWNlKDIpKTtcbiAgfVxuICBlbHNlIHtcbiAgICBpZihldmVudF9uYW1lIGluIHNjb3BlLnJlZ2lzdGVyZWRfZXZlbnRzKSB7XG4gICAgICB2YXIgZmlyaW5nX2V2ZW50cyA9IHNjb3BlLnJlZ2lzdGVyZWRfZXZlbnRzW2V2ZW50X25hbWVdO1xuXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZmlyaW5nX2V2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAoZnVuY3Rpb24oaGFuZGxlciwgc2NvcGUsIG9iamVjdCkge1xuICAgICAgICAgIGhhbmRsZXIuYXBwbHkoc2NvcGUsIFtvYmplY3RdKTtcbiAgICAgICAgfSkoZmlyaW5nX2V2ZW50c1tpXVsnaGFuZGxlciddLCBzY29wZSwgb2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLmdlb2xvY2F0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbXBsZXRlX2NhbGxiYWNrID0gb3B0aW9ucy5hbHdheXMgfHwgb3B0aW9ucy5jb21wbGV0ZTtcblxuICBpZiAobmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgb3B0aW9ucy5zdWNjZXNzKHBvc2l0aW9uKTtcblxuICAgICAgaWYgKGNvbXBsZXRlX2NhbGxiYWNrKSB7XG4gICAgICAgIGNvbXBsZXRlX2NhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgIG9wdGlvbnMuZXJyb3IoZXJyb3IpO1xuXG4gICAgICBpZiAoY29tcGxldGVfY2FsbGJhY2spIHtcbiAgICAgICAgY29tcGxldGVfY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9LCBvcHRpb25zLm9wdGlvbnMpO1xuICB9XG4gIGVsc2Uge1xuICAgIG9wdGlvbnMubm90X3N1cHBvcnRlZCgpO1xuXG4gICAgaWYgKGNvbXBsZXRlX2NhbGxiYWNrKSB7XG4gICAgICBjb21wbGV0ZV9jYWxsYmFjaygpO1xuICAgIH1cbiAgfVxufTtcblxuR01hcHMuZ2VvY29kZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdGhpcy5nZW9jb2RlciA9IG5ldyBnb29nbGUubWFwcy5HZW9jb2RlcigpO1xuICB2YXIgY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrO1xuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbGF0JykgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbG5nJykpIHtcbiAgICBvcHRpb25zLmxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5sYXQsIG9wdGlvbnMubG5nKTtcbiAgfVxuXG4gIGRlbGV0ZSBvcHRpb25zLmxhdDtcbiAgZGVsZXRlIG9wdGlvbnMubG5nO1xuICBkZWxldGUgb3B0aW9ucy5jYWxsYmFjaztcbiAgXG4gIHRoaXMuZ2VvY29kZXIuZ2VvY29kZShvcHRpb25zLCBmdW5jdGlvbihyZXN1bHRzLCBzdGF0dXMpIHtcbiAgICBjYWxsYmFjayhyZXN1bHRzLCBzdGF0dXMpO1xuICB9KTtcbn07XG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFBvbHlnb24gY29udGFpbnNMYXRMbmdcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90cGFya2luL0dvb2dsZS1NYXBzLVBvaW50LWluLVBvbHlnb25cbi8vIFBveWdvbiBnZXRCb3VuZHMgZXh0ZW5zaW9uIC0gZ29vZ2xlLW1hcHMtZXh0ZW5zaW9uc1xuLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1tYXBzLWV4dGVuc2lvbnMvc291cmNlL2Jyb3dzZS9nb29nbGUubWFwcy5Qb2x5Z29uLmdldEJvdW5kcy5qc1xuaWYgKCFnb29nbGUubWFwcy5Qb2x5Z29uLnByb3RvdHlwZS5nZXRCb3VuZHMpIHtcbiAgZ29vZ2xlLm1hcHMuUG9seWdvbi5wcm90b3R5cGUuZ2V0Qm91bmRzID0gZnVuY3Rpb24obGF0TG5nKSB7XG4gICAgdmFyIGJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKTtcbiAgICB2YXIgcGF0aHMgPSB0aGlzLmdldFBhdGhzKCk7XG4gICAgdmFyIHBhdGg7XG5cbiAgICBmb3IgKHZhciBwID0gMDsgcCA8IHBhdGhzLmdldExlbmd0aCgpOyBwKyspIHtcbiAgICAgIHBhdGggPSBwYXRocy5nZXRBdChwKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5nZXRMZW5ndGgoKTsgaSsrKSB7XG4gICAgICAgIGJvdW5kcy5leHRlbmQocGF0aC5nZXRBdChpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGJvdW5kcztcbiAgfTtcbn1cblxuaWYgKCFnb29nbGUubWFwcy5Qb2x5Z29uLnByb3RvdHlwZS5jb250YWluc0xhdExuZykge1xuICAvLyBQb2x5Z29uIGNvbnRhaW5zTGF0TG5nIC0gbWV0aG9kIHRvIGRldGVybWluZSBpZiBhIGxhdExuZyBpcyB3aXRoaW4gYSBwb2x5Z29uXG4gIGdvb2dsZS5tYXBzLlBvbHlnb24ucHJvdG90eXBlLmNvbnRhaW5zTGF0TG5nID0gZnVuY3Rpb24obGF0TG5nKSB7XG4gICAgLy8gRXhjbHVkZSBwb2ludHMgb3V0c2lkZSBvZiBib3VuZHMgYXMgdGhlcmUgaXMgbm8gd2F5IHRoZXkgYXJlIGluIHRoZSBwb2x5XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuZ2V0Qm91bmRzKCk7XG5cbiAgICBpZiAoYm91bmRzICE9PSBudWxsICYmICFib3VuZHMuY29udGFpbnMobGF0TG5nKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFJheWNhc3QgcG9pbnQgaW4gcG9seWdvbiBtZXRob2RcbiAgICB2YXIgaW5Qb2x5ID0gZmFsc2U7XG5cbiAgICB2YXIgbnVtUGF0aHMgPSB0aGlzLmdldFBhdGhzKCkuZ2V0TGVuZ3RoKCk7XG4gICAgZm9yICh2YXIgcCA9IDA7IHAgPCBudW1QYXRoczsgcCsrKSB7XG4gICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aHMoKS5nZXRBdChwKTtcbiAgICAgIHZhciBudW1Qb2ludHMgPSBwYXRoLmdldExlbmd0aCgpO1xuICAgICAgdmFyIGogPSBudW1Qb2ludHMgLSAxO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVBvaW50czsgaSsrKSB7XG4gICAgICAgIHZhciB2ZXJ0ZXgxID0gcGF0aC5nZXRBdChpKTtcbiAgICAgICAgdmFyIHZlcnRleDIgPSBwYXRoLmdldEF0KGopO1xuXG4gICAgICAgIGlmICh2ZXJ0ZXgxLmxuZygpIDwgbGF0TG5nLmxuZygpICYmIHZlcnRleDIubG5nKCkgPj0gbGF0TG5nLmxuZygpIHx8IHZlcnRleDIubG5nKCkgPCBsYXRMbmcubG5nKCkgJiYgdmVydGV4MS5sbmcoKSA+PSBsYXRMbmcubG5nKCkpIHtcbiAgICAgICAgICBpZiAodmVydGV4MS5sYXQoKSArIChsYXRMbmcubG5nKCkgLSB2ZXJ0ZXgxLmxuZygpKSAvICh2ZXJ0ZXgyLmxuZygpIC0gdmVydGV4MS5sbmcoKSkgKiAodmVydGV4Mi5sYXQoKSAtIHZlcnRleDEubGF0KCkpIDwgbGF0TG5nLmxhdCgpKSB7XG4gICAgICAgICAgICBpblBvbHkgPSAhaW5Qb2x5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGogPSBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpblBvbHk7XG4gIH07XG59XG5cbmlmICghZ29vZ2xlLm1hcHMuQ2lyY2xlLnByb3RvdHlwZS5jb250YWluc0xhdExuZykge1xuICBnb29nbGUubWFwcy5DaXJjbGUucHJvdG90eXBlLmNvbnRhaW5zTGF0TG5nID0gZnVuY3Rpb24obGF0TG5nKSB7XG4gICAgaWYgKGdvb2dsZS5tYXBzLmdlb21ldHJ5KSB7XG4gICAgICByZXR1cm4gZ29vZ2xlLm1hcHMuZ2VvbWV0cnkuc3BoZXJpY2FsLmNvbXB1dGVEaXN0YW5jZUJldHdlZW4odGhpcy5nZXRDZW50ZXIoKSwgbGF0TG5nKSA8PSB0aGlzLmdldFJhZGl1cygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcbn1cblxuZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzLnByb3RvdHlwZS5jb250YWluc0xhdExuZyA9IGZ1bmN0aW9uKGxhdExuZykge1xuICByZXR1cm4gdGhpcy5jb250YWlucyhsYXRMbmcpO1xufTtcblxuZ29vZ2xlLm1hcHMuTWFya2VyLnByb3RvdHlwZS5zZXRGZW5jZXMgPSBmdW5jdGlvbihmZW5jZXMpIHtcbiAgdGhpcy5mZW5jZXMgPSBmZW5jZXM7XG59O1xuXG5nb29nbGUubWFwcy5NYXJrZXIucHJvdG90eXBlLmFkZEZlbmNlID0gZnVuY3Rpb24oZmVuY2UpIHtcbiAgdGhpcy5mZW5jZXMucHVzaChmZW5jZSk7XG59O1xuXG5nb29nbGUubWFwcy5NYXJrZXIucHJvdG90eXBlLmdldElkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzWydfX2dtX2lkJ107XG59O1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBBcnJheSBpbmRleE9mXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcbmlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCAvKiwgZnJvbUluZGV4ICovICkge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgfVxuICAgICAgdmFyIHQgPSBPYmplY3QodGhpcyk7XG4gICAgICB2YXIgbGVuID0gdC5sZW5ndGggPj4+IDA7XG4gICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgdmFyIG4gPSAwO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgbiA9IE51bWJlcihhcmd1bWVudHNbMV0pO1xuICAgICAgICAgIGlmIChuICE9IG4pIHsgLy8gc2hvcnRjdXQgZm9yIHZlcmlmeWluZyBpZiBpdCdzIE5hTlxuICAgICAgICAgICAgICBuID0gMDtcbiAgICAgICAgICB9IGVsc2UgaWYgKG4gIT0gMCAmJiBuICE9IEluZmluaXR5ICYmIG4gIT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgICAgIG4gPSAobiA+IDAgfHwgLTEpICogTWF0aC5mbG9vcihNYXRoLmFicyhuKSk7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG4gPj0gbGVuKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgdmFyIGsgPSBuID49IDAgPyBuIDogTWF0aC5tYXgobGVuIC0gTWF0aC5hYnMobiksIDApO1xuICAgICAgZm9yICg7IGsgPCBsZW47IGsrKykge1xuICAgICAgICAgIGlmIChrIGluIHQgJiYgdFtrXSA9PT0gc2VhcmNoRWxlbWVudCkge1xuICAgICAgICAgICAgICByZXR1cm4gaztcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gIH1cbn1cbiAgXG5yZXR1cm4gR01hcHM7XG59KSk7XG4iLCJHTWFwcyA9IHJlcXVpcmUgJ2dtYXBzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGluaXQ6IC0+XG4gICAgQGluaXRNYXAoKSBpZiAkKCcjbWFwJykubGVuZ3RoXG5cblxuICBpbml0TWFwOiAtPlxuICAgIEAkbWFwX2Vycm9yID0gJCgnI21hcF9lcnJvcicpXG4gICAgQCRzZWFyY2ggPSAkKCdbbmFtZT1cInNlYXJjaF9tYXBcIl0nKVxuICAgIEBpbmZvd2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coKVxuICAgIEBtYXAgPSBuZXcgR01hcHNcbiAgICAgIGRpdjogJyNtYXAnLFxuICAgICAgbGF0OiA0Ny42NjIwNCxcbiAgICAgIGxuZzogLTEyMi4zMzMzNyxcbiAgICAgIHpvb206IDEyLFxuICAgICAgbWFwVHlwZUNvbnRyb2w6IGZhbHNlLFxuICAgICAgem9vbUNvbnRyb2xPcHRpb25zOlxuICAgICAgICBzdHlsZTogZ29vZ2xlLm1hcHMuWm9vbUNvbnRyb2xTdHlsZS5MQVJHRSxcbiAgICAgICAgcG9zaXRpb246IGdvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5MRUZUX0NFTlRFUlxuICAgICAgcGFuQ29udHJvbDogZmFsc2UsXG4gICAgICBzdHJlZXRWaWV3Q29udHJvbDogZmFsc2UsXG5cbiAgICAgIHN0eWxlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdhbGwnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnbGFiZWxzLnRleHQuZmlsbCdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdzYXR1cmF0aW9uJzogMzYgfVxuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDQwIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ2FsbCdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdsYWJlbHMudGV4dC5zdHJva2UnXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAndmlzaWJpbGl0eSc6ICdvbicgfVxuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDE2IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ2FsbCdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdsYWJlbHMuaWNvbidcbiAgICAgICAgICAgICdzdHlsZXJzJzogWyB7ICd2aXNpYmlsaXR5JzogJ29mZicgfSBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdhZG1pbmlzdHJhdGl2ZSdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeS5maWxsJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMjAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnYWRtaW5pc3RyYXRpdmUnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnkuc3Ryb2tlJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTcgfVxuICAgICAgICAgICAgICB7ICd3ZWlnaHQnOiAxLjIgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnbGFuZHNjYXBlJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5J1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTYgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAncG9pJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5J1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMjEgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAncm9hZC5oaWdod2F5J1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5LmZpbGwnXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxNyB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdyb2FkLmhpZ2h3YXknXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnkuc3Ryb2tlJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMjkgfVxuICAgICAgICAgICAgICB7ICd3ZWlnaHQnOiAwLjIgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAncm9hZC5hcnRlcmlhbCdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDEwIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3JvYWQubG9jYWwnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnknXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxMyB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICd0cmFuc2l0J1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5J1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTkgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnd2F0ZXInXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnknXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiA3IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgIF1cblxuICAgIEBidWlsZE1hcmtlcnMoKSBpZiBsb2NhdGlvbnM/XG4gICAgQGxpc3RlbmVycygpXG4gICAgQGdlb2xvY2F0ZSgpXG5cbiAgZ2VvbG9jYXRlOiAtPlxuICAgIEdNYXBzLmdlb2xvY2F0ZVxuICAgICAgc3VjY2VzczogKHBvc2l0aW9uKSAtPlxuICAgICAgICBtYXAuc2V0Q2VudGVyIHBvc2l0aW9uLmNvb3Jkcy5sYXRpdHVkZSwgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxuXG4gICAgICBlcnJvcjogKGVycm9yKSAtPlxuICAgICAgICBhbGVydCAnR2VvbG9jYXRpb24gZmFpbGVkOiAnICsgZXJyb3IubWVzc2FnZVxuXG4gICAgICBub3Rfc3VwcG9ydGVkOiAtPlxuICAgICAgICBhbGVydCAnWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZ2VvbG9jYXRpb24nXG5cbiAgICAgIGFsd2F5czogLT5cbiAgICAgICAgYWxlcnQgJ0RvbmUhJ1xuXG4gIGxpc3RlbmVyczogLT5cbiAgICBAJHNlYXJjaC5vbiAna2V5dXAnLCA9PlxuICAgICAgQCRtYXBfZXJyb3IuZW1wdHkoKVxuICAgICAgcSA9IEAkc2VhcmNoLnZhbCgpXG4gICAgICBAc2VhcmNoKHEpIGlmIHEubGVuZ3RoID4gM1xuXG4gIHNlYXJjaDogKHEpIC0+XG4gICAgR01hcHMuZ2VvY29kZVxuICAgICAgYWRkcmVzczogcVxuICAgICAgY2FsbGJhY2s6IChyZXN1bHRzLCBzdGF0dXMpID0+XG4gICAgICAgIGlmIHN0YXR1cyBpcyAnWkVST19SRVNVTFRTJ1xuICAgICAgICAgIEBub3RGb3VuZCgpXG4gICAgICAgIGlmIHJlc3VsdHNcbiAgICAgICAgICBsYXRsbmcgPSByZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uXG4gICAgICAgICAgQG1hcC5zZXRDZW50ZXIobGF0bG5nLmxhdCgpLCBsYXRsbmcubG5nKCkpXG4gICAgICAgICAgQG1hcC5zZXRab29tKDE0KVxuXG4gIG5vdEZvdW5kOiAtPlxuICAgIEAkbWFwX2Vycm9yLnRleHQgJ25vdGhpbmcgZm91bmQnXG5cbiAgYnVpbGRNYXJrZXJzOiAtPlxuICAgIGJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKVxuICAgICQuZWFjaCBsb2NhdGlvbnMsIChpLCBsb2NhdGlvbikgPT5cbiAgICAgIGxhdCA9IHBhcnNlRmxvYXQobG9jYXRpb24ubGF0KVxuICAgICAgbG5nID0gcGFyc2VGbG9hdChsb2NhdGlvbi5sbmcpXG4gICAgICBib3VuZHMuZXh0ZW5kIG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0LCBsbmcpXG5cbiAgICAgIEBtYXAuYWRkTWFya2VyXG4gICAgICAgIGxhdDogbGF0XG4gICAgICAgIGxuZzogbG5nXG4gICAgICAgIHRpdGxlOiBcIiN7bG9jYXRpb24ubmFtZX1cIlxuICAgICAgICBpbmZvV2luZG93OlxuICAgICAgICAgIGNvbnRlbnQ6IFwiPGRpdiBjbGFzcz0nbWFwLS1uYW1lJz4je2xvY2F0aW9uLm5hbWV9PC9kaXY+PGRpdiBjbGFzcz0nbWFwLS11cmwnPiN7bG9jYXRpb24uYWRkcmVzc308L2Rpdj48ZGl2IGNsYXNzPSdtYXAtLXVybCc+I3tsb2NhdGlvbi5waG9uZX08L2Rpdj48ZGl2IGNsYXNzPSdtYXAtLXVybCc+PGEgaHJlZj0nI3tsb2NhdGlvbi51cmx9Jz4je2xvY2F0aW9uLnVybH08L2Rpdj5cIlxuICAgICMgQG1hcC5maXRCb3VuZHMgYm91bmRzXG5cblxuIiwiQmlrZU1hcCA9IHJlcXVpcmUgJy4vbGliL21hcCdcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgRE9NIEluaXRcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuJCAtPlxuXG4gIEJpa2VNYXAuaW5pdCgpXG5cbiAgJCgnLnRvZ2dsZS1tZW51Jykub24gJ2NsaWNrJywgLT5cbiAgICAkKCcucmVzcG9uc2l2ZS1uYXYnKS50b2dnbGVDbGFzcyAnYWN0aXZlJ1xuICAgICQoXCIudG9wXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS10b3BcIlxuICAgICQoXCIubWlkZGxlXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS1taWRkbGVcIlxuICAgICQoXCIuYm90dG9tXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS1ib3R0b21cIlxuXG4gICQoJy5zbGlkZXInKS5zbGlja1xuICAgIGRvdHM6IHRydWUsXG4gICAgc3BlZWQ6IDYwMCxcbiAgICBjc3NFYXNlOiAnY3ViaWMtYmV6aWVyKDAuMjMwLCAxLjAwMCwgMC4zMjAsIDEuMDAwKSdcbiAgICBzbGlkZXNUb1Njcm9sbDogMSxcbiAgICBhdXRvcGxheTogdHJ1ZSxcbiAgICBhdXRvcGxheVNwZWVkOiA0MDAwXG5cbiAgJCgnLnNsaWRlci0tbXVsdGlwbGUnKS5zbGlja1xuICAgIGRvdHM6IGZhbHNlLFxuICAgIHNsaWRlc1RvU2hvdzogMixcbiAgICByZXNwb25zaXZlOiBbXG4gICAgICB7XG4gICAgICAgIGJyZWFrcG9pbnQ6IDQ4MCxcbiAgICAgICAgc2V0dGluZ3M6XG4gICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxuICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxXG4gICAgICB9XG4gICAgXVxuXG4gICQoZG9jdW1lbnQpLnJlYWR5IC0+XG4gIHNjcm9sbF9wb3MgPSAwXG4gICQoZG9jdW1lbnQpLnNjcm9sbCAtPlxuICAgIHNjcm9sbF9wb3MgPSAkKHRoaXMpLnNjcm9sbFRvcCgpXG4gICAgaWYgc2Nyb2xsX3BvcyA+IDEwXG4gICAgICAkKCcubmF2LWJhY2tncm91bmQnKS5jc3MgJ3RvcCcsICcwJ1xuICAgIGVsc2VcbiAgICAgICQoJy5uYXYtYmFja2dyb3VuZCcpLmNzcyAndG9wJywgJy0xMjBweCdcblxuICAkdW5kZXJsaW5lcyA9ICQoJy51bmRlcmxpbmUnKVxuICAkdW5kZXJsaW5lczIgPSAkKCcudW5kZXJsaW5lMicpXG5cbiAgJChkb2N1bWVudCkub24gJ21vdXNlZW50ZXInLCAnLnRleHQtbGluaycsIC0+XG4gICAgZHluYW1pY3MuYW5pbWF0ZSAkdW5kZXJsaW5lc1skKHRoaXMpLnBhcmVudCgpLmluZGV4KCldLCB7d2lkdGg6ICcxMDAlJ30sIHR5cGU6IGR5bmFtaWNzLnNwcmluZ1xuICAkKGRvY3VtZW50KS5vbiAnbW91c2VsZWF2ZScsICcudGV4dC1saW5rJywgLT5cbiAgICBkeW5hbWljcy5hbmltYXRlICR1bmRlcmxpbmVzWyQodGhpcykucGFyZW50KCkuaW5kZXgoKV0sIHsgd2lkdGg6ICcwJyB9LCB0eXBlOiBkeW5hbWljcy5zcHJpbmdcbiAgXG4gICQoZG9jdW1lbnQpLm9uICdtb3VzZWVudGVyJywgJy50b3AtdGV4dC1saW5rJywgLT5cbiAgICBkeW5hbWljcy5hbmltYXRlICR1bmRlcmxpbmVzMlskKHRoaXMpLnBhcmVudCgpLmluZGV4KCldLCB7d2lkdGg6ICcxMDAlJ30sIHR5cGU6IGR5bmFtaWNzLnNwcmluZ1xuICAkKGRvY3VtZW50KS5vbiAnbW91c2VsZWF2ZScsICcudG9wLXRleHQtbGluaycsIC0+XG4gICAgZHluYW1pY3MuYW5pbWF0ZSAkdW5kZXJsaW5lczJbJCh0aGlzKS5wYXJlbnQoKS5pbmRleCgpXSwgeyB3aWR0aDogJzAnIH0sIHR5cGU6IGR5bmFtaWNzLnNwcmluZyJdfQ==
