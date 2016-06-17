'use strict';

/**
 * Specify modules to build:
 *  > gulp -m=cms,site
 *
 * */

// todo: Environment param (uglify, minimize, etc)


// todo
// todo: plain copy additional files:
// bower images: , 'bower_components/**/*.png', 'bower_components/**/*.jpg', 'bower_components/**/*.gif'
// bower swf: 'bower_components/**/*.swf'
// todo
// todo


var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    cssmin = require('gulp-cssmin'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rigger = require('gulp-rigger'),
    plumber = require('gulp-plumber'),
    bust = require('gulp-buster'),
    argv = require('yargs').argv;


var RESULT_JS_NAME = 'all.js';
var BUILD_PATH = 'build/';
var SRC_PATH = 'resources/';

var busterOptions = {
    fileName: 'build/busters.json',
    length: 5
};

// modules to build
var DEFAULT_MODULES = [
    ''
];
var modulesToBuild = DEFAULT_MODULES;
if (argv.m) {
    modulesToBuild = argv.m.split(',');
}
if (!modulesToBuild) {
    modulesToBuild = [''];
}

var path = {
    src: {
        js: 'assets/js/**/*.js',
        vendorJs: 'assets/vendorJs/*.js',
        styles: 'assets/sass/**/*.scss',
        vendorStyles: 'assets/vendorCss/*.css',
        images: 'assets/i/**/*.*',
        fonts: 'assets/fonts/**/*.*',
        include: 'assets/include/**/*.*'
    },
    // additional to src-paths
    watch: {
        js: ['bower_components/**/*.js'],
        vendorStyles: ['assets/vendorCss/**/*.css'],
        vendorJs: ['assets/vendorJs/**/*.js']
    },

    build: {
        js: 'js/',
        styles: 'css/',
        images: 'i/',
        fonts: 'fonts/',
        include: 'include/',
    }
};


/**
 *
 * @param module
 * @param name
 * @returns {string}
 */
function getSrcPath(module, name) {
    var modulePath = module ? (module + '/') : '';
    return SRC_PATH + modulePath + path.src[name];
}

/**
 *
 * @param module
 * @param name
 * @returns {string}
 */
function getWatchPath(module, name) {
    var modulePath = module ? (module + '/') : '';
    return SRC_PATH + modulePath + path.watch[name];
}

/**
 *
 * @param module
 * @param name
 * @returns {string}
 */
function getBuildPath(module, name) {
    var modulePath = module ? (module + '/') : '';
    return BUILD_PATH + modulePath + path.build[name];
}


/** build js task */
modulesToBuild.map(function (module) {
    gulp.task('js:build:' + module, function () {
        gulp.src(getSrcPath(module, 'js'))
            .pipe(sourcemaps.init())
            .pipe(rigger())
            .pipe(concat(RESULT_JS_NAME))
            //.pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(getBuildPath(module, 'js')))
            .pipe(bust(busterOptions))
            .pipe(gulp.dest('.'))
    });
});

/** build styles task */
modulesToBuild.map(function (module) {
    gulp.task('styles:build:' + module, function () {
        gulp.src(getSrcPath(module, 'styles'))
            .pipe(plumber())
            .pipe(sourcemaps.init())
            .pipe(sass())
            .pipe(prefixer())
            //.pipe(cssmin())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(getBuildPath(module, 'styles')))
            .pipe(bust(busterOptions))
            .pipe(gulp.dest('.'))
    });
});

modulesToBuild.map(function (module) {
    gulp.task('vendorJs:build:' + module, function () {
        gulp.src(getSrcPath(module, 'vendorJs'))
            .pipe(rigger())
            .pipe(uglify())
            .pipe(gulp.dest(getBuildPath(module, 'js')))
            .pipe(bust(busterOptions))
            .pipe(gulp.dest('.'))
    });
});


/** build vendor styles task */
modulesToBuild.map(function (module) {
    gulp.task('vendorStyles:build:' + module, function () {
        gulp.src(getSrcPath(module, 'vendorStyles'))
            .pipe(rigger())
            //.pipe(cssmin())
            .pipe(gulp.dest(getBuildPath(module, 'styles')))
            .pipe(bust(busterOptions))
            .pipe(gulp.dest('.'))
    });
});

/** build images task */
modulesToBuild.map(function (module) {
    gulp.task('images:build:' + module, function () {
        gulp.src(getSrcPath(module, 'images'))
            .pipe(imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()],
                interlaced: true
            }))
            .pipe(gulp.dest(getBuildPath(module, 'images')))
    });
});

/** build fonts task */
modulesToBuild.map(function (module) {
    gulp.task('fonts:build:' + module, function () {
        gulp.src(getSrcPath(module, 'fonts'))
            .pipe(gulp.dest(getBuildPath(module, 'fonts')))
    });
});

/** build fonts task */
modulesToBuild.map(function (module) {
    gulp.task('include:build:' + module, function () {
        gulp.src(getSrcPath(module, 'include'))
            .pipe(gulp.dest(getBuildPath(module, 'include')))
    });
});


gulp.task('watch', function () {
    modulesToBuild.map(function (module) {
        for (var key in path.src) {
            if (path.src.hasOwnProperty(key)) {
                (function (key) {
                    var watchPath = getSrcPath(module, key)
                    var watchPath2 = getWatchPath(module, key)
                    watch([watchPath, watchPath2], function (event, cb) {
                        gulp.start(key + ':build:' + module);
                    });
                })(key);
            }
        }
    });
});

modulesToBuild.map(function (module) {
    gulp.task('build:' + module, [
        'js:build:' + module,
        'styles:build:' + module,
        'vendorStyles:build:' + module,
        'vendorJs:build:' + module,
        'fonts:build:' + module,
        'include:build:' + module,
        'images:build:' + module
    ]);
});

gulp.task('build', modulesToBuild.map(function (name) {
    return 'build:' + name
}));

gulp.task('default', ['build', 'watch']);