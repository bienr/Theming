// generated on 2017-01-12 using generator-webapp 2.3.2
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const spritesmith = require('gulp.spritesmith');
const $ = gulpLoadPlugins();
const path = require('path');
const directoryTree = require('directory-tree');
const _ = require('lodash');
const reload = browserSync.reload;
var dev = true;

const browserifySettings = {
    transform: "babelify",
    paths: ['./node_modules', './app/components', './app/components/atoms', './app/components/molecules', './app/components/organisms'],
    insertGlobals: true
}

gulp.task('sprites', $.folders('app/images/sprites', folderName => {
    let spriteData = gulp.src(`app/images/sprites/${folderName}/*{.jpg,.png}`)
        .pipe(spritesmith({
            imgName: `${folderName}.png`,
            cssName: `_${folderName}.scss`,
            imgPath: `/images/sprites/${folderName}.png`
        })),
        imgStream = spriteData.img
            .pipe($.buffer())
            .pipe($.cache($.imagemin()))
            .pipe(gulp.dest('app/images/sprites/')),
        cssStream = spriteData.css
            .pipe(gulp.dest('app/styles/sprites/'))
    return $.merge(imgStream, cssStream)
}))

gulp.task('styles', () => {
    return gulp.src('app/styles/*.scss')
        .pipe($.sassGlob())
        .pipe($.sourcemaps.init())
        .pipe($.plumber({
            errorHandler: $.notify.onError({
                title: 'Sass',
                message: "Error: <%= error.message %>",
                icon: path.join(__dirname, '/.sass.png'),
                onLast: true,
                sound: false
            })
        }))
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
        .pipe($.bless({ suffix: '-part' }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(reload({ stream: true }));
});

gulp.task('build:styles', ['styles'], () => {
    return gulp.src('.tmp/styles')
        .pipe($.cssnano({ safe: true, autoprefixer: false }))
        .pipe(gulp.dest('dist'))
})

gulp.task('scripts', ['scripts:test'], () => {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.plumber({
            errorHandler: $.notify.onError({
                title: 'Javascript',
                message: "Error: <%= error.message %>",
                icon: path.join(__dirname, '/.js.png'),
                onLast: true,
                sound: false
            })
        }))
        .pipe($.sourcemaps.init())
        .pipe($.browserify(browserifySettings))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('.tmp/scripts'))
        .pipe(reload({ stream: true }));
});

gulp.task('build:scripts', ['scripts'], () => {
    return gulp.src('.tmp/scripts')
        .pipe($.plumber())
        .pipe($.stripDebug())
        .pipe($.uglify())
        .pipe(gulp.dest('dist'))
})

gulp.task('scripts:test', () => {
    return gulp.src('test/spec/test.js')
        .pipe($.changed('.tmp/scripts/test/spec/'))
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
        .pipe($.if('*.css', $.cssnano({ safe: true, autoprefixer: false })))
        .pipe($.if('*.html', $.htmlmin({ collapseWhitespace: true })))
        .pipe(gulp.dest('dist'));
});

gulp.task('handlebars', () => {
    let components = _.reduce(directoryTree('./app/components/'), (result, folder) => {
        _.forEach(folder, child => {
            if (_.isNil(child.children) || child.children.length < 0) return result
            _.forEach(child.children, component => result.push(component.path))
        })
        return result
    }, [])
    return gulp.src('app/**/*.hbs')
        .pipe($.plumber({
            errorHandler: $.notify.onError({
                title: 'Handlebars',
                message: "Error: <%= error.message %>",
                icon: path.join(__dirname, '/.handlebars.png'),
                onLast: true,
                sound: false
            })
        }))
        .pipe($.compileHandlebars({}, {
            ignorePartials: true,
            batch: ['./app/views/partials'].concat(components)
        }))
        .pipe($.rename({ extname: '.html' }))
        .pipe($.htmlPrettify())
        .pipe(gulp.dest('.tmp'))
})

gulp.task('build:html', ['handlebars'], () => {
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
    return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', () => { })
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
    runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'fonts', 'handlebars'], () => {
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
            '.tmp/*.html',
            'app/images/**/*',
            '.tmp/fonts/**/*'
        ]).on('change', reload);

        gulp.watch('app/**/*.hbs', ['handlebars'])
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

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras', 'build:scripts', 'build:styles', 'build:html'], () => {
    return gulp.src('dist/**/*')
        .pipe($.size({ title: 'build', gzip: true }))
        .pipe($.notify({
            title: 'GNH Frontend',
            message: `was successfully built to ${path.join(__dirname, '/dist')}`,
            onLast: true,
            icon: path.join(__dirname, '/app/apple-touch-icon.png')
        }));
});

gulp.task('default', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence(['clean', 'wiredep'], 'build', resolve);
    });
});
