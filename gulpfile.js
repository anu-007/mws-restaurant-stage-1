const gulp = require('gulp');
const htmlclean = require('gulp-htmlclean');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const del = require('del');
const autoprefixer = require('gulp-autoprefixer');


const paths = {
    src: './',
    srcHTML: './*.html',
    srcCSS: './css/*.css',
    srcJS: './js/*.js',
    dist: 'dist',
    distIndex: 'dist/index.html',
    distCSS: 'dist/**/*.css',
    distJS: 'dist/**/*.js'
};

// HTML tasks
gulp.task('html:dist', function () {
    return gulp.src(paths.srcHTML)
    .pipe(htmlclean())
    .pipe(gulp.dest(paths.dist));
});

// CSS tasks
gulp.task('css:dist', function () {
    return gulp.src(paths.srcCSS)
      .pipe(concat('style.min.css'))
      .pipe(cleanCSS())
      .pipe(gulp.dest(paths.dist));
});

// JS tasks
gulp.task('js:dist', function () {
    return gulp.src(paths.srcJS)
      .pipe(concat('script.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest(paths.dist));
});

// Cleaning up
gulp.task('clean', function () {
    del([paths.dist]);
});

// Watch for changes
gulp.task('watch', ['serve'], function () {
    gulp.watch(paths.src);
});

gulp.task('inject:dist', ['copy:dist'], function () {
    var css = gulp.src(paths.distCSS);
    var js = gulp.src(paths.distJS);
    return gulp.src(paths.distIndex)
      .pipe(inject( css, { relative:true } ))
      .pipe(inject( js, { relative:true } ))
      .pipe(gulp.dest(paths.dist));
});

gulp.task('copy:dist', ['html:dist', 'css:dist', 'js:dist']);
gulp.task('default', ['watch']);