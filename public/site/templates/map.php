<?php snippet('header') ?>
<div class="map-container">
  <form class="map-search">
    <input type="text" name="search_map" onfocus="this.value='';" value="Search this map"/>
  </form>
  <div id="map"></div>
  <script>
    <?php
      $json = array();
      foreach($page->locations()->toStructure() as $location):
        $json[] = array(
          'name' => (string)$location->name(),
          'url' => (string)$location->url(),
          'lng' => (string)$location->loclong(),
          'lat' => (string)$location->loclat()
        );
      endforeach;
    ?>
    var locations = <?php echo json_encode($json);?>;
    
  </script>
</div>