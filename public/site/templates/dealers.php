<?php snippet('header') ?><?php $USlocations = $page->us_location()->yaml();

function cmp($a, $b){
  return strcmp($a["state"], $b["state"]);
}
usort($USlocations, "cmp");
 ?><?php $states = array();
foreach($USlocations as $shop):
  if(!in_array($shop['state'], $states)):
    $states[] = $shop['state'];
  endif;
endforeach;
 ?>
<main role="main" class="main">
  <div class="full-width--text">
    <h1>Traitors around the world</h1>
  </div>
  <div class="search-area">
    <h3>Find dealers nearby:</h3>
    <form id="search" action="" method="get">
      <input type="text" name="search" onfocus="this.value='';" value="Enter your city" class="sfield"/><i class="fa fa-search"></i>
    </form>
    <ul>
      <li></li>
    </ul>
  </div>
  <div class="tab-container">
    <ul data-persist="true" class="tabs">
      <li class="selected"><a href="#view1" class="tab-nav">USA</a></li>
      <li><a href="#view2" class="tab-nav">Canada</a></li>
      <li><a href="#view3" class="tab-nav">International</a></li>
    </ul>
    <div class="tabcontents">
      <div id="view1"><?php if(param('state')): 
  echo "<h5>".ucwords(str_replace("-", " ", param('state')))."</h5>";
  foreach($USlocations as $shop):
    if($shop['state'] == param('state')): ?>
      <li class="location">
        <div class="full">
          <h3><?php echo $shop['name'] ?></h3>
        </div>
        <div class="left">
          <?php echo $shop['address'] ?>
        </div>
        <div class="right">
          <?php echo $shop['phone'] ?></br>
          <a href="<?php echo $shop['website'] ?>"><?php echo $shop['website'] ?></a>
        </div>
      </li>
    <?php endif;
  endforeach; 
else:
  foreach ($states as $state):
  echo "<h5>".ucwords(str_replace("-", " ", $state))."</h5>";
    foreach($USlocations as $shop):
      if($state == $shop['state']): ?>
        <li class="location">
          <div class="full">
            <h3><?php echo $shop['name'] ?></h3>
          </div>
          <div class="left">
            <?php echo $shop['address'] ?>
          </div>
          <div class="right">
            <?php echo $shop['phone'] ?></br>
            <a href="<?php echo $shop['website'] ?>"><?php echo $shop['website'] ?></a>
          </div>
        </li>
      <?php endif;
    endforeach;
  endforeach;
endif; ?>
      </div>
      <div id="view2">
        <p>Empty</p>
      </div>
      <div id="view3">
        <p>Empty</p>
      </div>
    </div>
  </div>
</main><?php snippet('footer') ?>