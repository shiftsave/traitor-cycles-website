###*
 * Gulp Scaffold System
 *
 * @author  Ivan Cruz
 * @date   6.24.14
 *
###


gulp           = require 'gulp'
autoprefixer   = require 'gulp-autoprefixer'
browserify     = require 'gulp-browserify'
browserSync    = require('browser-sync')
concat         = require 'gulp-concat'
connect        = require 'gulp-connect-php'
coffeelint     = require 'gulp-coffeelint'
coffeeify      = require 'coffeeify'
handleify      = require 'handleify'
jade           = require 'gulp-jade-php'
jeet           = require 'jeet'
livereload     = require 'gulp-livereload'
minifyCSS      = require 'gulp-minify-css'
notify         = require 'gulp-notify'
plumber        = require 'gulp-plumber'
rename         = require 'gulp-rename'
runSequence    = require 'run-sequence'
stylus         = require 'gulp-stylus'
uglify         = require 'gulp-uglify'
util           = require 'gulp-util'
watch          = require 'gulp-watch'
del            = require 'del'


#--------------------------------------------------------
# Variables
#--------------------------------------------------------

# Root application path
# basePath = 'process.cwd()'

# Source path
sourcePath = "source"

# Compile path
outputPath = "public"

# Directory where vendor files live
vendorPath = "#{sourcePath}/assets/vendor"

# Name of snippets directory
blueprintsDirectory = "blueprints"

# Name of templates directory
templatesDirectory = "templates"

# Name of snippets directory
snippetsDirectory = "snippets"

# Name of JavaScript directory
jsDirectory = "assets/js"

# Name of CSS directory
cssDirectory = "assets/css"

# Name of Images directory
imagesDirectory = "assets/images"

# Name of Images directory
videosDirectory = "assets/videos"

# Name of Fonts directory
fontsDirectory = "assets/fonts"

# Name of main JS file
jsMainFile = "main"

# Name of main CSS file
cssMainFile = "main"

#--------------------------------------------------------
# Clean public folder
#--------------------------------------------------------


gulp.task 'clean', (cb) ->
  del [
    'public/assets/**/*'
    'public/site/blueprints/**/*'
    'public/site/snippets/**/*'
    'public/site/templates/**/*'
  ], cb


#--------------------------------------------------------
# Compile Stylus to CSS stylesheets
#--------------------------------------------------------


gulp.task "styles", ->
   gulp.src ["#{sourcePath}/#{cssDirectory}/#{cssMainFile}.styl"]
      .pipe plumber()
      .pipe stylus(use: [jeet()])
      .pipe autoprefixer()
      .pipe gulp.dest "#{outputPath}/#{cssDirectory}"
      .pipe browserSync.reload(stream:true)
      .pipe rename suffix: ".min"
      .pipe minifyCSS()
      .pipe gulp.dest "#{outputPath}/#{cssDirectory}"


#--------------------------------------------------------
# Copy images to public folder
#--------------------------------------------------------


gulp.task "images", ->
   gulp.src "#{sourcePath}/#{imagesDirectory}/**/*"
      .pipe gulp.dest "#{outputPath}/#{imagesDirectory}"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Images Updated"


#--------------------------------------------------------
# Copy videos to public folder
#--------------------------------------------------------


gulp.task "videos", ->
   gulp.src "#{sourcePath}/#{videosDirectory}/**/*"
      .pipe gulp.dest "#{outputPath}/#{videosDirectory}"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Videos Updated"


#--------------------------------------------------------
# Copy fonts to public folder
#--------------------------------------------------------


gulp.task "fonts", ->
   gulp.src "#{sourcePath}/#{fontsDirectory}/**/*"
      .pipe gulp.dest "#{outputPath}/#{fontsDirectory}"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Fonts Updated"


#--------------------------------------------------------
# Compile Javascript files
#--------------------------------------------------------


gulp.task "coffee", ->
   gulp.src "#{sourcePath}/#{jsDirectory}/#{jsMainFile}.coffee", read: false
      .pipe plumber()
      .pipe browserify
         transform:  ["handleify", "coffeeify"]
         extensions: [".coffee", ".js"]
         debug: true
      .pipe rename "#{jsMainFile}.js"
      .pipe gulp.dest "#{outputPath}/#{jsDirectory}"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Coffeescript Updated"


#--------------------------------------------------------
# Compile Vendor files
#--------------------------------------------------------


gulp.task "vendor", ->
   gulp.src "#{vendorPath}/**/*.js"
      .pipe uglify()
      .pipe concat "vendor.min.js"
      .pipe gulp.dest "#{outputPath}/#{jsDirectory}"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Vendors Updated"


#--------------------------------------------------------
# Compile Views to PHP
#--------------------------------------------------------


gulp.task "blueprints", ->
   gulp.src "#{sourcePath}/#{blueprintsDirectory}/**/*"
      .pipe plumber()
      .pipe gulp.dest "#{outputPath}/site/blueprints"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Blueprint Updated"

gulp.task "templates", ->
   gulp.src "#{sourcePath}/#{templatesDirectory}/**/*.jade"
      .pipe plumber()
      .pipe jade(pretty: true)
      .pipe gulp.dest "#{outputPath}/site/templates"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Template Updated"
    
gulp.task "snippets", ->
    gulp.src "#{sourcePath}/#{snippetsDirectory}/**/*.jade"
      .pipe plumber()
      .pipe jade(pretty: true)
      .pipe gulp.dest "#{outputPath}/site/snippets"
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Snippet Updated"


#--------------------------------------------------------
# Lint Coffeescript
#--------------------------------------------------------


gulp.task "lint", ->
   gulp.src "#{sourcePath}/#{jsDirectory}/*.coffee"
      .pipe coffeelint()
      .pipe coffeelint.reporter()
      .pipe coffeelint.reporter('fail')
      .pipe browserSync.reload(stream:true)
      .pipe notify message: "Lint Successful"


#--------------------------------------------------------
# Start local server
#--------------------------------------------------------


gulp.task "connect", ->
   connect.server(
      base: 'public'
      port: 8080
      keepalive: true
   )

gulp.task "browser-sync", [ "connect" ], ->
  browserSync
   proxy: "127.0.0.1:8080"
   port: 8000
   open: true
   notify: false


#--------------------------------------------------------
# Watch for changes
#--------------------------------------------------------


gulp.task "watch", ->
   gulp.watch "#{sourcePath}/#{cssDirectory}/**/*.styl",        ["styles"]
   gulp.watch "#{sourcePath}/#{jsDirectory}/**/*.coffee",       ["coffee"]
   gulp.watch "#{vendorPath}/**/*.js",                          ["vendor"]
   gulp.watch "#{sourcePath}/#{blueprintsDirectory}/**/*.php", ["blueprints"]
   gulp.watch "#{sourcePath}/#{templatesDirectory}/**/*.jade",  ["templates"]
   gulp.watch "#{sourcePath}/#{snippetsDirectory}/**/*.jade",   ["snippets"]
   gulp.watch "#{sourcePath}/#{imagesDirectory}/**/*",          ["images"]
   gulp.watch "#{sourcePath}/#{videosDirectory}/**/*",          ["videos"]
   gulp.watch "#{sourcePath}/#{fontsDirectory}/**/*",           ["fonts"]


# + ----------------------------------------------------------


gulp.task "default", ->
   runSequence "clean", [
      "styles"
      "templates"
      "blueprints"
      "snippets"
      "images"
      "videos"
      "fonts"
      "coffee"
      "vendor"
   ], "watch", "browser-sync"

