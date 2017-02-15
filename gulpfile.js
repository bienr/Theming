// generated on 2017-01-12 using generator-webapp 2.3.2
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var dev = true;

const browserifySettings = {
  transform: "babelify",
  paths: ['./node_modules', './app/components', '/app/components/atoms', '/app/components/molecules', '/app/components/organisms', './bower_components'],
  insertGlobals: true
}

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sassGlob())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({ stream: true }));
});

gulp.task('build:styles', ['styles'], () => {
    return gulp.src('.tmp/styles')
      .pipe($.cssnano({ safe: true, autoprefixer: true }))
      .pipe(gulp.dest('dist'))
})

gulp.task('scripts', ['scripts:test'], () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.browserify(browserifySettings))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({ stream: true }));
});

gulp.task('build:scripts', ['scripts'], () => {
    return gulp.src('.tmp/scripts')
      .pipe($.uglify())
      .pipe(gulp.dest('dist'))
})

gulp.task('scripts:test', () => {
  return gulp.src('test/spec/test.js')
    .pipe($.plumber())
    .pipe($.rename('test.js'))
    .pipe($.sourcemaps.init())
    .pipe($.browserify(browserifySettings))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts/test/spec/'))
})

function lint(files, options) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'));
});

gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});

gulp.task('html', ['styles', 'scripts'], () => {
  return gulp.src('app/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssnano({ safe: true, autoprefixer: true })))
    .pipe($.if('*.html', $.htmlmin({ collapseWhitespace: true })))
    .pipe(gulp.dest('dist'));
});

gulp.task('mustache', () => {
  return gulp.src('app/**/*.mustache')
    .pipe($.mustache())
    .pipe($.rename({extname:'.html'}))
    .pipe(gulp.dest('.tmp'))
})
gulp.task('build:mustache', ['mustache'], () => {
  return gulp.src('.tmp/**/*.html')
    .pipe($.htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist'))
})

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) { })
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html'
  ], {
      dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'fonts', 'mustache'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch([
      'app/*.html',
      'app/**/*.mustache',
      'app/images/**/*',
      '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/**/*.mustache', ['mustache'])
    gulp.watch('app/**/*.scss', ['styles']);
    gulp.watch('app/**/*.js', ['scripts']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
  });
});

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', ['scripts'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch(['test/spec/**/*.js', 'test/index.html', 'app/**/*.js'], ['scripts']);
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

gulp.src('app/*.mustache')
    .pipe(wiredep({
      exclude: ['bootstrap-sass', 'jquery', 'modernizr'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras', 'build:scripts', 'build:styles', 'build:mustache'], () => {
  return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
});

gulp.task('default', () => {
  return new Promise(resolve => {
    dev = false;
    runSequence(['clean', 'wiredep'], 'build', resolve);
  });
});