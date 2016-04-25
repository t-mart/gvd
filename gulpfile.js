var gulp = require('gulp');
var babel = require('gulp-babel');
var through = require('through2');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var EE = require('events').EventEmitter;


gulp.task('default', ['transpile']);

gulp.task('transpile', function () {
  return gulp.src('src/index.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('test', function() {
  return gulp.src('./test/src/*.js')
    .pipe(babel({
      'presets': 'es2015',
      'plugins': '../../lib/index.js',
      'compact': false
    }))
    .pipe(plumber({
      'error-handler': stackTracingErrorHandler
    }))
    .pipe(gulp.dest('./test/out'));
});

var watcher = gulp.watch(['src/*.js'], ['transpile']);
watcher.on('change', function (event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});

var printStream = function () {
  return through.obj(function (file, encoding, callback) {
    callback(null, (function () {
      console.log('='.repeat(file.path.length));
      console.log(file.path);
      console.log('='.repeat(file.path.length));
      console.log(file.contents.toString(encoding));
      console.log('='.repeat(file.path.length));
    })());
  });
};

function stackTracingErrorHandler(error) {
  // onerror2 and this handler
  if (EE.listenerCount(this, 'error') < 3) {
    gutil.log(
      gutil.colors.cyan('Plumber') + gutil.colors.red(' found unhandled error:\n'),
      error.toString()
    );
  }
}
