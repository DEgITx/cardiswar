var gulp = require('gulp');

gulp.task('beatify-js', function()
{
	var prettify = require('gulp-jsbeautifier');

	return gulp.src(['./*.js'])
		.pipe(prettify(
		{
			indent_with_tabs: true,
			brace_style: "expand"
		}))
		.pipe(gulp.dest('./'));
});

gulp.task('compress', function()
{
	var uglify = require('gulp-uglify');

	return gulp.src('./main.js')
		.pipe(uglify())
		.pipe(gulp.dest('./public/js'));
});

gulp.task('default', ['beatify-js', 'compress']);