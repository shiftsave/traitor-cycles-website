<?php if(!defined('KIRBY')) exit ?>

title: Dealers
pages: false
fields:
  title:
    label: Title
    type: text
  us_location:
    label: US Locations
    type: structure
    entry: >
      <strong>{{name}}</strong>
      {{email}}<br />
      {{phone}}<br />
      {{state}}
    fields:
      name:
        label: Store Name
        type: text
      address:
        label: Address
        type: text
      state:
        label: State
        type: select
        default: washington
        options:
          alaska: Alaska
          arizona: Arizona
          california: California
          colorado: Colorado
          florida: Florida
      phone:
        label: Phone
        type: tel
      website:
        label: Website
        type: url