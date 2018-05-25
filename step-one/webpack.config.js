const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const config = {
  mode: 'development',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['env', 'stage-0']
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      // datetimepicker: 'jquery-datetimepicker'
    }),
    new UglifyJSPlugin({
      sourceMap: true
    })
  ],
  resolve: {
    alias: {
      // D:\HTML\RT_test\node_modules\jquery-datetimepicker\build\jquery.datetimepicker.min.js
      datetimepicker: path.resolve(__dirname,'node_modules/jquery-datetimepicker/build/jquery.datetimepicker.full.min')
    }
  }
  // optimization: {
  //   minimize: false,
  //   runtimeChunk: {
  //     name: 'common'
  //   },
  //   splitChunks: {
  //     cacheGroups: {
  //       default: false,
  //       commons: {
  //         test: /node_modules/,
  //         name: 'common',
  //         chunks: 'initial',
  //         minSize: 1
  //       }
  //     }
  //   }
  // }
};

module.exports = config;
