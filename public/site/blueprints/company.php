<?php if(!defined('KIRBY')) exit ?>

title: Company
pages: false
fields:
  title:
    label: Page Title
    type: text

  slider:
    label: Slider Images
    type: structure
    fields:
      slider_image:
        label: Image
        type: select
        options: images

  hero_headline:
    label: Headline
    type: text

  hero_text:
    label: Lead Content
    type: textarea
  
  area1_content:
    label: Content Area
    type: textarea