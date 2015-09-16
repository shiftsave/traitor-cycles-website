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
      slider_desc:
        label: headline
        type: text

  hero_subheading:
    label: Page SubHeading
    type:text

  hero_content:
    label: Content
    type: textarea

  featured_product:
    label: Featured Product
    type: text

  featured_description:
    label: Featured Product Description
    type: text

  featured_photo:
    label: Featured Product Image
    type: structure
    fields:
      slider_image:
        label: Image
        type: select
        options: images 
