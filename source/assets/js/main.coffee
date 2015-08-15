BikeMap = require './lib/map'


#--------------------------------------------------------
# DOM Init
#--------------------------------------------------------
$ ->

  BikeMap.init()

  $('.toggle-menu').on 'click', ->
    $('.responsive-nav').toggleClass 'active'
    $(".top").toggleClass "animate-top"
    $(".middle").toggleClass "animate-middle"
    $(".bottom").toggleClass "animate-bottom"

  $('.slider').slick
    dots: true,
    speed: 600,
    cssEase: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)'
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000

  $('.slider--multiple').slick
    dots: false,
    slidesToShow: 2,
    responsive: [
      {
        breakpoint: 480,
        settings:
          slidesToShow: 1,
          slidesToScroll: 1
      }
    ]

  $(document).ready ->
  scroll_pos = 0
  $(document).scroll ->
    scroll_pos = $(this).scrollTop()
    if scroll_pos > 10
      $('.nav-background').css 'top', '0'
    else
      $('.nav-background').css 'top', '-120px'

  $underlines = $('.underline')
  $underlines2 = $('.underline2')

  $(document).on 'mouseenter', '.text-link', ->
    dynamics.animate $underlines[$(this).parent().index()], {width: '100%'}, type: dynamics.spring
  $(document).on 'mouseleave', '.text-link', ->
    dynamics.animate $underlines[$(this).parent().index()], { width: '0' }, type: dynamics.spring
  
  $(document).on 'mouseenter', '.top-text-link', ->
    dynamics.animate $underlines2[$(this).parent().index()], {width: '100%'}, type: dynamics.spring
  $(document).on 'mouseleave', '.top-text-link', ->
    dynamics.animate $underlines2[$(this).parent().index()], { width: '0' }, type: dynamics.spring