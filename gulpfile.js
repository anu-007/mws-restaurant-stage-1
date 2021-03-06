/*eslint-disable */
const gulp = require('gulp');
const htmlclean = require('gulp-htmlclean');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const del = require('del');
const autoprefixer = require('gulp-autoprefixer');
const eslint = require('gulp-eslint');
const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const babelify = require('babelify');
const browserify = require('browserify');
const connect = require('gulp-connect');
const gzip = require('gulp-gzip');
const gzipStatic = require('connect-gzip-static');
const gulpSequence = require('gulp-sequence');
const webp = require('gulp-webp');
const surge = require('gulp-surge');

// Paths for files
const paths = {
  src: './',
  srcHTML: './*.html',
  srcCSS: './css/*.css',
  srcJS: './js/*.js',
  srcJSmain: ['./js/main.js', './js/dbhelper.js'],
  srcJSrestaurant: ['./js/restaurant_info.js', './js/dbhelper.js'],
  srcIMG: './img/*.{png,jpg}',
  srcICONS: './icons/*.png',
  dist: './dist',
  distHTML: './dist/*.html',
  distINDEX: './dist/index.html',
  distCSS: './dist/style/',
  distJS: './dist/script/',
  distIMG: './dist/img/',
};

// Copy required files to dist
gulp.task('copy:dist', () => gulp.src(['!gulpfile.js', '!node_modules/**', 'sw.js', 'manifest.json', paths.srcICONS])
  .pipe(gulp.dest(paths.dist)));

// Linting task
gulp.task('eslint', () => gulp.src(paths.srcJS)
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError()));

// Image tasks
gulp.task('img:dist', () => gulp.src(paths.srcIMG)
  .pipe(webp())
  .pipe(gulp.dest(paths.distIMG)));

// HTML tasks
gulp.task('html:dist', () => gulp.src(paths.srcHTML)
  .pipe(htmlclean())
  .pipe(gulp.dest(paths.dist)));

// CSS tasks
gulp.task('css:dist', () => gulp.src(paths.srcCSS)
  .pipe(concat('style.min.css'))
  .pipe(cleanCSS({ compatibility: 'ie8' }))
  .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
  .pipe(gulp.dest(paths.distCSS)));

// js task main.js
gulp.task('js:main', () => {
  paths.srcJSmain.map(js => browserify({
    entries: [js],
  })
    .transform(babelify.configure({
      presets: ['env'],
    }))
    .bundle()
    .pipe(source('main.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true,
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.distJS)));
});

// js task restaurant.js
gulp.task('js:restaurant', () => {
  paths.srcJSrestaurant.map(js => browserify({
    entries: [js],
  })
    .transform(babelify.configure({
      presets: ['env'],
    }))
    .bundle()
    .pipe(source('restaurant.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.distJS)));
});

// Gzip HTML files
gulp.task('gzip:html', () => {
  gulp.src(paths.distHTML)
    .pipe(gzip())
    .pipe(gulp.dest(paths.dist));
});

// Gzip CSS files
gulp.task('gzip:css', () => {
  gulp.src(paths.distCSS)
    .pipe(gzip())
    .pipe(gulp.dest(paths.distCSS));
});

// Gzip js files
gulp.task('gzip:js', () => {
  gulp.src(paths.distJS)
    .pipe(gzip())
    .pipe(gulp.dest(paths.distJS));
});

// Serve the build
gulp.task('serve', () => {
  connect.server({
    root: paths.distINDEX,
    port: 3000,
    middleware: () => [
      gzipStatic(__dirname, {
        maxAge: 31536000000,
      }),
    ],
  });
});

// Watch for changes
gulp.task('watch', ['eslint'], () => {
  gulp.watch(paths.src);
});

// Cleaning up dist directory
gulp.task('clean', () => {
  del([paths.dist]);
});

// Deploy task
gulp.task('deploy', [], () => {
  return surge({
    project: './dist',
    domain: 'gentle-front.surge.sh',
  });
});

// Production build
gulp.task('build', gulpSequence('clean', 'html:dist', 'css:dist', 'js:dist', 'img:dist', 'copy:dist', 'gzip:dist'));

// Uglify scripts
gulp.task('js:dist', gulpSequence('js:main', 'js:restaurant'));

// Gzip html, css and js
gulp.task('gzip:dist', gulpSequence('gzip:html', 'gzip:css', 'gzip:js'));

// Production serve
gulp.task('serve:prod', gulpSequence('build', 'serve'));
