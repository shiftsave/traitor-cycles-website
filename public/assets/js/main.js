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
            content: "<div>" + location.name + "</div><div>" + location.url + "</div>"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9pdmFuY3J1ei9Qcm9qZWN0cy9UcmFpdG9yIEN5Y2xlcy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2l2YW5jcnV6L1Byb2plY3RzL1RyYWl0b3IgQ3ljbGVzL25vZGVfbW9kdWxlcy9nbWFwcy9nbWFwcy5qcyIsIi9Vc2Vycy9pdmFuY3J1ei9Qcm9qZWN0cy9UcmFpdG9yIEN5Y2xlcy9zb3VyY2UvYXNzZXRzL2pzL2xpYi9tYXAuY29mZmVlIiwiL1VzZXJzL2l2YW5jcnV6L1Byb2plY3RzL1RyYWl0b3IgQ3ljbGVzL3NvdXJjZS9hc3NldHMvanMvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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Q0FBQyxFQUFaLENBQWUsWUFBZixFQUE2QixnQkFBN0IsRUFBK0MsU0FBQTtXQUM3QyxRQUFRLENBQUMsT0FBVCxDQUFpQixZQUFhLENBQUEsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUFnQixDQUFDLEtBQWpCLENBQUEsQ0FBQSxDQUE5QixFQUF5RDtNQUFDLEtBQUEsRUFBTyxNQUFSO0tBQXpELEVBQTBFO01BQUEsSUFBQSxFQUFNLFFBQVEsQ0FBQyxNQUFmO0tBQTFFO0VBRDZDLENBQS9DO1NBRUEsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEVBQVosQ0FBZSxZQUFmLEVBQTZCLGdCQUE3QixFQUErQyxTQUFBO1dBQzdDLFFBQVEsQ0FBQyxPQUFULENBQWlCLFlBQWEsQ0FBQSxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsTUFBUixDQUFBLENBQWdCLENBQUMsS0FBakIsQ0FBQSxDQUFBLENBQTlCLEVBQXlEO01BQUUsS0FBQSxFQUFPLEdBQVQ7S0FBekQsRUFBeUU7TUFBQSxJQUFBLEVBQU0sUUFBUSxDQUFDLE1BQWY7S0FBekU7RUFENkMsQ0FBL0M7QUFqREEsQ0FBRiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9XG4gIGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCdHTWFwcycsIFtdLCBmYWN0b3J5KTtcbiAgfVxuXG4gIHJvb3QuR01hcHMgPSBmYWN0b3J5KCk7XG5cbn0odGhpcywgZnVuY3Rpb24oKSB7XG5cbi8qIVxuICogR01hcHMuanMgdjAuNC4xOFxuICogaHR0cDovL2hwbmVvLmdpdGh1Yi5jb20vZ21hcHMvXG4gKlxuICogQ29weXJpZ2h0IDIwMTUsIEd1c3Rhdm8gTGVvblxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICovXG5cbmlmICghKHR5cGVvZiB3aW5kb3cuZ29vZ2xlID09PSAnb2JqZWN0JyAmJiB3aW5kb3cuZ29vZ2xlLm1hcHMpKSB7XG4gIHRocm93ICdHb29nbGUgTWFwcyBBUEkgaXMgcmVxdWlyZWQuIFBsZWFzZSByZWdpc3RlciB0aGUgZm9sbG93aW5nIEphdmFTY3JpcHQgbGlicmFyeSBodHRwOi8vbWFwcy5nb29nbGUuY29tL21hcHMvYXBpL2pzP3NlbnNvcj10cnVlLidcbn1cblxudmFyIGV4dGVuZF9vYmplY3QgPSBmdW5jdGlvbihvYmosIG5ld19vYmopIHtcbiAgdmFyIG5hbWU7XG5cbiAgaWYgKG9iaiA9PT0gbmV3X29iaikge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBmb3IgKG5hbWUgaW4gbmV3X29iaikge1xuICAgIG9ialtuYW1lXSA9IG5ld19vYmpbbmFtZV07XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIHJlcGxhY2Vfb2JqZWN0ID0gZnVuY3Rpb24ob2JqLCByZXBsYWNlKSB7XG4gIHZhciBuYW1lO1xuXG4gIGlmIChvYmogPT09IHJlcGxhY2UpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgZm9yIChuYW1lIGluIHJlcGxhY2UpIHtcbiAgICBpZiAob2JqW25hbWVdICE9IHVuZGVmaW5lZCkge1xuICAgICAgb2JqW25hbWVdID0gcmVwbGFjZVtuYW1lXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGFycmF5X21hcCA9IGZ1bmN0aW9uKGFycmF5LCBjYWxsYmFjaykge1xuICB2YXIgb3JpZ2luYWxfY2FsbGJhY2tfcGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgIGFycmF5X3JldHVybiA9IFtdLFxuICAgICAgYXJyYXlfbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgaTtcblxuICBpZiAoQXJyYXkucHJvdG90eXBlLm1hcCAmJiBhcnJheS5tYXAgPT09IEFycmF5LnByb3RvdHlwZS5tYXApIHtcbiAgICBhcnJheV9yZXR1cm4gPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoYXJyYXksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHZhciBjYWxsYmFja19wYXJhbXMgPSBvcmlnaW5hbF9jYWxsYmFja19wYXJhbXMuc2xpY2UoMCk7XG4gICAgICBjYWxsYmFja19wYXJhbXMuc3BsaWNlKDAsIDAsIGl0ZW0pO1xuXG4gICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpcywgY2FsbGJhY2tfcGFyYW1zKTtcbiAgICB9KTtcbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJyYXlfbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrX3BhcmFtcyA9IG9yaWdpbmFsX2NhbGxiYWNrX3BhcmFtcztcbiAgICAgIGNhbGxiYWNrX3BhcmFtcy5zcGxpY2UoMCwgMCwgYXJyYXlbaV0pO1xuICAgICAgYXJyYXlfcmV0dXJuLnB1c2goY2FsbGJhY2suYXBwbHkodGhpcywgY2FsbGJhY2tfcGFyYW1zKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFycmF5X3JldHVybjtcbn07XG5cbnZhciBhcnJheV9mbGF0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgdmFyIG5ld19hcnJheSA9IFtdLFxuICAgICAgaTtcblxuICBmb3IgKGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBuZXdfYXJyYXkgPSBuZXdfYXJyYXkuY29uY2F0KGFycmF5W2ldKTtcbiAgfVxuXG4gIHJldHVybiBuZXdfYXJyYXk7XG59O1xuXG52YXIgY29vcmRzVG9MYXRMbmdzID0gZnVuY3Rpb24oY29vcmRzLCB1c2VHZW9KU09OKSB7XG4gIHZhciBmaXJzdF9jb29yZCA9IGNvb3Jkc1swXSxcbiAgICAgIHNlY29uZF9jb29yZCA9IGNvb3Jkc1sxXTtcblxuICBpZiAodXNlR2VvSlNPTikge1xuICAgIGZpcnN0X2Nvb3JkID0gY29vcmRzWzFdO1xuICAgIHNlY29uZF9jb29yZCA9IGNvb3Jkc1swXTtcbiAgfVxuXG4gIHJldHVybiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGZpcnN0X2Nvb3JkLCBzZWNvbmRfY29vcmQpO1xufTtcblxudmFyIGFycmF5VG9MYXRMbmcgPSBmdW5jdGlvbihjb29yZHMsIHVzZUdlb0pTT04pIHtcbiAgdmFyIGk7XG5cbiAgZm9yIChpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICghKGNvb3Jkc1tpXSBpbnN0YW5jZW9mIGdvb2dsZS5tYXBzLkxhdExuZykpIHtcbiAgICAgIGlmIChjb29yZHNbaV0ubGVuZ3RoID4gMCAmJiB0eXBlb2YoY29vcmRzW2ldWzBdKSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBjb29yZHNbaV0gPSBhcnJheVRvTGF0TG5nKGNvb3Jkc1tpXSwgdXNlR2VvSlNPTik7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29vcmRzW2ldID0gY29vcmRzVG9MYXRMbmdzKGNvb3Jkc1tpXSwgdXNlR2VvSlNPTik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvb3Jkcztcbn07XG5cblxudmFyIGdldEVsZW1lbnRzQnlDbGFzc05hbWUgPSBmdW5jdGlvbiAoY2xhc3NfbmFtZSwgY29udGV4dCkge1xuXG4gICAgdmFyIGVsZW1lbnQsXG4gICAgICAgIF9jbGFzcyA9IGNsYXNzX25hbWUucmVwbGFjZSgnLicsICcnKTtcblxuICAgIGlmICgnalF1ZXJ5JyBpbiB0aGlzICYmIGNvbnRleHQpIHtcbiAgICAgICAgZWxlbWVudCA9ICQoXCIuXCIgKyBfY2xhc3MsIGNvbnRleHQpWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKF9jbGFzcylbMF07XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50O1xuXG59O1xuXG52YXIgZ2V0RWxlbWVudEJ5SWQgPSBmdW5jdGlvbihpZCwgY29udGV4dCkge1xuICB2YXIgZWxlbWVudCxcbiAgaWQgPSBpZC5yZXBsYWNlKCcjJywgJycpO1xuXG4gIGlmICgnalF1ZXJ5JyBpbiB3aW5kb3cgJiYgY29udGV4dCkge1xuICAgIGVsZW1lbnQgPSAkKCcjJyArIGlkLCBjb250ZXh0KVswXTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICB9O1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcblxudmFyIGZpbmRBYnNvbHV0ZVBvc2l0aW9uID0gZnVuY3Rpb24ob2JqKSAge1xuICB2YXIgY3VybGVmdCA9IDAsXG4gICAgICBjdXJ0b3AgPSAwO1xuXG4gIGlmIChvYmoub2Zmc2V0UGFyZW50KSB7XG4gICAgZG8ge1xuICAgICAgY3VybGVmdCArPSBvYmoub2Zmc2V0TGVmdDtcbiAgICAgIGN1cnRvcCArPSBvYmoub2Zmc2V0VG9wO1xuICAgIH0gd2hpbGUgKG9iaiA9IG9iai5vZmZzZXRQYXJlbnQpO1xuICB9XG5cbiAgcmV0dXJuIFtjdXJsZWZ0LCBjdXJ0b3BdO1xufTtcblxudmFyIEdNYXBzID0gKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgZG9jID0gZG9jdW1lbnQ7XG5cbiAgdmFyIEdNYXBzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmICghdGhpcykgcmV0dXJuIG5ldyBHTWFwcyhvcHRpb25zKTtcblxuICAgIG9wdGlvbnMuem9vbSA9IG9wdGlvbnMuem9vbSB8fCAxNTtcbiAgICBvcHRpb25zLm1hcFR5cGUgPSBvcHRpb25zLm1hcFR5cGUgfHwgJ3JvYWRtYXAnO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICBpLFxuICAgICAgICBldmVudHNfdGhhdF9oaWRlX2NvbnRleHRfbWVudSA9IFtcbiAgICAgICAgICAnYm91bmRzX2NoYW5nZWQnLCAnY2VudGVyX2NoYW5nZWQnLCAnY2xpY2snLCAnZGJsY2xpY2snLCAnZHJhZycsXG4gICAgICAgICAgJ2RyYWdlbmQnLCAnZHJhZ3N0YXJ0JywgJ2lkbGUnLCAnbWFwdHlwZWlkX2NoYW5nZWQnLCAncHJvamVjdGlvbl9jaGFuZ2VkJyxcbiAgICAgICAgICAncmVzaXplJywgJ3RpbGVzbG9hZGVkJywgJ3pvb21fY2hhbmdlZCdcbiAgICAgICAgXSxcbiAgICAgICAgZXZlbnRzX3RoYXRfZG9lc250X2hpZGVfY29udGV4dF9tZW51ID0gWydtb3VzZW1vdmUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJ10sXG4gICAgICAgIG9wdGlvbnNfdG9fYmVfZGVsZXRlZCA9IFsnZWwnLCAnbGF0JywgJ2xuZycsICdtYXBUeXBlJywgJ3dpZHRoJywgJ2hlaWdodCcsICdtYXJrZXJDbHVzdGVyZXInLCAnZW5hYmxlTmV3U3R5bGUnXSxcbiAgICAgICAgaWRlbnRpZmllciA9IG9wdGlvbnMuZWwgfHwgb3B0aW9ucy5kaXYsXG4gICAgICAgIG1hcmtlckNsdXN0ZXJlckZ1bmN0aW9uID0gb3B0aW9ucy5tYXJrZXJDbHVzdGVyZXIsXG4gICAgICAgIG1hcFR5cGUgPSBnb29nbGUubWFwcy5NYXBUeXBlSWRbb3B0aW9ucy5tYXBUeXBlLnRvVXBwZXJDYXNlKCldLFxuICAgICAgICBtYXBfY2VudGVyID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmxhdCwgb3B0aW9ucy5sbmcpLFxuICAgICAgICB6b29tQ29udHJvbCA9IG9wdGlvbnMuem9vbUNvbnRyb2wgfHwgdHJ1ZSxcbiAgICAgICAgem9vbUNvbnRyb2xPcHQgPSBvcHRpb25zLnpvb21Db250cm9sT3B0IHx8IHtcbiAgICAgICAgICBzdHlsZTogJ0RFRkFVTFQnLFxuICAgICAgICAgIHBvc2l0aW9uOiAnVE9QX0xFRlQnXG4gICAgICAgIH0sXG4gICAgICAgIHpvb21Db250cm9sU3R5bGUgPSB6b29tQ29udHJvbE9wdC5zdHlsZSB8fCAnREVGQVVMVCcsXG4gICAgICAgIHpvb21Db250cm9sUG9zaXRpb24gPSB6b29tQ29udHJvbE9wdC5wb3NpdGlvbiB8fCAnVE9QX0xFRlQnLFxuICAgICAgICBwYW5Db250cm9sID0gb3B0aW9ucy5wYW5Db250cm9sIHx8IHRydWUsXG4gICAgICAgIG1hcFR5cGVDb250cm9sID0gb3B0aW9ucy5tYXBUeXBlQ29udHJvbCB8fCB0cnVlLFxuICAgICAgICBzY2FsZUNvbnRyb2wgPSBvcHRpb25zLnNjYWxlQ29udHJvbCB8fCB0cnVlLFxuICAgICAgICBzdHJlZXRWaWV3Q29udHJvbCA9IG9wdGlvbnMuc3RyZWV0Vmlld0NvbnRyb2wgfHwgdHJ1ZSxcbiAgICAgICAgb3ZlcnZpZXdNYXBDb250cm9sID0gb3ZlcnZpZXdNYXBDb250cm9sIHx8IHRydWUsXG4gICAgICAgIG1hcF9vcHRpb25zID0ge30sXG4gICAgICAgIG1hcF9iYXNlX29wdGlvbnMgPSB7XG4gICAgICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgICAgIGNlbnRlcjogbWFwX2NlbnRlcixcbiAgICAgICAgICBtYXBUeXBlSWQ6IG1hcFR5cGVcbiAgICAgICAgfSxcbiAgICAgICAgbWFwX2NvbnRyb2xzX29wdGlvbnMgPSB7XG4gICAgICAgICAgcGFuQ29udHJvbDogcGFuQ29udHJvbCxcbiAgICAgICAgICB6b29tQ29udHJvbDogem9vbUNvbnRyb2wsXG4gICAgICAgICAgem9vbUNvbnRyb2xPcHRpb25zOiB7XG4gICAgICAgICAgICBzdHlsZTogZ29vZ2xlLm1hcHMuWm9vbUNvbnRyb2xTdHlsZVt6b29tQ29udHJvbFN0eWxlXSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb25bem9vbUNvbnRyb2xQb3NpdGlvbl1cbiAgICAgICAgICB9LFxuICAgICAgICAgIG1hcFR5cGVDb250cm9sOiBtYXBUeXBlQ29udHJvbCxcbiAgICAgICAgICBzY2FsZUNvbnRyb2w6IHNjYWxlQ29udHJvbCxcbiAgICAgICAgICBzdHJlZXRWaWV3Q29udHJvbDogc3RyZWV0Vmlld0NvbnRyb2wsXG4gICAgICAgICAgb3ZlcnZpZXdNYXBDb250cm9sOiBvdmVydmlld01hcENvbnRyb2xcbiAgICAgICAgfTtcblxuICAgICAgaWYgKHR5cGVvZihvcHRpb25zLmVsKSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mKG9wdGlvbnMuZGl2KSA9PT0gJ3N0cmluZycpIHtcblxuICAgICAgICAgIGlmIChpZGVudGlmaWVyLmluZGV4T2YoXCIjXCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgdGhpcy5lbCA9IGdldEVsZW1lbnRCeUlkKGlkZW50aWZpZXIsIG9wdGlvbnMuY29udGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5lbCA9IGdldEVsZW1lbnRzQnlDbGFzc05hbWUuYXBwbHkodGhpcywgW2lkZW50aWZpZXIsIG9wdGlvbnMuY29udGV4dF0pO1xuICAgICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmVsID0gaWRlbnRpZmllcjtcbiAgICAgIH1cblxuICAgIGlmICh0eXBlb2YodGhpcy5lbCkgPT09ICd1bmRlZmluZWQnIHx8IHRoaXMuZWwgPT09IG51bGwpIHtcbiAgICAgIHRocm93ICdObyBlbGVtZW50IGRlZmluZWQuJztcbiAgICB9XG5cbiAgICB3aW5kb3cuY29udGV4dF9tZW51ID0gd2luZG93LmNvbnRleHRfbWVudSB8fCB7fTtcbiAgICB3aW5kb3cuY29udGV4dF9tZW51W3NlbGYuZWwuaWRdID0ge307XG5cbiAgICB0aGlzLmNvbnRyb2xzID0gW107XG4gICAgdGhpcy5vdmVybGF5cyA9IFtdO1xuICAgIHRoaXMubGF5ZXJzID0gW107IC8vIGFycmF5IHdpdGgga21sL2dlb3JzcyBhbmQgZnVzaW9udGFibGVzIGxheWVycywgY2FuIGJlIGFzIG1hbnlcbiAgICB0aGlzLnNpbmdsZUxheWVycyA9IHt9OyAvLyBvYmplY3Qgd2l0aCB0aGUgb3RoZXIgbGF5ZXJzLCBvbmx5IG9uZSBwZXIgbGF5ZXJcbiAgICB0aGlzLm1hcmtlcnMgPSBbXTtcbiAgICB0aGlzLnBvbHlsaW5lcyA9IFtdO1xuICAgIHRoaXMucm91dGVzID0gW107XG4gICAgdGhpcy5wb2x5Z29ucyA9IFtdO1xuICAgIHRoaXMuaW5mb1dpbmRvdyA9IG51bGw7XG4gICAgdGhpcy5vdmVybGF5X2VsID0gbnVsbDtcbiAgICB0aGlzLnpvb20gPSBvcHRpb25zLnpvb207XG4gICAgdGhpcy5yZWdpc3RlcmVkX2V2ZW50cyA9IHt9O1xuXG4gICAgdGhpcy5lbC5zdHlsZS53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgdGhpcy5lbC5zY3JvbGxXaWR0aCB8fCB0aGlzLmVsLm9mZnNldFdpZHRoO1xuICAgIHRoaXMuZWwuc3R5bGUuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgdGhpcy5lbC5zY3JvbGxIZWlnaHQgfHwgdGhpcy5lbC5vZmZzZXRIZWlnaHQ7XG5cbiAgICBnb29nbGUubWFwcy52aXN1YWxSZWZyZXNoID0gb3B0aW9ucy5lbmFibGVOZXdTdHlsZTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBvcHRpb25zX3RvX2JlX2RlbGV0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRlbGV0ZSBvcHRpb25zW29wdGlvbnNfdG9fYmVfZGVsZXRlZFtpXV07XG4gICAgfVxuXG4gICAgaWYob3B0aW9ucy5kaXNhYmxlRGVmYXVsdFVJICE9IHRydWUpIHtcbiAgICAgIG1hcF9iYXNlX29wdGlvbnMgPSBleHRlbmRfb2JqZWN0KG1hcF9iYXNlX29wdGlvbnMsIG1hcF9jb250cm9sc19vcHRpb25zKTtcbiAgICB9XG5cbiAgICBtYXBfb3B0aW9ucyA9IGV4dGVuZF9vYmplY3QobWFwX2Jhc2Vfb3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnRzX3RoYXRfaGlkZV9jb250ZXh0X21lbnUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRlbGV0ZSBtYXBfb3B0aW9uc1tldmVudHNfdGhhdF9oaWRlX2NvbnRleHRfbWVudVtpXV07XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGV2ZW50c190aGF0X2RvZXNudF9oaWRlX2NvbnRleHRfbWVudS5sZW5ndGg7IGkrKykge1xuICAgICAgZGVsZXRlIG1hcF9vcHRpb25zW2V2ZW50c190aGF0X2RvZXNudF9oaWRlX2NvbnRleHRfbWVudVtpXV07XG4gICAgfVxuXG4gICAgdGhpcy5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMuZWwsIG1hcF9vcHRpb25zKTtcblxuICAgIGlmIChtYXJrZXJDbHVzdGVyZXJGdW5jdGlvbikge1xuICAgICAgdGhpcy5tYXJrZXJDbHVzdGVyZXIgPSBtYXJrZXJDbHVzdGVyZXJGdW5jdGlvbi5hcHBseSh0aGlzLCBbdGhpcy5tYXBdKTtcbiAgICB9XG5cbiAgICB2YXIgYnVpbGRDb250ZXh0TWVudUhUTUwgPSBmdW5jdGlvbihjb250cm9sLCBlKSB7XG4gICAgICB2YXIgaHRtbCA9ICcnLFxuICAgICAgICAgIG9wdGlvbnMgPSB3aW5kb3cuY29udGV4dF9tZW51W3NlbGYuZWwuaWRdW2NvbnRyb2xdO1xuXG4gICAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpe1xuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgIHZhciBvcHRpb24gPSBvcHRpb25zW2ldO1xuXG4gICAgICAgICAgaHRtbCArPSAnPGxpPjxhIGlkPVwiJyArIGNvbnRyb2wgKyAnXycgKyBpICsgJ1wiIGhyZWY9XCIjXCI+JyArIG9wdGlvbi50aXRsZSArICc8L2E+PC9saT4nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZ2V0RWxlbWVudEJ5SWQoJ2dtYXBzX2NvbnRleHRfbWVudScpKSByZXR1cm47XG5cbiAgICAgIHZhciBjb250ZXh0X21lbnVfZWxlbWVudCA9IGdldEVsZW1lbnRCeUlkKCdnbWFwc19jb250ZXh0X21lbnUnKTtcbiAgICAgIFxuICAgICAgY29udGV4dF9tZW51X2VsZW1lbnQuaW5uZXJIVE1MID0gaHRtbDtcblxuICAgICAgdmFyIGNvbnRleHRfbWVudV9pdGVtcyA9IGNvbnRleHRfbWVudV9lbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdhJyksXG4gICAgICAgICAgY29udGV4dF9tZW51X2l0ZW1zX2NvdW50ID0gY29udGV4dF9tZW51X2l0ZW1zLmxlbmd0aCxcbiAgICAgICAgICBpO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgY29udGV4dF9tZW51X2l0ZW1zX2NvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGNvbnRleHRfbWVudV9pdGVtID0gY29udGV4dF9tZW51X2l0ZW1zW2ldO1xuXG4gICAgICAgIHZhciBhc3NpZ25fbWVudV9pdGVtX2FjdGlvbiA9IGZ1bmN0aW9uKGV2KXtcbiAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgb3B0aW9uc1t0aGlzLmlkLnJlcGxhY2UoY29udHJvbCArICdfJywgJycpXS5hY3Rpb24uYXBwbHkoc2VsZiwgW2VdKTtcbiAgICAgICAgICBzZWxmLmhpZGVDb250ZXh0TWVudSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmNsZWFyTGlzdGVuZXJzKGNvbnRleHRfbWVudV9pdGVtLCAnY2xpY2snKTtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXJPbmNlKGNvbnRleHRfbWVudV9pdGVtLCAnY2xpY2snLCBhc3NpZ25fbWVudV9pdGVtX2FjdGlvbiwgZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcG9zaXRpb24gPSBmaW5kQWJzb2x1dGVQb3NpdGlvbi5hcHBseSh0aGlzLCBbc2VsZi5lbF0pLFxuICAgICAgICAgIGxlZnQgPSBwb3NpdGlvblswXSArIGUucGl4ZWwueCAtIDE1LFxuICAgICAgICAgIHRvcCA9IHBvc2l0aW9uWzFdICsgZS5waXhlbC55LSAxNTtcblxuICAgICAgY29udGV4dF9tZW51X2VsZW1lbnQuc3R5bGUubGVmdCA9IGxlZnQgKyBcInB4XCI7XG4gICAgICBjb250ZXh0X21lbnVfZWxlbWVudC5zdHlsZS50b3AgPSB0b3AgKyBcInB4XCI7XG5cbiAgICAgIGNvbnRleHRfbWVudV9lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIH07XG5cbiAgICB0aGlzLmJ1aWxkQ29udGV4dE1lbnUgPSBmdW5jdGlvbihjb250cm9sLCBlKSB7XG4gICAgICBpZiAoY29udHJvbCA9PT0gJ21hcmtlcicpIHtcbiAgICAgICAgZS5waXhlbCA9IHt9O1xuXG4gICAgICAgIHZhciBvdmVybGF5ID0gbmV3IGdvb2dsZS5tYXBzLk92ZXJsYXlWaWV3KCk7XG4gICAgICAgIG92ZXJsYXkuc2V0TWFwKHNlbGYubWFwKTtcbiAgICAgICAgXG4gICAgICAgIG92ZXJsYXkuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBwcm9qZWN0aW9uID0gb3ZlcmxheS5nZXRQcm9qZWN0aW9uKCksXG4gICAgICAgICAgICAgIHBvc2l0aW9uID0gZS5tYXJrZXIuZ2V0UG9zaXRpb24oKTtcbiAgICAgICAgICBcbiAgICAgICAgICBlLnBpeGVsID0gcHJvamVjdGlvbi5mcm9tTGF0TG5nVG9Db250YWluZXJQaXhlbChwb3NpdGlvbik7XG5cbiAgICAgICAgICBidWlsZENvbnRleHRNZW51SFRNTChjb250cm9sLCBlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBidWlsZENvbnRleHRNZW51SFRNTChjb250cm9sLCBlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5zZXRDb250ZXh0TWVudSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHdpbmRvdy5jb250ZXh0X21lbnVbc2VsZi5lbC5pZF1bb3B0aW9ucy5jb250cm9sXSA9IHt9O1xuXG4gICAgICB2YXIgaSxcbiAgICAgICAgICB1bCA9IGRvYy5jcmVhdGVFbGVtZW50KCd1bCcpO1xuXG4gICAgICBmb3IgKGkgaW4gb3B0aW9ucy5vcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLm9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICB2YXIgb3B0aW9uID0gb3B0aW9ucy5vcHRpb25zW2ldO1xuXG4gICAgICAgICAgd2luZG93LmNvbnRleHRfbWVudVtzZWxmLmVsLmlkXVtvcHRpb25zLmNvbnRyb2xdW29wdGlvbi5uYW1lXSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiBvcHRpb24udGl0bGUsXG4gICAgICAgICAgICBhY3Rpb246IG9wdGlvbi5hY3Rpb25cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHVsLmlkID0gJ2dtYXBzX2NvbnRleHRfbWVudSc7XG4gICAgICB1bC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdWwuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgdWwuc3R5bGUubWluV2lkdGggPSAnMTAwcHgnO1xuICAgICAgdWwuc3R5bGUuYmFja2dyb3VuZCA9ICd3aGl0ZSc7XG4gICAgICB1bC5zdHlsZS5saXN0U3R5bGUgPSAnbm9uZSc7XG4gICAgICB1bC5zdHlsZS5wYWRkaW5nID0gJzhweCc7XG4gICAgICB1bC5zdHlsZS5ib3hTaGFkb3cgPSAnMnB4IDJweCA2cHggI2NjYyc7XG5cbiAgICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKHVsKTtcblxuICAgICAgdmFyIGNvbnRleHRfbWVudV9lbGVtZW50ID0gZ2V0RWxlbWVudEJ5SWQoJ2dtYXBzX2NvbnRleHRfbWVudScpXG5cbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKGNvbnRleHRfbWVudV9lbGVtZW50LCAnbW91c2VvdXQnLCBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAoIWV2LnJlbGF0ZWRUYXJnZXQgfHwgIXRoaXMuY29udGFpbnMoZXYucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgY29udGV4dF9tZW51X2VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICB9LCA0MDApO1xuICAgICAgICB9XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfTtcblxuICAgIHRoaXMuaGlkZUNvbnRleHRNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29udGV4dF9tZW51X2VsZW1lbnQgPSBnZXRFbGVtZW50QnlJZCgnZ21hcHNfY29udGV4dF9tZW51Jyk7XG5cbiAgICAgIGlmIChjb250ZXh0X21lbnVfZWxlbWVudCkge1xuICAgICAgICBjb250ZXh0X21lbnVfZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgc2V0dXBMaXN0ZW5lciA9IGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgaWYgKGUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZSA9IHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG5cbiAgICAgICAgc2VsZi5oaWRlQ29udGV4dE1lbnUoKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvL2dvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFwLCAnaWRsZScsIHRoaXMuaGlkZUNvbnRleHRNZW51KTtcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLm1hcCwgJ3pvb21fY2hhbmdlZCcsIHRoaXMuaGlkZUNvbnRleHRNZW51KTtcblxuICAgIGZvciAodmFyIGV2ID0gMDsgZXYgPCBldmVudHNfdGhhdF9oaWRlX2NvbnRleHRfbWVudS5sZW5ndGg7IGV2KyspIHtcbiAgICAgIHZhciBuYW1lID0gZXZlbnRzX3RoYXRfaGlkZV9jb250ZXh0X21lbnVbZXZdO1xuXG4gICAgICBpZiAobmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgIHNldHVwTGlzdGVuZXIodGhpcy5tYXAsIG5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGV2ID0gMDsgZXYgPCBldmVudHNfdGhhdF9kb2VzbnRfaGlkZV9jb250ZXh0X21lbnUubGVuZ3RoOyBldisrKSB7XG4gICAgICB2YXIgbmFtZSA9IGV2ZW50c190aGF0X2RvZXNudF9oaWRlX2NvbnRleHRfbWVudVtldl07XG5cbiAgICAgIGlmIChuYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgICAgc2V0dXBMaXN0ZW5lcih0aGlzLm1hcCwgbmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXAsICdyaWdodGNsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKG9wdGlvbnMucmlnaHRjbGljaykge1xuICAgICAgICBvcHRpb25zLnJpZ2h0Y2xpY2suYXBwbHkodGhpcywgW2VdKTtcbiAgICAgIH1cblxuICAgICAgaWYod2luZG93LmNvbnRleHRfbWVudVtzZWxmLmVsLmlkXVsnbWFwJ10gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNlbGYuYnVpbGRDb250ZXh0TWVudSgnbWFwJywgZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIodGhpcy5tYXAsICdyZXNpemUnKTtcbiAgICB9O1xuXG4gICAgdGhpcy5maXRab29tID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGF0TG5ncyA9IFtdLFxuICAgICAgICAgIG1hcmtlcnNfbGVuZ3RoID0gdGhpcy5tYXJrZXJzLmxlbmd0aCxcbiAgICAgICAgICBpO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbWFya2Vyc19sZW5ndGg7IGkrKykge1xuICAgICAgICBpZih0eXBlb2YodGhpcy5tYXJrZXJzW2ldLnZpc2libGUpID09PSAnYm9vbGVhbicgJiYgdGhpcy5tYXJrZXJzW2ldLnZpc2libGUpIHtcbiAgICAgICAgICBsYXRMbmdzLnB1c2godGhpcy5tYXJrZXJzW2ldLmdldFBvc2l0aW9uKCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZml0TGF0TG5nQm91bmRzKGxhdExuZ3MpO1xuICAgIH07XG5cbiAgICB0aGlzLmZpdExhdExuZ0JvdW5kcyA9IGZ1bmN0aW9uKGxhdExuZ3MpIHtcbiAgICAgIHZhciB0b3RhbCA9IGxhdExuZ3MubGVuZ3RoLFxuICAgICAgICAgIGJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKSxcbiAgICAgICAgICBpO1xuXG4gICAgICBmb3IoaSA9IDA7IGkgPCB0b3RhbDsgaSsrKSB7XG4gICAgICAgIGJvdW5kcy5leHRlbmQobGF0TG5nc1tpXSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubWFwLmZpdEJvdW5kcyhib3VuZHMpO1xuICAgIH07XG5cbiAgICB0aGlzLnNldENlbnRlciA9IGZ1bmN0aW9uKGxhdCwgbG5nLCBjYWxsYmFjaykge1xuICAgICAgdGhpcy5tYXAucGFuVG8obmV3IGdvb2dsZS5tYXBzLkxhdExuZyhsYXQsIGxuZykpO1xuXG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5nZXRFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5lbDtcbiAgICB9O1xuXG4gICAgdGhpcy56b29tSW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZSB8fCAxO1xuXG4gICAgICB0aGlzLnpvb20gPSB0aGlzLm1hcC5nZXRab29tKCkgKyB2YWx1ZTtcbiAgICAgIHRoaXMubWFwLnNldFpvb20odGhpcy56b29tKTtcbiAgICB9O1xuXG4gICAgdGhpcy56b29tT3V0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUgfHwgMTtcblxuICAgICAgdGhpcy56b29tID0gdGhpcy5tYXAuZ2V0Wm9vbSgpIC0gdmFsdWU7XG4gICAgICB0aGlzLm1hcC5zZXRab29tKHRoaXMuem9vbSk7XG4gICAgfTtcblxuICAgIHZhciBuYXRpdmVfbWV0aG9kcyA9IFtdLFxuICAgICAgICBtZXRob2Q7XG5cbiAgICBmb3IgKG1ldGhvZCBpbiB0aGlzLm1hcCkge1xuICAgICAgaWYgKHR5cGVvZih0aGlzLm1hcFttZXRob2RdKSA9PSAnZnVuY3Rpb24nICYmICF0aGlzW21ldGhvZF0pIHtcbiAgICAgICAgbmF0aXZlX21ldGhvZHMucHVzaChtZXRob2QpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBuYXRpdmVfbWV0aG9kcy5sZW5ndGg7IGkrKykge1xuICAgICAgKGZ1bmN0aW9uKGdtYXBzLCBzY29wZSwgbWV0aG9kX25hbWUpIHtcbiAgICAgICAgZ21hcHNbbWV0aG9kX25hbWVdID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICByZXR1cm4gc2NvcGVbbWV0aG9kX25hbWVdLmFwcGx5KHNjb3BlLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcywgdGhpcy5tYXAsIG5hdGl2ZV9tZXRob2RzW2ldKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEdNYXBzO1xufSkodGhpcyk7XG5cbkdNYXBzLnByb3RvdHlwZS5jcmVhdGVDb250cm9sID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgY29udHJvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIGNvbnRyb2wuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICBcbiAgaWYgKG9wdGlvbnMuZGlzYWJsZURlZmF1bHRTdHlsZXMgIT09IHRydWUpIHtcbiAgICBjb250cm9sLnN0eWxlLmZvbnRGYW1pbHkgPSAnUm9ib3RvLCBBcmlhbCwgc2Fucy1zZXJpZic7XG4gICAgY29udHJvbC5zdHlsZS5mb250U2l6ZSA9ICcxMXB4JztcbiAgICBjb250cm9sLnN0eWxlLmJveFNoYWRvdyA9ICdyZ2JhKDAsIDAsIDAsIDAuMjk4MDM5KSAwcHggMXB4IDRweCAtMXB4JztcbiAgfVxuXG4gIGZvciAodmFyIG9wdGlvbiBpbiBvcHRpb25zLnN0eWxlKSB7XG4gICAgY29udHJvbC5zdHlsZVtvcHRpb25dID0gb3B0aW9ucy5zdHlsZVtvcHRpb25dO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuaWQpIHtcbiAgICBjb250cm9sLmlkID0gb3B0aW9ucy5pZDtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNsYXNzZXMpIHtcbiAgICBjb250cm9sLmNsYXNzTmFtZSA9IG9wdGlvbnMuY2xhc3NlcztcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNvbnRlbnQpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29udGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnRyb2wuaW5uZXJIVE1MID0gb3B0aW9ucy5jb250ZW50O1xuICAgIH1cbiAgICBlbHNlIGlmIChvcHRpb25zLmNvbnRlbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgY29udHJvbC5hcHBlbmRDaGlsZChvcHRpb25zLmNvbnRlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRpb25zLnBvc2l0aW9uKSB7XG4gICAgY29udHJvbC5wb3NpdGlvbiA9IGdvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbltvcHRpb25zLnBvc2l0aW9uLnRvVXBwZXJDYXNlKCldO1xuICB9XG5cbiAgZm9yICh2YXIgZXYgaW4gb3B0aW9ucy5ldmVudHMpIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGREb21MaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKCl7XG4gICAgICAgIG9wdGlvbnMuZXZlbnRzW25hbWVdLmFwcGx5KHRoaXMsIFt0aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KShjb250cm9sLCBldik7XG4gIH1cblxuICBjb250cm9sLmluZGV4ID0gMTtcblxuICByZXR1cm4gY29udHJvbDtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRDb250cm9sID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgY29udHJvbCA9IHRoaXMuY3JlYXRlQ29udHJvbChvcHRpb25zKTtcbiAgXG4gIHRoaXMuY29udHJvbHMucHVzaChjb250cm9sKTtcbiAgdGhpcy5tYXAuY29udHJvbHNbY29udHJvbC5wb3NpdGlvbl0ucHVzaChjb250cm9sKTtcblxuICByZXR1cm4gY29udHJvbDtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVDb250cm9sID0gZnVuY3Rpb24oY29udHJvbCkge1xuICB2YXIgcG9zaXRpb24gPSBudWxsLFxuICAgICAgaTtcblxuICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5jb250cm9scy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLmNvbnRyb2xzW2ldID09IGNvbnRyb2wpIHtcbiAgICAgIHBvc2l0aW9uID0gdGhpcy5jb250cm9sc1tpXS5wb3NpdGlvbjtcbiAgICAgIHRoaXMuY29udHJvbHMuc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChwb3NpdGlvbikge1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm1hcC5jb250cm9scy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvbnRyb2xzRm9yUG9zaXRpb24gPSB0aGlzLm1hcC5jb250cm9sc1tjb250cm9sLnBvc2l0aW9uXTtcblxuICAgICAgaWYgKGNvbnRyb2xzRm9yUG9zaXRpb24uZ2V0QXQoaSkgPT0gY29udHJvbCkge1xuICAgICAgICBjb250cm9sc0ZvclBvc2l0aW9uLnJlbW92ZUF0KGkpO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb250cm9sO1xufTtcblxuR01hcHMucHJvdG90eXBlLmNyZWF0ZU1hcmtlciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMubGF0ID09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmxuZyA9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5wb3NpdGlvbiA9PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyAnTm8gbGF0aXR1ZGUgb3IgbG9uZ2l0dWRlIGRlZmluZWQuJztcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIGRldGFpbHMgPSBvcHRpb25zLmRldGFpbHMsXG4gICAgICBmZW5jZXMgPSBvcHRpb25zLmZlbmNlcyxcbiAgICAgIG91dHNpZGUgPSBvcHRpb25zLm91dHNpZGUsXG4gICAgICBiYXNlX29wdGlvbnMgPSB7XG4gICAgICAgIHBvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMubGF0LCBvcHRpb25zLmxuZyksXG4gICAgICAgIG1hcDogbnVsbFxuICAgICAgfSxcbiAgICAgIG1hcmtlcl9vcHRpb25zID0gZXh0ZW5kX29iamVjdChiYXNlX29wdGlvbnMsIG9wdGlvbnMpO1xuXG4gIGRlbGV0ZSBtYXJrZXJfb3B0aW9ucy5sYXQ7XG4gIGRlbGV0ZSBtYXJrZXJfb3B0aW9ucy5sbmc7XG4gIGRlbGV0ZSBtYXJrZXJfb3B0aW9ucy5mZW5jZXM7XG4gIGRlbGV0ZSBtYXJrZXJfb3B0aW9ucy5vdXRzaWRlO1xuXG4gIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKG1hcmtlcl9vcHRpb25zKTtcblxuICBtYXJrZXIuZmVuY2VzID0gZmVuY2VzO1xuXG4gIGlmIChvcHRpb25zLmluZm9XaW5kb3cpIHtcbiAgICBtYXJrZXIuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KG9wdGlvbnMuaW5mb1dpbmRvdyk7XG5cbiAgICB2YXIgaW5mb193aW5kb3dfZXZlbnRzID0gWydjbG9zZWNsaWNrJywgJ2NvbnRlbnRfY2hhbmdlZCcsICdkb21yZWFkeScsICdwb3NpdGlvbl9jaGFuZ2VkJywgJ3ppbmRleF9jaGFuZ2VkJ107XG5cbiAgICBmb3IgKHZhciBldiA9IDA7IGV2IDwgaW5mb193aW5kb3dfZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgICBpZiAob3B0aW9ucy5pbmZvV2luZG93W25hbWVdKSB7XG4gICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIG9wdGlvbnMuaW5mb1dpbmRvd1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KShtYXJrZXIuaW5mb1dpbmRvdywgaW5mb193aW5kb3dfZXZlbnRzW2V2XSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIG1hcmtlcl9ldmVudHMgPSBbJ2FuaW1hdGlvbl9jaGFuZ2VkJywgJ2NsaWNrYWJsZV9jaGFuZ2VkJywgJ2N1cnNvcl9jaGFuZ2VkJywgJ2RyYWdnYWJsZV9jaGFuZ2VkJywgJ2ZsYXRfY2hhbmdlZCcsICdpY29uX2NoYW5nZWQnLCAncG9zaXRpb25fY2hhbmdlZCcsICdzaGFkb3dfY2hhbmdlZCcsICdzaGFwZV9jaGFuZ2VkJywgJ3RpdGxlX2NoYW5nZWQnLCAndmlzaWJsZV9jaGFuZ2VkJywgJ3ppbmRleF9jaGFuZ2VkJ107XG5cbiAgdmFyIG1hcmtlcl9ldmVudHNfd2l0aF9tb3VzZSA9IFsnZGJsY2xpY2snLCAnZHJhZycsICdkcmFnZW5kJywgJ2RyYWdzdGFydCcsICdtb3VzZWRvd24nLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJywgJ21vdXNldXAnXTtcblxuICBmb3IgKHZhciBldiA9IDA7IGV2IDwgbWFya2VyX2V2ZW50cy5sZW5ndGg7IGV2KyspIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbdGhpc10pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KShtYXJrZXIsIG1hcmtlcl9ldmVudHNbZXZdKTtcbiAgfVxuXG4gIGZvciAodmFyIGV2ID0gMDsgZXYgPCBtYXJrZXJfZXZlbnRzX3dpdGhfbW91c2UubGVuZ3RoOyBldisrKSB7XG4gICAgKGZ1bmN0aW9uKG1hcCwgb2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKG1lKXtcbiAgICAgICAgICBpZighbWUucGl4ZWwpe1xuICAgICAgICAgICAgbWUucGl4ZWwgPSBtYXAuZ2V0UHJvamVjdGlvbigpLmZyb21MYXRMbmdUb1BvaW50KG1lLmxhdExuZylcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbbWVdKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkodGhpcy5tYXAsIG1hcmtlciwgbWFya2VyX2V2ZW50c193aXRoX21vdXNlW2V2XSk7XG4gIH1cblxuICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZGV0YWlscyA9IGRldGFpbHM7XG5cbiAgICBpZiAob3B0aW9ucy5jbGljaykge1xuICAgICAgb3B0aW9ucy5jbGljay5hcHBseSh0aGlzLCBbdGhpc10pO1xuICAgIH1cblxuICAgIGlmIChtYXJrZXIuaW5mb1dpbmRvdykge1xuICAgICAgc2VsZi5oaWRlSW5mb1dpbmRvd3MoKTtcbiAgICAgIG1hcmtlci5pbmZvV2luZG93Lm9wZW4oc2VsZi5tYXAsIG1hcmtlcik7XG4gICAgfVxuICB9KTtcblxuICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdyaWdodGNsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUubWFya2VyID0gdGhpcztcblxuICAgIGlmIChvcHRpb25zLnJpZ2h0Y2xpY2spIHtcbiAgICAgIG9wdGlvbnMucmlnaHRjbGljay5hcHBseSh0aGlzLCBbZV0pO1xuICAgIH1cblxuICAgIGlmICh3aW5kb3cuY29udGV4dF9tZW51W3NlbGYuZWwuaWRdWydtYXJrZXInXSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHNlbGYuYnVpbGRDb250ZXh0TWVudSgnbWFya2VyJywgZSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAobWFya2VyLmZlbmNlcykge1xuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2RyYWdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2hlY2tNYXJrZXJHZW9mZW5jZShtYXJrZXIsIGZ1bmN0aW9uKG0sIGYpIHtcbiAgICAgICAgb3V0c2lkZShtLCBmKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIG1hcmtlcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5hZGRNYXJrZXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBtYXJrZXI7XG4gIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2dtX2FjY2Vzc29yc18nKSkge1xuICAgIC8vIE5hdGl2ZSBnb29nbGUubWFwcy5NYXJrZXIgb2JqZWN0XG4gICAgbWFya2VyID0gb3B0aW9ucztcbiAgfVxuICBlbHNlIHtcbiAgICBpZiAoKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xhdCcpICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xuZycpKSB8fCBvcHRpb25zLnBvc2l0aW9uKSB7XG4gICAgICBtYXJrZXIgPSB0aGlzLmNyZWF0ZU1hcmtlcihvcHRpb25zKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyAnTm8gbGF0aXR1ZGUgb3IgbG9uZ2l0dWRlIGRlZmluZWQuJztcbiAgICB9XG4gIH1cblxuICBtYXJrZXIuc2V0TWFwKHRoaXMubWFwKTtcblxuICBpZih0aGlzLm1hcmtlckNsdXN0ZXJlcikge1xuICAgIHRoaXMubWFya2VyQ2x1c3RlcmVyLmFkZE1hcmtlcihtYXJrZXIpO1xuICB9XG5cbiAgdGhpcy5tYXJrZXJzLnB1c2gobWFya2VyKTtcblxuICBHTWFwcy5maXJlKCdtYXJrZXJfYWRkZWQnLCBtYXJrZXIsIHRoaXMpO1xuXG4gIHJldHVybiBtYXJrZXI7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkTWFya2VycyA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gIGZvciAodmFyIGkgPSAwLCBtYXJrZXI7IG1hcmtlcj1hcnJheVtpXTsgaSsrKSB7XG4gICAgdGhpcy5hZGRNYXJrZXIobWFya2VyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLm1hcmtlcnM7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuaGlkZUluZm9XaW5kb3dzID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwLCBtYXJrZXI7IG1hcmtlciA9IHRoaXMubWFya2Vyc1tpXTsgaSsrKXtcbiAgICBpZiAobWFya2VyLmluZm9XaW5kb3cpIHtcbiAgICAgIG1hcmtlci5pbmZvV2luZG93LmNsb3NlKCk7XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlTWFya2VyID0gZnVuY3Rpb24obWFya2VyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMubWFya2Vyc1tpXSA9PT0gbWFya2VyKSB7XG4gICAgICB0aGlzLm1hcmtlcnNbaV0uc2V0TWFwKG51bGwpO1xuICAgICAgdGhpcy5tYXJrZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgaWYodGhpcy5tYXJrZXJDbHVzdGVyZXIpIHtcbiAgICAgICAgdGhpcy5tYXJrZXJDbHVzdGVyZXIucmVtb3ZlTWFya2VyKG1hcmtlcik7XG4gICAgICB9XG5cbiAgICAgIEdNYXBzLmZpcmUoJ21hcmtlcl9yZW1vdmVkJywgbWFya2VyLCB0aGlzKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1hcmtlcjtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVNYXJrZXJzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgdmFyIG5ld19tYXJrZXJzID0gW107XG5cbiAgaWYgKHR5cGVvZiBjb2xsZWN0aW9uID09ICd1bmRlZmluZWQnKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcnNbaV07XG4gICAgICBtYXJrZXIuc2V0TWFwKG51bGwpO1xuXG4gICAgICBpZih0aGlzLm1hcmtlckNsdXN0ZXJlcikge1xuICAgICAgICB0aGlzLm1hcmtlckNsdXN0ZXJlci5yZW1vdmVNYXJrZXIobWFya2VyKTtcbiAgICAgIH1cblxuICAgICAgR01hcHMuZmlyZSgnbWFya2VyX3JlbW92ZWQnLCBtYXJrZXIsIHRoaXMpO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLm1hcmtlcnMgPSBuZXdfbWFya2VycztcbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpbmRleCA9IHRoaXMubWFya2Vycy5pbmRleE9mKGNvbGxlY3Rpb25baV0pO1xuXG4gICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXJzW2luZGV4XTtcbiAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcblxuICAgICAgICBpZih0aGlzLm1hcmtlckNsdXN0ZXJlcikge1xuICAgICAgICAgIHRoaXMubWFya2VyQ2x1c3RlcmVyLnJlbW92ZU1hcmtlcihtYXJrZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgR01hcHMuZmlyZSgnbWFya2VyX3JlbW92ZWQnLCBtYXJrZXIsIHRoaXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXJzW2ldO1xuICAgICAgaWYgKG1hcmtlci5nZXRNYXAoKSAhPSBudWxsKSB7XG4gICAgICAgIG5ld19tYXJrZXJzLnB1c2gobWFya2VyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm1hcmtlcnMgPSBuZXdfbWFya2VycztcbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLmRyYXdPdmVybGF5ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgb3ZlcmxheSA9IG5ldyBnb29nbGUubWFwcy5PdmVybGF5VmlldygpLFxuICAgICAgYXV0b19zaG93ID0gdHJ1ZTtcblxuICBvdmVybGF5LnNldE1hcCh0aGlzLm1hcCk7XG5cbiAgaWYgKG9wdGlvbnMuYXV0b19zaG93ICE9IG51bGwpIHtcbiAgICBhdXRvX3Nob3cgPSBvcHRpb25zLmF1dG9fc2hvdztcbiAgfVxuXG4gIG92ZXJsYXkub25BZGQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIGVsLnN0eWxlLmJvcmRlclN0eWxlID0gXCJub25lXCI7XG4gICAgZWwuc3R5bGUuYm9yZGVyV2lkdGggPSBcIjBweFwiO1xuICAgIGVsLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgIGVsLnN0eWxlLnpJbmRleCA9IDEwMDtcbiAgICBlbC5pbm5lckhUTUwgPSBvcHRpb25zLmNvbnRlbnQ7XG5cbiAgICBvdmVybGF5LmVsID0gZWw7XG5cbiAgICBpZiAoIW9wdGlvbnMubGF5ZXIpIHtcbiAgICAgIG9wdGlvbnMubGF5ZXIgPSAnb3ZlcmxheUxheWVyJztcbiAgICB9XG4gICAgXG4gICAgdmFyIHBhbmVzID0gdGhpcy5nZXRQYW5lcygpLFxuICAgICAgICBvdmVybGF5TGF5ZXIgPSBwYW5lc1tvcHRpb25zLmxheWVyXSxcbiAgICAgICAgc3RvcF9vdmVybGF5X2V2ZW50cyA9IFsnY29udGV4dG1lbnUnLCAnRE9NTW91c2VTY3JvbGwnLCAnZGJsY2xpY2snLCAnbW91c2Vkb3duJ107XG5cbiAgICBvdmVybGF5TGF5ZXIuYXBwZW5kQ2hpbGQoZWwpO1xuXG4gICAgZm9yICh2YXIgZXYgPSAwOyBldiA8IHN0b3Bfb3ZlcmxheV9ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdtc2llJykgIT0gLTEgJiYgZG9jdW1lbnQuYWxsKSB7XG4gICAgICAgICAgICBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkoZWwsIHN0b3Bfb3ZlcmxheV9ldmVudHNbZXZdKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5jbGljaykge1xuICAgICAgcGFuZXMub3ZlcmxheU1vdXNlVGFyZ2V0LmFwcGVuZENoaWxkKG92ZXJsYXkuZWwpO1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXIob3ZlcmxheS5lbCwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIG9wdGlvbnMuY2xpY2suYXBwbHkob3ZlcmxheSwgW292ZXJsYXldKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIodGhpcywgJ3JlYWR5Jyk7XG4gIH07XG5cbiAgb3ZlcmxheS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByb2plY3Rpb24gPSB0aGlzLmdldFByb2plY3Rpb24oKSxcbiAgICAgICAgcGl4ZWwgPSBwcm9qZWN0aW9uLmZyb21MYXRMbmdUb0RpdlBpeGVsKG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5sYXQsIG9wdGlvbnMubG5nKSk7XG5cbiAgICBvcHRpb25zLmhvcml6b250YWxPZmZzZXQgPSBvcHRpb25zLmhvcml6b250YWxPZmZzZXQgfHwgMDtcbiAgICBvcHRpb25zLnZlcnRpY2FsT2Zmc2V0ID0gb3B0aW9ucy52ZXJ0aWNhbE9mZnNldCB8fCAwO1xuXG4gICAgdmFyIGVsID0gb3ZlcmxheS5lbCxcbiAgICAgICAgY29udGVudCA9IGVsLmNoaWxkcmVuWzBdLFxuICAgICAgICBjb250ZW50X2hlaWdodCA9IGNvbnRlbnQuY2xpZW50SGVpZ2h0LFxuICAgICAgICBjb250ZW50X3dpZHRoID0gY29udGVudC5jbGllbnRXaWR0aDtcblxuICAgIHN3aXRjaCAob3B0aW9ucy52ZXJ0aWNhbEFsaWduKSB7XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICBlbC5zdHlsZS50b3AgPSAocGl4ZWwueSAtIGNvbnRlbnRfaGVpZ2h0ICsgb3B0aW9ucy52ZXJ0aWNhbE9mZnNldCkgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlICdtaWRkbGUnOlxuICAgICAgICBlbC5zdHlsZS50b3AgPSAocGl4ZWwueSAtIChjb250ZW50X2hlaWdodCAvIDIpICsgb3B0aW9ucy52ZXJ0aWNhbE9mZnNldCkgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIGVsLnN0eWxlLnRvcCA9IChwaXhlbC55ICsgb3B0aW9ucy52ZXJ0aWNhbE9mZnNldCkgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBzd2l0Y2ggKG9wdGlvbnMuaG9yaXpvbnRhbEFsaWduKSB7XG4gICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgZWwuc3R5bGUubGVmdCA9IChwaXhlbC54IC0gY29udGVudF93aWR0aCArIG9wdGlvbnMuaG9yaXpvbnRhbE9mZnNldCkgKyAncHgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICBlbC5zdHlsZS5sZWZ0ID0gKHBpeGVsLnggLSAoY29udGVudF93aWR0aCAvIDIpICsgb3B0aW9ucy5ob3Jpem9udGFsT2Zmc2V0KSArICdweCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICBlbC5zdHlsZS5sZWZ0ID0gKHBpeGVsLnggKyBvcHRpb25zLmhvcml6b250YWxPZmZzZXQpICsgJ3B4JztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgZWwuc3R5bGUuZGlzcGxheSA9IGF1dG9fc2hvdyA/ICdibG9jaycgOiAnbm9uZSc7XG5cbiAgICBpZiAoIWF1dG9fc2hvdykge1xuICAgICAgb3B0aW9ucy5zaG93LmFwcGx5KHRoaXMsIFtlbF0pO1xuICAgIH1cbiAgfTtcblxuICBvdmVybGF5Lm9uUmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsID0gb3ZlcmxheS5lbDtcblxuICAgIGlmIChvcHRpb25zLnJlbW92ZSkge1xuICAgICAgb3B0aW9ucy5yZW1vdmUuYXBwbHkodGhpcywgW2VsXSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgb3ZlcmxheS5lbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG92ZXJsYXkuZWwpO1xuICAgICAgb3ZlcmxheS5lbCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gIHRoaXMub3ZlcmxheXMucHVzaChvdmVybGF5KTtcbiAgcmV0dXJuIG92ZXJsYXk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlT3ZlcmxheSA9IGZ1bmN0aW9uKG92ZXJsYXkpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm92ZXJsYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMub3ZlcmxheXNbaV0gPT09IG92ZXJsYXkpIHtcbiAgICAgIHRoaXMub3ZlcmxheXNbaV0uc2V0TWFwKG51bGwpO1xuICAgICAgdGhpcy5vdmVybGF5cy5zcGxpY2UoaSwgMSk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZU92ZXJsYXlzID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwLCBpdGVtOyBpdGVtID0gdGhpcy5vdmVybGF5c1tpXTsgaSsrKSB7XG4gICAgaXRlbS5zZXRNYXAobnVsbCk7XG4gIH1cblxuICB0aGlzLm92ZXJsYXlzID0gW107XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuZHJhd1BvbHlsaW5lID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgcGF0aCA9IFtdLFxuICAgICAgcG9pbnRzID0gb3B0aW9ucy5wYXRoO1xuXG4gIGlmIChwb2ludHMubGVuZ3RoKSB7XG4gICAgaWYgKHBvaW50c1swXVswXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXRoID0gcG9pbnRzO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsYXRsbmc7IGxhdGxuZyA9IHBvaW50c1tpXTsgaSsrKSB7XG4gICAgICAgIHBhdGgucHVzaChuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGxhdGxuZ1swXSwgbGF0bG5nWzFdKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdmFyIHBvbHlsaW5lX29wdGlvbnMgPSB7XG4gICAgbWFwOiB0aGlzLm1hcCxcbiAgICBwYXRoOiBwYXRoLFxuICAgIHN0cm9rZUNvbG9yOiBvcHRpb25zLnN0cm9rZUNvbG9yLFxuICAgIHN0cm9rZU9wYWNpdHk6IG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSxcbiAgICBzdHJva2VXZWlnaHQ6IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0LFxuICAgIGdlb2Rlc2ljOiBvcHRpb25zLmdlb2Rlc2ljLFxuICAgIGNsaWNrYWJsZTogdHJ1ZSxcbiAgICBlZGl0YWJsZTogZmFsc2UsXG4gICAgdmlzaWJsZTogdHJ1ZVxuICB9O1xuXG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiY2xpY2thYmxlXCIpKSB7XG4gICAgcG9seWxpbmVfb3B0aW9ucy5jbGlja2FibGUgPSBvcHRpb25zLmNsaWNrYWJsZTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiZWRpdGFibGVcIikpIHtcbiAgICBwb2x5bGluZV9vcHRpb25zLmVkaXRhYmxlID0gb3B0aW9ucy5lZGl0YWJsZTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiaWNvbnNcIikpIHtcbiAgICBwb2x5bGluZV9vcHRpb25zLmljb25zID0gb3B0aW9ucy5pY29ucztcbiAgfVxuXG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiekluZGV4XCIpKSB7XG4gICAgcG9seWxpbmVfb3B0aW9ucy56SW5kZXggPSBvcHRpb25zLnpJbmRleDtcbiAgfVxuXG4gIHZhciBwb2x5bGluZSA9IG5ldyBnb29nbGUubWFwcy5Qb2x5bGluZShwb2x5bGluZV9vcHRpb25zKTtcblxuICB2YXIgcG9seWxpbmVfZXZlbnRzID0gWydjbGljaycsICdkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlcicsICdtb3VzZXVwJywgJ3JpZ2h0Y2xpY2snXTtcblxuICBmb3IgKHZhciBldiA9IDA7IGV2IDwgcG9seWxpbmVfZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KShwb2x5bGluZSwgcG9seWxpbmVfZXZlbnRzW2V2XSk7XG4gIH1cblxuICB0aGlzLnBvbHlsaW5lcy5wdXNoKHBvbHlsaW5lKTtcblxuICBHTWFwcy5maXJlKCdwb2x5bGluZV9hZGRlZCcsIHBvbHlsaW5lLCB0aGlzKTtcblxuICByZXR1cm4gcG9seWxpbmU7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlUG9seWxpbmUgPSBmdW5jdGlvbihwb2x5bGluZSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9seWxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMucG9seWxpbmVzW2ldID09PSBwb2x5bGluZSkge1xuICAgICAgdGhpcy5wb2x5bGluZXNbaV0uc2V0TWFwKG51bGwpO1xuICAgICAgdGhpcy5wb2x5bGluZXMuc3BsaWNlKGksIDEpO1xuXG4gICAgICBHTWFwcy5maXJlKCdwb2x5bGluZV9yZW1vdmVkJywgcG9seWxpbmUsIHRoaXMpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVQb2x5bGluZXMgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGl0ZW07IGl0ZW0gPSB0aGlzLnBvbHlsaW5lc1tpXTsgaSsrKSB7XG4gICAgaXRlbS5zZXRNYXAobnVsbCk7XG4gIH1cblxuICB0aGlzLnBvbHlsaW5lcyA9IFtdO1xufTtcblxuR01hcHMucHJvdG90eXBlLmRyYXdDaXJjbGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSAgZXh0ZW5kX29iamVjdCh7XG4gICAgbWFwOiB0aGlzLm1hcCxcbiAgICBjZW50ZXI6IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5sYXQsIG9wdGlvbnMubG5nKVxuICB9LCBvcHRpb25zKTtcblxuICBkZWxldGUgb3B0aW9ucy5sYXQ7XG4gIGRlbGV0ZSBvcHRpb25zLmxuZztcblxuICB2YXIgcG9seWdvbiA9IG5ldyBnb29nbGUubWFwcy5DaXJjbGUob3B0aW9ucyksXG4gICAgICBwb2x5Z29uX2V2ZW50cyA9IFsnY2xpY2snLCAnZGJsY2xpY2snLCAnbW91c2Vkb3duJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnbW91c2V1cCcsICdyaWdodGNsaWNrJ107XG5cbiAgZm9yICh2YXIgZXYgPSAwOyBldiA8IHBvbHlnb25fZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KShwb2x5Z29uLCBwb2x5Z29uX2V2ZW50c1tldl0pO1xuICB9XG5cbiAgdGhpcy5wb2x5Z29ucy5wdXNoKHBvbHlnb24pO1xuXG4gIHJldHVybiBwb2x5Z29uO1xufTtcblxuR01hcHMucHJvdG90eXBlLmRyYXdSZWN0YW5nbGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBleHRlbmRfb2JqZWN0KHtcbiAgICBtYXA6IHRoaXMubWFwXG4gIH0sIG9wdGlvbnMpO1xuXG4gIHZhciBsYXRMbmdCb3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKFxuICAgIG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5ib3VuZHNbMF1bMF0sIG9wdGlvbnMuYm91bmRzWzBdWzFdKSxcbiAgICBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMuYm91bmRzWzFdWzBdLCBvcHRpb25zLmJvdW5kc1sxXVsxXSlcbiAgKTtcblxuICBvcHRpb25zLmJvdW5kcyA9IGxhdExuZ0JvdW5kcztcblxuICB2YXIgcG9seWdvbiA9IG5ldyBnb29nbGUubWFwcy5SZWN0YW5nbGUob3B0aW9ucyksXG4gICAgICBwb2x5Z29uX2V2ZW50cyA9IFsnY2xpY2snLCAnZGJsY2xpY2snLCAnbW91c2Vkb3duJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnbW91c2V1cCcsICdyaWdodGNsaWNrJ107XG5cbiAgZm9yICh2YXIgZXYgPSAwOyBldiA8IHBvbHlnb25fZXZlbnRzLmxlbmd0aDsgZXYrKykge1xuICAgIChmdW5jdGlvbihvYmplY3QsIG5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zW25hbWVdKSB7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG9iamVjdCwgbmFtZSwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KShwb2x5Z29uLCBwb2x5Z29uX2V2ZW50c1tldl0pO1xuICB9XG5cbiAgdGhpcy5wb2x5Z29ucy5wdXNoKHBvbHlnb24pO1xuXG4gIHJldHVybiBwb2x5Z29uO1xufTtcblxuR01hcHMucHJvdG90eXBlLmRyYXdQb2x5Z29uID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgdXNlR2VvSlNPTiA9IGZhbHNlO1xuXG4gIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJ1c2VHZW9KU09OXCIpKSB7XG4gICAgdXNlR2VvSlNPTiA9IG9wdGlvbnMudXNlR2VvSlNPTjtcbiAgfVxuXG4gIGRlbGV0ZSBvcHRpb25zLnVzZUdlb0pTT047XG5cbiAgb3B0aW9ucyA9IGV4dGVuZF9vYmplY3Qoe1xuICAgIG1hcDogdGhpcy5tYXBcbiAgfSwgb3B0aW9ucyk7XG5cbiAgaWYgKHVzZUdlb0pTT04gPT0gZmFsc2UpIHtcbiAgICBvcHRpb25zLnBhdGhzID0gW29wdGlvbnMucGF0aHMuc2xpY2UoMCldO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGlmIChvcHRpb25zLnBhdGhzWzBdLmxlbmd0aCA+IDApIHtcbiAgICAgIG9wdGlvbnMucGF0aHMgPSBhcnJheV9mbGF0KGFycmF5X21hcChvcHRpb25zLnBhdGhzLCBhcnJheVRvTGF0TG5nLCB1c2VHZW9KU09OKSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHBvbHlnb24gPSBuZXcgZ29vZ2xlLm1hcHMuUG9seWdvbihvcHRpb25zKSxcbiAgICAgIHBvbHlnb25fZXZlbnRzID0gWydjbGljaycsICdkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlcicsICdtb3VzZXVwJywgJ3JpZ2h0Y2xpY2snXTtcblxuICBmb3IgKHZhciBldiA9IDA7IGV2IDwgcG9seWdvbl9ldmVudHMubGVuZ3RoOyBldisrKSB7XG4gICAgKGZ1bmN0aW9uKG9iamVjdCwgbmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBuYW1lLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBvcHRpb25zW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKHBvbHlnb24sIHBvbHlnb25fZXZlbnRzW2V2XSk7XG4gIH1cblxuICB0aGlzLnBvbHlnb25zLnB1c2gocG9seWdvbik7XG5cbiAgR01hcHMuZmlyZSgncG9seWdvbl9hZGRlZCcsIHBvbHlnb24sIHRoaXMpO1xuXG4gIHJldHVybiBwb2x5Z29uO1xufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZVBvbHlnb24gPSBmdW5jdGlvbihwb2x5Z29uKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wb2x5Z29ucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLnBvbHlnb25zW2ldID09PSBwb2x5Z29uKSB7XG4gICAgICB0aGlzLnBvbHlnb25zW2ldLnNldE1hcChudWxsKTtcbiAgICAgIHRoaXMucG9seWdvbnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICBHTWFwcy5maXJlKCdwb2x5Z29uX3JlbW92ZWQnLCBwb2x5Z29uLCB0aGlzKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5wcm90b3R5cGUucmVtb3ZlUG9seWdvbnMgPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGl0ZW07IGl0ZW0gPSB0aGlzLnBvbHlnb25zW2ldOyBpKyspIHtcbiAgICBpdGVtLnNldE1hcChudWxsKTtcbiAgfVxuXG4gIHRoaXMucG9seWdvbnMgPSBbXTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5nZXRGcm9tRnVzaW9uVGFibGVzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgZXZlbnRzID0gb3B0aW9ucy5ldmVudHM7XG5cbiAgZGVsZXRlIG9wdGlvbnMuZXZlbnRzO1xuXG4gIHZhciBmdXNpb25fdGFibGVzX29wdGlvbnMgPSBvcHRpb25zLFxuICAgICAgbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuRnVzaW9uVGFibGVzTGF5ZXIoZnVzaW9uX3RhYmxlc19vcHRpb25zKTtcblxuICBmb3IgKHZhciBldiBpbiBldmVudHMpIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZXZlbnRzW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICB9KTtcbiAgICB9KShsYXllciwgZXYpO1xuICB9XG5cbiAgdGhpcy5sYXllcnMucHVzaChsYXllcik7XG5cbiAgcmV0dXJuIGxheWVyO1xufTtcblxuR01hcHMucHJvdG90eXBlLmxvYWRGcm9tRnVzaW9uVGFibGVzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgbGF5ZXIgPSB0aGlzLmdldEZyb21GdXNpb25UYWJsZXMob3B0aW9ucyk7XG4gIGxheWVyLnNldE1hcCh0aGlzLm1hcCk7XG5cbiAgcmV0dXJuIGxheWVyO1xufTtcblxuR01hcHMucHJvdG90eXBlLmdldEZyb21LTUwgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciB1cmwgPSBvcHRpb25zLnVybCxcbiAgICAgIGV2ZW50cyA9IG9wdGlvbnMuZXZlbnRzO1xuXG4gIGRlbGV0ZSBvcHRpb25zLnVybDtcbiAgZGVsZXRlIG9wdGlvbnMuZXZlbnRzO1xuXG4gIHZhciBrbWxfb3B0aW9ucyA9IG9wdGlvbnMsXG4gICAgICBsYXllciA9IG5ldyBnb29nbGUubWFwcy5LbWxMYXllcih1cmwsIGttbF9vcHRpb25zKTtcblxuICBmb3IgKHZhciBldiBpbiBldmVudHMpIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZXZlbnRzW25hbWVdLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICB9KTtcbiAgICB9KShsYXllciwgZXYpO1xuICB9XG5cbiAgdGhpcy5sYXllcnMucHVzaChsYXllcik7XG5cbiAgcmV0dXJuIGxheWVyO1xufTtcblxuR01hcHMucHJvdG90eXBlLmxvYWRGcm9tS01MID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgbGF5ZXIgPSB0aGlzLmdldEZyb21LTUwob3B0aW9ucyk7XG4gIGxheWVyLnNldE1hcCh0aGlzLm1hcCk7XG5cbiAgcmV0dXJuIGxheWVyO1xufTtcblxuR01hcHMucHJvdG90eXBlLmFkZExheWVyID0gZnVuY3Rpb24obGF5ZXJOYW1lLCBvcHRpb25zKSB7XG4gIC8vdmFyIGRlZmF1bHRfbGF5ZXJzID0gWyd3ZWF0aGVyJywgJ2Nsb3VkcycsICd0cmFmZmljJywgJ3RyYW5zaXQnLCAnYmljeWNsaW5nJywgJ3Bhbm9yYW1pbycsICdwbGFjZXMnXTtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBsYXllcjtcblxuICBzd2l0Y2gobGF5ZXJOYW1lKSB7XG4gICAgY2FzZSAnd2VhdGhlcic6IHRoaXMuc2luZ2xlTGF5ZXJzLndlYXRoZXIgPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy53ZWF0aGVyLldlYXRoZXJMYXllcigpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2xvdWRzJzogdGhpcy5zaW5nbGVMYXllcnMuY2xvdWRzID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMud2VhdGhlci5DbG91ZExheWVyKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd0cmFmZmljJzogdGhpcy5zaW5nbGVMYXllcnMudHJhZmZpYyA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLlRyYWZmaWNMYXllcigpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndHJhbnNpdCc6IHRoaXMuc2luZ2xlTGF5ZXJzLnRyYW5zaXQgPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy5UcmFuc2l0TGF5ZXIoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2JpY3ljbGluZyc6IHRoaXMuc2luZ2xlTGF5ZXJzLmJpY3ljbGluZyA9IGxheWVyID0gbmV3IGdvb2dsZS5tYXBzLkJpY3ljbGluZ0xheWVyKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdwYW5vcmFtaW8nOlxuICAgICAgICB0aGlzLnNpbmdsZUxheWVycy5wYW5vcmFtaW8gPSBsYXllciA9IG5ldyBnb29nbGUubWFwcy5wYW5vcmFtaW8uUGFub3JhbWlvTGF5ZXIoKTtcbiAgICAgICAgbGF5ZXIuc2V0VGFnKG9wdGlvbnMuZmlsdGVyKTtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMuZmlsdGVyO1xuXG4gICAgICAgIC8vY2xpY2sgZXZlbnRcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xpY2spIHtcbiAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihsYXllciwgJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuY2xpY2soZXZlbnQpO1xuICAgICAgICAgICAgZGVsZXRlIG9wdGlvbnMuY2xpY2s7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncGxhY2VzJzpcbiAgICAgICAgdGhpcy5zaW5nbGVMYXllcnMucGxhY2VzID0gbGF5ZXIgPSBuZXcgZ29vZ2xlLm1hcHMucGxhY2VzLlBsYWNlc1NlcnZpY2UodGhpcy5tYXApO1xuXG4gICAgICAgIC8vc2VhcmNoLCBuZWFyYnlTZWFyY2gsIHJhZGFyU2VhcmNoIGNhbGxiYWNrLCBCb3RoIGFyZSB0aGUgc2FtZVxuICAgICAgICBpZiAob3B0aW9ucy5zZWFyY2ggfHwgb3B0aW9ucy5uZWFyYnlTZWFyY2ggfHwgb3B0aW9ucy5yYWRhclNlYXJjaCkge1xuICAgICAgICAgIHZhciBwbGFjZVNlYXJjaFJlcXVlc3QgID0ge1xuICAgICAgICAgICAgYm91bmRzIDogb3B0aW9ucy5ib3VuZHMgfHwgbnVsbCxcbiAgICAgICAgICAgIGtleXdvcmQgOiBvcHRpb25zLmtleXdvcmQgfHwgbnVsbCxcbiAgICAgICAgICAgIGxvY2F0aW9uIDogb3B0aW9ucy5sb2NhdGlvbiB8fCBudWxsLFxuICAgICAgICAgICAgbmFtZSA6IG9wdGlvbnMubmFtZSB8fCBudWxsLFxuICAgICAgICAgICAgcmFkaXVzIDogb3B0aW9ucy5yYWRpdXMgfHwgbnVsbCxcbiAgICAgICAgICAgIHJhbmtCeSA6IG9wdGlvbnMucmFua0J5IHx8IG51bGwsXG4gICAgICAgICAgICB0eXBlcyA6IG9wdGlvbnMudHlwZXMgfHwgbnVsbFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAob3B0aW9ucy5yYWRhclNlYXJjaCkge1xuICAgICAgICAgICAgbGF5ZXIucmFkYXJTZWFyY2gocGxhY2VTZWFyY2hSZXF1ZXN0LCBvcHRpb25zLnJhZGFyU2VhcmNoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob3B0aW9ucy5zZWFyY2gpIHtcbiAgICAgICAgICAgIGxheWVyLnNlYXJjaChwbGFjZVNlYXJjaFJlcXVlc3QsIG9wdGlvbnMuc2VhcmNoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob3B0aW9ucy5uZWFyYnlTZWFyY2gpIHtcbiAgICAgICAgICAgIGxheWVyLm5lYXJieVNlYXJjaChwbGFjZVNlYXJjaFJlcXVlc3QsIG9wdGlvbnMubmVhcmJ5U2VhcmNoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL3RleHRTZWFyY2ggY2FsbGJhY2tcbiAgICAgICAgaWYgKG9wdGlvbnMudGV4dFNlYXJjaCkge1xuICAgICAgICAgIHZhciB0ZXh0U2VhcmNoUmVxdWVzdCAgPSB7XG4gICAgICAgICAgICBib3VuZHMgOiBvcHRpb25zLmJvdW5kcyB8fCBudWxsLFxuICAgICAgICAgICAgbG9jYXRpb24gOiBvcHRpb25zLmxvY2F0aW9uIHx8IG51bGwsXG4gICAgICAgICAgICBxdWVyeSA6IG9wdGlvbnMucXVlcnkgfHwgbnVsbCxcbiAgICAgICAgICAgIHJhZGl1cyA6IG9wdGlvbnMucmFkaXVzIHx8IG51bGxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbGF5ZXIudGV4dFNlYXJjaCh0ZXh0U2VhcmNoUmVxdWVzdCwgb3B0aW9ucy50ZXh0U2VhcmNoKTtcbiAgICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cblxuICBpZiAobGF5ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgbGF5ZXIuc2V0T3B0aW9ucyA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBsYXllci5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGxheWVyLnNldE1hcCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBsYXllci5zZXRNYXAodGhpcy5tYXApO1xuICAgIH1cblxuICAgIHJldHVybiBsYXllcjtcbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZUxheWVyID0gZnVuY3Rpb24obGF5ZXIpIHtcbiAgaWYgKHR5cGVvZihsYXllcikgPT0gXCJzdHJpbmdcIiAmJiB0aGlzLnNpbmdsZUxheWVyc1tsYXllcl0gIT09IHVuZGVmaW5lZCkge1xuICAgICB0aGlzLnNpbmdsZUxheWVyc1tsYXllcl0uc2V0TWFwKG51bGwpO1xuXG4gICAgIGRlbGV0ZSB0aGlzLnNpbmdsZUxheWVyc1tsYXllcl07XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldID09PSBsYXllcikge1xuICAgICAgICB0aGlzLmxheWVyc1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICAgIHRoaXMubGF5ZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbnZhciB0cmF2ZWxNb2RlLCB1bml0U3lzdGVtO1xuXG5HTWFwcy5wcm90b3R5cGUuZ2V0Um91dGVzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBzd2l0Y2ggKG9wdGlvbnMudHJhdmVsTW9kZSkge1xuICAgIGNhc2UgJ2JpY3ljbGluZyc6XG4gICAgICB0cmF2ZWxNb2RlID0gZ29vZ2xlLm1hcHMuVHJhdmVsTW9kZS5CSUNZQ0xJTkc7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd0cmFuc2l0JzpcbiAgICAgIHRyYXZlbE1vZGUgPSBnb29nbGUubWFwcy5UcmF2ZWxNb2RlLlRSQU5TSVQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdkcml2aW5nJzpcbiAgICAgIHRyYXZlbE1vZGUgPSBnb29nbGUubWFwcy5UcmF2ZWxNb2RlLkRSSVZJTkc7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdHJhdmVsTW9kZSA9IGdvb2dsZS5tYXBzLlRyYXZlbE1vZGUuV0FMS0lORztcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMudW5pdFN5c3RlbSA9PT0gJ2ltcGVyaWFsJykge1xuICAgIHVuaXRTeXN0ZW0gPSBnb29nbGUubWFwcy5Vbml0U3lzdGVtLklNUEVSSUFMO1xuICB9XG4gIGVsc2Uge1xuICAgIHVuaXRTeXN0ZW0gPSBnb29nbGUubWFwcy5Vbml0U3lzdGVtLk1FVFJJQztcbiAgfVxuXG4gIHZhciBiYXNlX29wdGlvbnMgPSB7XG4gICAgICAgIGF2b2lkSGlnaHdheXM6IGZhbHNlLFxuICAgICAgICBhdm9pZFRvbGxzOiBmYWxzZSxcbiAgICAgICAgb3B0aW1pemVXYXlwb2ludHM6IGZhbHNlLFxuICAgICAgICB3YXlwb2ludHM6IFtdXG4gICAgICB9LFxuICAgICAgcmVxdWVzdF9vcHRpb25zID0gIGV4dGVuZF9vYmplY3QoYmFzZV9vcHRpb25zLCBvcHRpb25zKTtcblxuICByZXF1ZXN0X29wdGlvbnMub3JpZ2luID0gL3N0cmluZy8udGVzdCh0eXBlb2Ygb3B0aW9ucy5vcmlnaW4pID8gb3B0aW9ucy5vcmlnaW4gOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMub3JpZ2luWzBdLCBvcHRpb25zLm9yaWdpblsxXSk7XG4gIHJlcXVlc3Rfb3B0aW9ucy5kZXN0aW5hdGlvbiA9IC9zdHJpbmcvLnRlc3QodHlwZW9mIG9wdGlvbnMuZGVzdGluYXRpb24pID8gb3B0aW9ucy5kZXN0aW5hdGlvbiA6IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5kZXN0aW5hdGlvblswXSwgb3B0aW9ucy5kZXN0aW5hdGlvblsxXSk7XG4gIHJlcXVlc3Rfb3B0aW9ucy50cmF2ZWxNb2RlID0gdHJhdmVsTW9kZTtcbiAgcmVxdWVzdF9vcHRpb25zLnVuaXRTeXN0ZW0gPSB1bml0U3lzdGVtO1xuXG4gIGRlbGV0ZSByZXF1ZXN0X29wdGlvbnMuY2FsbGJhY2s7XG4gIGRlbGV0ZSByZXF1ZXN0X29wdGlvbnMuZXJyb3I7XG5cbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgc2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5EaXJlY3Rpb25zU2VydmljZSgpO1xuXG4gIHNlcnZpY2Uucm91dGUocmVxdWVzdF9vcHRpb25zLCBmdW5jdGlvbihyZXN1bHQsIHN0YXR1cykge1xuICAgIGlmIChzdGF0dXMgPT09IGdvb2dsZS5tYXBzLkRpcmVjdGlvbnNTdGF0dXMuT0spIHtcbiAgICAgIGZvciAodmFyIHIgaW4gcmVzdWx0LnJvdXRlcykge1xuICAgICAgICBpZiAocmVzdWx0LnJvdXRlcy5oYXNPd25Qcm9wZXJ0eShyKSkge1xuICAgICAgICAgIHNlbGYucm91dGVzLnB1c2gocmVzdWx0LnJvdXRlc1tyXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuY2FsbGJhY2spIHtcbiAgICAgICAgb3B0aW9ucy5jYWxsYmFjayhzZWxmLnJvdXRlcyk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMuZXJyb3IpIHtcbiAgICAgICAgb3B0aW9ucy5lcnJvcihyZXN1bHQsIHN0YXR1cyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5yZW1vdmVSb3V0ZXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yb3V0ZXMgPSBbXTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5nZXRFbGV2YXRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBvcHRpb25zID0gZXh0ZW5kX29iamVjdCh7XG4gICAgbG9jYXRpb25zOiBbXSxcbiAgICBwYXRoIDogZmFsc2UsXG4gICAgc2FtcGxlcyA6IDI1NlxuICB9LCBvcHRpb25zKTtcblxuICBpZiAob3B0aW9ucy5sb2NhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9uc1swXS5sZW5ndGggPiAwKSB7XG4gICAgICBvcHRpb25zLmxvY2F0aW9ucyA9IGFycmF5X2ZsYXQoYXJyYXlfbWFwKFtvcHRpb25zLmxvY2F0aW9uc10sIGFycmF5VG9MYXRMbmcsICBmYWxzZSkpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBjYWxsYmFjayA9IG9wdGlvbnMuY2FsbGJhY2s7XG4gIGRlbGV0ZSBvcHRpb25zLmNhbGxiYWNrO1xuXG4gIHZhciBzZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLkVsZXZhdGlvblNlcnZpY2UoKTtcblxuICAvL2xvY2F0aW9uIHJlcXVlc3RcbiAgaWYgKCFvcHRpb25zLnBhdGgpIHtcbiAgICBkZWxldGUgb3B0aW9ucy5wYXRoO1xuICAgIGRlbGV0ZSBvcHRpb25zLnNhbXBsZXM7XG5cbiAgICBzZXJ2aWNlLmdldEVsZXZhdGlvbkZvckxvY2F0aW9ucyhvcHRpb25zLCBmdW5jdGlvbihyZXN1bHQsIHN0YXR1cykge1xuICAgICAgaWYgKGNhbGxiYWNrICYmIHR5cGVvZihjYWxsYmFjaykgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHN0YXR1cyk7XG4gICAgICB9XG4gICAgfSk7XG4gIC8vcGF0aCByZXF1ZXN0XG4gIH0gZWxzZSB7XG4gICAgdmFyIHBhdGhSZXF1ZXN0ID0ge1xuICAgICAgcGF0aCA6IG9wdGlvbnMubG9jYXRpb25zLFxuICAgICAgc2FtcGxlcyA6IG9wdGlvbnMuc2FtcGxlc1xuICAgIH07XG5cbiAgICBzZXJ2aWNlLmdldEVsZXZhdGlvbkFsb25nUGF0aChwYXRoUmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0LCBzdGF0dXMpIHtcbiAgICAgaWYgKGNhbGxiYWNrICYmIHR5cGVvZihjYWxsYmFjaykgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQsIHN0YXR1cyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbkdNYXBzLnByb3RvdHlwZS5jbGVhblJvdXRlID0gR01hcHMucHJvdG90eXBlLnJlbW92ZVBvbHlsaW5lcztcblxuR01hcHMucHJvdG90eXBlLmRyYXdSb3V0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHRoaXMuZ2V0Um91dGVzKHtcbiAgICBvcmlnaW46IG9wdGlvbnMub3JpZ2luLFxuICAgIGRlc3RpbmF0aW9uOiBvcHRpb25zLmRlc3RpbmF0aW9uLFxuICAgIHRyYXZlbE1vZGU6IG9wdGlvbnMudHJhdmVsTW9kZSxcbiAgICB3YXlwb2ludHM6IG9wdGlvbnMud2F5cG9pbnRzLFxuICAgIHVuaXRTeXN0ZW06IG9wdGlvbnMudW5pdFN5c3RlbSxcbiAgICBlcnJvcjogb3B0aW9ucy5lcnJvcixcbiAgICBjYWxsYmFjazogZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgcG9seWxpbmVfb3B0aW9ucyA9IHtcbiAgICAgICAgICBwYXRoOiBlW2UubGVuZ3RoIC0gMV0ub3ZlcnZpZXdfcGF0aCxcbiAgICAgICAgICBzdHJva2VDb2xvcjogb3B0aW9ucy5zdHJva2VDb2xvcixcbiAgICAgICAgICBzdHJva2VPcGFjaXR5OiBvcHRpb25zLnN0cm9rZU9wYWNpdHksXG4gICAgICAgICAgc3Ryb2tlV2VpZ2h0OiBvcHRpb25zLnN0cm9rZVdlaWdodFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiaWNvbnNcIikpIHtcbiAgICAgICAgICBwb2x5bGluZV9vcHRpb25zLmljb25zID0gb3B0aW9ucy5pY29ucztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuZHJhd1BvbHlsaW5lKHBvbHlsaW5lX29wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgaWYgKG9wdGlvbnMuY2FsbGJhY2spIHtcbiAgICAgICAgICBvcHRpb25zLmNhbGxiYWNrKGVbZS5sZW5ndGggLSAxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuR01hcHMucHJvdG90eXBlLnRyYXZlbFJvdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5vcmlnaW4gJiYgb3B0aW9ucy5kZXN0aW5hdGlvbikge1xuICAgIHRoaXMuZ2V0Um91dGVzKHtcbiAgICAgIG9yaWdpbjogb3B0aW9ucy5vcmlnaW4sXG4gICAgICBkZXN0aW5hdGlvbjogb3B0aW9ucy5kZXN0aW5hdGlvbixcbiAgICAgIHRyYXZlbE1vZGU6IG9wdGlvbnMudHJhdmVsTW9kZSxcbiAgICAgIHdheXBvaW50cyA6IG9wdGlvbnMud2F5cG9pbnRzLFxuICAgICAgdW5pdFN5c3RlbTogb3B0aW9ucy51bml0U3lzdGVtLFxuICAgICAgZXJyb3I6IG9wdGlvbnMuZXJyb3IsXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oZSkge1xuICAgICAgICAvL3N0YXJ0IGNhbGxiYWNrXG4gICAgICAgIGlmIChlLmxlbmd0aCA+IDAgJiYgb3B0aW9ucy5zdGFydCkge1xuICAgICAgICAgIG9wdGlvbnMuc3RhcnQoZVtlLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc3RlcCBjYWxsYmFja1xuICAgICAgICBpZiAoZS5sZW5ndGggPiAwICYmIG9wdGlvbnMuc3RlcCkge1xuICAgICAgICAgIHZhciByb3V0ZSA9IGVbZS5sZW5ndGggLSAxXTtcbiAgICAgICAgICBpZiAocm91dGUubGVncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgc3RlcHMgPSByb3V0ZS5sZWdzWzBdLnN0ZXBzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHN0ZXA7IHN0ZXAgPSBzdGVwc1tpXTsgaSsrKSB7XG4gICAgICAgICAgICAgIHN0ZXAuc3RlcF9udW1iZXIgPSBpO1xuICAgICAgICAgICAgICBvcHRpb25zLnN0ZXAoc3RlcCwgKHJvdXRlLmxlZ3NbMF0uc3RlcHMubGVuZ3RoIC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vZW5kIGNhbGxiYWNrXG4gICAgICAgIGlmIChlLmxlbmd0aCA+IDAgJiYgb3B0aW9ucy5lbmQpIHtcbiAgICAgICAgICAgb3B0aW9ucy5lbmQoZVtlLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGVsc2UgaWYgKG9wdGlvbnMucm91dGUpIHtcbiAgICBpZiAob3B0aW9ucy5yb3V0ZS5sZWdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBzdGVwcyA9IG9wdGlvbnMucm91dGUubGVnc1swXS5zdGVwcztcbiAgICAgIGZvciAodmFyIGkgPSAwLCBzdGVwOyBzdGVwID0gc3RlcHNbaV07IGkrKykge1xuICAgICAgICBzdGVwLnN0ZXBfbnVtYmVyID0gaTtcbiAgICAgICAgb3B0aW9ucy5zdGVwKHN0ZXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLmRyYXdTdGVwcGVkUm91dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgXG4gIGlmIChvcHRpb25zLm9yaWdpbiAmJiBvcHRpb25zLmRlc3RpbmF0aW9uKSB7XG4gICAgdGhpcy5nZXRSb3V0ZXMoe1xuICAgICAgb3JpZ2luOiBvcHRpb25zLm9yaWdpbixcbiAgICAgIGRlc3RpbmF0aW9uOiBvcHRpb25zLmRlc3RpbmF0aW9uLFxuICAgICAgdHJhdmVsTW9kZTogb3B0aW9ucy50cmF2ZWxNb2RlLFxuICAgICAgd2F5cG9pbnRzIDogb3B0aW9ucy53YXlwb2ludHMsXG4gICAgICBlcnJvcjogb3B0aW9ucy5lcnJvcixcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vc3RhcnQgY2FsbGJhY2tcbiAgICAgICAgaWYgKGUubGVuZ3RoID4gMCAmJiBvcHRpb25zLnN0YXJ0KSB7XG4gICAgICAgICAgb3B0aW9ucy5zdGFydChlW2UubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9zdGVwIGNhbGxiYWNrXG4gICAgICAgIGlmIChlLmxlbmd0aCA+IDAgJiYgb3B0aW9ucy5zdGVwKSB7XG4gICAgICAgICAgdmFyIHJvdXRlID0gZVtlLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGlmIChyb3V0ZS5sZWdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBzdGVwcyA9IHJvdXRlLmxlZ3NbMF0uc3RlcHM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgc3RlcDsgc3RlcCA9IHN0ZXBzW2ldOyBpKyspIHtcbiAgICAgICAgICAgICAgc3RlcC5zdGVwX251bWJlciA9IGk7XG4gICAgICAgICAgICAgIHZhciBwb2x5bGluZV9vcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHN0ZXAucGF0aCxcbiAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogb3B0aW9ucy5zdHJva2VDb2xvcixcbiAgICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiBvcHRpb25zLnN0cm9rZU9wYWNpdHksXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2VpZ2h0OiBvcHRpb25zLnN0cm9rZVdlaWdodFxuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiaWNvbnNcIikpIHtcbiAgICAgICAgICAgICAgICBwb2x5bGluZV9vcHRpb25zLmljb25zID0gb3B0aW9ucy5pY29ucztcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNlbGYuZHJhd1BvbHlsaW5lKHBvbHlsaW5lX29wdGlvbnMpO1xuICAgICAgICAgICAgICBvcHRpb25zLnN0ZXAoc3RlcCwgKHJvdXRlLmxlZ3NbMF0uc3RlcHMubGVuZ3RoIC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vZW5kIGNhbGxiYWNrXG4gICAgICAgIGlmIChlLmxlbmd0aCA+IDAgJiYgb3B0aW9ucy5lbmQpIHtcbiAgICAgICAgICAgb3B0aW9ucy5lbmQoZVtlLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGVsc2UgaWYgKG9wdGlvbnMucm91dGUpIHtcbiAgICBpZiAob3B0aW9ucy5yb3V0ZS5sZWdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBzdGVwcyA9IG9wdGlvbnMucm91dGUubGVnc1swXS5zdGVwcztcbiAgICAgIGZvciAodmFyIGkgPSAwLCBzdGVwOyBzdGVwID0gc3RlcHNbaV07IGkrKykge1xuICAgICAgICBzdGVwLnN0ZXBfbnVtYmVyID0gaTtcbiAgICAgICAgdmFyIHBvbHlsaW5lX29wdGlvbnMgPSB7XG4gICAgICAgICAgcGF0aDogc3RlcC5wYXRoLFxuICAgICAgICAgIHN0cm9rZUNvbG9yOiBvcHRpb25zLnN0cm9rZUNvbG9yLFxuICAgICAgICAgIHN0cm9rZU9wYWNpdHk6IG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSxcbiAgICAgICAgICBzdHJva2VXZWlnaHQ6IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpY29uc1wiKSkge1xuICAgICAgICAgIHBvbHlsaW5lX29wdGlvbnMuaWNvbnMgPSBvcHRpb25zLmljb25zO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5kcmF3UG9seWxpbmUocG9seWxpbmVfb3B0aW9ucyk7XG4gICAgICAgIG9wdGlvbnMuc3RlcChzdGVwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLlJvdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB0aGlzLm9yaWdpbiA9IG9wdGlvbnMub3JpZ2luO1xuICB0aGlzLmRlc3RpbmF0aW9uID0gb3B0aW9ucy5kZXN0aW5hdGlvbjtcbiAgdGhpcy53YXlwb2ludHMgPSBvcHRpb25zLndheXBvaW50cztcblxuICB0aGlzLm1hcCA9IG9wdGlvbnMubWFwO1xuICB0aGlzLnJvdXRlID0gb3B0aW9ucy5yb3V0ZTtcbiAgdGhpcy5zdGVwX2NvdW50ID0gMDtcbiAgdGhpcy5zdGVwcyA9IHRoaXMucm91dGUubGVnc1swXS5zdGVwcztcbiAgdGhpcy5zdGVwc19sZW5ndGggPSB0aGlzLnN0ZXBzLmxlbmd0aDtcblxuICB2YXIgcG9seWxpbmVfb3B0aW9ucyA9IHtcbiAgICBwYXRoOiBuZXcgZ29vZ2xlLm1hcHMuTVZDQXJyYXkoKSxcbiAgICBzdHJva2VDb2xvcjogb3B0aW9ucy5zdHJva2VDb2xvcixcbiAgICBzdHJva2VPcGFjaXR5OiBvcHRpb25zLnN0cm9rZU9wYWNpdHksXG4gICAgc3Ryb2tlV2VpZ2h0OiBvcHRpb25zLnN0cm9rZVdlaWdodFxuICB9O1xuXG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiaWNvbnNcIikpIHtcbiAgICBwb2x5bGluZV9vcHRpb25zLmljb25zID0gb3B0aW9ucy5pY29ucztcbiAgfVxuXG4gIHRoaXMucG9seWxpbmUgPSB0aGlzLm1hcC5kcmF3UG9seWxpbmUocG9seWxpbmVfb3B0aW9ucykuZ2V0UGF0aCgpO1xufTtcblxuR01hcHMuUm91dGUucHJvdG90eXBlLmdldFJvdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy5tYXAuZ2V0Um91dGVzKHtcbiAgICBvcmlnaW4gOiB0aGlzLm9yaWdpbixcbiAgICBkZXN0aW5hdGlvbiA6IHRoaXMuZGVzdGluYXRpb24sXG4gICAgdHJhdmVsTW9kZSA6IG9wdGlvbnMudHJhdmVsTW9kZSxcbiAgICB3YXlwb2ludHMgOiB0aGlzLndheXBvaW50cyB8fCBbXSxcbiAgICBlcnJvcjogb3B0aW9ucy5lcnJvcixcbiAgICBjYWxsYmFjayA6IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yb3V0ZSA9IGVbMF07XG5cbiAgICAgIGlmIChvcHRpb25zLmNhbGxiYWNrKSB7XG4gICAgICAgIG9wdGlvbnMuY2FsbGJhY2suY2FsbChzZWxmKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuR01hcHMuUm91dGUucHJvdG90eXBlLmJhY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuc3RlcF9jb3VudCA+IDApIHtcbiAgICB0aGlzLnN0ZXBfY291bnQtLTtcbiAgICB2YXIgcGF0aCA9IHRoaXMucm91dGUubGVnc1swXS5zdGVwc1t0aGlzLnN0ZXBfY291bnRdLnBhdGg7XG5cbiAgICBmb3IgKHZhciBwIGluIHBhdGgpe1xuICAgICAgaWYgKHBhdGguaGFzT3duUHJvcGVydHkocCkpe1xuICAgICAgICB0aGlzLnBvbHlsaW5lLnBvcCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuR01hcHMuUm91dGUucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuc3RlcF9jb3VudCA8IHRoaXMuc3RlcHNfbGVuZ3RoKSB7XG4gICAgdmFyIHBhdGggPSB0aGlzLnJvdXRlLmxlZ3NbMF0uc3RlcHNbdGhpcy5zdGVwX2NvdW50XS5wYXRoO1xuXG4gICAgZm9yICh2YXIgcCBpbiBwYXRoKXtcbiAgICAgIGlmIChwYXRoLmhhc093blByb3BlcnR5KHApKXtcbiAgICAgICAgdGhpcy5wb2x5bGluZS5wdXNoKHBhdGhbcF0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0ZXBfY291bnQrKztcbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLmNoZWNrR2VvZmVuY2UgPSBmdW5jdGlvbihsYXQsIGxuZywgZmVuY2UpIHtcbiAgcmV0dXJuIGZlbmNlLmNvbnRhaW5zTGF0TG5nKG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0LCBsbmcpKTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5jaGVja01hcmtlckdlb2ZlbmNlID0gZnVuY3Rpb24obWFya2VyLCBvdXRzaWRlX2NhbGxiYWNrKSB7XG4gIGlmIChtYXJrZXIuZmVuY2VzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGZlbmNlOyBmZW5jZSA9IG1hcmtlci5mZW5jZXNbaV07IGkrKykge1xuICAgICAgdmFyIHBvcyA9IG1hcmtlci5nZXRQb3NpdGlvbigpO1xuICAgICAgaWYgKCF0aGlzLmNoZWNrR2VvZmVuY2UocG9zLmxhdCgpLCBwb3MubG5nKCksIGZlbmNlKSkge1xuICAgICAgICBvdXRzaWRlX2NhbGxiYWNrKG1hcmtlciwgZmVuY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnRvSW1hZ2UgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBvcHRpb25zID0gb3B0aW9ucyB8fCB7fSxcbiAgICAgIHN0YXRpY19tYXBfb3B0aW9ucyA9IHt9O1xuXG4gIHN0YXRpY19tYXBfb3B0aW9uc1snc2l6ZSddID0gb3B0aW9uc1snc2l6ZSddIHx8IFt0aGlzLmVsLmNsaWVudFdpZHRoLCB0aGlzLmVsLmNsaWVudEhlaWdodF07XG4gIHN0YXRpY19tYXBfb3B0aW9uc1snbGF0J10gPSB0aGlzLmdldENlbnRlcigpLmxhdCgpO1xuICBzdGF0aWNfbWFwX29wdGlvbnNbJ2xuZyddID0gdGhpcy5nZXRDZW50ZXIoKS5sbmcoKTtcblxuICBpZiAodGhpcy5tYXJrZXJzLmxlbmd0aCA+IDApIHtcbiAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ21hcmtlcnMnXSA9IFtdO1xuICAgIFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ21hcmtlcnMnXS5wdXNoKHtcbiAgICAgICAgbGF0OiB0aGlzLm1hcmtlcnNbaV0uZ2V0UG9zaXRpb24oKS5sYXQoKSxcbiAgICAgICAgbG5nOiB0aGlzLm1hcmtlcnNbaV0uZ2V0UG9zaXRpb24oKS5sbmcoKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMucG9seWxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgcG9seWxpbmUgPSB0aGlzLnBvbHlsaW5lc1swXTtcbiAgICBcbiAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ3BvbHlsaW5lJ10gPSB7fTtcbiAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ3BvbHlsaW5lJ11bJ3BhdGgnXSA9IGdvb2dsZS5tYXBzLmdlb21ldHJ5LmVuY29kaW5nLmVuY29kZVBhdGgocG9seWxpbmUuZ2V0UGF0aCgpKTtcbiAgICBzdGF0aWNfbWFwX29wdGlvbnNbJ3BvbHlsaW5lJ11bJ3N0cm9rZUNvbG9yJ10gPSBwb2x5bGluZS5zdHJva2VDb2xvclxuICAgIHN0YXRpY19tYXBfb3B0aW9uc1sncG9seWxpbmUnXVsnc3Ryb2tlT3BhY2l0eSddID0gcG9seWxpbmUuc3Ryb2tlT3BhY2l0eVxuICAgIHN0YXRpY19tYXBfb3B0aW9uc1sncG9seWxpbmUnXVsnc3Ryb2tlV2VpZ2h0J10gPSBwb2x5bGluZS5zdHJva2VXZWlnaHRcbiAgfVxuXG4gIHJldHVybiBHTWFwcy5zdGF0aWNNYXBVUkwoc3RhdGljX21hcF9vcHRpb25zKTtcbn07XG5cbkdNYXBzLnN0YXRpY01hcFVSTCA9IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICB2YXIgcGFyYW1ldGVycyA9IFtdLFxuICAgICAgZGF0YSxcbiAgICAgIHN0YXRpY19yb290ID0gKGxvY2F0aW9uLnByb3RvY29sID09PSAnZmlsZTonID8gJ2h0dHA6JyA6IGxvY2F0aW9uLnByb3RvY29sICkgKyAnLy9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL3N0YXRpY21hcCc7XG5cbiAgaWYgKG9wdGlvbnMudXJsKSB7XG4gICAgc3RhdGljX3Jvb3QgPSBvcHRpb25zLnVybDtcbiAgICBkZWxldGUgb3B0aW9ucy51cmw7XG4gIH1cblxuICBzdGF0aWNfcm9vdCArPSAnPyc7XG5cbiAgdmFyIG1hcmtlcnMgPSBvcHRpb25zLm1hcmtlcnM7XG4gIFxuICBkZWxldGUgb3B0aW9ucy5tYXJrZXJzO1xuXG4gIGlmICghbWFya2VycyAmJiBvcHRpb25zLm1hcmtlcikge1xuICAgIG1hcmtlcnMgPSBbb3B0aW9ucy5tYXJrZXJdO1xuICAgIGRlbGV0ZSBvcHRpb25zLm1hcmtlcjtcbiAgfVxuXG4gIHZhciBzdHlsZXMgPSBvcHRpb25zLnN0eWxlcztcblxuICBkZWxldGUgb3B0aW9ucy5zdHlsZXM7XG5cbiAgdmFyIHBvbHlsaW5lID0gb3B0aW9ucy5wb2x5bGluZTtcbiAgZGVsZXRlIG9wdGlvbnMucG9seWxpbmU7XG5cbiAgLyoqIE1hcCBvcHRpb25zICoqL1xuICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcbiAgICBwYXJhbWV0ZXJzLnB1c2goJ2NlbnRlcj0nICsgb3B0aW9ucy5jZW50ZXIpO1xuICAgIGRlbGV0ZSBvcHRpb25zLmNlbnRlcjtcbiAgfVxuICBlbHNlIGlmIChvcHRpb25zLmFkZHJlc3MpIHtcbiAgICBwYXJhbWV0ZXJzLnB1c2goJ2NlbnRlcj0nICsgb3B0aW9ucy5hZGRyZXNzKTtcbiAgICBkZWxldGUgb3B0aW9ucy5hZGRyZXNzO1xuICB9XG4gIGVsc2UgaWYgKG9wdGlvbnMubGF0KSB7XG4gICAgcGFyYW1ldGVycy5wdXNoKFsnY2VudGVyPScsIG9wdGlvbnMubGF0LCAnLCcsIG9wdGlvbnMubG5nXS5qb2luKCcnKSk7XG4gICAgZGVsZXRlIG9wdGlvbnMubGF0O1xuICAgIGRlbGV0ZSBvcHRpb25zLmxuZztcbiAgfVxuICBlbHNlIGlmIChvcHRpb25zLnZpc2libGUpIHtcbiAgICB2YXIgdmlzaWJsZSA9IGVuY29kZVVSSShvcHRpb25zLnZpc2libGUuam9pbignfCcpKTtcbiAgICBwYXJhbWV0ZXJzLnB1c2goJ3Zpc2libGU9JyArIHZpc2libGUpO1xuICB9XG5cbiAgdmFyIHNpemUgPSBvcHRpb25zLnNpemU7XG4gIGlmIChzaXplKSB7XG4gICAgaWYgKHNpemUuam9pbikge1xuICAgICAgc2l6ZSA9IHNpemUuam9pbigneCcpO1xuICAgIH1cbiAgICBkZWxldGUgb3B0aW9ucy5zaXplO1xuICB9XG4gIGVsc2Uge1xuICAgIHNpemUgPSAnNjMweDMwMCc7XG4gIH1cbiAgcGFyYW1ldGVycy5wdXNoKCdzaXplPScgKyBzaXplKTtcblxuICBpZiAoIW9wdGlvbnMuem9vbSAmJiBvcHRpb25zLnpvb20gIT09IGZhbHNlKSB7XG4gICAgb3B0aW9ucy56b29tID0gMTU7XG4gIH1cblxuICB2YXIgc2Vuc29yID0gb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnc2Vuc29yJykgPyAhIW9wdGlvbnMuc2Vuc29yIDogdHJ1ZTtcbiAgZGVsZXRlIG9wdGlvbnMuc2Vuc29yO1xuICBwYXJhbWV0ZXJzLnB1c2goJ3NlbnNvcj0nICsgc2Vuc29yKTtcblxuICBmb3IgKHZhciBwYXJhbSBpbiBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG4gICAgICBwYXJhbWV0ZXJzLnB1c2gocGFyYW0gKyAnPScgKyBvcHRpb25zW3BhcmFtXSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIE1hcmtlcnMgKiovXG4gIGlmIChtYXJrZXJzKSB7XG4gICAgdmFyIG1hcmtlciwgbG9jO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGRhdGEgPSBtYXJrZXJzW2ldOyBpKyspIHtcbiAgICAgIG1hcmtlciA9IFtdO1xuXG4gICAgICBpZiAoZGF0YS5zaXplICYmIGRhdGEuc2l6ZSAhPT0gJ25vcm1hbCcpIHtcbiAgICAgICAgbWFya2VyLnB1c2goJ3NpemU6JyArIGRhdGEuc2l6ZSk7XG4gICAgICAgIGRlbGV0ZSBkYXRhLnNpemU7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChkYXRhLmljb24pIHtcbiAgICAgICAgbWFya2VyLnB1c2goJ2ljb246JyArIGVuY29kZVVSSShkYXRhLmljb24pKTtcbiAgICAgICAgZGVsZXRlIGRhdGEuaWNvbjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuY29sb3IpIHtcbiAgICAgICAgbWFya2VyLnB1c2goJ2NvbG9yOicgKyBkYXRhLmNvbG9yLnJlcGxhY2UoJyMnLCAnMHgnKSk7XG4gICAgICAgIGRlbGV0ZSBkYXRhLmNvbG9yO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5sYWJlbCkge1xuICAgICAgICBtYXJrZXIucHVzaCgnbGFiZWw6JyArIGRhdGEubGFiZWxbMF0udG9VcHBlckNhc2UoKSk7XG4gICAgICAgIGRlbGV0ZSBkYXRhLmxhYmVsO1xuICAgICAgfVxuXG4gICAgICBsb2MgPSAoZGF0YS5hZGRyZXNzID8gZGF0YS5hZGRyZXNzIDogZGF0YS5sYXQgKyAnLCcgKyBkYXRhLmxuZyk7XG4gICAgICBkZWxldGUgZGF0YS5hZGRyZXNzO1xuICAgICAgZGVsZXRlIGRhdGEubGF0O1xuICAgICAgZGVsZXRlIGRhdGEubG5nO1xuXG4gICAgICBmb3IodmFyIHBhcmFtIGluIGRhdGEpe1xuICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcbiAgICAgICAgICBtYXJrZXIucHVzaChwYXJhbSArICc6JyArIGRhdGFbcGFyYW1dKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobWFya2VyLmxlbmd0aCB8fCBpID09PSAwKSB7XG4gICAgICAgIG1hcmtlci5wdXNoKGxvYyk7XG4gICAgICAgIG1hcmtlciA9IG1hcmtlci5qb2luKCd8Jyk7XG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCgnbWFya2Vycz0nICsgZW5jb2RlVVJJKG1hcmtlcikpO1xuICAgICAgfVxuICAgICAgLy8gTmV3IG1hcmtlciB3aXRob3V0IHN0eWxlc1xuICAgICAgZWxzZSB7XG4gICAgICAgIG1hcmtlciA9IHBhcmFtZXRlcnMucG9wKCkgKyBlbmNvZGVVUkkoJ3wnICsgbG9jKTtcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKG1hcmtlcik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIE1hcCBTdHlsZXMgKiovXG4gIGlmIChzdHlsZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHN0eWxlUnVsZSA9IFtdO1xuICAgICAgaWYgKHN0eWxlc1tpXS5mZWF0dXJlVHlwZSl7XG4gICAgICAgIHN0eWxlUnVsZS5wdXNoKCdmZWF0dXJlOicgKyBzdHlsZXNbaV0uZmVhdHVyZVR5cGUudG9Mb3dlckNhc2UoKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdHlsZXNbaV0uZWxlbWVudFR5cGUpIHtcbiAgICAgICAgc3R5bGVSdWxlLnB1c2goJ2VsZW1lbnQ6JyArIHN0eWxlc1tpXS5lbGVtZW50VHlwZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzdHlsZXNbaV0uc3R5bGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBmb3IgKHZhciBwIGluIHN0eWxlc1tpXS5zdHlsZXJzW2pdKSB7XG4gICAgICAgICAgdmFyIHJ1bGVBcmcgPSBzdHlsZXNbaV0uc3R5bGVyc1tqXVtwXTtcbiAgICAgICAgICBpZiAocCA9PSAnaHVlJyB8fCBwID09ICdjb2xvcicpIHtcbiAgICAgICAgICAgIHJ1bGVBcmcgPSAnMHgnICsgcnVsZUFyZy5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0eWxlUnVsZS5wdXNoKHAgKyAnOicgKyBydWxlQXJnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgcnVsZSA9IHN0eWxlUnVsZS5qb2luKCd8Jyk7XG4gICAgICBpZiAocnVsZSAhPSAnJykge1xuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goJ3N0eWxlPScgKyBydWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogUG9seWxpbmVzICoqL1xuICBmdW5jdGlvbiBwYXJzZUNvbG9yKGNvbG9yLCBvcGFjaXR5KSB7XG4gICAgaWYgKGNvbG9yWzBdID09PSAnIycpe1xuICAgICAgY29sb3IgPSBjb2xvci5yZXBsYWNlKCcjJywgJzB4Jyk7XG5cbiAgICAgIGlmIChvcGFjaXR5KSB7XG4gICAgICAgIG9wYWNpdHkgPSBwYXJzZUZsb2F0KG9wYWNpdHkpO1xuICAgICAgICBvcGFjaXR5ID0gTWF0aC5taW4oMSwgTWF0aC5tYXgob3BhY2l0eSwgMCkpO1xuICAgICAgICBpZiAob3BhY2l0eSA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiAnMHgwMDAwMDAwMCc7XG4gICAgICAgIH1cbiAgICAgICAgb3BhY2l0eSA9IChvcGFjaXR5ICogMjU1KS50b1N0cmluZygxNik7XG4gICAgICAgIGlmIChvcGFjaXR5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIG9wYWNpdHkgKz0gb3BhY2l0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbG9yID0gY29sb3Iuc2xpY2UoMCw4KSArIG9wYWNpdHk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb2xvcjtcbiAgfVxuXG4gIGlmIChwb2x5bGluZSkge1xuICAgIGRhdGEgPSBwb2x5bGluZTtcbiAgICBwb2x5bGluZSA9IFtdO1xuXG4gICAgaWYgKGRhdGEuc3Ryb2tlV2VpZ2h0KSB7XG4gICAgICBwb2x5bGluZS5wdXNoKCd3ZWlnaHQ6JyArIHBhcnNlSW50KGRhdGEuc3Ryb2tlV2VpZ2h0LCAxMCkpO1xuICAgIH1cblxuICAgIGlmIChkYXRhLnN0cm9rZUNvbG9yKSB7XG4gICAgICB2YXIgY29sb3IgPSBwYXJzZUNvbG9yKGRhdGEuc3Ryb2tlQ29sb3IsIGRhdGEuc3Ryb2tlT3BhY2l0eSk7XG4gICAgICBwb2x5bGluZS5wdXNoKCdjb2xvcjonICsgY29sb3IpO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmZpbGxDb2xvcikge1xuICAgICAgdmFyIGZpbGxjb2xvciA9IHBhcnNlQ29sb3IoZGF0YS5maWxsQ29sb3IsIGRhdGEuZmlsbE9wYWNpdHkpO1xuICAgICAgcG9seWxpbmUucHVzaCgnZmlsbGNvbG9yOicgKyBmaWxsY29sb3IpO1xuICAgIH1cblxuICAgIHZhciBwYXRoID0gZGF0YS5wYXRoO1xuICAgIGlmIChwYXRoLmpvaW4pIHtcbiAgICAgIGZvciAodmFyIGo9MCwgcG9zOyBwb3M9cGF0aFtqXTsgaisrKSB7XG4gICAgICAgIHBvbHlsaW5lLnB1c2gocG9zLmpvaW4oJywnKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcG9seWxpbmUucHVzaCgnZW5jOicgKyBwYXRoKTtcbiAgICB9XG5cbiAgICBwb2x5bGluZSA9IHBvbHlsaW5lLmpvaW4oJ3wnKTtcbiAgICBwYXJhbWV0ZXJzLnB1c2goJ3BhdGg9JyArIGVuY29kZVVSSShwb2x5bGluZSkpO1xuICB9XG5cbiAgLyoqIFJldGluYSBzdXBwb3J0ICoqL1xuICB2YXIgZHBpID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgcGFyYW1ldGVycy5wdXNoKCdzY2FsZT0nICsgZHBpKTtcblxuICBwYXJhbWV0ZXJzID0gcGFyYW1ldGVycy5qb2luKCcmJyk7XG4gIHJldHVybiBzdGF0aWNfcm9vdCArIHBhcmFtZXRlcnM7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkTWFwVHlwZSA9IGZ1bmN0aW9uKG1hcFR5cGVJZCwgb3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImdldFRpbGVVcmxcIikgJiYgdHlwZW9mKG9wdGlvbnNbXCJnZXRUaWxlVXJsXCJdKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBvcHRpb25zLnRpbGVTaXplID0gb3B0aW9ucy50aWxlU2l6ZSB8fCBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyNTYsIDI1Nik7XG5cbiAgICB2YXIgbWFwVHlwZSA9IG5ldyBnb29nbGUubWFwcy5JbWFnZU1hcFR5cGUob3B0aW9ucyk7XG5cbiAgICB0aGlzLm1hcC5tYXBUeXBlcy5zZXQobWFwVHlwZUlkLCBtYXBUeXBlKTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBcIidnZXRUaWxlVXJsJyBmdW5jdGlvbiByZXF1aXJlZC5cIjtcbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLmFkZE92ZXJsYXlNYXBUeXBlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImdldFRpbGVcIikgJiYgdHlwZW9mKG9wdGlvbnNbXCJnZXRUaWxlXCJdKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB2YXIgb3ZlcmxheU1hcFR5cGVJbmRleCA9IG9wdGlvbnMuaW5kZXg7XG5cbiAgICBkZWxldGUgb3B0aW9ucy5pbmRleDtcblxuICAgIHRoaXMubWFwLm92ZXJsYXlNYXBUeXBlcy5pbnNlcnRBdChvdmVybGF5TWFwVHlwZUluZGV4LCBvcHRpb25zKTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBcIidnZXRUaWxlJyBmdW5jdGlvbiByZXF1aXJlZC5cIjtcbiAgfVxufTtcblxuR01hcHMucHJvdG90eXBlLnJlbW92ZU92ZXJsYXlNYXBUeXBlID0gZnVuY3Rpb24ob3ZlcmxheU1hcFR5cGVJbmRleCkge1xuICB0aGlzLm1hcC5vdmVybGF5TWFwVHlwZXMucmVtb3ZlQXQob3ZlcmxheU1hcFR5cGVJbmRleCk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuYWRkU3R5bGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBzdHlsZWRNYXBUeXBlID0gbmV3IGdvb2dsZS5tYXBzLlN0eWxlZE1hcFR5cGUob3B0aW9ucy5zdHlsZXMsIHsgbmFtZTogb3B0aW9ucy5zdHlsZWRNYXBOYW1lIH0pO1xuXG4gIHRoaXMubWFwLm1hcFR5cGVzLnNldChvcHRpb25zLm1hcFR5cGVJZCwgc3R5bGVkTWFwVHlwZSk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuc2V0U3R5bGUgPSBmdW5jdGlvbihtYXBUeXBlSWQpIHtcbiAgdGhpcy5tYXAuc2V0TWFwVHlwZUlkKG1hcFR5cGVJZCk7XG59O1xuXG5HTWFwcy5wcm90b3R5cGUuY3JlYXRlUGFub3JhbWEgPSBmdW5jdGlvbihzdHJlZXR2aWV3X29wdGlvbnMpIHtcbiAgaWYgKCFzdHJlZXR2aWV3X29wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xhdCcpIHx8ICFzdHJlZXR2aWV3X29wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xuZycpKSB7XG4gICAgc3RyZWV0dmlld19vcHRpb25zLmxhdCA9IHRoaXMuZ2V0Q2VudGVyKCkubGF0KCk7XG4gICAgc3RyZWV0dmlld19vcHRpb25zLmxuZyA9IHRoaXMuZ2V0Q2VudGVyKCkubG5nKCk7XG4gIH1cblxuICB0aGlzLnBhbm9yYW1hID0gR01hcHMuY3JlYXRlUGFub3JhbWEoc3RyZWV0dmlld19vcHRpb25zKTtcblxuICB0aGlzLm1hcC5zZXRTdHJlZXRWaWV3KHRoaXMucGFub3JhbWEpO1xuXG4gIHJldHVybiB0aGlzLnBhbm9yYW1hO1xufTtcblxuR01hcHMuY3JlYXRlUGFub3JhbWEgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBlbCA9IGdldEVsZW1lbnRCeUlkKG9wdGlvbnMuZWwsIG9wdGlvbnMuY29udGV4dCk7XG5cbiAgb3B0aW9ucy5wb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5sYXQsIG9wdGlvbnMubG5nKTtcblxuICBkZWxldGUgb3B0aW9ucy5lbDtcbiAgZGVsZXRlIG9wdGlvbnMuY29udGV4dDtcbiAgZGVsZXRlIG9wdGlvbnMubGF0O1xuICBkZWxldGUgb3B0aW9ucy5sbmc7XG5cbiAgdmFyIHN0cmVldHZpZXdfZXZlbnRzID0gWydjbG9zZWNsaWNrJywgJ2xpbmtzX2NoYW5nZWQnLCAncGFub19jaGFuZ2VkJywgJ3Bvc2l0aW9uX2NoYW5nZWQnLCAncG92X2NoYW5nZWQnLCAncmVzaXplJywgJ3Zpc2libGVfY2hhbmdlZCddLFxuICAgICAgc3RyZWV0dmlld19vcHRpb25zID0gZXh0ZW5kX29iamVjdCh7dmlzaWJsZSA6IHRydWV9LCBvcHRpb25zKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVldHZpZXdfZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgZGVsZXRlIHN0cmVldHZpZXdfb3B0aW9uc1tzdHJlZXR2aWV3X2V2ZW50c1tpXV07XG4gIH1cblxuICB2YXIgcGFub3JhbWEgPSBuZXcgZ29vZ2xlLm1hcHMuU3RyZWV0Vmlld1Bhbm9yYW1hKGVsLCBzdHJlZXR2aWV3X29wdGlvbnMpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWV0dmlld19ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAoZnVuY3Rpb24ob2JqZWN0LCBuYW1lKSB7XG4gICAgICBpZiAob3B0aW9uc1tuYW1lXSkge1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihvYmplY3QsIG5hbWUsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgb3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkocGFub3JhbWEsIHN0cmVldHZpZXdfZXZlbnRzW2ldKTtcbiAgfVxuXG4gIHJldHVybiBwYW5vcmFtYTtcbn07XG5cbkdNYXBzLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50X25hbWUsIGhhbmRsZXIpIHtcbiAgcmV0dXJuIEdNYXBzLm9uKGV2ZW50X25hbWUsIHRoaXMsIGhhbmRsZXIpO1xufTtcblxuR01hcHMucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50X25hbWUpIHtcbiAgR01hcHMub2ZmKGV2ZW50X25hbWUsIHRoaXMpO1xufTtcblxuR01hcHMuY3VzdG9tX2V2ZW50cyA9IFsnbWFya2VyX2FkZGVkJywgJ21hcmtlcl9yZW1vdmVkJywgJ3BvbHlsaW5lX2FkZGVkJywgJ3BvbHlsaW5lX3JlbW92ZWQnLCAncG9seWdvbl9hZGRlZCcsICdwb2x5Z29uX3JlbW92ZWQnLCAnZ2VvbG9jYXRlZCcsICdnZW9sb2NhdGlvbl9mYWlsZWQnXTtcblxuR01hcHMub24gPSBmdW5jdGlvbihldmVudF9uYW1lLCBvYmplY3QsIGhhbmRsZXIpIHtcbiAgaWYgKEdNYXBzLmN1c3RvbV9ldmVudHMuaW5kZXhPZihldmVudF9uYW1lKSA9PSAtMSkge1xuICAgIGlmKG9iamVjdCBpbnN0YW5jZW9mIEdNYXBzKSBvYmplY3QgPSBvYmplY3QubWFwOyBcbiAgICByZXR1cm4gZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIob2JqZWN0LCBldmVudF9uYW1lLCBoYW5kbGVyKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgcmVnaXN0ZXJlZF9ldmVudCA9IHtcbiAgICAgIGhhbmRsZXIgOiBoYW5kbGVyLFxuICAgICAgZXZlbnROYW1lIDogZXZlbnRfbmFtZVxuICAgIH07XG5cbiAgICBvYmplY3QucmVnaXN0ZXJlZF9ldmVudHNbZXZlbnRfbmFtZV0gPSBvYmplY3QucmVnaXN0ZXJlZF9ldmVudHNbZXZlbnRfbmFtZV0gfHwgW107XG4gICAgb2JqZWN0LnJlZ2lzdGVyZWRfZXZlbnRzW2V2ZW50X25hbWVdLnB1c2gocmVnaXN0ZXJlZF9ldmVudCk7XG5cbiAgICByZXR1cm4gcmVnaXN0ZXJlZF9ldmVudDtcbiAgfVxufTtcblxuR01hcHMub2ZmID0gZnVuY3Rpb24oZXZlbnRfbmFtZSwgb2JqZWN0KSB7XG4gIGlmIChHTWFwcy5jdXN0b21fZXZlbnRzLmluZGV4T2YoZXZlbnRfbmFtZSkgPT0gLTEpIHtcbiAgICBpZihvYmplY3QgaW5zdGFuY2VvZiBHTWFwcykgb2JqZWN0ID0gb2JqZWN0Lm1hcDsgXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuY2xlYXJMaXN0ZW5lcnMob2JqZWN0LCBldmVudF9uYW1lKTtcbiAgfVxuICBlbHNlIHtcbiAgICBvYmplY3QucmVnaXN0ZXJlZF9ldmVudHNbZXZlbnRfbmFtZV0gPSBbXTtcbiAgfVxufTtcblxuR01hcHMuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50X25hbWUsIG9iamVjdCwgc2NvcGUpIHtcbiAgaWYgKEdNYXBzLmN1c3RvbV9ldmVudHMuaW5kZXhPZihldmVudF9uYW1lKSA9PSAtMSkge1xuICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIob2JqZWN0LCBldmVudF9uYW1lLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoYXJndW1lbnRzKS5zbGljZSgyKSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYoZXZlbnRfbmFtZSBpbiBzY29wZS5yZWdpc3RlcmVkX2V2ZW50cykge1xuICAgICAgdmFyIGZpcmluZ19ldmVudHMgPSBzY29wZS5yZWdpc3RlcmVkX2V2ZW50c1tldmVudF9uYW1lXTtcblxuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGZpcmluZ19ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgKGZ1bmN0aW9uKGhhbmRsZXIsIHNjb3BlLCBvYmplY3QpIHtcbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KHNjb3BlLCBbb2JqZWN0XSk7XG4gICAgICAgIH0pKGZpcmluZ19ldmVudHNbaV1bJ2hhbmRsZXInXSwgc2NvcGUsIG9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5HTWFwcy5nZW9sb2NhdGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBjb21wbGV0ZV9jYWxsYmFjayA9IG9wdGlvbnMuYWx3YXlzIHx8IG9wdGlvbnMuY29tcGxldGU7XG5cbiAgaWYgKG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICAgIG9wdGlvbnMuc3VjY2Vzcyhwb3NpdGlvbik7XG5cbiAgICAgIGlmIChjb21wbGV0ZV9jYWxsYmFjaykge1xuICAgICAgICBjb21wbGV0ZV9jYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBvcHRpb25zLmVycm9yKGVycm9yKTtcblxuICAgICAgaWYgKGNvbXBsZXRlX2NhbGxiYWNrKSB7XG4gICAgICAgIGNvbXBsZXRlX2NhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSwgb3B0aW9ucy5vcHRpb25zKTtcbiAgfVxuICBlbHNlIHtcbiAgICBvcHRpb25zLm5vdF9zdXBwb3J0ZWQoKTtcblxuICAgIGlmIChjb21wbGV0ZV9jYWxsYmFjaykge1xuICAgICAgY29tcGxldGVfY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn07XG5cbkdNYXBzLmdlb2NvZGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHRoaXMuZ2VvY29kZXIgPSBuZXcgZ29vZ2xlLm1hcHMuR2VvY29kZXIoKTtcbiAgdmFyIGNhbGxiYWNrID0gb3B0aW9ucy5jYWxsYmFjaztcbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xhdCcpICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xuZycpKSB7XG4gICAgb3B0aW9ucy5sYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMubGF0LCBvcHRpb25zLmxuZyk7XG4gIH1cblxuICBkZWxldGUgb3B0aW9ucy5sYXQ7XG4gIGRlbGV0ZSBvcHRpb25zLmxuZztcbiAgZGVsZXRlIG9wdGlvbnMuY2FsbGJhY2s7XG4gIFxuICB0aGlzLmdlb2NvZGVyLmdlb2NvZGUob3B0aW9ucywgZnVuY3Rpb24ocmVzdWx0cywgc3RhdHVzKSB7XG4gICAgY2FsbGJhY2socmVzdWx0cywgc3RhdHVzKTtcbiAgfSk7XG59O1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQb2x5Z29uIGNvbnRhaW5zTGF0TG5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vdHBhcmtpbi9Hb29nbGUtTWFwcy1Qb2ludC1pbi1Qb2x5Z29uXG4vLyBQb3lnb24gZ2V0Qm91bmRzIGV4dGVuc2lvbiAtIGdvb2dsZS1tYXBzLWV4dGVuc2lvbnNcbi8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9nb29nbGUtbWFwcy1leHRlbnNpb25zL3NvdXJjZS9icm93c2UvZ29vZ2xlLm1hcHMuUG9seWdvbi5nZXRCb3VuZHMuanNcbmlmICghZ29vZ2xlLm1hcHMuUG9seWdvbi5wcm90b3R5cGUuZ2V0Qm91bmRzKSB7XG4gIGdvb2dsZS5tYXBzLlBvbHlnb24ucHJvdG90eXBlLmdldEJvdW5kcyA9IGZ1bmN0aW9uKGxhdExuZykge1xuICAgIHZhciBib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKCk7XG4gICAgdmFyIHBhdGhzID0gdGhpcy5nZXRQYXRocygpO1xuICAgIHZhciBwYXRoO1xuXG4gICAgZm9yICh2YXIgcCA9IDA7IHAgPCBwYXRocy5nZXRMZW5ndGgoKTsgcCsrKSB7XG4gICAgICBwYXRoID0gcGF0aHMuZ2V0QXQocCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGguZ2V0TGVuZ3RoKCk7IGkrKykge1xuICAgICAgICBib3VuZHMuZXh0ZW5kKHBhdGguZ2V0QXQoaSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBib3VuZHM7XG4gIH07XG59XG5cbmlmICghZ29vZ2xlLm1hcHMuUG9seWdvbi5wcm90b3R5cGUuY29udGFpbnNMYXRMbmcpIHtcbiAgLy8gUG9seWdvbiBjb250YWluc0xhdExuZyAtIG1ldGhvZCB0byBkZXRlcm1pbmUgaWYgYSBsYXRMbmcgaXMgd2l0aGluIGEgcG9seWdvblxuICBnb29nbGUubWFwcy5Qb2x5Z29uLnByb3RvdHlwZS5jb250YWluc0xhdExuZyA9IGZ1bmN0aW9uKGxhdExuZykge1xuICAgIC8vIEV4Y2x1ZGUgcG9pbnRzIG91dHNpZGUgb2YgYm91bmRzIGFzIHRoZXJlIGlzIG5vIHdheSB0aGV5IGFyZSBpbiB0aGUgcG9seVxuICAgIHZhciBib3VuZHMgPSB0aGlzLmdldEJvdW5kcygpO1xuXG4gICAgaWYgKGJvdW5kcyAhPT0gbnVsbCAmJiAhYm91bmRzLmNvbnRhaW5zKGxhdExuZykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBSYXljYXN0IHBvaW50IGluIHBvbHlnb24gbWV0aG9kXG4gICAgdmFyIGluUG9seSA9IGZhbHNlO1xuXG4gICAgdmFyIG51bVBhdGhzID0gdGhpcy5nZXRQYXRocygpLmdldExlbmd0aCgpO1xuICAgIGZvciAodmFyIHAgPSAwOyBwIDwgbnVtUGF0aHM7IHArKykge1xuICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGhzKCkuZ2V0QXQocCk7XG4gICAgICB2YXIgbnVtUG9pbnRzID0gcGF0aC5nZXRMZW5ndGgoKTtcbiAgICAgIHZhciBqID0gbnVtUG9pbnRzIC0gMTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1Qb2ludHM7IGkrKykge1xuICAgICAgICB2YXIgdmVydGV4MSA9IHBhdGguZ2V0QXQoaSk7XG4gICAgICAgIHZhciB2ZXJ0ZXgyID0gcGF0aC5nZXRBdChqKTtcblxuICAgICAgICBpZiAodmVydGV4MS5sbmcoKSA8IGxhdExuZy5sbmcoKSAmJiB2ZXJ0ZXgyLmxuZygpID49IGxhdExuZy5sbmcoKSB8fCB2ZXJ0ZXgyLmxuZygpIDwgbGF0TG5nLmxuZygpICYmIHZlcnRleDEubG5nKCkgPj0gbGF0TG5nLmxuZygpKSB7XG4gICAgICAgICAgaWYgKHZlcnRleDEubGF0KCkgKyAobGF0TG5nLmxuZygpIC0gdmVydGV4MS5sbmcoKSkgLyAodmVydGV4Mi5sbmcoKSAtIHZlcnRleDEubG5nKCkpICogKHZlcnRleDIubGF0KCkgLSB2ZXJ0ZXgxLmxhdCgpKSA8IGxhdExuZy5sYXQoKSkge1xuICAgICAgICAgICAgaW5Qb2x5ID0gIWluUG9seTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBqID0gaTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5Qb2x5O1xuICB9O1xufVxuXG5pZiAoIWdvb2dsZS5tYXBzLkNpcmNsZS5wcm90b3R5cGUuY29udGFpbnNMYXRMbmcpIHtcbiAgZ29vZ2xlLm1hcHMuQ2lyY2xlLnByb3RvdHlwZS5jb250YWluc0xhdExuZyA9IGZ1bmN0aW9uKGxhdExuZykge1xuICAgIGlmIChnb29nbGUubWFwcy5nZW9tZXRyeSkge1xuICAgICAgcmV0dXJuIGdvb2dsZS5tYXBzLmdlb21ldHJ5LnNwaGVyaWNhbC5jb21wdXRlRGlzdGFuY2VCZXR3ZWVuKHRoaXMuZ2V0Q2VudGVyKCksIGxhdExuZykgPD0gdGhpcy5nZXRSYWRpdXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG59XG5cbmdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcy5wcm90b3R5cGUuY29udGFpbnNMYXRMbmcgPSBmdW5jdGlvbihsYXRMbmcpIHtcbiAgcmV0dXJuIHRoaXMuY29udGFpbnMobGF0TG5nKTtcbn07XG5cbmdvb2dsZS5tYXBzLk1hcmtlci5wcm90b3R5cGUuc2V0RmVuY2VzID0gZnVuY3Rpb24oZmVuY2VzKSB7XG4gIHRoaXMuZmVuY2VzID0gZmVuY2VzO1xufTtcblxuZ29vZ2xlLm1hcHMuTWFya2VyLnByb3RvdHlwZS5hZGRGZW5jZSA9IGZ1bmN0aW9uKGZlbmNlKSB7XG4gIHRoaXMuZmVuY2VzLnB1c2goZmVuY2UpO1xufTtcblxuZ29vZ2xlLm1hcHMuTWFya2VyLnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpc1snX19nbV9pZCddO1xufTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gQXJyYXkgaW5kZXhPZlxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mXG5pZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQgLyosIGZyb21JbmRleCAqLyApIHtcbiAgICAgIFwidXNlIHN0cmljdFwiO1xuICAgICAgaWYgKHRoaXMgPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHZhciB0ID0gT2JqZWN0KHRoaXMpO1xuICAgICAgdmFyIGxlbiA9IHQubGVuZ3RoID4+PiAwO1xuICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHZhciBuID0gMDtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG4gPSBOdW1iZXIoYXJndW1lbnRzWzFdKTtcbiAgICAgICAgICBpZiAobiAhPSBuKSB7IC8vIHNob3J0Y3V0IGZvciB2ZXJpZnlpbmcgaWYgaXQncyBOYU5cbiAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgfSBlbHNlIGlmIChuICE9IDAgJiYgbiAhPSBJbmZpbml0eSAmJiBuICE9IC1JbmZpbml0eSkge1xuICAgICAgICAgICAgICBuID0gKG4gPiAwIHx8IC0xKSAqIE1hdGguZmxvb3IoTWF0aC5hYnMobikpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChuID49IGxlbikge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHZhciBrID0gbiA+PSAwID8gbiA6IE1hdGgubWF4KGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcbiAgICAgIGZvciAoOyBrIDwgbGVuOyBrKyspIHtcbiAgICAgICAgICBpZiAoayBpbiB0ICYmIHRba10gPT09IHNlYXJjaEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGs7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICB9XG59XG4gIFxucmV0dXJuIEdNYXBzO1xufSkpO1xuIiwiR01hcHMgPSByZXF1aXJlICdnbWFwcydcblxubW9kdWxlLmV4cG9ydHMgPVxuICBpbml0OiAtPlxuICAgIEBpbml0TWFwKCkgaWYgJCgnI21hcCcpLmxlbmd0aFxuXG5cbiAgaW5pdE1hcDogLT5cbiAgICBAJG1hcF9lcnJvciA9ICQoJyNtYXBfZXJyb3InKVxuICAgIEAkc2VhcmNoID0gJCgnW25hbWU9XCJzZWFyY2hfbWFwXCJdJylcbiAgICBAaW5mb3dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KClcbiAgICBAbWFwID0gbmV3IEdNYXBzXG4gICAgICBkaXY6ICcjbWFwJyxcbiAgICAgIGxhdDogNDcuNjYyMDQsXG4gICAgICBsbmc6IC0xMjIuMzMzMzcsXG4gICAgICB6b29tOiAxMixcbiAgICAgIG1hcFR5cGVDb250cm9sOiBmYWxzZSxcbiAgICAgIHpvb21Db250cm9sT3B0aW9uczpcbiAgICAgICAgc3R5bGU6IGdvb2dsZS5tYXBzLlpvb21Db250cm9sU3R5bGUuTEFSR0UsXG4gICAgICAgIHBvc2l0aW9uOiBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uTEVGVF9DRU5URVJcbiAgICAgIHBhbkNvbnRyb2w6IGZhbHNlLFxuICAgICAgc3RyZWV0Vmlld0NvbnRyb2w6IGZhbHNlLFxuXG4gICAgICBzdHlsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnYWxsJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2xhYmVscy50ZXh0LmZpbGwnXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnc2F0dXJhdGlvbic6IDM2IH1cbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiA0MCB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdhbGwnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnbGFiZWxzLnRleHQuc3Ryb2tlJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ3Zpc2liaWxpdHknOiAnb24nIH1cbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxNiB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdhbGwnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnbGFiZWxzLmljb24nXG4gICAgICAgICAgICAnc3R5bGVycyc6IFsgeyAndmlzaWJpbGl0eSc6ICdvZmYnIH0gXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAnYWRtaW5pc3RyYXRpdmUnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnkuZmlsbCdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDIwIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ2FkbWluaXN0cmF0aXZlJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5LnN0cm9rZSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDE3IH1cbiAgICAgICAgICAgICAgeyAnd2VpZ2h0JzogMS4yIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ2xhbmRzY2FwZSdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDE2IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3BvaSdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDIxIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3JvYWQuaGlnaHdheSdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeS5maWxsJ1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTcgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAncm9hZC5oaWdod2F5J1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5LnN0cm9rZSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDI5IH1cbiAgICAgICAgICAgICAgeyAnd2VpZ2h0JzogMC4yIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3JvYWQuYXJ0ZXJpYWwnXG4gICAgICAgICAgICAnZWxlbWVudFR5cGUnOiAnZ2VvbWV0cnknXG4gICAgICAgICAgICAnc3R5bGVycyc6IFtcbiAgICAgICAgICAgICAgeyAnY29sb3InOiAnIzAwMDAwMCcgfVxuICAgICAgICAgICAgICB7ICdsaWdodG5lc3MnOiAxMCB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdmZWF0dXJlVHlwZSc6ICdyb2FkLmxvY2FsJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5J1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogMTMgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAnZmVhdHVyZVR5cGUnOiAndHJhbnNpdCdcbiAgICAgICAgICAgICdlbGVtZW50VHlwZSc6ICdnZW9tZXRyeSdcbiAgICAgICAgICAgICdzdHlsZXJzJzogW1xuICAgICAgICAgICAgICB7ICdjb2xvcic6ICcjMDAwMDAwJyB9XG4gICAgICAgICAgICAgIHsgJ2xpZ2h0bmVzcyc6IDE5IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2ZlYXR1cmVUeXBlJzogJ3dhdGVyJ1xuICAgICAgICAgICAgJ2VsZW1lbnRUeXBlJzogJ2dlb21ldHJ5J1xuICAgICAgICAgICAgJ3N0eWxlcnMnOiBbXG4gICAgICAgICAgICAgIHsgJ2NvbG9yJzogJyMwMDAwMDAnIH1cbiAgICAgICAgICAgICAgeyAnbGlnaHRuZXNzJzogNyB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICBdXG5cbiAgICBAYnVpbGRNYXJrZXJzKCkgaWYgbG9jYXRpb25zP1xuICAgIEBsaXN0ZW5lcnMoKVxuXG4gICMgZ2VvbG9jYXRlOiAtPlxuICAjICAgR01hcHMuZ2VvbG9jYXRlXG4gICMgICAgIHN1Y2Nlc3M6IChwb3NpdGlvbikgLT5cbiAgIyAgICAgICBtYXAuc2V0Q2VudGVyIHBvc2l0aW9uLmNvb3Jkcy5sYXRpdHVkZSwgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxuXG4gICMgICAgIGVycm9yOiAoZXJyb3IpIC0+XG4gICMgICAgICAgYWxlcnQgJ0dlb2xvY2F0aW9uIGZhaWxlZDogJyArIGVycm9yLm1lc3NhZ2VcblxuICAjICAgICBub3Rfc3VwcG9ydGVkOiAtPlxuICAjICAgICAgIGFsZXJ0ICdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBnZW9sb2NhdGlvbidcblxuICAjICAgICBhbHdheXM6IC0+XG4gICMgICAgICAgYWxlcnQgJ0RvbmUhJ1xuXG4gIGxpc3RlbmVyczogLT5cbiAgICBAJHNlYXJjaC5vbiAna2V5dXAnLCA9PlxuICAgICAgQCRtYXBfZXJyb3IuZW1wdHkoKVxuICAgICAgcSA9IEAkc2VhcmNoLnZhbCgpXG4gICAgICBAc2VhcmNoKHEpIGlmIHEubGVuZ3RoID4gM1xuXG4gIHNlYXJjaDogKHEpIC0+XG4gICAgR01hcHMuZ2VvY29kZVxuICAgICAgYWRkcmVzczogcVxuICAgICAgY2FsbGJhY2s6IChyZXN1bHRzLCBzdGF0dXMpID0+XG4gICAgICAgIGlmIHN0YXR1cyBpcyAnWkVST19SRVNVTFRTJ1xuICAgICAgICAgIEBub3RGb3VuZCgpXG4gICAgICAgIGlmIHJlc3VsdHNcbiAgICAgICAgICBsYXRsbmcgPSByZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uXG4gICAgICAgICAgQG1hcC5zZXRDZW50ZXIobGF0bG5nLmxhdCgpLCBsYXRsbmcubG5nKCkpXG4gICAgICAgICAgQG1hcC5zZXRab29tKDE0KVxuXG4gIG5vdEZvdW5kOiAtPlxuICAgIEAkbWFwX2Vycm9yLnRleHQgJ25vdGhpbmcgZm91bmQnXG5cbiAgYnVpbGRNYXJrZXJzOiAtPlxuICAgIGJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKVxuICAgICQuZWFjaCBsb2NhdGlvbnMsIChpLCBsb2NhdGlvbikgPT5cbiAgICAgIGxhdCA9IHBhcnNlRmxvYXQobG9jYXRpb24ubGF0KVxuICAgICAgbG5nID0gcGFyc2VGbG9hdChsb2NhdGlvbi5sbmcpXG4gICAgICBib3VuZHMuZXh0ZW5kIG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0LCBsbmcpXG5cbiAgICAgIEBtYXAuYWRkTWFya2VyXG4gICAgICAgIGxhdDogbGF0XG4gICAgICAgIGxuZzogbG5nXG4gICAgICAgIHRpdGxlOiBcIiN7bG9jYXRpb24ubmFtZX1cIlxuICAgICAgICBpbmZvV2luZG93OlxuICAgICAgICAgIGNvbnRlbnQ6IFwiPGRpdj4je2xvY2F0aW9uLm5hbWV9PC9kaXY+PGRpdj4je2xvY2F0aW9uLnVybH08L2Rpdj5cIlxuICAgICMgQG1hcC5maXRCb3VuZHMgYm91bmRzXG5cblxuIiwiQmlrZU1hcCA9IHJlcXVpcmUgJy4vbGliL21hcCdcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgRE9NIEluaXRcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuJCAtPlxuXG4gIEJpa2VNYXAuaW5pdCgpXG5cbiAgJCgnLnRvZ2dsZS1tZW51Jykub24gJ2NsaWNrJywgLT5cbiAgICAkKCcucmVzcG9uc2l2ZS1uYXYnKS50b2dnbGVDbGFzcyAnYWN0aXZlJ1xuICAgICQoXCIudG9wXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS10b3BcIlxuICAgICQoXCIubWlkZGxlXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS1taWRkbGVcIlxuICAgICQoXCIuYm90dG9tXCIpLnRvZ2dsZUNsYXNzIFwiYW5pbWF0ZS1ib3R0b21cIlxuXG4gICQoJy5zbGlkZXInKS5zbGlja1xuICAgIGRvdHM6IHRydWUsXG4gICAgc3BlZWQ6IDYwMCxcbiAgICBjc3NFYXNlOiAnY3ViaWMtYmV6aWVyKDAuMjMwLCAxLjAwMCwgMC4zMjAsIDEuMDAwKSdcbiAgICBzbGlkZXNUb1Njcm9sbDogMSxcbiAgICBhdXRvcGxheTogdHJ1ZSxcbiAgICBhdXRvcGxheVNwZWVkOiA0MDAwXG5cbiAgJCgnLnNsaWRlci0tbXVsdGlwbGUnKS5zbGlja1xuICAgIGRvdHM6IGZhbHNlLFxuICAgIHNsaWRlc1RvU2hvdzogMixcbiAgICByZXNwb25zaXZlOiBbXG4gICAgICB7XG4gICAgICAgIGJyZWFrcG9pbnQ6IDQ4MCxcbiAgICAgICAgc2V0dGluZ3M6XG4gICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxuICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxXG4gICAgICB9XG4gICAgXVxuXG4gICQoZG9jdW1lbnQpLnJlYWR5IC0+XG4gIHNjcm9sbF9wb3MgPSAwXG4gICQoZG9jdW1lbnQpLnNjcm9sbCAtPlxuICAgIHNjcm9sbF9wb3MgPSAkKHRoaXMpLnNjcm9sbFRvcCgpXG4gICAgaWYgc2Nyb2xsX3BvcyA+IDEwXG4gICAgICAkKCcubmF2LWJhY2tncm91bmQnKS5jc3MgJ3RvcCcsICcwJ1xuICAgIGVsc2VcbiAgICAgICQoJy5uYXYtYmFja2dyb3VuZCcpLmNzcyAndG9wJywgJy0xMjBweCdcblxuICAkdW5kZXJsaW5lcyA9ICQoJy51bmRlcmxpbmUnKVxuICAkdW5kZXJsaW5lczIgPSAkKCcudW5kZXJsaW5lMicpXG5cbiAgJChkb2N1bWVudCkub24gJ21vdXNlZW50ZXInLCAnLnRleHQtbGluaycsIC0+XG4gICAgZHluYW1pY3MuYW5pbWF0ZSAkdW5kZXJsaW5lc1skKHRoaXMpLnBhcmVudCgpLmluZGV4KCldLCB7d2lkdGg6ICcxMDAlJ30sIHR5cGU6IGR5bmFtaWNzLnNwcmluZ1xuICAkKGRvY3VtZW50KS5vbiAnbW91c2VsZWF2ZScsICcudGV4dC1saW5rJywgLT5cbiAgICBkeW5hbWljcy5hbmltYXRlICR1bmRlcmxpbmVzWyQodGhpcykucGFyZW50KCkuaW5kZXgoKV0sIHsgd2lkdGg6ICcwJyB9LCB0eXBlOiBkeW5hbWljcy5zcHJpbmdcbiAgXG4gICQoZG9jdW1lbnQpLm9uICdtb3VzZWVudGVyJywgJy50b3AtdGV4dC1saW5rJywgLT5cbiAgICBkeW5hbWljcy5hbmltYXRlICR1bmRlcmxpbmVzMlskKHRoaXMpLnBhcmVudCgpLmluZGV4KCldLCB7d2lkdGg6ICcxMDAlJ30sIHR5cGU6IGR5bmFtaWNzLnNwcmluZ1xuICAkKGRvY3VtZW50KS5vbiAnbW91c2VsZWF2ZScsICcudG9wLXRleHQtbGluaycsIC0+XG4gICAgZHluYW1pY3MuYW5pbWF0ZSAkdW5kZXJsaW5lczJbJCh0aGlzKS5wYXJlbnQoKS5pbmRleCgpXSwgeyB3aWR0aDogJzAnIH0sIHR5cGU6IGR5bmFtaWNzLnNwcmluZyJdfQ==
