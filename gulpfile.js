var gulp = require('gulp');
var typescript = require('gulp-typescript');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");

var tsProject = typescript.createProject('./tsconfig.json');

gulp.task('build-lib', function () {
  return tsProject.src()
    .pipe(tsProject()).js
    .pipe(gulp.dest('lib'));
});

gulp.task('build-dist', ['build-lib'], function () {
  return browserify({
    basedir: '.',
    entries: ['lib/tagExplorer.js'],
    standalone: 'tagExplorer',
    cache: {},
    packageCache: {}
  })
  .bundle()
  .pipe(source('tag-explorer.js'))
  .pipe(gulp.dest('dist'));
});


gulp.task('build-min', ['build-dist'], function (cb) {
  pump([
    gulp.src('dist/tag-explorer.js'),
    uglify({
      preserveComments: 'some'
    }),
    rename("tag-explorer.min.js"),
    gulp.dest('dist')
  ], cb);
});

gulp.task('default', ['build-min'], function() {
    gulp.watch('src/*.ts', ['build-min']);
});
