/* eslint strict: 0 */
'use strict'

const webpack = require('webpack')
const baseConfig = require('./webpack.config.base')

const config = Object.create(baseConfig)

config.debug = true

config.devtool = 'cheap-module-eval-source-map'

config.entry = [
  'webpack-hot-middleware/client?reload=true&path=http://localhost:3000/__webpack_hmr',
  './src/index'
]

config.output.publicPath = 'http://localhost:3000/dist/'

config.module.loaders.push({
  test: /^((?!\.module).)*\.css$/,
  loaders: [
    'style-loader',
    'css-loader?sourceMap'
  ]
}, {
  test: /\.module\.css$/,
  loaders: [
    'style-loader',
    'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!'
  ]
})


config.plugins.push(
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    '__DEV__': true,
    'process.env': {
      'NODE_ENV': JSON.stringify('development')
    }
  })
)

module.exports = config
