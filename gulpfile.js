/* eslint-disable global-require, import/newline-after-import, import/no-unresolved */
var akamai = require('akamai');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var eslint = require('gulp-eslint');
var fs = require('fs');
var gulp = require('gulp');
var Rsync = require('rsync');
var inquirer = require('inquirer');
var jsdoc = require('gulp-jsdoc3');
var jsdoc2md = require('jsdoc-to-markdown');
var rename = require('gulp-rename');
var sequence = require('run-sequence');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var path = require('path');

var sdkDistFiles = [
  'sdk.js',
  'sdk.min.js',
  'sdk.min.js.map',
];

gulp.task('build', ['lint', 'clean'], function () {
  var distDir = './dist';
  var bundleName = './sdk.js';
  var browserifyOpts = {
    entries: ['./src/rtm.js'],
    standalone: 'RTM',
  };
  return browserify(browserifyOpts)
        .bundle()
        .pipe(source(bundleName))
        .pipe(buffer())
        .pipe(gulp.dest(distDir))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(distDir));
});

gulp.task('clean', function (cb) {
  del('./dist/**/*', cb);
});

gulp.task('eslint', function () {
  return gulp.src(['gulpfile.js', 'src/**/*.js', '__tests__/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('docs', function (cb) {
  var config = require('./.jsdoc.json');

  gulp.src(['README.md'], { read: false })
    .pipe(jsdoc(config, cb));
});

gulp.task('apimd', function () {
  return jsdoc2md
    .render({ files: 'src/*.js' })
    .then(function (output) {
      fs.writeFileSync('API.md', output.replace(/rtM/g, 'RTM'));
    });
});

function applyVersion(str) {
  var pack = require('./package.json');

  return str.replace(/{version}/, pack.version);
}

gulp.task('deploy.confirm', function (done) {
  var pack = require('./package.json');

  inquirer.prompt([{
    type: 'confirm',
    name: 'deployment',
    message: 'Releasing to PRODUCTION (v' + pack.version + ')?',
    default: false,
  }], function (answers) {
    if (answers.deployment) {
      done();
    }
  });
});

gulp.task('deploy.upload', function (done) {
  var files = sdkDistFiles.map(function (file) { return './dist/' + file; });
  var config = require('./deploy.json').origin;
  var remotePath = applyVersion(config.remotePath);
  var output = [];
  var expandTilde = function (p) {
    if (p[0] === '~') {
      return path.join(process.env.HOME, p.slice(1));
    }
    return p;
  };
  var rsync = new Rsync()
        .shell('ssh -i ' + expandTilde(config.key))
        .flags('aicv')
        .source(files)
        .destination(config.user + '@' + config.host + ':' + remotePath + '/');

  rsync.execute(function (err) {
    var entries;
    if (!err) {
      entries = Buffer.concat(output).toString().split('\n');
      util.log(util.colors.green('Uploaded files:'), entries);
      done();
    } else {
      util.log(util.colors.red('Upload failed!'), err);
    }
  }, function (out) {
    output.push(out);
  });
});

gulp.task('deploy.invalidate', function (done) {
  var config = require('./deploy.json').cdn;
  var baseURL = applyVersion(config.baseURL);
  var files = sdkDistFiles.reduce(function (acc, file) {
    var urls = ['http', 'https'].map(function (scheme) {
      return scheme + '://' + baseURL + '/' + file;
    });
    return acc.concat(urls);
  }, []);

  util.log('CDN Invalidate was issued for the files:\n', files);

  akamai.invalidate.production.url(config.username, config.password, files)
    .then(function () {
      done();
    }).catch(function (error) {
      util.log(util.colors.red('CDN Invalidate failed!'), error);
    });
});

gulp.task('deploy', function (done) {
  sequence(
    'deploy.confirm',
    'build',
    'deploy.upload',
    'deploy.invalidate',
    done
  );
});

gulp.task('lint', ['eslint']);
gulp.task('default', ['build', 'docs']);
