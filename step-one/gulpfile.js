const gulp = require('gulp');
const pug = require('gulp-pug');
const path = require('path');

const $gp = require('gulp-load-plugins')();
const mergeStream = require('merge-stream');

const sass = require('gulp-sass');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');

const del = require('del');

const browserSync = require('browser-sync').create();

const gulpWebpack = require('gulp-webpack');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
const jshint = require('gulp-jshint');

const paths = {
  root: './build',
  src: 'src',
  templates: {
    pages: 'src/templates/pages/*.pug',
    src: 'src/templates/**/*.pug'
  },
  styles: {
    src: 'src/styles/**/*.scss',
    dest: 'build/assets/styles/'
  },
  images: {
    src: 'src/images/**/*.*',
    dest: 'build/assets/images/'
  },
  fonts: {
    src: 'src/fonts/**/*.*',
    dest: 'build/assets/fonts/'
  },
  scripts: {
    src: 'src/scripts/**/*.js',
    dest: 'build/assets/scripts/'
  }
};

// pug
function templates() {
  return gulp
    .src(paths.templates.pages)
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest(paths.root));
}

// scss
function styles() {
  return gulp
    .src('./src/styles/styles.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'compressed',
        includePaths: ['node_modules', path.join('src')]
      })
    )
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
      })
    )
    .pipe(sourcemaps.write())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.styles.dest));
}

// очистка
function clean() {
  return del(paths.root);
}

// JSLint Task
function lint() {
  return gulp
    .src(paths.scripts.src)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
}

// webpack
function jsScripts() {
  return gulp
    .src('src/scripts/app.js')
    .pipe(gulpWebpack(webpackConfig, webpack))
    .pipe(gulp.dest(paths.scripts.dest));
}

var myBuildConfig = Object.create(webpackConfig);
myBuildConfig.mode = 'production';
function jsScriptsBuild() {
  return gulp
    .src('src/scripts/app.js')
    .pipe(gulpWebpack(myBuildConfig, webpack))
    .pipe(gulp.dest(paths.scripts.dest));
}

let scriptsDev = gulp.series(lint, jsScripts);
let scriptsProd = gulp.series(lint, jsScriptsBuild);

// галповский вотчер
function watch() {
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.templates.src, templates);
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.scripts.src, scriptsDev);
}

// локальный сервер + livereload (встроенный)
function server() {
  browserSync.init({
    server: paths.root
  });
  browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}

// спрайт иконок + инлайн svg
gulp.task('svg', done => {
  const prettySvgs = () => {
    return gulp
      .src(`${paths.src}/images/icons/*.svg`)
      .pipe(
        $gp.svgmin({
          js2svg: {
            pretty: true
          }
        })
      )
      .pipe(
        $gp.cheerio({
          run($) {
            $('[fill], [stroke], [style]')
              .removeAttr('fill')
              .removeAttr('stroke')
              .removeAttr('style');
          },
          parserOptions: { xmlMode: true }
        })
      )
      .pipe($gp.replace('&gt;', '>'));
  };

  let svgSprite = prettySvgs()
    .pipe(
      $gp.svgSprite({
        mode: {
          symbol: {
            sprite: '../sprite.svg'
          }
        }
      })
    )
    .pipe(gulp.dest('build/assets/images/icons/'));

  let svgInline = prettySvgs().pipe(
    $gp.sassInlineSvg({
      destDir: `${paths.src}/styles/icons/`
    })
  );

  return mergeStream(svgSprite, svgInline);
});

// просто переносим картинки
function images() {
  return gulp
    .src([`${paths.images.src}`,`!${paths.src}/images/icons/*.*`])
    .pipe(gulp.dest(paths.images.dest));
}

// просто переносим шрифты
function fonts() {
  return gulp.src(paths.fonts.src).pipe(gulp.dest(paths.fonts.dest));
}

exports.templates = templates;
exports.styles = styles;
exports.clean = clean;
exports.images = images;
exports.scripts = scriptsDev;

gulp.task(
  'default',
  gulp.series(
    clean,
    'svg',
    gulp.parallel(styles, templates, images, scriptsDev),
    gulp.parallel(watch, server)
  )
);
gulp.task(
  'dev',
  gulp.series(clean,'svg', gulp.parallel(styles, templates, images, scriptsDev))
);
gulp.task(
  'prod',
  gulp.series(clean,'svg', gulp.parallel(styles, templates, images, scriptsProd))
);
