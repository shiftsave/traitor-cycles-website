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
  </div>
  <div class="product--colors">
    <div class="darken"></div>
    <div class="slider"><?php $color_slides = $page->product_color()->yaml() ?><?php foreach($color_slides as $slide): ?><img src="<?php echo $page->image($slide['slider_image'])->url() ?>"/><?php endforeach; ?>
    </div>
  </div>
  <div class="product--details">
    <div class="darken"></div>
    <div class="slider--details"><?php $detail_slides = $page->product_details()->yaml() ?><?php foreach($detail_slides as $slide): ?><a href="<?php echo $page->image($slide['slider_image'])->url() ?>" data-featherlight="image" class="gallery"><img src="<?php echo $page->image($slide['slider_image'])->url() ?>"/></a><?php endforeach; ?>
    </div>
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