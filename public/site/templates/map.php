<?php snippet('header') ?>
<div class="map-container">
  <form class="map-search">
    <input type="text" name="search_map" onfocus="this.value='';" value="Search in city or ZIP code"/>
  </form>
  <div id="map"></div>
  <script>
    <?php
      $json = array();
      foreach($page->locations()->toStructure() as $location):
        $json[] = array(
          'name' => (string)$location->name(),
          'address' => (string)$location->address(),
          'lat' => (string)$location->loclat(),
          'lng' => (string)$location->loclong(),
          'phone' => (string)$location->phone(),
          'email' => (string)$location->email(),
          'url' => (string)$location->url()
        );
      endforeach;
    ?>
    var locations = <?php echo json_encode($json);?>;
    
  </script>
</div>