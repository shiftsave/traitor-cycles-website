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
    return this.listeners();
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
            content: "<div>" + location.name + "</div><div>" + location.url + "</div><div>" + location.url + "</div>"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9pdmFuY3J1ei9Qcm9qZWN0cy9UcmFpdG9yIEN5Y2xlcy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2l2YW5jcnV6L1Byb2plY3RzL1RyYWl0b3IgQ3ljbGVzL25vZGVfbW9kdWxlcy9nbWFwcy9nbWFwcy5qcyIsIi9Vc2Vycy9pdmFuY3J1ei9Qcm9qZWN0cy9UcmFpdG9yIEN5Y2xlcy9zb3VyY2UvYXNzZXRzL2pzL2xpYi9tYXAuY29mZmVlIiwiL1VzZXJzL2l2YW5jcnV6L1Byb2plY3RzL1RyYWl0b3IgQ3ljbGVzL3NvdXJjZS9hc3NldHMvanMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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eUMsQ0FBM0M7RUFHQSxDQUFBLENBQUUsUUFBRixDQUFXLENBQUMsRUFBWixDQUFlLFlBQWYsRUFBNkIsZ0JBQTdCLEVBQStDLFNBQUE7V0FDN0MsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsWUFBYSxDQUFBLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxNQUFSLENBQUEsQ0FBZ0IsQ0FBQyxLQUFqQixDQUFBLENBQUEsQ0FBOUIsRUFBeUQ7TUFBQyxLQUFBLEVBQU8sTUFBUjtLQUF6RCxFQUEwRTtNQUFBLElBQUEsRUFBTSxRQUFRLENBQUMsTUFBZjtLQUExRTtFQUQ2QyxDQUEvQztTQUVBLENBQUEsQ0FBRSxRQUFGLENBQVcsQ0FBQyxFQUFaLENBQWUsWUFBZixFQUE2QixnQkFBN0IsRUFBK0MsU0FBQTtXQUM3QyxRQUFRLENBQUMsT0FBVCxDQUFpQixZQUFhLENBQUEsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUFnQixDQUFDLEtBQWpCLENBQUEsQ0FBQSxDQUE5QixFQUF5RDtNQUFFLEtBQUEsRUFBTyxHQUFUO0tBQXpELEVBQXlFO01BQUEsSUFBQSxFQUFNLFFBQVEsQ0FBQyxNQUFmO0tBQXpFO0VBRDZDLENBQS9DO0FBakRBLENBQUYiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG4oZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfVxuICBlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgnR01hcHMnLCBbXSwgZmFjdG9yeSk7XG4gIH1cblxuICByb290LkdNYXBzID0gZmFjdG9yeSgpO1xuXG59KHRoaXMsIGZ1bmN0aW9uKCkge1xuXG4vKiFcbiAqIEdNYXBzLmpzIHYwLjQuMThcbiAqIGh0dHA6Ly9ocG5lby5naXRodWIuY29tL2dtYXBzL1xuICpcbiAqIENvcHlyaWdodCAyMDE1LCBHdXN0YXZvIExlb25cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG5pZiAoISh0eXBlb2Ygd2luZG93Lmdvb2dsZSA9PT0gJ29iamVjdCcgJiYgd2luZG93Lmdvb2dsZS5tYXBzKSkge1xuICB0aHJvdyAnR29vZ2xlIE1hcHMgQVBJIGlzIHJlcXVpcmVkLiBQbGVhc2UgcmVnaXN0ZXIgdGhlIGZvbGxvd2luZyBKYXZhU2NyaXB0IGxpYnJhcnkgaHR0cDovL21hcHMuZ29vZ2xlLmNvbS9tYXBzL2FwaS9qcz9zZW5zb3I9dHJ1ZS4nXG59XG5cbnZhciBleHRlbmRfb2JqZWN0ID0gZnVuY3Rpb24ob2JqLCBuZXdfb2JqKSB7XG4gIHZhciBuYW1lO1xuXG4gIGlmIChvYmogPT09IG5ld19vYmopIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgZm9yIChuYW1lIGluIG5ld19vYmopIHtcbiAgICBvYmpbbmFtZV0gPSBuZXdfb2JqW25hbWVdO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbnZhciByZXBsYWNlX29iamVjdCA9IGZ1bmN0aW9uKG9iaiwgcmVwbGFjZSkge1xuICB2YXIgbmFtZTtcblxuICBpZiAob2JqID09PSByZXBsYWNlKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIGZvciAobmFtZSBpbiByZXBsYWNlKSB7XG4gICAgaWYgKG9ialtuYW1lXSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIG9ialtuYW1lXSA9IHJlcGxhY2VbbmFtZV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBhcnJheV9tYXAgPSBmdW5jdGlvbihhcnJheSwgY2FsbGJhY2spIHtcbiAgdmFyIG9yaWdpbmFsX2NhbGxiYWNrX3BhcmFtcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICBhcnJheV9yZXR1cm4gPSBbXSxcbiAgICAgIGFycmF5X2xlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIGk7XG5cbiAgaWYgKEFycmF5LnByb3RvdHlwZS5tYXAgJiYgYXJyYXkubWFwID09PSBBcnJheS5wcm90b3R5cGUubWFwKSB7XG4gICAgYXJyYXlfcmV0dXJuID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGFycmF5LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICB2YXIgY2FsbGJhY2tfcGFyYW1zID0gb3JpZ2luYWxfY2FsbGJhY2tfcGFyYW1zLnNsaWNlKDApO1xuICAgICAgY2FsbGJhY2tfcGFyYW1zLnNwbGljZSgwLCAwLCBpdGVtKTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGNhbGxiYWNrX3BhcmFtcyk7XG4gICAgfSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGFycmF5X2xlbmd0aDsgaSsrKSB7XG4gICAgICBjYWxsYmFja19wYXJhbXMgPSBvcmlnaW5hbF9jYWxsYmFja19wYXJhbXM7XG4gICAgICBjYWxsYmFja19wYXJhbXMuc3BsaWNlKDAsIDAsIGFycmF5W2ldKTtcbiAgICAgIGFycmF5X3JldHVybi5wdXNoKGNhbGxiYWNrLmFwcGx5KHRoaXMsIGNhbGxiYWNrX3BhcmFtcykpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcnJheV9yZXR1cm47XG59O1xuXG52YXIgYXJyYXlfZmxhdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gIHZhciBuZXdfYXJyYXkgPSBbXSxcbiAgICAgIGk7XG5cbiAgZm9yIChpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgbmV3X2FycmF5ID0gbmV3X2FycmF5LmNvbmNhdChhcnJheVtpXSk7XG4gIH1cblxuICByZXR1cm4gbmV3X2FycmF5O1xufTtcblxudmFyIGNvb3Jkc1RvTGF0TG5ncyA9IGZ1bmN0aW9uKGNvb3JkcywgdXNlR2VvSlNPTikge1xuICB2YXIgZmlyc3RfY29vcmQgPSBjb29yZHNbMF0sXG4gICAgICBzZWNvbmRfY29vcmQgPSBjb29yZHNbMV07XG5cbiAgaWYgKHVzZUdlb0pTT04pIHtcbiAgICBmaXJzdF9jb29yZCA9IGNvb3Jkc1sxXTtcbiAgICBzZWNvbmRfY29vcmQgPSBjb29yZHNbMF07XG4gIH1cblxuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhmaXJzdF9jb29yZCwgc2Vjb25kX2Nvb3JkKTtcbn07XG5cbnZhciBhcnJheVRvTGF0TG5nID0gZnVuY3Rpb24oY29vcmRzLCB1c2VHZW9KU09OKSB7XG4gIHZhciBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIShjb29yZHNbaV0gaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmcpKSB7XG4gICAgICBpZiAoY29vcmRzW2ldLmxlbmd0aCA+IDAgJiYgdHlwZW9mKGNvb3Jkc1tpXVswXSkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgY29vcmRzW2ldID0gYXJyYXlUb0xhdExuZyhjb29yZHNbaV0sIHVzZUdlb0pTT04pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvb3Jkc1tpXSA9IGNvb3Jkc1RvTGF0TG5ncyhjb29yZHNbaV0sIHVzZUdlb0pTT04pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb29yZHM7XG59O1xuXG5cbnZhciBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lID0gZnVuY3Rpb24gKGNsYXNzX25hbWUsIGNvbnRleHQpIHtcblxuICAgIHZhciBlbGVtZW50LFxuICAgICAgICBfY2xhc3MgPSBjbGFzc19uYW1lLnJlcGxhY2UoJy4nLCAnJyk7XG5cbiAgICBpZiAoJ2pRdWVyeScgaW4gdGhpcyAmJiBjb250ZXh0KSB7XG4gICAgICAgIGVsZW1lbnQgPSAkKFwiLlwiICsgX2NsYXNzLCBjb250ZXh0KVswXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShfY2xhc3MpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcblxufTtcblxudmFyIGdldEVsZW1lbnRCeUlkID0gZnVuY3Rpb24oaWQsIGNvbnRleHQpIHtcbiAgdmFyIGVsZW1lbnQsXG4gIGlkID0gaWQucmVwbGFjZSgnIycsICcnKTtcblxuICBpZiAoJ2pRdWVyeScgaW4gd2luZG93ICYmIGNvbnRleHQpIHtcbiAgICBlbGVtZW50ID0gJCgnIycgKyBpZCwgY29udGV4dClbMF07XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgfTtcblxuICByZXR1cm4gZWxlbWVudDtcbn07XG5cbnZhciBmaW5kQWJzb2x1dGVQb3NpdGlvbiA9IGZ1bmN0aW9uKG9iaikgIHtcbiAgdmFyIGN1cmxlZnQgPSAwLFxuICAgICAgY3VydG9wID0gMDtcblxuICBpZiAob2JqLm9mZnNldFBhcmVudCkge1xuICAgIGRvIHtcbiAgICAgIGN1cmxlZnQgKz0gb2JqLm9mZnNldExlZnQ7XG4gICAgICBjdXJ0b3AgKz0gb2JqLm9mZnNldFRvcDtcbiAgICB9IHdoaWxlIChvYmogPSBvYmoub2Zmc2V0UGFyZW50KTtcbiAgfVxuXG4gIHJldHVybiBbY3VybGVmdCwgY3VydG9wXTtcbn07XG5cbnZhciBHTWFwcyA9IChmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmFyIGRvYyA9IGRvY3VtZW50O1xuXG4gIHZhciBHTWFwcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAoIXRoaXMpIHJldHVybiBuZXcgR01hcHMob3B0aW9ucyk7XG5cbiAgICBvcHRpb25zLnpvb20gPSBvcHRpb25zLnpvb20gfHwgMTU7XG4gICAgb3B0aW9ucy5tYXBUeXBlID0gb3B0aW9ucy5tYXBUeXBlIHx8ICdyb2FkbWFwJztcblxuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgaSxcbiAgICAgICAgZXZlbnRzX3RoYXRfaGlkZV9jb250ZXh0X21lbnUgPSBbXG4gICAgICAgICAgJ2JvdW5kc19jaGFuZ2VkJywgJ2NlbnRlcl9jaGFuZ2VkJywgJ2NsaWNrJywgJ2RibGNsaWNrJywgJ2RyYWcnLFxuICAgICAgICAgICdkcmFnZW5kJywgJ2RyYWdzdGFydCcsICdpZGxlJywgJ21hcHR5cGVpZF9jaGFuZ2VkJywgJ3Byb2plY3Rpb25fY2hhbmdlZCcsXG4gICAgICAgICAgJ3Jlc2l6ZScsICd0aWxlc2xvYWRlZCcsICd6b29tX2NoYW5nZWQnXG4gICAgICAgIF0sXG4gICAgICAgIGV2ZW50c190aGF0X2RvZXNudF9oaWRlX2NvbnRleHRfbWVudSA9IFsnbW91c2Vtb3ZlJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlciddLFxuICAgICAgICBvcHRpb25zX3RvX2JlX2RlbGV0ZWQgPSBbJ2VsJywgJ2xhdCcsICdsbmcnLCAnbWFwVHlwZScsICd3aWR0aCcsICdoZWlnaHQnLCAnbWFya2VyQ2x1c3RlcmVyJywgJ2VuYWJsZU5ld1N0eWxlJ10sXG4gICAgICAgIGlkZW50aWZpZXIgPSBvcHRpb25zLmVsIHx8IG9wdGlvbnMuZGl2LFxuICAgICAgICBtYXJrZXJDbHVzdGVyZXJGdW5jdGlvbiA9IG9wdGlvbnMubWFya2VyQ2x1c3RlcmVyLFxuICAgICAgICBtYXBUeXBlID0gZ29vZ2xlLm1hcHMuTWFwVHlwZUlkW29wdGlvbnMubWFwVHlwZS50b1VwcGVyQ2FzZSgpXSxcbiAgICAgICAgbWFwX2NlbnRlciA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5sYXQsIG9wdGlvbnMubG5nKSxcbiAgICAgICAgem9vbUNvbnRyb2wgPSBvcHRpb25zLnpvb21Db250cm9sIHx8IHRydWUsXG4gICAgICAgIHpvb21Db250cm9sT3B0ID0gb3B0aW9ucy56b29tQ29udHJvbE9wdCB8fCB7XG4gICAgICAgICAgc3R5bGU6ICdERUZBVUxUJyxcbiAgICAgICAgICBwb3NpdGlvbjogJ1RPUF9MRUZUJ1xuICAgICAgICB9LFxuICAgICAgICB6b29tQ29udHJvbFN0eWxlID0gem9vbUNvbnRyb2xPcHQuc3R5bGUgfHwgJ0RFRkFVTFQnLFxuICAgICAgICB6b29tQ29udHJvbFBvc2l0aW9uID0gem9vbUNvbnRyb2xPcHQucG9zaXRpb24gfHwgJ1RPUF9MRUZUJyxcbiAgICAgICAgcGFuQ29udHJvbCA9IG9wdGlvbnMucGFuQ29udHJvbCB8fCB0cnVlLFxuICAgICAgICBtYXBUeXBlQ29udHJvbCA9IG9wdGlvbnMubWFwVHlwZUNvbnRyb2wgfHwgdHJ1ZSxcbiAgICAgICAgc2NhbGVDb250cm9sID0gb3B0aW9ucy5zY2FsZUNvbnRyb2wgfHwgdHJ1ZSxcbiAgICAgICAgc3RyZWV0Vmlld0NvbnRyb2wgPSBvcHRpb25zLnN0cmVldFZpZXdDb250cm9sIHx8IHRydWUsXG4gICAgICAgIG92ZXJ2aWV3TWFwQ29udHJvbCA9IG92ZXJ2aWV3TWFwQ29udHJvbCB8fCB0cnVlLFxuICAgICAgICBtYXBfb3B0aW9ucyA9IHt9LFxuICAgICAgICBtYXBfYmFzZV9vcHRpb25zID0ge1xuICAgICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgICBjZW50ZXI6IG1hcF9jZW50ZXIsXG4gICAgICAgICAgbWFwVHlwZUlkOiBtYXBUeXBlXG4gICAgICAgIH0sXG4gICAgICAgIG1hcF9jb250cm9sc19vcHRpb25zID0ge1xuICAgICAgICAgIHBhbkNvbnRyb2w6IHBhbkNvbnRyb2wsXG4gICAgICAgICAgem9vbUNvbnRyb2w6IHpvb21Db250cm9sLFxuICAgICAgICAgIHpvb21Db250cm9sT3B0aW9uczoge1xuICAgICAgICAgICAgc3R5bGU6IGdvb2dsZS5tYXBzLlpvb21Db250cm9sU3R5bGVbem9vbUNvbnRyb2xTdHlsZV0sXG4gICAgICAgICAgICBwb3NpdGlvbjogZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uW3pvb21Db250cm9sUG9zaXRpb25dXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtYXBUeXBlQ29udHJvbDogbWFwVHlwZUNvbnRyb2wsXG4gICAgICAgICAgc2NhbGVDb250cm9sOiBzY2FsZUNvbnRyb2wsXG4gICAgICAgICAgc3RyZWV0Vmlld0NvbnRyb2w6IHN0cmVldFZpZXdDb250cm9sLFxuICAgICAgICAgIG92ZXJ2aWV3TWFwQ29udHJvbDogb3ZlcnZpZXdNYXBDb250cm9sXG4gICAgICAgIH07XG5cbiAgICAgIGlmICh0eXBlb2Yob3B0aW9ucy5lbCkgPT09ICdzdHJpbmcnIHx8IHR5cGVvZihvcHRpb25zLmRpdikgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgICBpZiAoaWRlbnRpZmllci5pbmRleE9mKFwiI1wiKSA+IC0xKSB7XG4gICAgICAgICAgICAgIHRoaXMuZWwgPSBnZXRFbGVtZW50QnlJZChpZGVudGlmaWVyLCBvcHRpb25zLmNvbnRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuZWwgPSBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lLmFwcGx5KHRoaXMsIFtpZGVudGlmaWVyLCBvcHRpb25zLmNvbnRleHRdKTtcbiAgICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5lbCA9IGlkZW50aWZpZXI7XG4gICAgICB9XG5cbiAgICBpZiAodHlwZW9mKHRoaXMuZWwpID09PSAndW5kZWZpbmVkJyB8fCB0aGlzLmVsID09PSBudWxsKSB7XG4gICAgICB0aHJvdyAnTm8gZWxlbWVudCBkZWZpbmVkLic7XG4gICAgfVxuXG4gICAgd2luZG93LmNvbnRleHRfbWVudSA9IHdpbmRvdy5jb250ZXh0X21lbnUgfHwge307XG4gICAgd2luZG93LmNvbnRleHRfbWVudVtzZWxmLmVsLmlkXSA9IHt9O1xuXG4gICAgdGhpcy5jb250cm9scyA9IFtdO1xuICAgIHRoaXMub3ZlcmxheXMgPSBbXTtcbiAgICB0aGlzLmxheWVycyA9IFtdOyAvLyBhcnJheSB3aXRoIGttbC9nZW9yc3MgYW5kIGZ1c2lvbnRhYmxlcyBsYXllcnMsIGNhbiBiZSBhcyBtYW55XG4gICAgdGhpcy5zaW5nbGVMYXllcnMgPSB7fTsgLy8gb2JqZWN0IHdpdGggdGhlIG90aGVyIGxheWVycywgb25seSBvbmUgcGVyIGxheWVyXG4gICAgdGhpcy5tYXJrZXJzID0gW107XG4gICAgdGhpcy5wb2x5bGluZXMgPSBbXTtcbiAgICB0aGlzLnJvdXRlcyA9IFtdO1xuICAgIHRoaXMucG9seWdvbnMgPSBbXTtcbiAgICB0aGlzLmluZm9XaW5kb3cgPSBudWxsO1xuICAgIHRoaXMub3ZlcmxheV9lbCA9IG51bGw7XG4gICAgdGhpcy56b29tID0gb3B0aW9ucy56b29tO1xuICAgIHRoaXMucmVnaXN0ZXJlZF9ldmVudHMgPSB7fTtcblxuICAgIHRoaXMuZWwuc3R5bGUud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IHRoaXMuZWwuc2Nyb2xsV2lkdGggfHwgdGhpcy5lbC5vZmZzZXRXaWR0aDtcbiAgICB0aGlzLmVsLnN0eWxlLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMuZWwuc2Nyb2xsSGVpZ2h0IHx8IHRoaXMuZWwub2Zmc2V0SGVpZ2h0O1xuXG4gICAgZ29vZ2xlLm1hcHMudmlzdWFsUmVmcmVzaCA9IG9wdGlvbnMuZW5hYmxlTmV3U3R5bGU7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgb3B0aW9uc190b19iZV9kZWxldGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZWxldGUgb3B0aW9uc1tvcHRpb25zX3RvX2JlX2RlbGV0ZWRbaV1dO1xuICAgIH1cblxuICAgIGlmKG9wdGlvbnMuZGlzYWJsZURlZmF1bHRVSSAhPSB0cnVlKSB7XG4gICAgICBtYXBfYmFzZV9vcHRpb25zID0gZXh0ZW5kX29iamVjdChtYXBfYmFzZV9vcHRpb25zLCBtYXBfY29udHJvbHNfb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgbWFwX29wdGlvbnMgPSBleHRlbmRfb2JqZWN0KG1hcF9iYXNlX29wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGV2ZW50c190aGF0X2hpZGVfY29udGV4dF9tZW51Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZWxldGUgbWFwX29wdGlvbnNbZXZlbnRzX3RoYXRfaGlkZV9jb250ZXh0X21lbnVbaV1dO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBldmVudHNfdGhhdF9kb2VzbnRfaGlkZV9jb250ZXh0X21lbnUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRlbGV0ZSBtYXBfb3B0aW9uc1tldmVudHNfdGhhdF9kb2VzbnRfaGlkZV9jb250ZXh0X21lbnVbaV1dO1xuICAgIH1cblxuICAgIHRoaXMubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCh0aGlzLmVsLCBtYXBfb3B0aW9ucyk7XG5cbiAgICBpZiAobWFya2VyQ2x1c3RlcmVyRnVuY3Rpb24pIHtcbiAgICAgIHRoaXMubWFya2VyQ2x1c3RlcmVyID0gbWFya2VyQ2x1c3RlcmVyRnVuY3Rpb24uYXBwbHkodGhpcywgW3RoaXMubWFwXSk7XG4gICAgfVxuXG4gICAgdmFyIGJ1aWxkQ29udGV4dE1lbnVIVE1MID0gZnVuY3Rpb24oY29udHJvbCwgZSkge1xuICAgICAgdmFyIGh0bWwgPSAnJyxcbiAgICAgICAgICBvcHRpb25zID0gd2luZG93LmNvbnRleHRfbWVudVtzZWxmLmVsLmlkXVtjb250cm9sXTtcblxuICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKXtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICB2YXIgb3B0aW9uID0gb3B0aW9uc1tpXTtcblxuICAgICAgICAgIGh0bWwgKz0gJzxsaT48YSBpZD1cIicgKyBjb250cm9sICsgJ18nICsgaSArICdcIiBocmVmPVwiI1wiPicgKyBvcHRpb24udGl0bGUgKyAnPC9hPjwvbGk+JztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWdldEVsZW1lbnRCeUlkKCdnbWFwc19jb250ZXh0X21lbnUnKSkgcmV0dXJuO1xuXG4gICAgICB2YXIgY29udGV4dF9tZW51X2VsZW1lbnQgPSBnZXRFbGVtZW50QnlJZCgnZ21hcHNfY29udGV4dF9tZW51Jyk7XG4gICAgICBcbiAgICAgIGNvbnRleHRfbWVudV9lbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG5cbiAgICAgIHZhciBjb250ZXh0X21lbnVfaXRlbXMgPSBjb250ZXh0X21lbnVfZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYScpLFxuICAgICAgICAgIGNvbnRleHRfbWVudV9pdGVtc19jb3VudCA9IGNvbnRleHRfbWVudV9pdGVtcy5sZW5ndGgsXG4gICAgICAgICAgaTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGNvbnRleHRfbWVudV9pdGVtc19jb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBjb250ZXh0X21lbnVfaXRlbSA9IGNvbnRleHRfbWVudV9pdGVtc1tpXTtcblxuICAgICAgICB2YXIgYXNzaWduX21lbnVfaXRlbV9hY3Rpb24gPSBmdW5jdGlvbihldil7XG4gICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIG9wdGlvbnNbdGhpcy5pZC5yZXBsYWNlKGNvbnRyb2wgKyAnXycsICcnKV0uYWN0aW9uLmFwcGx5KHNlbGYsIFtlXSk7XG4gICAgICAgICAgc2VsZi5oaWRlQ29udGV4dE1lbnUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5jbGVhckxpc3RlbmVycyhjb250ZXh0X21lbnVfaXRlbSwgJ2NsaWNrJyk7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyT25jZShjb250ZXh0X21lbnVfaXRlbSwgJ2NsaWNrJywgYXNzaWduX21lbnVfaXRlbV9hY3Rpb24sIGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHBvc2l0aW9uID0gZmluZEFic29sdXRlUG9zaXRpb24uYXBwbHkodGhpcywgW3NlbGYuZWxdKSxcbiAgICAgICAgICBsZWZ0ID0gcG9zaXRpb25bMF0gKyBlLnBpeGVsLnggLSAxNSxcbiAgICAgICAgICB0b3AgPSBwb3NpdGlvblsxXSArIGUucGl4ZWwueS0gMTU7XG5cbiAgICAgIGNvbnRleHRfbWVudV9lbGVtZW50LnN0eWxlLmxlZnQgPSBsZWZ0ICsgXCJweFwiO1xuICAgICAgY29udGV4dF9tZW51X2VsZW1lbnQuc3R5bGUudG9wID0gdG9wICsgXCJweFwiO1xuXG4gICAgICBjb250ZXh0X21lbnVfZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9O1xuXG4gICAgdGhpcy5idWlsZENvbnRleHRNZW51ID0gZnVuY3Rpb24oY29udHJvbCwgZSkge1xuICAgICAgaWYgKGNvbnRyb2wgPT09ICdtYXJrZXInKSB7XG4gICAgICAgIGUucGl4ZWwgPSB7fTtcblxuICAgICAgICB2YXIgb3ZlcmxheSA9IG5ldyBnb29nbGUubWFwcy5PdmVybGF5VmlldygpO1xuICAgICAgICBvdmVybGF5LnNldE1hcChzZWxmLm1hcCk7XG4gICAgICAgIFxuICAgICAgICBvdmVybGF5LmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcHJvamVjdGlvbiA9IG92ZXJsYXkuZ2V0UHJvamVjdGlvbigpLFxuICAgICAgICAgICAgICBwb3NpdGlvbiA9IGUubWFya2VyLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICAgXG4gICAgICAgICAgZS5waXhlbCA9IHByb2plY3Rpb24uZnJvbUxhdExuZ1RvQ29udGFpbmVyUGl4ZWwocG9zaXRpb24pO1xuXG4gICAgICAgICAgYnVpbGRDb250ZXh0TWVudUhUTUwoY29udHJvbCwgZSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYnVpbGRDb250ZXh0TWVudUhUTUwoY29udHJvbCwgZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuc2V0Q29udGV4dE1lbnUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB3aW5kb3cuY29udGV4dF9tZW51W3NlbGYuZWwuaWRdW29wdGlvbnMuY29udHJvbF0gPSB7fTtcblxuICAgICAgdmFyIGksXG4gICAgICAgICAgdWwgPSBkb2MuY3JlYXRlRWxlbWVudCgndWwnKTtcblxuICAgICAgZm9yIChpIGluIG9wdGlvbnMub3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5vcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgdmFyIG9wdGlvbiA9IG9wdGlvbnMub3B0aW9uc1tpXTtcblxuICAgICAgICAgIHdpbmRvdy5jb250ZXh0X21lbnVbc2VsZi5lbC5pZF1bb3B0aW9ucy5jb250cm9sXVtvcHRpb24ubmFtZV0gPSB7XG4gICAgICAgICAgICB0aXRsZTogb3B0aW9uLnRpdGxlLFxuICAgICAgICAgICAgYWN0aW9uOiBvcHRpb24uYWN0aW9uXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB1bC5pZCA9ICdnbWFwc19jb250ZXh0X21lbnUnO1xuICAgICAgdWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHVsLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgIHVsLnN0eWxlLm1pbldpZHRoID0gJzEwMHB4JztcbiAgICAgIHVsLnN0eWxlLmJhY2tncm91bmQgPSAnd2hpdGUnO1xuICAgICAgdWwuc3R5bGUubGlzdFN0eWxlID0gJ25vbmUnO1xuICAgICAgdWwuc3R5bGUucGFkZGluZyA9ICc4cHgnO1xuICAgICAgdWwuc3R5bGUuYm94U2hhZG93ID0gJzJweCAycHggNnB4ICNjY2MnO1xuXG4gICAgICBkb2MuYm9keS5hcHBlbmRDaGlsZCh1bCk7XG5cbiAgICAgIHZhciBjb250ZXh0X21lbnVfZWxlbWVudCA9IGdldEVsZW1lbnRCeUlkKCdnbWFwc19jb250ZXh0X21lbnUnKVxuXG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGREb21MaXN0ZW5lcihjb250ZXh0X21lbnVfZWxlbWVudCwgJ21vdXNlb3V0JywgZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKCFldi5yZWxhdGVkVGFyZ2V0IHx8ICF0aGlzLmNvbnRhaW5zKGV2LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNvbnRleHRfbWVudV9lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgfVxuICAgICAgfSwgZmFsc2UpO1xuICAgIH07XG5cbiAgICB0aGlzLmhpZGVDb250ZXh0TWVudSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvbnRleHRfbWVudV9lbGVtZW50ID0gZ2V0RWxlbWVudEJ5SWQoJ2dtYXBzX2NvbnRleHRfbWVudScpO1xuXG4gICAgICBpZiAoY29udGV4dF9tZW51X2VsZW1lbnQpIHtcbiAgICAgICAgY29udGV4dF9tZW51X2VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHNldHVwTGlzdGVuZXIgPSBmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgIGlmIChlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGUgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuXG4gICAgICAgIHNlbGYuaGlkZUNvbnRleHRNZW51KCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy9nb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLm1hcCwgJ2lkbGUnLCB0aGlzLmhpZGVDb250ZXh0TWVudSk7XG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXAsICd6b29tX2NoYW5nZWQnLCB0aGlzLmhpZGVDb250ZXh0TWVudSk7XG5cbiAgICBmb3IgKHZhciBldiA9IDA7IGV2IDwgZXZlbnRzX3RoYXRfaGlkZV9jb250ZXh0X21lbnUubGVuZ3RoOyBldisrKSB7XG4gICAgICB2YXIgbmFtZSA9IGV2ZW50c190aGF0X2hpZGVfY29udGV4dF9tZW51W2V2XTtcblxuICAgICAgaWYgKG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgICBzZXR1cExpc3RlbmVyKHRoaXMubWFwLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBldiA9IDA7IGV2IDwgZXZlbnRzX3RoYXRfZG9lc250X2hpZGVfY29udGV4dF9tZW51Lmxlbmd0aDsgZXYrKykge1xuICAgICAgdmFyIG5hbWUgPSBldmVudHNfdGhhdF9kb2VzbnRfaGlkZV9jb250ZXh0X21lbnVbZXZdO1xuXG4gICAgICBpZiAobmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgIHNldHVwTGlzdGVuZXIodGhpcy5tYXAsIG5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFwLCAncmlnaHRjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChvcHRpb25zLnJpZ2h0Y2xpY2spIHtcbiAgICAgICAgb3B0aW9ucy5yaWdodGNsaWNrLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICB9XG5cbiAgICAgIGlmKHdpbmRvdy5jb250ZXh0X21lbnVbc2VsZi5lbC5pZF1bJ21hcCddICE9IHVuZGVmaW5lZCkge1xuICAgICAgICBzZWxmLmJ1aWxkQ29udGV4dE1lbnUoJ21hcCcsIGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKHRoaXMubWFwLCAncmVzaXplJyk7XG4gICAgfTtcblxuICAgIHRoaXMuZml0Wm9vbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxhdExuZ3MgPSBbXSxcbiAgICAgICAgICBtYXJrZXJzX2xlbmd0aCA9IHRoaXMubWFya2Vycy5sZW5ndGgsXG4gICAgICAgICAgaTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IG1hcmtlcnNfbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYodHlwZW9mKHRoaXMubWFya2Vyc1tpXS52aXNpYmxlKSA9PT0gJ2Jvb2xlYW4nICYmIHRoaXMubWFya2Vyc1tpXS52aXNpYmxlKSB7XG4gICAgICAgICAgbGF0TG5ncy5wdXNoKHRoaXMubWFya2Vyc1tpXS5nZXRQb3NpdGlvbigpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmZpdExhdExuZ0JvdW5kcyhsYXRMbmdzKTtcbiAgICB9O1xuXG4gICAgdGhpcy5maXRMYXRMbmdCb3VuZHMgPSBmdW5jdGlvbihsYXRMbmdzKSB7XG4gICAgICB2YXIgdG90YWwgPSBsYXRMbmdzLmxlbmd0aCxcbiAgICAgICAgICBib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKCksXG4gICAgICAgICAgaTtcblxuICAgICAgZm9yKGkgPSAwOyBpIDwgdG90YWw7IGkrKykge1xuICAgICAgICBib3VuZHMuZXh0ZW5kKGxhdExuZ3NbaV0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm1hcC5maXRCb3VuZHMoYm91bmRzKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zZXRDZW50ZXIgPSBmdW5jdGlvbihsYXQsIGxuZywgY2FsbGJhY2spIHtcbiAgICAgIHRoaXMubWFwLnBhblRvKG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0LCBsbmcpKTtcblxuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZWw7XG4gICAgfTtcblxuICAgIHRoaXMuem9vbUluID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUgfHwgMTtcblxuICAgICAgdGhpcy56b29tID0gdGhpcy5tYXAuZ2V0Wm9vbSgpICsgdmFsdWU7XG4gICAgICB0aGlzLm1hcC5zZXRab29tKHRoaXMuem9vbSk7XG4gICAgfTtcblxuICAgIHRoaXMuem9vbU91dCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlIHx8IDE7XG5cbiAgICAgIHRoaXMuem9vbSA9IHRoaXMubWFwLmdldFpvb20oKSAtIHZhbHVlO1xuICAgICAgdGhpcy5tYXAuc2V0Wm9vbSh0aGlzLnpvb20pO1xuICAgIH07XG5cbiAgICB2YXIgbmF0aXZlX21ldGhvZHMgPSBbXSxcbiAgICAgICAgbWV0aG9kO1xuXG4gICAgZm9yIChtZXRob2QgaW4gdGhpcy5tYXApIHtcbiAgICAgIGlmICh0eXBlb2YodGhpcy5tYXBbbWV0aG9kXSkgPT0gJ2Z1bmN0aW9uJyAmJiAhdGhpc1ttZXRob2RdKSB7XG4gICAgICAgIG5hdGl2ZV9tZXRob2RzLnB1c2gobWV0aG9kKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbmF0aXZlX21ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIChmdW5jdGlvbihnbWFwcywgc2NvcGUsIG1ldGhvZF9uYW1lKSB7XG4gICAgICAgIGdtYXBzW21ldGhvZF9uYW1lXSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgcmV0dXJuIHNjb3BlW21ldGhvZF9uYW1lXS5hcHBseShzY29wZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMsIHRoaXMubWFwLCBuYXRpdmVfbWV0aG9kc1tpXSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBHTWFwcztcbn0pKHRoaXMpO1xuXG5HTWFwcy5wcm90b3R5cGUuY3JlYXRlQ29udHJvbCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbnRyb2wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBjb250cm9sLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgXG4gIGlmIChvcHRpb25zLmRpc2FibGVEZWZhdWx0U3R5bGVzICE9PSB0cnVlKSB7XG4gICAgY29udHJvbC5zdHlsZS5mb250RmFtaWx5ID0gJ1JvYm90bywgQXJpYWwsIHNhbnMtc2VyaWYnO1xuICAgIGNvbnRyb2wuc3R5bGUuZm9udFNpemUgPSAnMTFweCc7XG4gICAgY29udHJvbC5zdHlsZS5ib3hTaGFkb3cgPSAncmdiYSgwLCAwLCAwLCAwLjI5ODAzOSkgMHB4IDFweCA0cHggLTFweCc7XG4gIH1cblxuICBmb3IgKHZhciBvcHRpb24gaW4gb3B0aW9ucy5zdHlsZSkge1xuICAgIGNvbnRyb2wuc3R5bGVbb3B0aW9uXSA9IG9wdGlvbnMuc3R5bGVbb3B0aW9uXTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmlkKSB7XG4gICAgY29udHJvbC5pZCA9IG9wdGlvbnMuaWQ7XG4gIH1cblxuICBpZiAob3B0aW9ucy5jbGFzc2VzKSB7XG4gICAgY29udHJvbC5jbGFzc05hbWUgPSBvcHRpb25zLmNsYXNzZXM7XG4gIH1cblxuICBpZiAob3B0aW9ucy5jb250ZW50KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb250cm9sLmlubmVySFRNTCA9IG9wdGlvbnMuY29udGVudDtcbiAgICB9XG4gICAgZWxzZSBpZiAob3B0aW9ucy5jb250ZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgIGNvbnRyb2wuYXBwZW5kQ2hpbGQob3B0aW9ucy5jb250ZW50KTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucy5wb3NpdGlvbikge1xuICAgIGNvbnRyb2wucG9zaXRpb24gPSBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb25bb3B0aW9ucy5wb3NpdGlvbi50b1VwcGVyQ2FzZSgpXTtcbiAgfVxuXG4gIGZvciAodmFyIGV2IGluIG9wdGlvbnMuZXZlbnRzKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbigpe1xuICAgICAgICBvcHRpb25zLmV2ZW50c1tuYW1lXS5hcHBseSh0aGlzLCBbdGhpc10pO1xuICAgICAgfSk7XG4gICAgfSkoY29udHJvbCwgZXYpO1xuICB9XG5cbiAgY29udHJvbC5pbmRleCA9IDE7XG5cbiAgcmV0dXJuIGNvbnRyb2w7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkQ29udHJvbCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbnRyb2wgPSB0aGlzLmNyZWF0ZUNvbnRyb2wob3B0aW9ucyk7XG4gIFxuICB0aGlzLmNvbnRyb2xzLnB1c2goY29udHJvbCk7XG4gIHRoaXMubWFwLmNvbnRyb2xzW2NvbnRyb2wucG9zaXRpb25dLnB1c2goY29udHJvbCk7XG5cbiAgcmV0dXJuIGNvbnRyb2w7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlQ29udHJvbCA9IGZ1bmN0aW9uKGNvbnRyb2wpIHtcbiAgdmFyIHBvc2l0aW9uID0gbnVsbCxcbiAgICAgIGk7XG5cbiAgZm9yIChpID0gMDsgaSA8IHRoaXMuY29udHJvbHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5jb250cm9sc1tpXSA9PSBjb250cm9sKSB7XG4gICAgICBwb3NpdGlvbiA9IHRoaXMuY29udHJvbHNbaV0ucG9zaXRpb247XG4gICAgICB0aGlzLmNvbnRyb2xzLnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICBpZiAocG9zaXRpb24pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5tYXAuY29udHJvbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb250cm9sc0ZvclBvc2l0aW9uID0gdGhpcy5tYXAuY29udHJvbHNbY29udHJvbC5wb3NpdGlvbl07XG5cbiAgICAgIGlmIChjb250cm9sc0ZvclBvc2l0aW9uLmdldEF0KGkpID09IGNvbnRyb2wpIHtcbiAgICAgICAgY29udHJvbHNGb3JQb3NpdGlvbi5yZW1vdmVBdChpKTtcblxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29udHJvbDtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5jcmVhdGVNYXJrZXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLmxhdCA9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5sbmcgPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMucG9zaXRpb24gPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgJ05vIGxhdGl0dWRlIG9yIGxvbmdpdHVkZSBkZWZpbmVkLic7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBkZXRhaWxzID0gb3B0aW9ucy5kZXRhaWxzLFxuICAgICAgZmVuY2VzID0gb3B0aW9ucy5mZW5jZXMsXG4gICAgICBvdXRzaWRlID0gb3B0aW9ucy5vdXRzaWRlLFxuICAgICAgYmFzZV9vcHRpb25zID0ge1xuICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmxhdCwgb3B0aW9ucy5sbmcpLFxuICAgICAgICBtYXA6IG51bGxcbiAgICAgIH0sXG4gICAgICBtYXJrZXJfb3B0aW9ucyA9IGV4dGVuZF9vYmplY3QoYmFzZV9vcHRpb25zLCBvcHRpb25zKTtcblxuICBkZWxldGUgbWFya2VyX29wdGlvbnMubGF0O1xuICBkZWxldGUgbWFya2VyX29wdGlvbnMubG5nO1xuICBkZWxldGUgbWFya2VyX29wdGlvbnMuZmVuY2VzO1xuICBkZWxldGUgbWFya2VyX29wdGlvbnMub3V0c2lkZTtcblxuICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcihtYXJrZXJfb3B0aW9ucyk7XG5cbiAgbWFya2VyLmZlbmNlcyA9IGZlbmNlcztcblxuICBpZiAob3B0aW9ucy5pbmZvV2luZG93KSB7XG4gICAgbWFya2VyLmluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyhvcHRpb25zLmluZm9XaW5kb3cpO1xuXG4gICAgdmFyIGluZm9fd2luZG93X2V2ZW50cyA9IFsnY2xvc2VjbGljaycsICdjb250ZW50X2NoYW5nZWQnLCAnZG9tcmVhZHknLCAncG9zaXRpb25fY2hhbmdlZCcsICd6aW5kZXhfY2hhbmdlZCddO1xuXG4gICAgZm9yICh2YXIgZXYgPSAwOyBldiA8IGluZm9fd2luZG93X2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaW5mb1dpbmRvd1tuYW1lXSkge1xuICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBvcHRpb25zLmluZm9XaW5kb3dbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSkobWFya2VyLmluZm9XaW5kb3csIGluZm9fd2luZG93X2V2ZW50c1tldl0pO1xuICAgIH1cbiAgfVxuXG4gIHZhciBtYXJrZXJfZXZlbnRzID0gWydhbmltYXRpb25fY2hhbmdlZCcsICdjbGlja2FibGVfY2hhbmdlZCcsICdjdXJzb3JfY2hhbmdlZCcsICdkcmFnZ2FibGVfY2hhbmdlZCcsICdmbGF0X2NoYW5nZWQnLCAnaWNvbl9jaGFuZ2VkJywgJ3Bvc2l0aW9uX2NoYW5nZWQnLCAnc2hhZG93X2NoYW5nZWQnLCAnc2hhcGVfY2hhbmdlZCcsICd0aXRsZV9jaGFuZ2VkJywgJ3Zpc2libGVfY2hhbmdlZCcsICd6aW5kZXhfY2hhbmdlZCddO1xuXG4gIHZhciBtYXJrZXJfZXZlbnRzX3dpdGhfbW91c2UgPSBbJ2RibGNsaWNrJywgJ2RyYWcnLCAnZHJhZ2VuZCcsICdkcmFnc3RhcnQnLCAnbW91c2Vkb3duJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlcicsICdtb3VzZXVwJ107XG5cbiAgZm9yICh2YXIgZXYgPSAwOyBldiA8IG1hcmtlcl9ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbigpe1xuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW3RoaXNdKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkobWFya2VyLCBtYXJrZXJfZXZlbnRzW2V2XSk7XG4gIH1cblxuICBmb3IgKHZhciBldiA9IDA7IGV2IDwgbWFya2VyX2V2ZW50c193aXRoX21vdXNlLmxlbmd0aDsgZXYrKykge1xuICAgIChmdW5jdGlvbihtYXAsIG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihtZSl7XG4gICAgICAgICAgaWYoIW1lLnBpeGVsKXtcbiAgICAgICAgICAgIG1lLnBpeGVsID0gbWFwLmdldFByb2plY3Rpb24oKS5mcm9tTGF0TG5nVG9Qb2ludChtZS5sYXRMbmcpXG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW21lXSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKHRoaXMubWFwLCBtYXJrZXIsIG1hcmtlcl9ldmVudHNfd2l0aF9tb3VzZVtldl0pO1xuICB9XG5cbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmRldGFpbHMgPSBkZXRhaWxzO1xuXG4gICAgaWYgKG9wdGlvbnMuY2xpY2spIHtcbiAgICAgIG9wdGlvbnMuY2xpY2suYXBwbHkodGhpcywgW3RoaXNdKTtcbiAgICB9XG5cbiAgICBpZiAobWFya2VyLmluZm9XaW5kb3cpIHtcbiAgICAgIHNlbGYuaGlkZUluZm9XaW5kb3dzKCk7XG4gICAgICBtYXJrZXIuaW5mb1dpbmRvdy5vcGVuKHNlbGYubWFwLCBtYXJrZXIpO1xuICAgIH1cbiAgfSk7XG5cbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAncmlnaHRjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLm1hcmtlciA9IHRoaXM7XG5cbiAgICBpZiAob3B0aW9ucy5yaWdodGNsaWNrKSB7XG4gICAgICBvcHRpb25zLnJpZ2h0Y2xpY2suYXBwbHkodGhpcywgW2VdKTtcbiAgICB9XG5cbiAgICBpZiAod2luZG93LmNvbnRleHRfbWVudVtzZWxmLmVsLmlkXVsnbWFya2VyJ10gIT0gdW5kZWZpbmVkKSB7XG4gICAgICBzZWxmLmJ1aWxkQ29udGV4dE1lbnUoJ21hcmtlcicsIGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKG1hcmtlci5mZW5jZXMpIHtcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdkcmFnZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmNoZWNrTWFya2VyR2VvZmVuY2UobWFya2VyLCBmdW5jdGlvbihtLCBmKSB7XG4gICAgICAgIG91dHNpZGUobSwgZik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBtYXJrZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkTWFya2VyID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgbWFya2VyO1xuICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KCdnbV9hY2Nlc3NvcnNfJykpIHtcbiAgICAvLyBOYXRpdmUgZ29vZ2xlLm1hcHMuTWFya2VyIG9iamVjdFxuICAgIG1hcmtlciA9IG9wdGlvbnM7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKChvcHRpb25zLmhhc093blByb3BlcnR5KCdsYXQnKSAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCdsbmcnKSkgfHwgb3B0aW9ucy5wb3NpdGlvbikge1xuICAgICAgbWFya2VyID0gdGhpcy5jcmVhdGVNYXJrZXIob3B0aW9ucyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhyb3cgJ05vIGxhdGl0dWRlIG9yIGxvbmdpdHVkZSBkZWZpbmVkLic7XG4gICAgfVxuICB9XG5cbiAgbWFya2VyLnNldE1hcCh0aGlzLm1hcCk7XG5cbiAgaWYodGhpcy5tYXJrZXJDbHVzdGVyZXIpIHtcbiAgICB0aGlzLm1hcmtlckNsdXN0ZXJlci5hZGRNYXJrZXIobWFya2VyKTtcbiAgfVxuXG4gIHRoaXMubWFya2Vycy5wdXNoKG1hcmtlcik7XG5cbiAgR01hcHMuZmlyZSgnbWFya2VyX2FkZGVkJywgbWFya2VyLCB0aGlzKTtcblxuICByZXR1cm4gbWFya2VyO1xufTtcblxuR01hcHMucHJvdG90eXBlLmFkZE1hcmtlcnMgPSBmdW5jdGlvbihhcnJheSkge1xuICBmb3IgKHZhciBpID0gMCwgbWFya2VyOyBtYXJrZXI9YXJyYXlbaV07IGkrKykge1xuICAgIHRoaXMuYWRkTWFya2VyKG1hcmtlcik7XG4gIH1cblxuICByZXR1cm4gdGhpcy5tYXJrZXJzO1xufTtcblxuR01hcHMucHJvdG90eXBlLmhpZGVJbmZvV2luZG93cyA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMCwgbWFya2VyOyBtYXJrZXIgPSB0aGlzLm1hcmtlcnNbaV07IGkrKyl7XG4gICAgaWYgKG1hcmtlci5pbmZvV2luZG93KSB7XG4gICAgICBtYXJrZXIuaW5mb1dpbmRvdy5jbG9zZSgpO1xuICAgIH1cbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZU1hcmtlciA9IGZ1bmN0aW9uKG1hcmtlcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLm1hcmtlcnNbaV0gPT09IG1hcmtlcikge1xuICAgICAgdGhpcy5tYXJrZXJzW2ldLnNldE1hcChudWxsKTtcbiAgICAgIHRoaXMubWFya2Vycy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgIGlmKHRoaXMubWFya2VyQ2x1c3RlcmVyKSB7XG4gICAgICAgIHRoaXMubWFya2VyQ2x1c3RlcmVyLnJlbW92ZU1hcmtlcihtYXJrZXIpO1xuICAgICAgfVxuXG4gICAgICBHTWFwcy5maXJlKCdtYXJrZXJfcmVtb3ZlZCcsIG1hcmtlciwgdGhpcyk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXJrZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlTWFya2VycyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gIHZhciBuZXdfbWFya2VycyA9IFtdO1xuXG4gIGlmICh0eXBlb2YgY29sbGVjdGlvbiA9PSAndW5kZWZpbmVkJykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXJzW2ldO1xuICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcblxuICAgICAgaWYodGhpcy5tYXJrZXJDbHVzdGVyZXIpIHtcbiAgICAgICAgdGhpcy5tYXJrZXJDbHVzdGVyZXIucmVtb3ZlTWFya2VyKG1hcmtlcik7XG4gICAgICB9XG5cbiAgICAgIEdNYXBzLmZpcmUoJ21hcmtlcl9yZW1vdmVkJywgbWFya2VyLCB0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5tYXJrZXJzID0gbmV3X21hcmtlcnM7XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaW5kZXggPSB0aGlzLm1hcmtlcnMuaW5kZXhPZihjb2xsZWN0aW9uW2ldKTtcblxuICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2Vyc1tpbmRleF07XG4gICAgICAgIG1hcmtlci5zZXRNYXAobnVsbCk7XG5cbiAgICAgICAgaWYodGhpcy5tYXJrZXJDbHVzdGVyZXIpIHtcbiAgICAgICAgICB0aGlzLm1hcmtlckNsdXN0ZXJlci5yZW1vdmVNYXJrZXIobWFya2VyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEdNYXBzLmZpcmUoJ21hcmtlcl9yZW1vdmVkJywgbWFya2VyLCB0aGlzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2Vyc1tpXTtcbiAgICAgIGlmIChtYXJrZXIuZ2V0TWFwKCkgIT0gbnVsbCkge1xuICAgICAgICBuZXdfbWFya2Vycy5wdXNoKG1hcmtlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5tYXJrZXJzID0gbmV3X21hcmtlcnM7XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3T3ZlcmxheSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIG92ZXJsYXkgPSBuZXcgZ29vZ2xlLm1hcHMuT3ZlcmxheVZpZXcoKSxcbiAgICAgIGF1dG9fc2hvdyA9IHRydWU7XG5cbiAgb3ZlcmxheS5zZXRNYXAodGhpcy5tYXApO1xuXG4gIGlmIChvcHRpb25zLmF1dG9fc2hvdyAhPSBudWxsKSB7XG4gICAgYXV0b19zaG93ID0gb3B0aW9ucy5hdXRvX3Nob3c7XG4gIH1cblxuICBvdmVybGF5Lm9uQWRkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBlbC5zdHlsZS5ib3JkZXJTdHlsZSA9IFwibm9uZVwiO1xuICAgIGVsLnN0eWxlLmJvcmRlcldpZHRoID0gXCIwcHhcIjtcbiAgICBlbC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICBlbC5zdHlsZS56SW5kZXggPSAxMDA7XG4gICAgZWwuaW5uZXJIVE1MID0gb3B0aW9ucy5jb250ZW50O1xuXG4gICAgb3ZlcmxheS5lbCA9IGVsO1xuXG4gICAgaWYgKCFvcHRpb25zLmxheWVyKSB7XG4gICAgICBvcHRpb25zLmxheWVyID0gJ292ZXJsYXlMYXllcic7XG4gICAgfVxuICAgIFxuICAgIHZhciBwYW5lcyA9IHRoaXMuZ2V0UGFuZXMoKSxcbiAgICAgICAgb3ZlcmxheUxheWVyID0gcGFuZXNbb3B0aW9ucy5sYXllcl0sXG4gICAgICAgIHN0b3Bfb3ZlcmxheV9ldmVudHMgPSBbJ2NvbnRleHRtZW51JywgJ0RPTU1vdXNlU2Nyb2xsJywgJ2RibGNsaWNrJywgJ21vdXNlZG93biddO1xuXG4gICAgb3ZlcmxheUxheWVyLmFwcGVuZENoaWxkKGVsKTtcblxuICAgIGZvciAodmFyIGV2ID0gMDsgZXYgPCBzdG9wX292ZXJsYXlfZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGREb21MaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbXNpZScpICE9IC0xICYmIGRvY3VtZW50LmFsbCkge1xuICAgICAgICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKGVsLCBzdG9wX292ZXJsYXlfZXZlbnRzW2V2XSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuY2xpY2spIHtcbiAgICAgIHBhbmVzLm92ZXJsYXlNb3VzZVRhcmdldC5hcHBlbmRDaGlsZChvdmVybGF5LmVsKTtcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKG92ZXJsYXkuZWwsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBvcHRpb25zLmNsaWNrLmFwcGx5KG92ZXJsYXksIFtvdmVybGF5XSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKHRoaXMsICdyZWFkeScpO1xuICB9O1xuXG4gIG92ZXJsYXkuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm9qZWN0aW9uID0gdGhpcy5nZXRQcm9qZWN0aW9uKCksXG4gICAgICAgIHBpeGVsID0gcHJvamVjdGlvbi5mcm9tTGF0TG5nVG9EaXZQaXhlbChuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMubGF0LCBvcHRpb25zLmxuZykpO1xuXG4gICAgb3B0aW9ucy5ob3Jpem9udGFsT2Zmc2V0ID0gb3B0aW9ucy5ob3Jpem9udGFsT2Zmc2V0IHx8IDA7XG4gICAgb3B0aW9ucy52ZXJ0aWNhbE9mZnNldCA9IG9wdGlvbnMudmVydGljYWxPZmZzZXQgfHwgMDtcblxuICAgIHZhciBlbCA9IG92ZXJsYXkuZWwsXG4gICAgICAgIGNvbnRlbnQgPSBlbC5jaGlsZHJlblswXSxcbiAgICAgICAgY29udGVudF9oZWlnaHQgPSBjb250ZW50LmNsaWVudEhlaWdodCxcbiAgICAgICAgY29udGVudF93aWR0aCA9IGNvbnRlbnQuY2xpZW50V2lkdGg7XG5cbiAgICBzd2l0Y2ggKG9wdGlvbnMudmVydGljYWxBbGlnbikge1xuICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgZWwuc3R5bGUudG9wID0gKHBpeGVsLnkgLSBjb250ZW50X2hlaWdodCArIG9wdGlvbnMudmVydGljYWxPZmZzZXQpICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgY2FzZSAnbWlkZGxlJzpcbiAgICAgICAgZWwuc3R5bGUudG9wID0gKHBpeGVsLnkgLSAoY29udGVudF9oZWlnaHQgLyAyKSArIG9wdGlvbnMudmVydGljYWxPZmZzZXQpICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICBlbC5zdHlsZS50b3AgPSAocGl4ZWwueSArIG9wdGlvbnMudmVydGljYWxPZmZzZXQpICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgc3dpdGNoIChvcHRpb25zLmhvcml6b250YWxBbGlnbikge1xuICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIGVsLnN0eWxlLmxlZnQgPSAocGl4ZWwueCAtIGNvbnRlbnRfd2lkdGggKyBvcHRpb25zLmhvcml6b250YWxPZmZzZXQpICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgZWwuc3R5bGUubGVmdCA9IChwaXhlbC54IC0gKGNvbnRlbnRfd2lkdGggLyAyKSArIG9wdGlvbnMuaG9yaXpvbnRhbE9mZnNldCkgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgZWwuc3R5bGUubGVmdCA9IChwaXhlbC54ICsgb3B0aW9ucy5ob3Jpem9udGFsT2Zmc2V0KSArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGVsLnN0eWxlLmRpc3BsYXkgPSBhdXRvX3Nob3cgPyAnYmxvY2snIDogJ25vbmUnO1xuXG4gICAgaWYgKCFhdXRvX3Nob3cpIHtcbiAgICAgIG9wdGlvbnMuc2hvdy5hcHBseSh0aGlzLCBbZWxdKTtcbiAgICB9XG4gIH07XG5cbiAgb3ZlcmxheS5vblJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbCA9IG92ZXJsYXkuZWw7XG5cbiAgICBpZiAob3B0aW9ucy5yZW1vdmUpIHtcbiAgICAgIG9wdGlvbnMucmVtb3ZlLmFwcGx5KHRoaXMsIFtlbF0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG92ZXJsYXkuZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdmVybGF5LmVsKTtcbiAgICAgIG92ZXJsYXkuZWwgPSBudWxsO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLm92ZXJsYXlzLnB1c2gob3ZlcmxheSk7XG4gIHJldHVybiBvdmVybGF5O1xufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZU92ZXJsYXkgPSBmdW5jdGlvbihvdmVybGF5KSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdmVybGF5cy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLm92ZXJsYXlzW2ldID09PSBvdmVybGF5KSB7XG4gICAgICB0aGlzLm92ZXJsYXlzW2ldLnNldE1hcChudWxsKTtcbiAgICAgIHRoaXMub3ZlcmxheXMuc3BsaWNlKGksIDEpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVPdmVybGF5cyA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMCwgaXRlbTsgaXRlbSA9IHRoaXMub3ZlcmxheXNbaV07IGkrKykge1xuICAgIGl0ZW0uc2V0TWFwKG51bGwpO1xuICB9XG5cbiAgdGhpcy5vdmVybGF5cyA9IFtdO1xufTtcblxuR01hcHMucHJvdG90eXBlLmRyYXdQb2x5bGluZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHBhdGggPSBbXSxcbiAgICAgIHBvaW50cyA9IG9wdGlvbnMucGF0aDtcblxuICBpZiAocG9pbnRzLmxlbmd0aCkge1xuICAgIGlmIChwb2ludHNbMF1bMF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0aCA9IHBvaW50cztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGF0bG5nOyBsYXRsbmcgPSBwb2ludHNbaV07IGkrKykge1xuICAgICAgICBwYXRoLnB1c2gobmV3IGdvb2dsZS5tYXBzLkxhdExuZyhsYXRsbmdbMF0sIGxhdGxuZ1sxXSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZhciBwb2x5bGluZV9vcHRpb25zID0ge1xuICAgIG1hcDogdGhpcy5tYXAsXG4gICAgcGF0aDogcGF0aCxcbiAgICBzdHJva2VDb2xvcjogb3B0aW9ucy5zdHJva2VDb2xvcixcbiAgICBzdHJva2VPcGFjaXR5OiBvcHRpb25zLnN0cm9rZU9wYWNpdHksXG4gICAgc3Ryb2tlV2VpZ2h0OiBvcHRpb25zLnN0cm9rZVdlaWdodCxcbiAgICBnZW9kZXNpYzogb3B0aW9ucy5nZW9kZXNpYyxcbiAgICBjbGlja2FibGU6IHRydWUsXG4gICAgZWRpdGFibGU6IGZhbHNlLFxuICAgIHZpc2libGU6IHRydWVcbiAgfTtcblxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImNsaWNrYWJsZVwiKSkge1xuICAgIHBvbHlsaW5lX29wdGlvbnMuY2xpY2thYmxlID0gb3B0aW9ucy5jbGlja2FibGU7XG4gIH1cblxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImVkaXRhYmxlXCIpKSB7XG4gICAgcG9seWxpbmVfb3B0aW9ucy5lZGl0YWJsZSA9IG9wdGlvbnMuZWRpdGFibGU7XG4gIH1cblxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImljb25zXCIpKSB7XG4gICAgcG9seWxpbmVfb3B0aW9ucy5pY29ucyA9IG9wdGlvbnMuaWNvbnM7XG4gIH1cblxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcInpJbmRleFwiKSkge1xuICAgIHBvbHlsaW5lX29wdGlvbnMuekluZGV4ID0gb3B0aW9ucy56SW5kZXg7XG4gIH1cblxuICB2YXIgcG9seWxpbmUgPSBuZXcgZ29vZ2xlLm1hcHMuUG9seWxpbmUocG9seWxpbmVfb3B0aW9ucyk7XG5cbiAgdmFyIHBvbHlsaW5lX2V2ZW50cyA9IFsnY2xpY2snLCAnZGJsY2xpY2snLCAnbW91c2Vkb3duJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnbW91c2V1cCcsICdyaWdodGNsaWNrJ107XG5cbiAgZm9yICh2YXIgZXYgPSAwOyBldiA8IHBvbHlsaW5lX2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkocG9seWxpbmUsIHBvbHlsaW5lX2V2ZW50c1tldl0pO1xuICB9XG5cbiAgdGhpcy5wb2x5bGluZXMucHVzaChwb2x5bGluZSk7XG5cbiAgR01hcHMuZmlyZSgncG9seWxpbmVfYWRkZWQnLCBwb2x5bGluZSwgdGhpcyk7XG5cbiAgcmV0dXJuIHBvbHlsaW5lO1xufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZVBvbHlsaW5lID0gZnVuY3Rpb24ocG9seWxpbmUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvbHlsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLnBvbHlsaW5lc1tpXSA9PT0gcG9seWxpbmUpIHtcbiAgICAgIHRoaXMucG9seWxpbmVzW2ldLnNldE1hcChudWxsKTtcbiAgICAgIHRoaXMucG9seWxpbmVzLnNwbGljZShpLCAxKTtcblxuICAgICAgR01hcHMuZmlyZSgncG9seWxpbmVfcmVtb3ZlZCcsIHBvbHlsaW5lLCB0aGlzKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlUG9seWxpbmVzID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwLCBpdGVtOyBpdGVtID0gdGhpcy5wb2x5bGluZXNbaV07IGkrKykge1xuICAgIGl0ZW0uc2V0TWFwKG51bGwpO1xuICB9XG5cbiAgdGhpcy5wb2x5bGluZXMgPSBbXTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3Q2lyY2xlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBvcHRpb25zID0gIGV4dGVuZF9vYmplY3Qoe1xuICAgIG1hcDogdGhpcy5tYXAsXG4gICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMubGF0LCBvcHRpb25zLmxuZylcbiAgfSwgb3B0aW9ucyk7XG5cbiAgZGVsZXRlIG9wdGlvbnMubGF0O1xuICBkZWxldGUgb3B0aW9ucy5sbmc7XG5cbiAgdmFyIHBvbHlnb24gPSBuZXcgZ29vZ2xlLm1hcHMuQ2lyY2xlKG9wdGlvbnMpLFxuICAgICAgcG9seWdvbl9ldmVudHMgPSBbJ2NsaWNrJywgJ2RibGNsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJywgJ21vdXNldXAnLCAncmlnaHRjbGljayddO1xuXG4gIGZvciAodmFyIGV2ID0gMDsgZXYgPCBwb2x5Z29uX2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkocG9seWdvbiwgcG9seWdvbl9ldmVudHNbZXZdKTtcbiAgfVxuXG4gIHRoaXMucG9seWdvbnMucHVzaChwb2x5Z29uKTtcblxuICByZXR1cm4gcG9seWdvbjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3UmVjdGFuZ2xlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBvcHRpb25zID0gZXh0ZW5kX29iamVjdCh7XG4gICAgbWFwOiB0aGlzLm1hcFxuICB9LCBvcHRpb25zKTtcblxuICB2YXIgbGF0TG5nQm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcyhcbiAgICBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMuYm91bmRzWzBdWzBdLCBvcHRpb25zLmJvdW5kc1swXVsxXSksXG4gICAgbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmJvdW5kc1sxXVswXSwgb3B0aW9ucy5ib3VuZHNbMV1bMV0pXG4gICk7XG5cbiAgb3B0aW9ucy5ib3VuZHMgPSBsYXRMbmdCb3VuZHM7XG5cbiAgdmFyIHBvbHlnb24gPSBuZXcgZ29vZ2xlLm1hcHMuUmVjdGFuZ2xlKG9wdGlvbnMpLFxuICAgICAgcG9seWdvbl9ldmVudHMgPSBbJ2NsaWNrJywgJ2RibGNsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJywgJ21vdXNldXAnLCAncmlnaHRjbGljayddO1xuXG4gIGZvciAodmFyIGV2ID0gMDsgZXYgPCBwb2x5Z29uX2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgW2VdKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkocG9seWdvbiwgcG9seWdvbl9ldmVudHNbZXZdKTtcbiAgfVxuXG4gIHRoaXMucG9seWdvbnMucHVzaChwb2x5Z29uKTtcblxuICByZXR1cm4gcG9seWdvbjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3UG9seWdvbiA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHVzZUdlb0pTT04gPSBmYWxzZTtcblxuICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KFwidXNlR2VvSlNPTlwiKSkge1xuICAgIHVzZUdlb0pTT04gPSBvcHRpb25zLnVzZUdlb0pTT047XG4gIH1cblxuICBkZWxldGUgb3B0aW9ucy51c2VHZW9KU09OO1xuXG4gIG9wdGlvbnMgPSBleHRlbmRfb2JqZWN0KHtcbiAgICBtYXA6IHRoaXMubWFwXG4gIH0sIG9wdGlvbnMpO1xuXG4gIGlmICh1c2VHZW9KU09OID09IGZhbHNlKSB7XG4gICAgb3B0aW9ucy5wYXRocyA9IFtvcHRpb25zLnBhdGhzLnNsaWNlKDApXTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBpZiAob3B0aW9ucy5wYXRoc1swXS5sZW5ndGggPiAwKSB7XG4gICAgICBvcHRpb25zLnBhdGhzID0gYXJyYXlfZmxhdChhcnJheV9tYXAob3B0aW9ucy5wYXRocywgYXJyYXlUb0xhdExuZywgdXNlR2VvSlNPTikpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBwb2x5Z29uID0gbmV3IGdvb2dsZS5tYXBzLlBvbHlnb24ob3B0aW9ucyksXG4gICAgICBwb2x5Z29uX2V2ZW50cyA9IFsnY2xpY2snLCAnZGJsY2xpY2snLCAnbW91c2Vkb3duJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnbW91c2V1cCcsICdyaWdodGNsaWNrJ107XG5cbiAgZm9yICh2YXIgZXYgPSAwOyBldiA8IHBvbHlnb25fZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KShwb2x5Z29uLCBwb2x5Z29uX2V2ZW50c1tldl0pO1xuICB9XG5cbiAgdGhpcy5wb2x5Z29ucy5wdXNoKHBvbHlnb24pO1xuXG4gIEdNYXBzLmZpcmUoJ3BvbHlnb25fYWRkZWQnLCBwb2x5Z29uLCB0aGlzKTtcblxuICByZXR1cm4gcG9seWdvbjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVQb2x5Z29uID0gZnVuY3Rpb24ocG9seWdvbikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9seWdvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5wb2x5Z29uc1tpXSA9PT0gcG9seWdvbikge1xuICAgICAgdGhpcy5wb2x5Z29uc1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICB0aGlzLnBvbHlnb25zLnNwbGljZShpLCAxKTtcblxuICAgICAgR01hcHMuZmlyZSgncG9seWdvbl9yZW1vdmVkJywgcG9seWdvbiwgdGhpcyk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZVBvbHlnb25zID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwLCBpdGVtOyBpdGVtID0gdGhpcy5wb2x5Z29uc1tpXTsgaSsrKSB7XG4gICAgaXRlbS5zZXRNYXAobnVsbCk7XG4gIH1cblxuICB0aGlzLnBvbHlnb25zID0gW107XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZ2V0RnJvbUZ1c2lvblRhYmxlcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGV2ZW50cyA9IG9wdGlvbnMuZXZlbnRzO1xuXG4gIGRlbGV0ZSBvcHRpb25zLmV2ZW50cztcblxuICB2YXIgZnVzaW9uX3RhYmxlc19vcHRpb25zID0gb3B0aW9ucyxcbiAgICAgIGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLkZ1c2lvblRhYmxlc0xheWVyKGZ1c2lvbl90YWJsZXNfb3B0aW9ucyk7XG5cbiAgZm9yICh2YXIgZXYgaW4gZXZlbnRzKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGV2ZW50c1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgfSk7XG4gICAgfSkobGF5ZXIsIGV2KTtcbiAgfVxuXG4gIHRoaXMubGF5ZXJzLnB1c2gobGF5ZXIpO1xuXG4gIHJldHVybiBsYXllcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5sb2FkRnJvbUZ1c2lvblRhYmxlcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGxheWVyID0gdGhpcy5nZXRGcm9tRnVzaW9uVGFibGVzKG9wdGlvbnMpO1xuICBsYXllci5zZXRNYXAodGhpcy5tYXApO1xuXG4gIHJldHVybiBsYXllcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5nZXRGcm9tS01MID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgdXJsID0gb3B0aW9ucy51cmwsXG4gICAgICBldmVudHMgPSBvcHRpb25zLmV2ZW50cztcblxuICBkZWxldGUgb3B0aW9ucy51cmw7XG4gIGRlbGV0ZSBvcHRpb25zLmV2ZW50cztcblxuICB2YXIga21sX29wdGlvbnMgPSBvcHRpb25zLFxuICAgICAgbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuS21sTGF5ZXIodXJsLCBrbWxfb3B0aW9ucyk7XG5cbiAgZm9yICh2YXIgZXYgaW4gZXZlbnRzKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGV2ZW50c1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgfSk7XG4gICAgfSkobGF5ZXIsIGV2KTtcbiAgfVxuXG4gIHRoaXMubGF5ZXJzLnB1c2gobGF5ZXIpO1xuXG4gIHJldHVybiBsYXllcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5sb2FkRnJvbUtNTCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGxheWVyID0gdGhpcy5nZXRGcm9tS01MKG9wdGlvbnMpO1xuICBsYXllci5zZXRNYXAodGhpcy5tYXApO1xuXG4gIHJldHVybiBsYXllcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRMYXllciA9IGZ1bmN0aW9uKGxheWVyTmFtZSwgb3B0aW9ucykge1xuICAvL3ZhciBkZWZhdWx0X2xheWVycyA9IFsnd2VhdGhlcicsICdjbG91ZHMnLCAndHJhZmZpYycsICd0cmFuc2l0JywgJ2JpY3ljbGluZycsICdwYW5vcmFtaW8nLCAncGxhY2VzJ107XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgbGF5ZXI7XG5cbiAgc3dpdGNoKGxheWVyTmFtZSkge1xuICAgIGNhc2UgJ3dlYXRoZXInOiB0aGlzLnNpbmdsZUxheWVycy53ZWF0aGVyID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMud2VhdGhlci5XZWF0aGVyTGF5ZXIoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2Nsb3Vkcyc6IHRoaXMuc2luZ2xlTGF5ZXJzLmNsb3VkcyA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLndlYXRoZXIuQ2xvdWRMYXllcigpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndHJhZmZpYyc6IHRoaXMuc2luZ2xlTGF5ZXJzLnRyYWZmaWMgPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy5UcmFmZmljTGF5ZXIoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3RyYW5zaXQnOiB0aGlzLnNpbmdsZUxheWVycy50cmFuc2l0ID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuVHJhbnNpdExheWVyKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdiaWN5Y2xpbmcnOiB0aGlzLnNpbmdsZUxheWVycy5iaWN5Y2xpbmcgPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy5CaWN5Y2xpbmdMYXllcigpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncGFub3JhbWlvJzpcbiAgICAgICAgdGhpcy5zaW5nbGVMYXllcnMucGFub3JhbWlvID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMucGFub3JhbWlvLlBhbm9yYW1pb0xheWVyKCk7XG4gICAgICAgIGxheWVyLnNldFRhZyhvcHRpb25zLmZpbHRlcik7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmZpbHRlcjtcblxuICAgICAgICAvL2NsaWNrIGV2ZW50XG4gICAgICAgIGlmIChvcHRpb25zLmNsaWNrKSB7XG4gICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobGF5ZXIsICdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBvcHRpb25zLmNsaWNrKGV2ZW50KTtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLmNsaWNrO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BsYWNlcyc6XG4gICAgICAgIHRoaXMuc2luZ2xlTGF5ZXJzLnBsYWNlcyA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5QbGFjZXNTZXJ2aWNlKHRoaXMubWFwKTtcblxuICAgICAgICAvL3NlYXJjaCwgbmVhcmJ5U2VhcmNoLCByYWRhclNlYXJjaCBjYWxsYmFjaywgQm90aCBhcmUgdGhlIHNhbWVcbiAgICAgICAgaWYgKG9wdGlvbnMuc2VhcmNoIHx8IG9wdGlvbnMubmVhcmJ5U2VhcmNoIHx8IG9wdGlvbnMucmFkYXJTZWFyY2gpIHtcbiAgICAgICAgICB2YXIgcGxhY2VTZWFyY2hSZXF1ZXN0ICA9IHtcbiAgICAgICAgICAgIGJvdW5kcyA6IG9wdGlvbnMuYm91bmRzIHx8IG51bGwsXG4gICAgICAgICAgICBrZXl3b3JkIDogb3B0aW9ucy5rZXl3b3JkIHx8IG51bGwsXG4gICAgICAgICAgICBsb2NhdGlvbiA6IG9wdGlvbnMubG9jYXRpb24gfHwgbnVsbCxcbiAgICAgICAgICAgIG5hbWUgOiBvcHRpb25zLm5hbWUgfHwgbnVsbCxcbiAgICAgICAgICAgIHJhZGl1cyA6IG9wdGlvbnMucmFkaXVzIHx8IG51bGwsXG4gICAgICAgICAgICByYW5rQnkgOiBvcHRpb25zLnJhbmtCeSB8fCBudWxsLFxuICAgICAgICAgICAgdHlwZXMgOiBvcHRpb25zLnR5cGVzIHx8IG51bGxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKG9wdGlvbnMucmFkYXJTZWFyY2gpIHtcbiAgICAgICAgICAgIGxheWVyLnJhZGFyU2VhcmNoKHBsYWNlU2VhcmNoUmVxdWVzdCwgb3B0aW9ucy5yYWRhclNlYXJjaCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMuc2VhcmNoKSB7XG4gICAgICAgICAgICBsYXllci5zZWFyY2gocGxhY2VTZWFyY2hSZXF1ZXN0LCBvcHRpb25zLnNlYXJjaCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMubmVhcmJ5U2VhcmNoKSB7XG4gICAgICAgICAgICBsYXllci5uZWFyYnlTZWFyY2gocGxhY2VTZWFyY2hSZXF1ZXN0LCBvcHRpb25zLm5lYXJieVNlYXJjaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy90ZXh0U2VhcmNoIGNhbGxiYWNrXG4gICAgICAgIGlmIChvcHRpb25zLnRleHRTZWFyY2gpIHtcbiAgICAgICAgICB2YXIgdGV4dFNlYXJjaFJlcXVlc3QgID0ge1xuICAgICAgICAgICAgYm91bmRzIDogb3B0aW9ucy5ib3VuZHMgfHwgbnVsbCxcbiAgICAgICAgICAgIGxvY2F0aW9uIDogb3B0aW9ucy5sb2NhdGlvbiB8fCBudWxsLFxuICAgICAgICAgICAgcXVlcnkgOiBvcHRpb25zLnF1ZXJ5IHx8IG51bGwsXG4gICAgICAgICAgICByYWRpdXMgOiBvcHRpb25zLnJhZGl1cyB8fCBudWxsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGxheWVyLnRleHRTZWFyY2godGV4dFNlYXJjaFJlcXVlc3QsIG9wdGlvbnMudGV4dFNlYXJjaCk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIGxheWVyLnNldE9wdGlvbnMgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGF5ZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsYXllci5zZXRNYXAgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGF5ZXIuc2V0TWFwKHRoaXMubWFwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGF5ZXI7XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVMYXllciA9IGZ1bmN0aW9uKGxheWVyKSB7XG4gIGlmICh0eXBlb2YobGF5ZXIpID09IFwic3RyaW5nXCIgJiYgdGhpcy5zaW5nbGVMYXllcnNbbGF5ZXJdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgdGhpcy5zaW5nbGVMYXllcnNbbGF5ZXJdLnNldE1hcChudWxsKTtcblxuICAgICBkZWxldGUgdGhpcy5zaW5nbGVMYXllcnNbbGF5ZXJdO1xuICB9XG4gIGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmxheWVyc1tpXSA9PT0gbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5sYXllcnNbaV0uc2V0TWFwKG51bGwpO1xuICAgICAgICB0aGlzLmxheWVycy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG52YXIgdHJhdmVsTW9kZSwgdW5pdFN5c3RlbTtcblxuR01hcHMucHJvdG90eXBlLmdldFJvdXRlcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgc3dpdGNoIChvcHRpb25zLnRyYXZlbE1vZGUpIHtcbiAgICBjYXNlICdiaWN5Y2xpbmcnOlxuICAgICAgdHJhdmVsTW9kZSA9IGdvb2dsZS5tYXBzLlRyYXZlbE1vZGUuQklDWUNMSU5HO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndHJhbnNpdCc6XG4gICAgICB0cmF2ZWxNb2RlID0gZ29vZ2xlLm1hcHMuVHJhdmVsTW9kZS5UUkFOU0lUO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnZHJpdmluZyc6XG4gICAgICB0cmF2ZWxNb2RlID0gZ29vZ2xlLm1hcHMuVHJhdmVsTW9kZS5EUklWSU5HO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRyYXZlbE1vZGUgPSBnb29nbGUubWFwcy5UcmF2ZWxNb2RlLldBTEtJTkc7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGlmIChvcHRpb25zLnVuaXRTeXN0ZW0gPT09ICdpbXBlcmlhbCcpIHtcbiAgICB1bml0U3lzdGVtID0gZ29vZ2xlLm1hcHMuVW5pdFN5c3RlbS5JTVBFUklBTDtcbiAgfVxuICBlbHNlIHtcbiAgICB1bml0U3lzdGVtID0gZ29vZ2xlLm1hcHMuVW5pdFN5c3RlbS5NRVRSSUM7XG4gIH1cblxuICB2YXIgYmFzZV9vcHRpb25zID0ge1xuICAgICAgICBhdm9pZEhpZ2h3YXlzOiBmYWxzZSxcbiAgICAgICAgYXZvaWRUb2xsczogZmFsc2UsXG4gICAgICAgIG9wdGltaXplV2F5cG9pbnRzOiBmYWxzZSxcbiAgICAgICAgd2F5cG9pbnRzOiBbXVxuICAgICAgfSxcbiAgICAgIHJlcXVlc3Rfb3B0aW9ucyA9ICBleHRlbmRfb2JqZWN0KGJhc2Vfb3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgcmVxdWVzdF9vcHRpb25zLm9yaWdpbiA9IC9zdHJpbmcvLnRlc3QodHlwZW9mIG9wdGlvbnMub3JpZ2luKSA/IG9wdGlvbnMub3JpZ2luIDogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLm9yaWdpblswXSwgb3B0aW9ucy5vcmlnaW5bMV0pO1xuICByZXF1ZXN0X29wdGlvbnMuZGVzdGluYXRpb24gPSAvc3RyaW5nLy50ZXN0KHR5cGVvZiBvcHRpb25zLmRlc3RpbmF0aW9uKSA/IG9wdGlvbnMuZGVzdGluYXRpb24gOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMuZGVzdGluYXRpb25bMF0sIG9wdGlvbnMuZGVzdGluYXRpb25bMV0pO1xuICByZXF1ZXN0X29wdGlvbnMudHJhdmVsTW9kZSA9IHRyYXZlbE1vZGU7XG4gIHJlcXVlc3Rfb3B0aW9ucy51bml0U3lzdGVtID0gdW5pdFN5c3RlbTtcblxuICBkZWxldGUgcmVxdWVzdF9vcHRpb25zLmNhbGxiYWNrO1xuICBkZWxldGUgcmVxdWVzdF9vcHRpb25zLmVycm9yO1xuXG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIHNlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMuRGlyZWN0aW9uc1NlcnZpY2UoKTtcblxuICBzZXJ2aWNlLnJvdXRlKHJlcXVlc3Rfb3B0aW9ucywgZnVuY3Rpb24ocmVzdWx0LCBzdGF0dXMpIHtcbiAgICBpZiAoc3RhdHVzID09PSBnb29nbGUubWFwcy5EaXJlY3Rpb25zU3RhdHVzLk9LKSB7XG4gICAgICBmb3IgKHZhciByIGluIHJlc3VsdC5yb3V0ZXMpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5yb3V0ZXMuaGFzT3duUHJvcGVydHkocikpIHtcbiAgICAgICAgICBzZWxmLnJvdXRlcy5wdXNoKHJlc3VsdC5yb3V0ZXNbcl0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmNhbGxiYWNrKSB7XG4gICAgICAgIG9wdGlvbnMuY2FsbGJhY2soc2VsZi5yb3V0ZXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgIG9wdGlvbnMuZXJyb3IocmVzdWx0LCBzdGF0dXMpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlUm91dGVzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucm91dGVzID0gW107XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZ2V0RWxldmF0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IGV4dGVuZF9vYmplY3Qoe1xuICAgIGxvY2F0aW9uczogW10sXG4gICAgcGF0aCA6IGZhbHNlLFxuICAgIHNhbXBsZXMgOiAyNTZcbiAgfSwgb3B0aW9ucyk7XG5cbiAgaWYgKG9wdGlvbnMubG9jYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnNbMF0ubGVuZ3RoID4gMCkge1xuICAgICAgb3B0aW9ucy5sb2NhdGlvbnMgPSBhcnJheV9mbGF0KGFycmF5X21hcChbb3B0aW9ucy5sb2NhdGlvbnNdLCBhcnJheVRvTGF0TG5nLCAgZmFsc2UpKTtcbiAgICB9XG4gIH1cblxuICB2YXIgY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrO1xuICBkZWxldGUgb3B0aW9ucy5jYWxsYmFjaztcblxuICB2YXIgc2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5FbGV2YXRpb25TZXJ2aWNlKCk7XG5cbiAgLy9sb2NhdGlvbiByZXF1ZXN0XG4gIGlmICghb3B0aW9ucy5wYXRoKSB7XG4gICAgZGVsZXRlIG9wdGlvbnMucGF0aDtcbiAgICBkZWxldGUgb3B0aW9ucy5zYW1wbGVzO1xuXG4gICAgc2VydmljZS5nZXRFbGV2YXRpb25Gb3JMb2NhdGlvbnMob3B0aW9ucywgZnVuY3Rpb24ocmVzdWx0LCBzdGF0dXMpIHtcbiAgICAgIGlmIChjYWxsYmFjayAmJiB0eXBlb2YoY2FsbGJhY2spID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0LCBzdGF0dXMpO1xuICAgICAgfVxuICAgIH0pO1xuICAvL3BhdGggcmVxdWVzdFxuICB9IGVsc2Uge1xuICAgIHZhciBwYXRoUmVxdWVzdCA9IHtcbiAgICAgIHBhdGggOiBvcHRpb25zLmxvY2F0aW9ucyxcbiAgICAgIHNhbXBsZXMgOiBvcHRpb25zLnNhbXBsZXNcbiAgICB9O1xuXG4gICAgc2VydmljZS5nZXRFbGV2YXRpb25BbG9uZ1BhdGgocGF0aFJlcXVlc3QsIGZ1bmN0aW9uKHJlc3VsdCwgc3RhdHVzKSB7XG4gICAgIGlmIChjYWxsYmFjayAmJiB0eXBlb2YoY2FsbGJhY2spID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0LCBzdGF0dXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuY2xlYW5Sb3V0ZSA9IEdNYXBzLnByb3RvdHlwZS5yZW1vdmVQb2x5bGluZXM7XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3Um91dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB0aGlzLmdldFJvdXRlcyh7XG4gICAgb3JpZ2luOiBvcHRpb25zLm9yaWdpbixcbiAgICBkZXN0aW5hdGlvbjogb3B0aW9ucy5kZXN0aW5hdGlvbixcbiAgICB0cmF2ZWxNb2RlOiBvcHRpb25zLnRyYXZlbE1vZGUsXG4gICAgd2F5cG9pbnRzOiBvcHRpb25zLndheXBvaW50cyxcbiAgICB1bml0U3lzdGVtOiBvcHRpb25zLnVuaXRTeXN0ZW0sXG4gICAgZXJyb3I6IG9wdGlvbnMuZXJyb3IsXG4gICAgY2FsbGJhY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHBvbHlsaW5lX29wdGlvbnMgPSB7XG4gICAgICAgICAgcGF0aDogZVtlLmxlbmd0aCAtIDFdLm92ZXJ2aWV3X3BhdGgsXG4gICAgICAgICAgc3Ryb2tlQ29sb3I6IG9wdGlvbnMuc3Ryb2tlQ29sb3IsXG4gICAgICAgICAgc3Ryb2tlT3BhY2l0eTogb3B0aW9ucy5zdHJva2VPcGFjaXR5LFxuICAgICAgICAgIHN0cm9rZVdlaWdodDogb3B0aW9ucy5zdHJva2VXZWlnaHRcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImljb25zXCIpKSB7XG4gICAgICAgICAgcG9seWxpbmVfb3B0aW9ucy5pY29ucyA9IG9wdGlvbnMuaWNvbnM7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLmRyYXdQb2x5bGluZShwb2x5bGluZV9vcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcHRpb25zLmNhbGxiYWNrKSB7XG4gICAgICAgICAgb3B0aW9ucy5jYWxsYmFjayhlW2UubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS50cmF2ZWxSb3V0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMub3JpZ2luICYmIG9wdGlvbnMuZGVzdGluYXRpb24pIHtcbiAgICB0aGlzLmdldFJvdXRlcyh7XG4gICAgICBvcmlnaW46IG9wdGlvbnMub3JpZ2luLFxuICAgICAgZGVzdGluYXRpb246IG9wdGlvbnMuZGVzdGluYXRpb24sXG4gICAgICB0cmF2ZWxNb2RlOiBvcHRpb25zLnRyYXZlbE1vZGUsXG4gICAgICB3YXlwb2ludHMgOiBvcHRpb25zLndheXBvaW50cyxcbiAgICAgIHVuaXRTeXN0ZW06IG9wdGlvbnMudW5pdFN5c3RlbSxcbiAgICAgIGVycm9yOiBvcHRpb25zLmVycm9yLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy9zdGFydCBjYWxsYmFja1xuICAgICAgICBpZiAoZS5sZW5ndGggPiAwICYmIG9wdGlvbnMuc3RhcnQpIHtcbiAgICAgICAgICBvcHRpb25zLnN0YXJ0KGVbZS5sZW5ndGggLSAxXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL3N0ZXAgY2FsbGJhY2tcbiAgICAgICAgaWYgKGUubGVuZ3RoID4gMCAmJiBvcHRpb25zLnN0ZXApIHtcbiAgICAgICAgICB2YXIgcm91dGUgPSBlW2UubGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKHJvdXRlLmxlZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHN0ZXBzID0gcm91dGUubGVnc1swXS5zdGVwcztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBzdGVwOyBzdGVwID0gc3RlcHNbaV07IGkrKykge1xuICAgICAgICAgICAgICBzdGVwLnN0ZXBfbnVtYmVyID0gaTtcbiAgICAgICAgICAgICAgb3B0aW9ucy5zdGVwKHN0ZXAsIChyb3V0ZS5sZWdzWzBdLnN0ZXBzLmxlbmd0aCAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2VuZCBjYWxsYmFja1xuICAgICAgICBpZiAoZS5sZW5ndGggPiAwICYmIG9wdGlvbnMuZW5kKSB7XG4gICAgICAgICAgIG9wdGlvbnMuZW5kKGVbZS5sZW5ndGggLSAxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBlbHNlIGlmIChvcHRpb25zLnJvdXRlKSB7XG4gICAgaWYgKG9wdGlvbnMucm91dGUubGVncy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3RlcHMgPSBvcHRpb25zLnJvdXRlLmxlZ3NbMF0uc3RlcHM7XG4gICAgICBmb3IgKHZhciBpID0gMCwgc3RlcDsgc3RlcCA9IHN0ZXBzW2ldOyBpKyspIHtcbiAgICAgICAgc3RlcC5zdGVwX251bWJlciA9IGk7XG4gICAgICAgIG9wdGlvbnMuc3RlcChzdGVwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5kcmF3U3RlcHBlZFJvdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIFxuICBpZiAob3B0aW9ucy5vcmlnaW4gJiYgb3B0aW9ucy5kZXN0aW5hdGlvbikge1xuICAgIHRoaXMuZ2V0Um91dGVzKHtcbiAgICAgIG9yaWdpbjogb3B0aW9ucy5vcmlnaW4sXG4gICAgICBkZXN0aW5hdGlvbjogb3B0aW9ucy5kZXN0aW5hdGlvbixcbiAgICAgIHRyYXZlbE1vZGU6IG9wdGlvbnMudHJhdmVsTW9kZSxcbiAgICAgIHdheXBvaW50cyA6IG9wdGlvbnMud2F5cG9pbnRzLFxuICAgICAgZXJyb3I6IG9wdGlvbnMuZXJyb3IsXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oZSkge1xuICAgICAgICAvL3N0YXJ0IGNhbGxiYWNrXG4gICAgICAgIGlmIChlLmxlbmd0aCA+IDAgJiYgb3B0aW9ucy5zdGFydCkge1xuICAgICAgICAgIG9wdGlvbnMuc3RhcnQoZVtlLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc3RlcCBjYWxsYmFja1xuICAgICAgICBpZiAoZS5sZW5ndGggPiAwICYmIG9wdGlvbnMuc3RlcCkge1xuICAgICAgICAgIHZhciByb3V0ZSA9IGVbZS5sZW5ndGggLSAxXTtcbiAgICAgICAgICBpZiAocm91dGUubGVncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgc3RlcHMgPSByb3V0ZS5sZWdzWzBdLnN0ZXBzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHN0ZXA7IHN0ZXAgPSBzdGVwc1tpXTsgaSsrKSB7XG4gICAgICAgICAgICAgIHN0ZXAuc3RlcF9udW1iZXIgPSBpO1xuICAgICAgICAgICAgICB2YXIgcG9seWxpbmVfb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBwYXRoOiBzdGVwLnBhdGgsXG4gICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IG9wdGlvbnMuc3Ryb2tlQ29sb3IsXG4gICAgICAgICAgICAgICAgc3Ryb2tlT3BhY2l0eTogb3B0aW9ucy5zdHJva2VPcGFjaXR5LFxuICAgICAgICAgICAgICAgIHN0cm9rZVdlaWdodDogb3B0aW9ucy5zdHJva2VXZWlnaHRcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImljb25zXCIpKSB7XG4gICAgICAgICAgICAgICAgcG9seWxpbmVfb3B0aW9ucy5pY29ucyA9IG9wdGlvbnMuaWNvbnM7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBzZWxmLmRyYXdQb2x5bGluZShwb2x5bGluZV9vcHRpb25zKTtcbiAgICAgICAgICAgICAgb3B0aW9ucy5zdGVwKHN0ZXAsIChyb3V0ZS5sZWdzWzBdLnN0ZXBzLmxlbmd0aCAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2VuZCBjYWxsYmFja1xuICAgICAgICBpZiAoZS5sZW5ndGggPiAwICYmIG9wdGlvbnMuZW5kKSB7XG4gICAgICAgICAgIG9wdGlvbnMuZW5kKGVbZS5sZW5ndGggLSAxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBlbHNlIGlmIChvcHRpb25zLnJvdXRlKSB7XG4gICAgaWYgKG9wdGlvbnMucm91dGUubGVncy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3RlcHMgPSBvcHRpb25zLnJvdXRlLmxlZ3NbMF0uc3RlcHM7XG4gICAgICBmb3IgKHZhciBpID0gMCwgc3RlcDsgc3RlcCA9IHN0ZXBzW2ldOyBpKyspIHtcbiAgICAgICAgc3RlcC5zdGVwX251bWJlciA9IGk7XG4gICAgICAgIHZhciBwb2x5bGluZV9vcHRpb25zID0ge1xuICAgICAgICAgIHBhdGg6IHN0ZXAucGF0aCxcbiAgICAgICAgICBzdHJva2VDb2xvcjogb3B0aW9ucy5zdHJva2VDb2xvcixcbiAgICAgICAgICBzdHJva2VPcGFjaXR5OiBvcHRpb25zLnN0cm9rZU9wYWNpdHksXG4gICAgICAgICAgc3Ryb2tlV2VpZ2h0OiBvcHRpb25zLnN0cm9rZVdlaWdodFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiaWNvbnNcIikpIHtcbiAgICAgICAgICBwb2x5bGluZV9vcHRpb25zLmljb25zID0gb3B0aW9ucy5pY29ucztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuZHJhd1BvbHlsaW5lKHBvbHlsaW5lX29wdGlvbnMpO1xuICAgICAgICBvcHRpb25zLnN0ZXAoc3RlcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5Sb3V0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdGhpcy5vcmlnaW4gPSBvcHRpb25zLm9yaWdpbjtcbiAgdGhpcy5kZXN0aW5hdGlvbiA9IG9wdGlvbnMuZGVzdGluYXRpb247XG4gIHRoaXMud2F5cG9pbnRzID0gb3B0aW9ucy53YXlwb2ludHM7XG5cbiAgdGhpcy5tYXAgPSBvcHRpb25zLm1hcDtcbiAgdGhpcy5yb3V0ZSA9IG9wdGlvbnMucm91dGU7XG4gIHRoaXMuc3RlcF9jb3VudCA9IDA7XG4gIHRoaXMuc3RlcHMgPSB0aGlzLnJvdXRlLmxlZ3NbMF0uc3RlcHM7XG4gIHRoaXMuc3RlcHNfbGVuZ3RoID0gdGhpcy5zdGVwcy5sZW5ndGg7XG5cbiAgdmFyIHBvbHlsaW5lX29wdGlvbnMgPSB7XG4gICAgcGF0aDogbmV3IGdvb2dsZS5tYXBzLk1WQ0FycmF5KCksXG4gICAgc3Ryb2tlQ29sb3I6IG9wdGlvbnMuc3Ryb2tlQ29sb3IsXG4gICAgc3Ryb2tlT3BhY2l0eTogb3B0aW9ucy5zdHJva2VPcGFjaXR5LFxuICAgIHN0cm9rZVdlaWdodDogb3B0aW9ucy5zdHJva2VXZWlnaHRcbiAgfTtcblxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImljb25zXCIpKSB7XG4gICAgcG9seWxpbmVfb3B0aW9ucy5pY29ucyA9IG9wdGlvbnMuaWNvbnM7XG4gIH1cblxuICB0aGlzLnBvbHlsaW5lID0gdGhpcy5tYXAuZHJhd1BvbHlsaW5lKHBvbHlsaW5lX29wdGlvbnMpLmdldFBhdGgoKTtcbn07XG5cbkdNYXBzLlJvdXRlLnByb3RvdHlwZS5nZXRSb3V0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHRoaXMubWFwLmdldFJvdXRlcyh7XG4gICAgb3JpZ2luIDogdGhpcy5vcmlnaW4sXG4gICAgZGVzdGluYXRpb24gOiB0aGlzLmRlc3RpbmF0aW9uLFxuICAgIHRyYXZlbE1vZGUgOiBvcHRpb25zLnRyYXZlbE1vZGUsXG4gICAgd2F5cG9pbnRzIDogdGhpcy53YXlwb2ludHMgfHwgW10sXG4gICAgZXJyb3I6IG9wdGlvbnMuZXJyb3IsXG4gICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucm91dGUgPSBlWzBdO1xuXG4gICAgICBpZiAob3B0aW9ucy5jYWxsYmFjaykge1xuICAgICAgICBvcHRpb25zLmNhbGxiYWNrLmNhbGwoc2VsZik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn07XG5cbkdNYXBzLlJvdXRlLnByb3RvdHlwZS5iYWNrID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnN0ZXBfY291bnQgPiAwKSB7XG4gICAgdGhpcy5zdGVwX2NvdW50LS07XG4gICAgdmFyIHBhdGggPSB0aGlzLnJvdXRlLmxlZ3NbMF0uc3RlcHNbdGhpcy5zdGVwX2NvdW50XS5wYXRoO1xuXG4gICAgZm9yICh2YXIgcCBpbiBwYXRoKXtcbiAgICAgIGlmIChwYXRoLmhhc093blByb3BlcnR5KHApKXtcbiAgICAgICAgdGhpcy5wb2x5bGluZS5wb3AoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLlJvdXRlLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnN0ZXBfY291bnQgPCB0aGlzLnN0ZXBzX2xlbmd0aCkge1xuICAgIHZhciBwYXRoID0gdGhpcy5yb3V0ZS5sZWdzWzBdLnN0ZXBzW3RoaXMuc3RlcF9jb3VudF0ucGF0aDtcblxuICAgIGZvciAodmFyIHAgaW4gcGF0aCl7XG4gICAgICBpZiAocGF0aC5oYXNPd25Qcm9wZXJ0eShwKSl7XG4gICAgICAgIHRoaXMucG9seWxpbmUucHVzaChwYXRoW3BdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zdGVwX2NvdW50Kys7XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5jaGVja0dlb2ZlbmNlID0gZnVuY3Rpb24obGF0LCBsbmcsIGZlbmNlKSB7XG4gIHJldHVybiBmZW5jZS5jb250YWluc0xhdExuZyhuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGxhdCwgbG5nKSk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuY2hlY2tNYXJrZXJHZW9mZW5jZSA9IGZ1bmN0aW9uKG1hcmtlciwgb3V0c2lkZV9jYWxsYmFjaykge1xuICBpZiAobWFya2VyLmZlbmNlcykge1xuICAgIGZvciAodmFyIGkgPSAwLCBmZW5jZTsgZmVuY2UgPSBtYXJrZXIuZmVuY2VzW2ldOyBpKyspIHtcbiAgICAgIHZhciBwb3MgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcbiAgICAgIGlmICghdGhpcy5jaGVja0dlb2ZlbmNlKHBvcy5sYXQoKSwgcG9zLmxuZygpLCBmZW5jZSkpIHtcbiAgICAgICAgb3V0c2lkZV9jYWxsYmFjayhtYXJrZXIsIGZlbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS50b0ltYWdlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgb3B0aW9ucyA9IG9wdGlvbnMgfHwge30sXG4gICAgICBzdGF0aWNfbWFwX29wdGlvbnMgPSB7fTtcblxuICBzdGF0aWNfbWFwX29wdGlvbnNbJ3NpemUnXSA9IG9wdGlvbnNbJ3NpemUnXSB8fCBbdGhpcy5lbC5jbGllbnRXaWR0aCwgdGhpcy5lbC5jbGllbnRIZWlnaHRdO1xuICBzdGF0aWNfbWFwX29wdGlvbnNbJ2xhdCddID0gdGhpcy5nZXRDZW50ZXIoKS5sYXQoKTtcbiAgc3RhdGljX21hcF9vcHRpb25zWydsbmcnXSA9IHRoaXMuZ2V0Q2VudGVyKCkubG5nKCk7XG5cbiAgaWYgKHRoaXMubWFya2Vycy5sZW5ndGggPiAwKSB7XG4gICAgc3RhdGljX21hcF9vcHRpb25zWydtYXJrZXJzJ10gPSBbXTtcbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgc3RhdGljX21hcF9vcHRpb25zWydtYXJrZXJzJ10ucHVzaCh7XG4gICAgICAgIGxhdDogdGhpcy5tYXJrZXJzW2ldLmdldFBvc2l0aW9uKCkubGF0KCksXG4gICAgICAgIGxuZzogdGhpcy5tYXJrZXJzW2ldLmdldFBvc2l0aW9uKCkubG5nKClcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLnBvbHlsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgdmFyIHBvbHlsaW5lID0gdGhpcy5wb2x5bGluZXNbMF07XG4gICAgXG4gICAgc3RhdGljX21hcF9vcHRpb25zWydwb2x5bGluZSddID0ge307XG4gICAgc3RhdGljX21hcF9vcHRpb25zWydwb2x5bGluZSddWydwYXRoJ10gPSBnb29nbGUubWFwcy5nZW9tZXRyeS5lbmNvZGluZy5lbmNvZGVQYXRoKHBvbHlsaW5lLmdldFBhdGgoKSk7XG4gICAgc3RhdGljX21hcF9vcHRpb25zWydwb2x5bGluZSddWydzdHJva2VDb2xvciddID0gcG9seWxpbmUuc3Ryb2tlQ29sb3JcbiAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ3BvbHlsaW5lJ11bJ3N0cm9rZU9wYWNpdHknXSA9IHBvbHlsaW5lLnN0cm9rZU9wYWNpdHlcbiAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ3BvbHlsaW5lJ11bJ3N0cm9rZVdlaWdodCddID0gcG9seWxpbmUuc3Ryb2tlV2VpZ2h0XG4gIH1cblxuICByZXR1cm4gR01hcHMuc3RhdGljTWFwVVJMKHN0YXRpY19tYXBfb3B0aW9ucyk7XG59O1xuXG5HTWFwcy5zdGF0aWNNYXBVUkwgPSBmdW5jdGlvbihvcHRpb25zKXtcbiAgdmFyIHBhcmFtZXRlcnMgPSBbXSxcbiAgICAgIGRhdGEsXG4gICAgICBzdGF0aWNfcm9vdCA9IChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JyA/ICdodHRwOicgOiBsb2NhdGlvbi5wcm90b2NvbCApICsgJy8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9zdGF0aWNtYXAnO1xuXG4gIGlmIChvcHRpb25zLnVybCkge1xuICAgIHN0YXRpY19yb290ID0gb3B0aW9ucy51cmw7XG4gICAgZGVsZXRlIG9wdGlvbnMudXJsO1xuICB9XG5cbiAgc3RhdGljX3Jvb3QgKz0gJz8nO1xuXG4gIHZhciBtYXJrZXJzID0gb3B0aW9ucy5tYXJrZXJzO1xuICBcbiAgZGVsZXRlIG9wdGlvbnMubWFya2VycztcblxuICBpZiAoIW1hcmtlcnMgJiYgb3B0aW9ucy5tYXJrZXIpIHtcbiAgICBtYXJrZXJzID0gW29wdGlvbnMubWFya2VyXTtcbiAgICBkZWxldGUgb3B0aW9ucy5tYXJrZXI7XG4gIH1cblxuICB2YXIgc3R5bGVzID0gb3B0aW9ucy5zdHlsZXM7XG5cbiAgZGVsZXRlIG9wdGlvbnMuc3R5bGVzO1xuXG4gIHZhciBwb2x5bGluZSA9IG9wdGlvbnMucG9seWxpbmU7XG4gIGRlbGV0ZSBvcHRpb25zLnBvbHlsaW5lO1xuXG4gIC8qKiBNYXAgb3B0aW9ucyAqKi9cbiAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XG4gICAgcGFyYW1ldGVycy5wdXNoKCdjZW50ZXI9JyArIG9wdGlvbnMuY2VudGVyKTtcbiAgICBkZWxldGUgb3B0aW9ucy5jZW50ZXI7XG4gIH1cbiAgZWxzZSBpZiAob3B0aW9ucy5hZGRyZXNzKSB7XG4gICAgcGFyYW1ldGVycy5wdXNoKCdjZW50ZXI9JyArIG9wdGlvbnMuYWRkcmVzcyk7XG4gICAgZGVsZXRlIG9wdGlvbnMuYWRkcmVzcztcbiAgfVxuICBlbHNlIGlmIChvcHRpb25zLmxhdCkge1xuICAgIHBhcmFtZXRlcnMucHVzaChbJ2NlbnRlcj0nLCBvcHRpb25zLmxhdCwgJywnLCBvcHRpb25zLmxuZ10uam9pbignJykpO1xuICAgIGRlbGV0ZSBvcHRpb25zLmxhdDtcbiAgICBkZWxldGUgb3B0aW9ucy5sbmc7XG4gIH1cbiAgZWxzZSBpZiAob3B0aW9ucy52aXNpYmxlKSB7XG4gICAgdmFyIHZpc2libGUgPSBlbmNvZGVVUkkob3B0aW9ucy52aXNpYmxlLmpvaW4oJ3wnKSk7XG4gICAgcGFyYW1ldGVycy5wdXNoKCd2aXNpYmxlPScgKyB2aXNpYmxlKTtcbiAgfVxuXG4gIHZhciBzaXplID0gb3B0aW9ucy5zaXplO1xuICBpZiAoc2l6ZSkge1xuICAgIGlmIChzaXplLmpvaW4pIHtcbiAgICAgIHNpemUgPSBzaXplLmpvaW4oJ3gnKTtcbiAgICB9XG4gICAgZGVsZXRlIG9wdGlvbnMuc2l6ZTtcbiAgfVxuICBlbHNlIHtcbiAgICBzaXplID0gJzYzMHgzMDAnO1xuICB9XG4gIHBhcmFtZXRlcnMucHVzaCgnc2l6ZT0nICsgc2l6ZSk7XG5cbiAgaWYgKCFvcHRpb25zLnpvb20gJiYgb3B0aW9ucy56b29tICE9PSBmYWxzZSkge1xuICAgIG9wdGlvbnMuem9vbSA9IDE1O1xuICB9XG5cbiAgdmFyIHNlbnNvciA9IG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ3NlbnNvcicpID8gISFvcHRpb25zLnNlbnNvciA6IHRydWU7XG4gIGRlbGV0ZSBvcHRpb25zLnNlbnNvcjtcbiAgcGFyYW1ldGVycy5wdXNoKCdzZW5zb3I9JyArIHNlbnNvcik7XG5cbiAgZm9yICh2YXIgcGFyYW0gaW4gb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KHBhcmFtKSkge1xuICAgICAgcGFyYW1ldGVycy5wdXNoKHBhcmFtICsgJz0nICsgb3B0aW9uc1twYXJhbV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBNYXJrZXJzICoqL1xuICBpZiAobWFya2Vycykge1xuICAgIHZhciBtYXJrZXIsIGxvYztcblxuICAgIGZvciAodmFyIGkgPSAwOyBkYXRhID0gbWFya2Vyc1tpXTsgaSsrKSB7XG4gICAgICBtYXJrZXIgPSBbXTtcblxuICAgICAgaWYgKGRhdGEuc2l6ZSAmJiBkYXRhLnNpemUgIT09ICdub3JtYWwnKSB7XG4gICAgICAgIG1hcmtlci5wdXNoKCdzaXplOicgKyBkYXRhLnNpemUpO1xuICAgICAgICBkZWxldGUgZGF0YS5zaXplO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZGF0YS5pY29uKSB7XG4gICAgICAgIG1hcmtlci5wdXNoKCdpY29uOicgKyBlbmNvZGVVUkkoZGF0YS5pY29uKSk7XG4gICAgICAgIGRlbGV0ZSBkYXRhLmljb247XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmNvbG9yKSB7XG4gICAgICAgIG1hcmtlci5wdXNoKCdjb2xvcjonICsgZGF0YS5jb2xvci5yZXBsYWNlKCcjJywgJzB4JykpO1xuICAgICAgICBkZWxldGUgZGF0YS5jb2xvcjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEubGFiZWwpIHtcbiAgICAgICAgbWFya2VyLnB1c2goJ2xhYmVsOicgKyBkYXRhLmxhYmVsWzBdLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICBkZWxldGUgZGF0YS5sYWJlbDtcbiAgICAgIH1cblxuICAgICAgbG9jID0gKGRhdGEuYWRkcmVzcyA/IGRhdGEuYWRkcmVzcyA6IGRhdGEubGF0ICsgJywnICsgZGF0YS5sbmcpO1xuICAgICAgZGVsZXRlIGRhdGEuYWRkcmVzcztcbiAgICAgIGRlbGV0ZSBkYXRhLmxhdDtcbiAgICAgIGRlbGV0ZSBkYXRhLmxuZztcblxuICAgICAgZm9yKHZhciBwYXJhbSBpbiBkYXRhKXtcbiAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG4gICAgICAgICAgbWFya2VyLnB1c2gocGFyYW0gKyAnOicgKyBkYXRhW3BhcmFtXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG1hcmtlci5sZW5ndGggfHwgaSA9PT0gMCkge1xuICAgICAgICBtYXJrZXIucHVzaChsb2MpO1xuICAgICAgICBtYXJrZXIgPSBtYXJrZXIuam9pbignfCcpO1xuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goJ21hcmtlcnM9JyArIGVuY29kZVVSSShtYXJrZXIpKTtcbiAgICAgIH1cbiAgICAgIC8vIE5ldyBtYXJrZXIgd2l0aG91dCBzdHlsZXNcbiAgICAgIGVsc2Uge1xuICAgICAgICBtYXJrZXIgPSBwYXJhbWV0ZXJzLnBvcCgpICsgZW5jb2RlVVJJKCd8JyArIGxvYyk7XG4gICAgICAgIHBhcmFtZXRlcnMucHVzaChtYXJrZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBNYXAgU3R5bGVzICoqL1xuICBpZiAoc3R5bGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzdHlsZVJ1bGUgPSBbXTtcbiAgICAgIGlmIChzdHlsZXNbaV0uZmVhdHVyZVR5cGUpe1xuICAgICAgICBzdHlsZVJ1bGUucHVzaCgnZmVhdHVyZTonICsgc3R5bGVzW2ldLmZlYXR1cmVUeXBlLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3R5bGVzW2ldLmVsZW1lbnRUeXBlKSB7XG4gICAgICAgIHN0eWxlUnVsZS5wdXNoKCdlbGVtZW50OicgKyBzdHlsZXNbaV0uZWxlbWVudFR5cGUudG9Mb3dlckNhc2UoKSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3R5bGVzW2ldLnN0eWxlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzdHlsZXNbaV0uc3R5bGVyc1tqXSkge1xuICAgICAgICAgIHZhciBydWxlQXJnID0gc3R5bGVzW2ldLnN0eWxlcnNbal1bcF07XG4gICAgICAgICAgaWYgKHAgPT0gJ2h1ZScgfHwgcCA9PSAnY29sb3InKSB7XG4gICAgICAgICAgICBydWxlQXJnID0gJzB4JyArIHJ1bGVBcmcuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHlsZVJ1bGUucHVzaChwICsgJzonICsgcnVsZUFyZyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHJ1bGUgPSBzdHlsZVJ1bGUuam9pbignfCcpO1xuICAgICAgaWYgKHJ1bGUgIT0gJycpIHtcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKCdzdHlsZT0nICsgcnVsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFBvbHlsaW5lcyAqKi9cbiAgZnVuY3Rpb24gcGFyc2VDb2xvcihjb2xvciwgb3BhY2l0eSkge1xuICAgIGlmIChjb2xvclswXSA9PT0gJyMnKXtcbiAgICAgIGNvbG9yID0gY29sb3IucmVwbGFjZSgnIycsICcweCcpO1xuXG4gICAgICBpZiAob3BhY2l0eSkge1xuICAgICAgICBvcGFjaXR5ID0gcGFyc2VGbG9hdChvcGFjaXR5KTtcbiAgICAgICAgb3BhY2l0eSA9IE1hdGgubWluKDEsIE1hdGgubWF4KG9wYWNpdHksIDApKTtcbiAgICAgICAgaWYgKG9wYWNpdHkgPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gJzB4MDAwMDAwMDAnO1xuICAgICAgICB9XG4gICAgICAgIG9wYWNpdHkgPSAob3BhY2l0eSAqIDI1NSkudG9TdHJpbmcoMTYpO1xuICAgICAgICBpZiAob3BhY2l0eS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICBvcGFjaXR5ICs9IG9wYWNpdHk7XG4gICAgICAgIH1cblxuICAgICAgICBjb2xvciA9IGNvbG9yLnNsaWNlKDAsOCkgKyBvcGFjaXR5O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29sb3I7XG4gIH1cblxuICBpZiAocG9seWxpbmUpIHtcbiAgICBkYXRhID0gcG9seWxpbmU7XG4gICAgcG9seWxpbmUgPSBbXTtcblxuICAgIGlmIChkYXRhLnN0cm9rZVdlaWdodCkge1xuICAgICAgcG9seWxpbmUucHVzaCgnd2VpZ2h0OicgKyBwYXJzZUludChkYXRhLnN0cm9rZVdlaWdodCwgMTApKTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5zdHJva2VDb2xvcikge1xuICAgICAgdmFyIGNvbG9yID0gcGFyc2VDb2xvcihkYXRhLnN0cm9rZUNvbG9yLCBkYXRhLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgcG9seWxpbmUucHVzaCgnY29sb3I6JyArIGNvbG9yKTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5maWxsQ29sb3IpIHtcbiAgICAgIHZhciBmaWxsY29sb3IgPSBwYXJzZUNvbG9yKGRhdGEuZmlsbENvbG9yLCBkYXRhLmZpbGxPcGFjaXR5KTtcbiAgICAgIHBvbHlsaW5lLnB1c2goJ2ZpbGxjb2xvcjonICsgZmlsbGNvbG9yKTtcbiAgICB9XG5cbiAgICB2YXIgcGF0aCA9IGRhdGEucGF0aDtcbiAgICBpZiAocGF0aC5qb2luKSB7XG4gICAgICBmb3IgKHZhciBqPTAsIHBvczsgcG9zPXBhdGhbal07IGorKykge1xuICAgICAgICBwb2x5bGluZS5wdXNoKHBvcy5qb2luKCcsJykpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvbHlsaW5lLnB1c2goJ2VuYzonICsgcGF0aCk7XG4gICAgfVxuXG4gICAgcG9seWxpbmUgPSBwb2x5bGluZS5qb2luKCd8Jyk7XG4gICAgcGFyYW1ldGVycy5wdXNoKCdwYXRoPScgKyBlbmNvZGVVUkkocG9seWxpbmUpKTtcbiAgfVxuXG4gIC8qKiBSZXRpbmEgc3VwcG9ydCAqKi9cbiAgdmFyIGRwaSA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XG4gIHBhcmFtZXRlcnMucHVzaCgnc2NhbGU9JyArIGRwaSk7XG5cbiAgcGFyYW1ldGVycyA9IHBhcmFtZXRlcnMuam9pbignJicpO1xuICByZXR1cm4gc3RhdGljX3Jvb3QgKyBwYXJhbWV0ZXJzO1xufTtcblxuR01hcHMucHJvdG90eXBlLmFkZE1hcFR5cGUgPSBmdW5jdGlvbihtYXBUeXBlSWQsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJnZXRUaWxlVXJsXCIpICYmIHR5cGVvZihvcHRpb25zW1wiZ2V0VGlsZVVybFwiXSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgb3B0aW9ucy50aWxlU2l6ZSA9IG9wdGlvbnMudGlsZVNpemUgfHwgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjU2LCAyNTYpO1xuXG4gICAgdmFyIG1hcFR5cGUgPSBuZXcgZ29vZ2xlLm1hcHMuSW1hZ2VNYXBUeXBlKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5tYXAubWFwVHlwZXMuc2V0KG1hcFR5cGVJZCwgbWFwVHlwZSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhyb3cgXCInZ2V0VGlsZVVybCcgZnVuY3Rpb24gcmVxdWlyZWQuXCI7XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRPdmVybGF5TWFwVHlwZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJnZXRUaWxlXCIpICYmIHR5cGVvZihvcHRpb25zW1wiZ2V0VGlsZVwiXSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdmFyIG92ZXJsYXlNYXBUeXBlSW5kZXggPSBvcHRpb25zLmluZGV4O1xuXG4gICAgZGVsZXRlIG9wdGlvbnMuaW5kZXg7XG5cbiAgICB0aGlzLm1hcC5vdmVybGF5TWFwVHlwZXMuaW5zZXJ0QXQob3ZlcmxheU1hcFR5cGVJbmRleCwgb3B0aW9ucyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhyb3cgXCInZ2V0VGlsZScgZnVuY3Rpb24gcmVxdWlyZWQuXCI7XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVPdmVybGF5TWFwVHlwZSA9IGZ1bmN0aW9uKG92ZXJsYXlNYXBUeXBlSW5kZXgpIHtcbiAgdGhpcy5tYXAub3ZlcmxheU1hcFR5cGVzLnJlbW92ZUF0KG92ZXJsYXlNYXBUeXBlSW5kZXgpO1xufTtcblxuR01hcHMucHJvdG90eXBlLmFkZFN0eWxlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgc3R5bGVkTWFwVHlwZSA9IG5ldyBnb29nbGUubWFwcy5TdHlsZWRNYXBUeXBlKG9wdGlvbnMuc3R5bGVzLCB7IG5hbWU6IG9wdGlvbnMuc3R5bGVkTWFwTmFtZSB9KTtcblxuICB0aGlzLm1hcC5tYXBUeXBlcy5zZXQob3B0aW9ucy5tYXBUeXBlSWQsIHN0eWxlZE1hcFR5cGUpO1xufTtcblxuR01hcHMucHJvdG90eXBlLnNldFN0eWxlID0gZnVuY3Rpb24obWFwVHlwZUlkKSB7XG4gIHRoaXMubWFwLnNldE1hcFR5cGVJZChtYXBUeXBlSWQpO1xufTtcblxuR01hcHMucHJvdG90eXBlLmNyZWF0ZVBhbm9yYW1hID0gZnVuY3Rpb24oc3RyZWV0dmlld19vcHRpb25zKSB7XG4gIGlmICghc3RyZWV0dmlld19vcHRpb25zLmhhc093blByb3BlcnR5KCdsYXQnKSB8fCAhc3RyZWV0dmlld19vcHRpb25zLmhhc093blByb3BlcnR5KCdsbmcnKSkge1xuICAgIHN0cmVldHZpZXdfb3B0aW9ucy5sYXQgPSB0aGlzLmdldENlbnRlcigpLmxhdCgpO1xuICAgIHN0cmVldHZpZXdfb3B0aW9ucy5sbmcgPSB0aGlzLmdldENlbnRlcigpLmxuZygpO1xuICB9XG5cbiAgdGhpcy5wYW5vcmFtYSA9IEdNYXBzLmNyZWF0ZVBhbm9yYW1hKHN0cmVldHZpZXdfb3B0aW9ucyk7XG5cbiAgdGhpcy5tYXAuc2V0U3RyZWV0Vmlldyh0aGlzLnBhbm9yYW1hKTtcblxuICByZXR1cm4gdGhpcy5wYW5vcmFtYTtcbn07XG5cbkdNYXBzLmNyZWF0ZVBhbm9yYW1hID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgZWwgPSBnZXRFbGVtZW50QnlJZChvcHRpb25zLmVsLCBvcHRpb25zLmNvbnRleHQpO1xuXG4gIG9wdGlvbnMucG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMubGF0LCBvcHRpb25zLmxuZyk7XG5cbiAgZGVsZXRlIG9wdGlvbnMuZWw7XG4gIGRlbGV0ZSBvcHRpb25zLmNvbnRleHQ7XG4gIGRlbGV0ZSBvcHRpb25zLmxhdDtcbiAgZGVsZXRlIG9wdGlvbnMubG5nO1xuXG4gIHZhciBzdHJlZXR2aWV3X2V2ZW50cyA9IFsnY2xvc2VjbGljaycsICdsaW5rc19jaGFuZ2VkJywgJ3Bhbm9fY2hhbmdlZCcsICdwb3NpdGlvbl9jaGFuZ2VkJywgJ3Bvdl9jaGFuZ2VkJywgJ3Jlc2l6ZScsICd2aXNpYmxlX2NoYW5nZWQnXSxcbiAgICAgIHN0cmVldHZpZXdfb3B0aW9ucyA9IGV4dGVuZF9vYmplY3Qoe3Zpc2libGUgOiB0cnVlfSwgb3B0aW9ucyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJlZXR2aWV3X2V2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGRlbGV0ZSBzdHJlZXR2aWV3X29wdGlvbnNbc3RyZWV0dmlld19ldmVudHNbaV1dO1xuICB9XG5cbiAgdmFyIHBhbm9yYW1hID0gbmV3IGdvb2dsZS5tYXBzLlN0cmVldFZpZXdQYW5vcmFtYShlbCwgc3RyZWV0dmlld19vcHRpb25zKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVldHZpZXdfZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbigpe1xuICAgICAgICAgIG9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKHBhbm9yYW1hLCBzdHJlZXR2aWV3X2V2ZW50c1tpXSk7XG4gIH1cblxuICByZXR1cm4gcGFub3JhbWE7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudF9uYW1lLCBoYW5kbGVyKSB7XG4gIHJldHVybiBHTWFwcy5vbihldmVudF9uYW1lLCB0aGlzLCBoYW5kbGVyKTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudF9uYW1lKSB7XG4gIEdNYXBzLm9mZihldmVudF9uYW1lLCB0aGlzKTtcbn07XG5cbkdNYXBzLmN1c3RvbV9ldmVudHMgPSBbJ21hcmtlcl9hZGRlZCcsICdtYXJrZXJfcmVtb3ZlZCcsICdwb2x5bGluZV9hZGRlZCcsICdwb2x5bGluZV9yZW1vdmVkJywgJ3BvbHlnb25fYWRkZWQnLCAncG9seWdvbl9yZW1vdmVkJywgJ2dlb2xvY2F0ZWQnLCAnZ2VvbG9jYXRpb25fZmFpbGVkJ107XG5cbkdNYXBzLm9uID0gZnVuY3Rpb24oZXZlbnRfbmFtZSwgb2JqZWN0LCBoYW5kbGVyKSB7XG4gIGlmIChHTWFwcy5jdXN0b21fZXZlbnRzLmluZGV4T2YoZXZlbnRfbmFtZSkgPT0gLTEpIHtcbiAgICBpZihvYmplY3QgaW5zdGFuY2VvZiBHTWFwcykgb2JqZWN0ID0gb2JqZWN0Lm1hcDsgXG4gICAgcmV0dXJuIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgZXZlbnRfbmFtZSwgaGFuZGxlcik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIHJlZ2lzdGVyZWRfZXZlbnQgPSB7XG4gICAgICBoYW5kbGVyIDogaGFuZGxlcixcbiAgICAgIGV2ZW50TmFtZSA6IGV2ZW50X25hbWVcbiAgICB9O1xuXG4gICAgb2JqZWN0LnJlZ2lzdGVyZWRfZXZlbnRzW2V2ZW50X25hbWVdID0gb2JqZWN0LnJlZ2lzdGVyZWRfZXZlbnRzW2V2ZW50X25hbWVdIHx8IFtdO1xuICAgIG9iamVjdC5yZWdpc3RlcmVkX2V2ZW50c1tldmVudF9uYW1lXS5wdXNoKHJlZ2lzdGVyZWRfZXZlbnQpO1xuXG4gICAgcmV0dXJuIHJlZ2lzdGVyZWRfZXZlbnQ7XG4gIH1cbn07XG5cbkdNYXBzLm9mZiA9IGZ1bmN0aW9uKGV2ZW50X25hbWUsIG9iamVjdCkge1xuICBpZiAoR01hcHMuY3VzdG9tX2V2ZW50cy5pbmRleE9mKGV2ZW50X25hbWUpID09IC0xKSB7XG4gICAgaWYob2JqZWN0IGluc3RhbmNlb2YgR01hcHMpIG9iamVjdCA9IG9iamVjdC5tYXA7IFxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmNsZWFyTGlzdGVuZXJzKG9iamVjdCwgZXZlbnRfbmFtZSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgb2JqZWN0LnJlZ2lzdGVyZWRfZXZlbnRzW2V2ZW50X25hbWVdID0gW107XG4gIH1cbn07XG5cbkdNYXBzLmZpcmUgPSBmdW5jdGlvbihldmVudF9uYW1lLCBvYmplY3QsIHNjb3BlKSB7XG4gIGlmIChHTWFwcy5jdXN0b21fZXZlbnRzLmluZGV4T2YoZXZlbnRfbmFtZSkgPT0gLTEpIHtcbiAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKG9iamVjdCwgZXZlbnRfbmFtZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykuc2xpY2UoMikpO1xuICB9XG4gIGVsc2Uge1xuICAgIGlmKGV2ZW50X25hbWUgaW4gc2NvcGUucmVnaXN0ZXJlZF9ldmVudHMpIHtcbiAgICAgIHZhciBmaXJpbmdfZXZlbnRzID0gc2NvcGUucmVnaXN0ZXJlZF9ldmVudHNbZXZlbnRfbmFtZV07XG5cbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBmaXJpbmdfZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIChmdW5jdGlvbihoYW5kbGVyLCBzY29wZSwgb2JqZWN0KSB7XG4gICAgICAgICAgaGFuZGxlci5hcHBseShzY29wZSwgW29iamVjdF0pO1xuICAgICAgICB9KShmaXJpbmdfZXZlbnRzW2ldWydoYW5kbGVyJ10sIHNjb3BlLCBvYmplY3QpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuR01hcHMuZ2VvbG9jYXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgY29tcGxldGVfY2FsbGJhY2sgPSBvcHRpb25zLmFsd2F5cyB8fCBvcHRpb25zLmNvbXBsZXRlO1xuXG4gIGlmIChuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gICAgICBvcHRpb25zLnN1Y2Nlc3MocG9zaXRpb24pO1xuXG4gICAgICBpZiAoY29tcGxldGVfY2FsbGJhY2spIHtcbiAgICAgICAgY29tcGxldGVfY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgb3B0aW9ucy5lcnJvcihlcnJvcik7XG5cbiAgICAgIGlmIChjb21wbGV0ZV9jYWxsYmFjaykge1xuICAgICAgICBjb21wbGV0ZV9jYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sIG9wdGlvbnMub3B0aW9ucyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgb3B0aW9ucy5ub3Rfc3VwcG9ydGVkKCk7XG5cbiAgICBpZiAoY29tcGxldGVfY2FsbGJhY2spIHtcbiAgICAgIGNvbXBsZXRlX2NhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5nZW9jb2RlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB0aGlzLmdlb2NvZGVyID0gbmV3IGdvb2dsZS5tYXBzLkdlb2NvZGVyKCk7XG4gIHZhciBjYWxsYmFjayA9IG9wdGlvbnMuY2FsbGJhY2s7XG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KCdsYXQnKSAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCdsbmcnKSkge1xuICAgIG9wdGlvbnMubGF0TG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmxhdCwgb3B0aW9ucy5sbmcpO1xuICB9XG5cbiAgZGVsZXRlIG9wdGlvbnMubGF0O1xuICBkZWxldGUgb3B0aW9ucy5sbmc7XG4gIGRlbGV0ZSBvcHRpb25zLmNhbGxiYWNrO1xuICBcbiAgdGhpcy5nZW9jb2Rlci5nZW9jb2RlKG9wdGlvbnMsIGZ1bmN0aW9uKHJlc3VsdHMsIHN0YXR1cykge1xuICAgIGNhbGxiYWNrKHJlc3VsdHMsIHN0YXR1cyk7XG4gIH0pO1xufTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUG9seWdvbiBjb250YWluc0xhdExuZ1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL3RwYXJraW4vR29vZ2xlLU1hcHMtUG9pbnQtaW4tUG9seWdvblxuLy8gUG95Z29uIGdldEJvdW5kcyBleHRlbnNpb24gLSBnb29nbGUtbWFwcy1leHRlbnNpb25zXG4vLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLW1hcHMtZXh0ZW5zaW9ucy9zb3VyY2UvYnJvd3NlL2dvb2dsZS5tYXBzLlBvbHlnb24uZ2V0Qm91bmRzLmpzXG5pZiAoIWdvb2dsZS5tYXBzLlBvbHlnb24ucHJvdG90eXBlLmdldEJvdW5kcykge1xuICBnb29nbGUubWFwcy5Qb2x5Z29uLnByb3RvdHlwZS5nZXRCb3VuZHMgPSBmdW5jdGlvbihsYXRMbmcpIHtcbiAgICB2YXIgYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICAgIHZhciBwYXRocyA9IHRoaXMuZ2V0UGF0aHMoKTtcbiAgICB2YXIgcGF0aDtcblxuICAgIGZvciAodmFyIHAgPSAwOyBwIDwgcGF0aHMuZ2V0TGVuZ3RoKCk7IHArKykge1xuICAgICAgcGF0aCA9IHBhdGhzLmdldEF0KHApO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmdldExlbmd0aCgpOyBpKyspIHtcbiAgICAgICAgYm91bmRzLmV4dGVuZChwYXRoLmdldEF0KGkpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYm91bmRzO1xuICB9O1xufVxuXG5pZiAoIWdvb2dsZS5tYXBzLlBvbHlnb24ucHJvdG90eXBlLmNvbnRhaW5zTGF0TG5nKSB7XG4gIC8vIFBvbHlnb24gY29udGFpbnNMYXRMbmcgLSBtZXRob2QgdG8gZGV0ZXJtaW5lIGlmIGEgbGF0TG5nIGlzIHdpdGhpbiBhIHBvbHlnb25cbiAgZ29vZ2xlLm1hcHMuUG9seWdvbi5wcm90b3R5cGUuY29udGFpbnNMYXRMbmcgPSBmdW5jdGlvbihsYXRMbmcpIHtcbiAgICAvLyBFeGNsdWRlIHBvaW50cyBvdXRzaWRlIG9mIGJvdW5kcyBhcyB0aGVyZSBpcyBubyB3YXkgdGhleSBhcmUgaW4gdGhlIHBvbHlcbiAgICB2YXIgYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoKTtcblxuICAgIGlmIChib3VuZHMgIT09IG51bGwgJiYgIWJvdW5kcy5jb250YWlucyhsYXRMbmcpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUmF5Y2FzdCBwb2ludCBpbiBwb2x5Z29uIG1ldGhvZFxuICAgIHZhciBpblBvbHkgPSBmYWxzZTtcblxuICAgIHZhciBudW1QYXRocyA9IHRoaXMuZ2V0UGF0aHMoKS5nZXRMZW5ndGgoKTtcbiAgICBmb3IgKHZhciBwID0gMDsgcCA8IG51bVBhdGhzOyBwKyspIHtcbiAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRocygpLmdldEF0KHApO1xuICAgICAgdmFyIG51bVBvaW50cyA9IHBhdGguZ2V0TGVuZ3RoKCk7XG4gICAgICB2YXIgaiA9IG51bVBvaW50cyAtIDE7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUG9pbnRzOyBpKyspIHtcbiAgICAgICAgdmFyIHZlcnRleDEgPSBwYXRoLmdldEF0KGkpO1xuICAgICAgICB2YXIgdmVydGV4MiA9IHBhdGguZ2V0QXQoaik7XG5cbiAgICAgICAgaWYgKHZlcnRleDEubG5nKCkgPCBsYXRMbmcubG5nKCkgJiYgdmVydGV4Mi5sbmcoKSA+PSBsYXRMbmcubG5nKCkgfHwgdmVydGV4Mi5sbmcoKSA8IGxhdExuZy5sbmcoKSAmJiB2ZXJ0ZXgxLmxuZygpID49IGxhdExuZy5sbmcoKSkge1xuICAgICAgICAgIGlmICh2ZXJ0ZXgxLmxhdCgpICsgKGxhdExuZy5sbmcoKSAtIHZlcnRleDEubG5nKCkpIC8gKHZlcnRleDIubG5nKCkgLSB2ZXJ0ZXgxLmxuZygpKSAqICh2ZXJ0ZXgyLmxhdCgpIC0gdmVydGV4MS5sYXQoKSkgPCBsYXRMbmcubGF0KCkpIHtcbiAgICAgICAgICAgIGluUG9seSA9ICFpblBvbHk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaiA9IGk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluUG9seTtcbiAgfTtcbn1cblxuaWYgKCFnb29nbGUubWFwcy5DaXJjbGUucHJvdG90eXBlLmNvbnRhaW5zTGF0TG5nKSB7XG4gIGdvb2dsZS5tYXBzLkNpcmNsZS5wcm90b3R5cGUuY29udGFpbnNMYXRMbmcgPSBmdW5jdGlvbihsYXRMbmcpIHtcbiAgICBpZiAoZ29vZ2xlLm1hcHMuZ2VvbWV0cnkpIHtcbiAgICAgIHJldHVybiBnb29nbGUubWFwcy5nZW9tZXRyeS5zcGhlcmljYWwuY29tcHV0ZURpc3RhbmNlQmV0d2Vlbih0aGlzLmdldENlbnRlcigpLCBsYXRMbmcpIDw9IHRoaXMuZ2V0UmFkaXVzKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xufVxuXG5nb29nbGUubWFwcy5MYXRMbmdCb3VuZHMucHJvdG90eXBlLmNvbnRhaW5zTGF0TG5nID0gZnVuY3Rpb24obGF0TG5nKSB7XG4gIHJldHVybiB0aGlzLmNvbnRhaW5zKGxhdExuZyk7XG59O1xuXG5nb29nbGUubWFwcy5NYXJrZXIucHJvdG90eXBlLnNldEZlbmNlcyA9IGZ1bmN0aW9uKGZlbmNlcykge1xuICB0aGlzLmZlbmNlcyA9IGZlbmNlcztcbn07XG5cbmdvb2dsZS5tYXBzLk1hcmtlci5wcm90b3R5cGUuYWRkRmVuY2UgPSBmdW5jdGlvbihmZW5jZSkge1xuICB0aGlzLmZlbmNlcy5wdXNoKGZlbmNlKTtcbn07XG5cbmdvb2dsZS5tYXBzLk1hcmtlci5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXNbJ19fZ21faWQnXTtcbn07XG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEFycmF5IGluZGV4T2Zcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZlxuaWYgKCFBcnJheS5wcm90b3R5cGUuaW5kZXhPZikge1xuICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50IC8qLCBmcm9tSW5kZXggKi8gKSB7XG4gICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICB9XG4gICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgIHZhciBsZW4gPSB0Lmxlbmd0aCA+Pj4gMDtcbiAgICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICB2YXIgbiA9IDA7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBuID0gTnVtYmVyKGFyZ3VtZW50c1sxXSk7XG4gICAgICAgICAgaWYgKG4gIT0gbikgeyAvLyBzaG9ydGN1dCBmb3IgdmVyaWZ5aW5nIGlmIGl0J3MgTmFOXG4gICAgICAgICAgICAgIG4gPSAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAobiAhPSAwICYmIG4gIT0gSW5maW5pdHkgJiYgbiAhPSAtSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgbiA9IChuID4gMCB8fCAtMSkgKiBNYXRoLmZsb29yKE1hdGguYWJzKG4pKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobiA+PSBsZW4pIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICB2YXIgayA9IG4gPj0gMCA/IG4gOiBNYXRoLm1heChsZW4gLSBNYXRoLmFicyhuKSwgMCk7XG4gICAgICBmb3IgKDsgayA8IGxlbjsgaysrKSB7XG4gICAgICAgICAgaWYgKGsgaW4gdCAmJiB0W2tdID09PSBzZWFyY2hFbGVtZW50KSB7XG4gICAgICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgfVxufVxuICBcbnJldHVybiBHTWFwcztcbn0pKTtcbiIsIkdNYXBzID0gcmVxdWlyZSAnZ21hcHMnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgaW5pdDogLT5cbiAgICBAaW5pdE1hcCgpIGlmICQoJyNtYXAnKS5sZW5ndGhcblxuXG4gIGluaXRNYXA6IC0+XG4gICAgQCRtYXBfZXJyb3IgPSAkKCcjbWFwX2Vycm9yJylcbiAgICBAJHNlYXJjaCA9ICQoJ1tuYW1lPVwic2VhcmNoX21hcFwiXScpXG4gICAgQGluZm93aW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdygpXG4gICAgQG1hcCA9IG5ldyBHTWFwc1xuICAgICAgZGl2OiAnI21hcCcsXG4gICAgICBsYXQ6IDQ3LjY2MjA0LFxuICAgICAgbG5nOiAtMTIyLjMzMzM3LFxuICAgICAgem9vbTogMTIsXG4gICAgICBtYXBUeXBlQ29udHJvbDogZmFsc2UsXG4gICAgICB6b29tQ29udHJvbE9wdGlvbnM6XG4gICAgICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlLkxBUkdFLFxuICAgICAgICBwb3NpdGlvbjogZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uLkxFRlRfQ0VOVEVSXG4gICAgICBwYW5Db250cm9sOiBmYWxzZSxcbiAgICAgIHN0cmVldFZpZXdDb250cm9sOiBmYWxzZSxcblxuICAgICAgc3R5bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ2FsbCdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdsYWJlbHMudGV4dC5maWxsJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ3NhdHVyYXRpb24nOiAzNiB9XG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogNDAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnYWxsJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2xhYmVscy50ZXh0LnN0cm9rZSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICd2aXNpYmlsaXR5JzogJ29uJyB9XG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTYgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnYWxsJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2xhYmVscy5pY29uJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbIHsgJ3Zpc2liaWxpdHknOiAnb2ZmJyB9IF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ2FkbWluaXN0cmF0aXZlJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5LmZpbGwnXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAyMCB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdhZG1pbmlzdHJhdGl2ZSdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeS5zdHJva2UnXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxNyB9XG4gICAgICAgICAgICAgIHsgJ3dlaWdodCc6IDEuMiB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdsYW5kc2NhcGUnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnknXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxNiB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdwb2knXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnknXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAyMSB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdyb2FkLmhpZ2h3YXknXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnkuZmlsbCdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDE3IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3JvYWQuaGlnaHdheSdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeS5zdHJva2UnXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAyOSB9XG4gICAgICAgICAgICAgIHsgJ3dlaWdodCc6IDAuMiB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdyb2FkLmFydGVyaWFsJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5J1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAncm9hZC5sb2NhbCdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDEzIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3RyYW5zaXQnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnknXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxOSB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICd3YXRlcidcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDcgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuXG4gICAgQGJ1aWxkTWFya2VycygpIGlmIGxvY2F0aW9ucz9cbiAgICBAbGlzdGVuZXJzKClcblxuICAjIGdlb2xvY2F0ZTogLT5cbiAgIyAgIEdNYXBzLmdlb2xvY2F0ZVxuICAjICAgICBzdWNjZXNzOiAocG9zaXRpb24pIC0+XG4gICMgICAgICAgbWFwLnNldENlbnRlciBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcblxuICAjICAgICBlcnJvcjogKGVycm9yKSAtPlxuICAjICAgICAgIGFsZXJ0ICdHZW9sb2NhdGlvbiBmYWlsZWQ6ICcgKyBlcnJvci5tZXNzYWdlXG5cbiAgIyAgICAgbm90X3N1cHBvcnRlZDogLT5cbiAgIyAgICAgICBhbGVydCAnWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZ2VvbG9jYXRpb24nXG5cbiAgIyAgICAgYWx3YXlzOiAtPlxuICAjICAgICAgIGFsZXJ0ICdEb25lISdcblxuICBsaXN0ZW5lcnM6IC0+XG4gICAgQCRzZWFyY2gub24gJ2tleXVwJywgPT5cbiAgICAgIEAkbWFwX2Vycm9yLmVtcHR5KClcbiAgICAgIHEgPSBAJHNlYXJjaC52YWwoKVxuICAgICAgQHNlYXJjaChxKSBpZiBxLmxlbmd0aCA+IDNcblxuICBzZWFyY2g6IChxKSAtPlxuICAgIEdNYXBzLmdlb2NvZGVcbiAgICAgIGFkZHJlc3M6IHFcbiAgICAgIGNhbGxiYWNrOiAocmVzdWx0cywgc3RhdHVzKSA9PlxuICAgICAgICBpZiBzdGF0dXMgaXMgJ1pFUk9fUkVTVUxUUydcbiAgICAgICAgICBAbm90Rm91bmQoKVxuICAgICAgICBpZiByZXN1bHRzXG4gICAgICAgICAgbGF0bG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvblxuICAgICAgICAgIEBtYXAuc2V0Q2VudGVyKGxhdGxuZy5sYXQoKSwgbGF0bG5nLmxuZygpKVxuICAgICAgICAgIEBtYXAuc2V0Wm9vbSgxNClcblxuICBub3RGb3VuZDogLT5cbiAgICBAJG1hcF9lcnJvci50ZXh0ICdub3RoaW5nIGZvdW5kJ1xuXG4gIGJ1aWxkTWFya2VyczogLT5cbiAgICBib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKClcbiAgICAkLmVhY2ggbG9jYXRpb25zLCAoaSwgbG9jYXRpb24pID0+XG4gICAgICBsYXQgPSBwYXJzZUZsb2F0KGxvY2F0aW9uLmxhdClcbiAgICAgIGxuZyA9IHBhcnNlRmxvYXQobG9jYXRpb24ubG5nKVxuICAgICAgYm91bmRzLmV4dGVuZCBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGxhdCwgbG5nKVxuXG4gICAgICBAbWFwLmFkZE1hcmtlclxuICAgICAgICBsYXQ6IGxhdFxuICAgICAgICBsbmc6IGxuZ1xuICAgICAgICB0aXRsZTogXCIje2xvY2F0aW9uLm5hbWV9XCJcbiAgICAgICAgaW5mb1dpbmRvdzpcbiAgICAgICAgICBjb250ZW50OiBcIjxkaXY+I3tsb2NhdGlvbi5uYW1lfTwvZGl2PjxkaXY+I3tsb2NhdGlvbi51cmx9PC9kaXY+PGRpdj4je2xvY2F0aW9uLnVybH08L2Rpdj5cIlxuICAgICMgQG1hcC5maXRCb3VuZHMgYm91bmRzXG5cblxuIiwiQmlrZU1hcCA9IHJlcXVpcmUgJy4vbGliL21hcCdcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgRE9NIEluaXRcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuJCAtPlxuXG4gIEJpa2VNYXAuaW5pdCgpXG5cbiAgJCgnLnRvZ2dsZS1tZW51Jykub24gJ2NsaWNrJywgLT5cbiAgICAkKCcucmVzcG9uc2l2ZS1uYXYnKS50b2dnbGVDbGFzcyAnYWN0aXZlJ1xuICAgICQoXCIudG9wXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS10b3BcIlxuICAgICQoXCIubWlkZGxlXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS1taWRkbGVcIlxuICAgICQoXCIuYm90dG9tXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS1ib3R0b21cIlxuXG4gICQoJy5zbGlkZXInKS5zbGlja1xuICAgIGRvdHM6IHRydWUsXG4gICAgc3BlZWQ6IDYwMCxcbiAgICBjc3NFYXNlOiAnY3ViaWMtYmV6aWVyKDAuMjMwLCAxLjAwMCwgMC4zMjAsIDEuMDAwKSdcbiAgICBzbGlkZXNUb1Njcm9sbDogMSxcbiAgICBhdXRvcGxheTogdHJ1ZSxcbiAgICBhdXRvcGxheVNwZWVkOiA0MDAwXG5cbiAgJCgnLnNsaWRlci0tbXVsdGlwbGUnKS5zbGlja1xuICAgIGRvdHM6IGZhbHNlLFxuICAgIHNsaWRlc1RvU2hvdzogMixcbiAgICByZXNwb25zaXZlOiBbXG4gICAgICB7XG4gICAgICAgIGJyZWFrcG9pbnQ6IDQ4MCxcbiAgICAgICAgc2V0dGluZ3M6XG4gICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxuICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxXG4gICAgICB9XG4gICAgXVxuXG4gICQoZG9jdW1lbnQpLnJlYWR5IC0+XG4gIHNjcm9sbF9wb3MgPSAwXG4gICQoZG9jdW1lbnQpLnNjcm9sbCAtPlxuICAgIHNjcm9sbF9wb3MgPSAkKHRoaXMpLnNjcm9sbFRvcCgpXG4gICAgaWYgc2Nyb2xsX3BvcyA+IDEwXG4gICAgICAkKCcubmF2LWJhY2tncm91bmQnKS5jc3MgJ3RvcCcsICcwJ1xuICAgIGVsc2VcbiAgICAgICQoJy5uYXYtYmFja2dyb3VuZCcpLmNzcyAndG9wJywgJy0xMjBweCdcblxuICAkdW5kZXJsaW5lcyA9ICQoJy51bmRlcmxpbmUnKVxuICAkdW5kZXJsaW5lczIgPSAkKCcudW5kZXJsaW5lMicpXG5cbiAgJChkb2N1bWVudCkub24gJ21vdXNlZW50ZXInLCAnLnRleHQtbGluaycsIC0+XG4gICAgZHluYW1pY3MuYW5pbWF0ZSAkdW5kZXJsaW5lc1skKHRoaXMpLnBhcmVudCgpLmluZGV4KCldLCB7d2lkdGg6ICcxMDAlJ30sIHR5cGU6IGR5bmFtaWNzLnNwcmluZ1xuICAkKGRvY3VtZW50KS5vbiAnbW91c2VsZWF2ZScsICcudGV4dC1saW5rJywgLT5cbiAgICBkeW5hbWljcy5hbmltYXRlICR1bmRlcmxpbmVzWyQodGhpcykucGFyZW50KCkuaW5kZXgoKV0sIHsgd2lkdGg6ICcwJyB9LCB0eXBlOiBkeW5hbWljcy5zcHJpbmdcbiAgXG4gICQoZG9jdW1lbnQpLm9uICdtb3VzZWVudGVyJywgJy50b3AtdGV4dC1saW5rJywgLT5cbiAgICBkeW5hbWljcy5hbmltYXRlICR1bmRlcmxpbmVzMlskKHRoaXMpLnBhcmVudCgpLmluZGV4KCldLCB7d2lkdGg6ICcxMDAlJ30sIHR5cGU6IGR5bmFtaWNzLnNwcmluZ1xuICAkKGRvY3VtZW50KS5vbiAnbW91c2VsZWF2ZScsICcudG9wLXRleHQtbGluaycsIC0+XG4gICAgZHluYW1pY3MuYW5pbWF0ZSAkdW5kZXJsaW5lczJbJCh0aGlzKS5wYXJlbnQoKS5pbmRleCgpXSwgeyB3aWR0aDogJzAnIH0sIHR5cGU6IGR5bmFtaWNzLnNwcmluZyJdfQ==
