
<body></body><?php snippet('header') ?>
<main role="main" class="main">
  <div class="slider--container">
    <div class="darken"></div>
    <h1 class="slider--text"><?php echo htmlspecialchars($page->headline(), ENT_QUOTES, 'UTF-8'); ?></h1>
    <div class="slider"><?php $slides = $page->slider()->yaml() ?><?php foreach($slides as $slide): ?>
      <div class="slider--container">
        <h1 class="slider--text"><?php echo htmlspecialchars($slide['slider_desc'], ENT_QUOTES, 'UTF-8'); ?></h1>
        <div style="background-image:url(<?php echo $page->image($slide['slider_image'])->url() ?>)" class="full-width--slider"></div>
      </div><?php endforeach; ?>
    </div>
  </div>
  <div class="lead--text">
    <h2><?php echo htmlspecialchars($page->hero_subheading(), ENT_QUOTES, 'UTF-8'); ?></h2>
    <p class="lead"><?php echo htmlspecialchars($page->hero_content(), ENT_QUOTES, 'UTF-8'); ?></p>
  </div>
  <div class="slider--container">
    <div class="centered">
      <h1><?php echo htmlspecialchars($page->featured_product(), ENT_QUOTES, 'UTF-8'); ?></h1>
      <h4 class="white"><?php echo htmlspecialchars($page->featured_description(), ENT_QUOTES, 'UTF-8'); ?></h4><a href="/bikes/crusade" class="primary-button">Check it out!</a>
    </div>
    <div class="darken"></div>
    <div class="slider"><?php $slides = $page->featured_photo()->yaml() ?><?php foreach($slides as $slide): ?>
      <div style="background-image:url(<?php echo $page->image($slide['slider_image'])->url() ?>)" class="full-width--slider"></div><?php endforeach; ?>
    </div>
  </div>
</main><?php snippet('footer') ?>