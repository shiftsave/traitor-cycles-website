<?php snippet('header') ?>
<main role="main" class="main">
  <div class="full-width--text-s">
    <h1><?php echo htmlspecialchars($page->title(), ENT_QUOTES, 'UTF-8'); ?></h1>
  </div>
  <div class="content--media"><?php echo $page->text()->kirbytext() ?>
  </div>
</main><?php snippet('footer') ?>