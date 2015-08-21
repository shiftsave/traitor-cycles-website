GMaps = require 'gmaps'

module.exports =
  init: ->
    @initMap() if $('#map').length


  initMap: ->
    @$map_error = $('#map_error')
    @$search = $('[name="search_map"]')
    @infowindow = new google.maps.InfoWindow()
    @map = new GMaps
      div: '#map',
      lat: 47.66204,
      lng: -122.33337,
      zoom: 12,
      mapTypeControl: false,
      zoomControlOptions:
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.LEFT_CENTER
      panControl: false,
      streetViewControl: false,

      styles: [
          {
            'featureType': 'all'
            'elementType': 'labels.text.fill'
            'stylers': [
              { 'saturation': 36 }
              { 'color': '#000000' }
              { 'lightness': 40 }
            ]
          }
          {
            'featureType': 'all'
            'elementType': 'labels.text.stroke'
            'stylers': [
              { 'visibility': 'on' }
              { 'color': '#000000' }
              { 'lightness': 16 }
            ]
          }
          {
            'featureType': 'all'
            'elementType': 'labels.icon'
            'stylers': [ { 'visibility': 'off' } ]
          }
          {
            'featureType': 'administrative'
            'elementType': 'geometry.fill'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 20 }
            ]
          }
          {
            'featureType': 'administrative'
            'elementType': 'geometry.stroke'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 17 }
              { 'weight': 1.2 }
            ]
          }
          {
            'featureType': 'landscape'
            'elementType': 'geometry'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 16 }
            ]
          }
          {
            'featureType': 'poi'
            'elementType': 'geometry'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 21 }
            ]
          }
          {
            'featureType': 'road.highway'
            'elementType': 'geometry.fill'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 17 }
            ]
          }
          {
            'featureType': 'road.highway'
            'elementType': 'geometry.stroke'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 29 }
              { 'weight': 0.2 }
            ]
          }
          {
            'featureType': 'road.arterial'
            'elementType': 'geometry'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 10 }
            ]
          }
          {
            'featureType': 'road.local'
            'elementType': 'geometry'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 13 }
            ]
          }
          {
            'featureType': 'transit'
            'elementType': 'geometry'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 19 }
            ]
          }
          {
            'featureType': 'water'
            'elementType': 'geometry'
            'stylers': [
              { 'color': '#000000' }
              { 'lightness': 7 }
            ]
          }
        ]

    @buildMarkers() if locations?
    @listeners()
    @geolocate()

  geolocate: ->
    GMaps.geolocate
      success: (position) ->
        map.setCenter position.coords.latitude, position.coords.longitude

      error: (error) ->
        alert 'Geolocation failed: ' + error.message

      not_supported: ->
        alert 'Your browser does not support geolocation'

      always: ->
        alert 'Done!'

  listeners: ->
    @$search.on 'keyup', =>
      @$map_error.empty()
      q = @$search.val()
      @search(q) if q.length > 3

  search: (q) ->
    GMaps.geocode
      address: q
      callback: (results, status) =>
        if status is 'ZERO_RESULTS'
          @notFound()
        if results
          latlng = results[0].geometry.location
          @map.setCenter(latlng.lat(), latlng.lng())
          @map.setZoom(14)

  notFound: ->
    @$map_error.text 'nothing found'

  buildMarkers: ->
    bounds = new google.maps.LatLngBounds()
    $.each locations, (i, location) =>
      lat = parseFloat(location.lat)
      lng = parseFloat(location.lng)
      bounds.extend new google.maps.LatLng(lat, lng)

      @map.addMarker
        lat: lat
        lng: lng
        title: "#{location.name}"
        infoWindow:
          content: "<div class='map--name'>#{location.name}</div><div class='map--url'>#{location.address}</div><div class='map--url'>#{location.phone}</div><div class='map--url'><a href='#{location.url}'>#{location.url}</div>"
    # @map.fitBounds bounds


