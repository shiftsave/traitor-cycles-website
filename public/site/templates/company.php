<?php snippet('header') ?>
<main role="main" class="main">
  <div class="slider--container">
    <h1 class="slider--text"><?php echo htmlspecialchars($page->hero_headline(), ENT_QUOTES, 'UTF-8'); ?></h1>
    <div class="darken"></div>
    <div class="slider"><?php $slides = $page->slider()->yaml() ?><?php foreach($slides as $slide): ?>
      <div style="background-image:url(<?php echo $page->image($slide['slider_image'])->url() ?>)" class="full-width--slider"></div><?php endforeach; ?>
    </div>
  </div>
  <div class="lead--text">
    <p class="lead"><?php echo htmlspecialchars($page->hero_text(), ENT_QUOTES, 'UTF-8'); ?></p>
  </div>
  <div class="content--media"><?php echo $page->area1_content()->kirbytext() ?>
  </div>
</main><?php snippet('footer') ?>