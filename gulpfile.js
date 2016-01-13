var gulp = require('gulp');
var inlineImages = require('./tasks/inline-images');

gulp.task('inline-images', function () {
  gulp.src('src/**/*.html')
      .pipe(inlineImages('src'))  // takes in the directory to use as the root when looking for images
      .pipe(gulp.dest('dest'));
});

gulp.task('default', ['inline-images']);