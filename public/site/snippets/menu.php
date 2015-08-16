
<nav role="navigation" class="responsive-nav"><a href="#" class="toggle-menu">
    <div class="menu-icon">
      <div class="menu-icon__bar top"></div>
      <div class="menu-icon__bar middle"></div>
      <div class="menu-icon__bar bottom"></div>
    </div></a><a href="<?php echo url() ?>" class="logo"><img src="<?php echo url('assets/images/traitor-logo.svg') ?>" alt="<?php echo $site->title()->html() ?>"/></a>
  <ul class="menu"><?php foreach($pages->visible() as $p): ?>
    <li><a href="<?php echo $p->url() ?>" class="<?php e($p->isOpen(), 'nav--active') ?> top-text-link"><span><?php echo htmlspecialchars($p->title()->html(), ENT_QUOTES, 'UTF-8'); ?></span>
        <div class="underline2"></div></a><?php if($p->hasVisibleChildren()) : ?>
      <div class="submenu"><?php foreach($p->children()->visible() as $p): ?>
        <div class="item"><a href="<?php echo $p->url() ?>"><?php echo htmlspecialchars($p->title()->html(), ENT_QUOTES, 'UTF-8'); ?></a></div><?php endforeach; ?>
      </div><?php endif ?>
    </li><?php endforeach; ?>
    <li><a href="http://traitorcycles.wordpress.com" class="top-text-link"><span>Blog</span>
        <div class="underline2"></div></a></li>
  </ul><a href="http://traitorcycles.bigcartel.com" class="primary-button pull-right">Store</a>
  <div class="nav-background"></div>
</nav>