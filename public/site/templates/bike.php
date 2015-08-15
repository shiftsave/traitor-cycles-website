<?php snippet('header') ?>
<main role="main" class="main">
  <div class="slider--container">
    <div class="centered">
      <h1><?php echo htmlspecialchars($page->title(), ENT_QUOTES, 'UTF-8'); ?></h1>
      <h4 class="white"><?php echo htmlspecialchars($page->price_complete(), ENT_QUOTES, 'UTF-8'); ?></h4><a href="/dealers" class="primary-button">Find Dealers</a>
    </div>
    <div class="darken"></div>
    <div class="slider"><?php $slides = $page->slider()->yaml() ?><?php foreach($slides as $slide): ?>
      <div style="background-image:url(<?php echo $page->image($slide['slider_image'])->url() ?>)" class="full-width--slider"></div><?php endforeach; ?>
    </div>
  </div><img src="<?php echo $page->files()->find($page->hero_image())->url() ?>" class="padded"/>
  <div class="details">
    <div class="features--text">
      <h5>features</h5>
    </div>
    <ul class="product--features--list"><?php $features = $page->features()->split() ?><?php foreach($features as $feature): ?>
      <li><img src="<?php echo url('assets/images/') . $feature . '.svg' ?>"/>
        <p><?php echo htmlspecialchars($feature = str_replace('_', ' ', $feature), ENT_QUOTES, 'UTF-8'); ?></p>
      </li><?php endforeach; ?>
    </ul>
  </div>
  <div class="tab-container">
    <ul data-persist="true" class="tabs">
      <li class="selected"><a href="#view1" class="tab-nav text-link"><span>Description</span>
          <div class="underline"></div></a></li>
      <li><a href="#view2" class="tab-nav text-link"><span>Specs</span>
          <div class="underline"></div></a></li>
      <li><a href="#view3" class="tab-nav text-link"><span>Geometry</span>
          <div class="underline"></div></a></li>
    </ul>
    <div class="tabcontents">
      <div id="view1"><?php echo $page->description()->kirbytext() ?>
      </div>
      <div id="view2"><?php echo $page->specs()->kirbytext() ?>
      </div>
      <div id="view3"><?php echo $page->geometry()->kirbytext() ?>
      </div>
    </div>
  </div>
</main><?php snippet('footer') ?>