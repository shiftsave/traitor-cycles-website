<?php if(!defined('KIRBY')) exit ?>

title: Dealers Map
pages: false
fields:
  title:
    label: Title
    type: text
  locations:
    label: Locations
    type: structure
    entry: >
      <strong>{{name}}</strong>
      {{url}}<br />
    fields:
      name:
        label: Store Name
        type: text
      loclat:
        label: Latitude
        type: text
      loclong:
        label: Longitude
        type: text
      url:
        label: Website
        type: url