var gulp = require("gulp");
var babel = require("gulp-babel");

gulp.task("default", function () {
  return gulp.src("src/index.js")
    .pipe(babel())
    .pipe(gulp.dest("lib"));
});

gulp.task("test_on_example", function () {
  return gulp.src("test/example.js")
      .pipe(babel({
        plugins: [require("./lib/index.js")]
      }));
});

var watcher = gulp.watch('src/index.js', ['default', 'test_on_example']);
watcher.on('change', function() {
	console.log('src/index.js changed. running tasks...');
});


var exampleWatcher = gulp.watch('test/example.js', ['default', 'test_on_example']);
exampleWatcher.on('change', function() {
  console.log('test/example.js changed. running tasks...');
});
