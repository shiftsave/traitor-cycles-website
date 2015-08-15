<?php if(!defined('KIRBY')) exit ?>

title: Home
pages: false
fields:
  title:
    label: Page Title
    type: text

  headline:
    label: Slider Text
    type: text

  slider:
    label: Slider Images
    type: structure
    fields:
      slider_image:
        label: Image
        type: select
        options: images
  
  hero_subheading:
    label: Page SubHeading
    type:text
  
  hero_content:
    label: Content
    type: textarea

  featured_subheading:
    label: Subheading
    type: text

  featured:
    label: Products Listing
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

      product_page:
        label: Details Page
        type: page