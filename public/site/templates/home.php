
<body></body><?php snippet('header') ?>
<main role="main" class="main">
  <div class="slider--container">
    <h1 class="slider--text"><?php echo htmlspecialchars($page->headline(), ENT_QUOTES, 'UTF-8'); ?></h1>
    <div class="darken"></div>
    <div class="slider"><?php $slides = $page->slider()->yaml() ?><?php foreach($slides as $slide): ?>
      <div style="background-image:url(<?php echo $page->image($slide['slider_image'])->url() ?>)" class="full-width--slider"></div><?php endforeach; ?>
    </div>
  </div>
  <div class="lead--text">
    <h2><?php echo htmlspecialchars($page->hero_subheading(), ENT_QUOTES, 'UTF-8'); ?></h2>
    <p class="lead"><?php echo htmlspecialchars($page->hero_content(), ENT_QUOTES, 'UTF-8'); ?></p>
  </div>
  <div class="featured-products">
    <h2><?php echo htmlspecialchars($page->featured_subheading(), ENT_QUOTES, 'UTF-8'); ?></h2>
    <div class="slider--multiple"><?php $products = $page->featured()->toStructure() ?><?php foreach($products as $product):  ?>
      <div class="half-width"><a href="<?php echo url('bikes/') ?>/<?php echo $product->product_page()?>" class="product--image"><img src="<?php echo $page->image($product->product_image())->url() ?>"/></a><a href="<?php echo $product->product_page()?>" class="featured--link text-link">
          <h3><?php echo htmlspecialchars($product->product_name(), ENT_QUOTES, 'UTF-8'); ?></h3>
          <div class="underline"></div></a>
        <p><?php echo htmlspecialchars($product->product_desc(), ENT_QUOTES, 'UTF-8'); ?></p>
      </div><?php endforeach; ?>
    </div><a href="<?php echo url('bikes/') ?>" class="primary-button">View All Bikes</a>
  </div>
</main><?php snippet('footer') ?>