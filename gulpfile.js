var gulp = require("gulp");
var babel = require("gulp-babel");
var through = require('through2');

gulp.task("default", ["transpile"]);

gulp.task("transpile", function () {
  return gulp.src("src/index.js")
    .pipe(babel())
    .pipe(gulp.dest("lib"));
});

gulp.task("test", ['transpile'], function () {
  return gulp.src("test/example.js")
      .pipe(babel({
        plugins: ["../lib/index.js"]
      }))
      .pipe(printStream());
});

gulp.task("testgv", ['transpile'], function () {
  return gulp.src("test/gorillavidscript.js")
    .pipe(babel({
      plugins: ["../lib/index.js"]
    }))
    .pipe(printStream());
});

var watcher = gulp.watch(['src/*.js'], ['transpile']);
watcher.on('change', function(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});

var printStream = function() {
  return through.obj(function(file, encoding, callback) {
    callback(null, (function() {
      console.log("=".repeat(file.path.length));
      console.log(file.path);
      console.log("=".repeat(file.path.length));
      console.log(file.contents.toString(encoding));
      console.log("=".repeat(file.path.length));
    })());
  });
};

