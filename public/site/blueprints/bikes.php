<?php if(!defined('KIRBY')) exit ?>

title: Bikes
pages: true
files: true
fields:
  title:
    label: Title
    type:  text
  product:
    label: Products
    type: structure
    fields:
      product_name:
        label: Name
        type: text
      product_desc:
        label: Description
        type: textarea
      product_image:
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


      product_page:
        label: Details Page
        type: select
        options: children
