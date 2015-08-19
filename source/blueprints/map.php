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
    fields:
      name:
        label: Store Name
        type: text
      address:
        label: Address
        type: text
      email:
        label: Email
        type: text
      url:
        label: Website
        type: text
      loclat:
        label: Latitude
        type: text
      loclong:
        label: Longitude
        type: text