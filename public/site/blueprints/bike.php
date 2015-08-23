<?php if(!defined('KIRBY')) exit ?>

title: Single Bike
pages: false
files: true
fields:
  title:
    label: Bike Name
    type: text
  
  price_complete:
    label: Bike Price
    type: text

  slider:
    label: Photography Slider
    type: structure
    fields:
      slider_image:
        label: Image
        type: select
        options: images

  product_color:
    label: Bike Colors
    type: structure
    fields:
      slider_image:
        label: Image
        type: select
        options: images

  features:
    label: Features
    type: checkboxes
    columns: 2
    options:
      Dropbar: Dropbar
      Flatbar: Flatbar
      Disc_Brakes: Disk Brakes
      Caliper_Brakes: Caliper Brakes
      Gears: Gears
      Single_Speed: Single Speed
      Rear_Rack_Mounts: Rear Rack Mounts
      Front_and_Rear_Rack_Mounts: Front and Rear Rack Mounts
      Steel_Frame: Steel Frame
      Custom_Dropout: Custom Dropout
  
  description:
    label: Description
    type: textarea
  
  specs:
    label: Description
    type: textarea
  
  geometry:
    label: Geometry
    type: textarea
