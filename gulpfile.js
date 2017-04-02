var browserify = require('browserify');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var pump = require('pump');
var rename = require("gulp-rename");
var shell = require('gulp-shell');
var source = require('vinyl-source-stream');
var typescript = require('gulp-typescript');
var uglify = require('gulp-uglify');

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
  }).bundle()
    .pipe(source('tag-explorer.js'))
    .pipe(gulp.dest('dist'));
});


gulp.task('build-min', ['build-dist'], function (cb) {
  pump([
    gulp.src('dist/tag-explorer.js'),
    uglify({
      preserveComments: 'some'
    }),
    rename('tag-explorer.min.js'),
    gulp.dest('dist')
  ], cb);
});

gulp.task('lint', function () {
  return gulp.src('src/*.ts', {read: false})
    .pipe(shell('./node_modules/.bin/tslint -c tslint.json <%= file.path %>'));
});

gulp.task('mocha', ['lint'], function () {
  return gulp.src(['lib/*.test.js'])
    .pipe(mocha());
});

gulp.task('test', ['mocha'], function () {
});

gulp.task('default', ['build-min'], function() {
  gulp.watch('src/*.ts', ['build-min']);
});
