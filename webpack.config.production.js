/* eslint strict: 0 */
'use strict'

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const baseConfig = require('./webpack.config.base')


const config = Object.create(baseConfig)

config.devtool = 'source-map'

config.entry = './src/index'

config.output.publicPath = '../dist/'

config.module.loaders.push({
  test: /^((?!\.module).)*\.css$/,
  loader: ExtractTextPlugin.extract(
    'style',
    'css'
  )
}, {
  test: /\.module\.css$/,
  loader: ExtractTextPlugin.extract(
    'style',
    'css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
  )
})

config.plugins.push(
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    '__DEV__': false,
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  }),
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false
    }
  }),
  new ExtractTextPlugin('style.css', { allChunks: true })
)

module.exports = config
