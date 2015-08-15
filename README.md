Front-end Scaffold for Use with [Gulp](http://gulpjs.com/)
================================================================

Includes [CoffeeScript](http://coffeescript.org/) for Javascript compiling, [Stylus](http://learnboost.github.io/stylus/) for CSS pre-processing, Live-Reload for automatic page-refreshes during development and automated concatination of vendor libraries.

Project Setup
-------------
- Install Node
 - [Node.js Installer](http://nodejs.org/)
- Install Gulp globally
 - `sudo npm install -g gulp`
- Clone and cd into the repo
 - `git clone https://github.com/shiftsave/gulp-frontend-scaffold-v1.0.git && cd gulp-frontend-scaffold-v1.0`
- Then install Gulp task dependencies
 - `npm install`


Development Tasks
-----------------
To run use the command `gulp` then navigate to `http://localhost:8080` (or IP address).


A Few Notes on Folder Structure
-------------------------------
- **Assets** like **images**, **audio**, **webfonts**, **etc** are created in `src/assets` and will automatically be moved over to the **public** folder, mirroring the folder structure where they came from.
- **Html** in `html` will be copied over to the `public` root.  **The public directory never needs to be touched.**
- **Scripts** such as **CoffeeScript** and **JavaScript** are placed here and compiled over to public on save.
- **Styles** is where **Stylus** files go, and are compiled over to **public** on save.
- **Vendor** is where are vendor sources go, When changes are made to this directory, the **Gulpfile** `concat` task should be updated to include the newly added files.