var gulp = require('gulp');
var paths = require('../paths');
var eslint = require('gulp-eslint');

gulp.task('lint', function() {
  return gulp.src(paths.lintSource)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('lint-test', function() {
  return gulp.src(paths.test)
    .pipe(eslint({
      rules: {
        'dot-notation': 1,
        'key-spacing': 1
      }
    }))
    .pipe(eslint.format());
});
