<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="initial-scale=1">
    <title><?php echo htmlspecialchars($site->title()->html(), ENT_QUOTES, 'UTF-8'); ?></title>
    <meta name="description" content="<?php echo $site->description()->html() ?>">
    <meta name="keywords">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.css">
    <script src="https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.js"></script><?php echo css('assets/css/main.css') ?><?php echo css('http://cdn.rawgit.com/noelboss/featherlight/1.3.4/release/featherlight.min.css') ?><?php echo js('http://maps.google.com/maps/api/js?sensor=true') ?><?php echo js('assets/js/vendor.min.js') ?><?php echo js('assets/js/main.js') ?><?php echo js('http://cdn.rawgit.com/noelboss/featherlight/1.3.4/release/featherlight.min.js') ?>
  </head>
  <body>
    <header role="banner" class="header cf"><?php snippet('menu') ?>
      <div class="gradient-overlay"></div>
    </header>
  </body>
</html>