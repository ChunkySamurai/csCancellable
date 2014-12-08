// Load modules
var gulp = require('gulp');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var header = require('gulp-header');
var karma = require('gulp-karma');
var requireNew = require('require-new');

var run = require('run-sequence');

var jeditor = require('gulp-json-editor');

var bump = require('gulp-bump');
var git = require('gulp-git');

var rimraf = require('rimraf');
var concat = require('gulp-concat');

var annotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');

// Configuration
var files = {
  config: {
    pkg: './package.json',
    bwr: './bower.json'
  },
  root: './',
  src: {
    js: './src/cs-cancellable.js',
    base: 'src'
  },
  tests: {
    unit: './test/unit/*.js',
    e2e: './test/e2e/*.js'
  },
  min: 'cs-cancellable.min.js'
};

var hdr = {
  extended: [
  '/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  '*/',
  ''
  ].join('\n'),
  succinct: '// <%= pkg.name %>@v<%= pkg.version %>, <%= pkg.license %> licensed. <%= pkg.homepage %>\n'
}

var karmaTask = function (action) {
  return function () {
    var src = [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'node_modules/chai/chai.js',
      'node_modules/chai-as-promised/lib/chai-as-promised.js',
      gutil.env.debug ? 'src/cs-cancellable.js' : 'cs-cancellable.min.js',
      'tests/unit/*.js'
    ];

    return gulp.src(src)
      .pipe(plumber())
      .pipe(karma({
        configFile: 'karma.conf.js',
        action: action
      }))
      .on('error', function (err) {
        if (action === 'run') {
          throw err;
        } else {
          gutil.log(err);
        }
      });
  };
};
gulp.task('karma-run', karmaTask('run'));
gulp.task('karma-watch', karmaTask('watch'));

gulp.task('lint', function () {
  return gulp.src(files.src.js)
    .pipe(plumber())
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
})

gulp.task('clean', function (cb) {
  rimraf('./cs-cancellable*.js', { force: true }, cb);
});

gulp.task('scripts', function () {
  var pkg = requireNew(files.config.pkg);

  return gulp.src(files.src.js, { base: files.src.base })
    .pipe(plumber())
    .pipe(annotate())
    .pipe(header(hdr.extended, { pkg: pkg }))
    .pipe(gulp.dest(files.root))
    .pipe(rename(files.min))
    .pipe(uglify())
    .pipe(header(hdr.succinct, { pkg: pkg }))
    .pipe(gulp.dest(files.root));
});

gulp.task('build', function (next) {
  run(
    'clean',
    'scripts',
    next
  );
});

gulp.task('bump', function () {
  var bumpType = gutil.env.bump || 'patch'; //major.minor.patch

  return gulp.src([files.config.pkg, files.config.bwr])
    .pipe(plumber())
    .pipe(bump({ type: bumpType }))
    .pipe(gulp.dest(files.root));
});

gulp.task('sync-bower', function () {
  var pkg = requireNew(files.config.pkg);
  var bwr = requireNew(files.config.bwr);

  [
    'author',
    'name',
    'keywords',
    'licence',
    'repository',
    'description',
    'version'
  ].forEach(function (prop) {
    if (pkg.hasOwnProperty(prop)) {
      bwr[prop] = pkg[prop];
    }
  });
  return gulp.src(files.config.bwr)
    .pipe(plumber())
    .pipe(jeditor(bwr))
    .pipe(gulp.dest(files.root));
});

gulp.task('tag', function (cb) {
  var pkg = requireNew(files.config.pkg);
  var v = 'v' + pkg.version;
  var message = 'Release ' + v + (gutil.env.message ? ' - ' + gutil.env.message : '');

  return gulp.src(files.root)
    .pipe(git.commit(message))
    .pipe(git.tag(v, message, function (err) {
      if (err) throw err;
    }))
    .pipe(git.push('origin', 'master', '--tags'))
    .pipe(gulp.dest(files.root));
});

gulp.task('watch', function () {
  gulp.watch(files.src.js, ['build', 'lint'])
});

gulp.task('default', function (next) {
  run(
    [ 'build', 'lint' ],
    [ 'watch', 'karma-watch' ],
    next
  );
});
gulp.task('test', function (next) {
  run(
    [ 'build', 'lint', ],
    'karma-run',
    next
  );
});
gulp.task('release', function (next) {
  run(
    [ 'test', 'sync-bower' ],
    'bump',
    'tag',
    next
  );
});
