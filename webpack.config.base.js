/* eslint strict: 0 */
'use strict'

const path = require('path')

module.exports = {
  module: {
    loaders: [
      {
        test: /\.(j|t)sx?/,
        loaders: ['awesome-typescript'],
        exclude: /node_modules/
      },
      { test: /\.(woff|woff2)$/, loader: 'file' },
      { test: /\.ttf$/, loader: 'file' },
      { test: /\.eot$/, loader: 'file' },
      { test: /\.svg$/, loader: 'file' },
      {
        test: /\.json/,
        loaders: ['json'],
        exclude: /node_modules/
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.ts', '.tsx'],
    packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']
  },
  plugins: [],
  externals: [
    // put your node 3rd party libraries which can't be built with webpack here (mysql, mongodb, and so on..)
  ],
  serverPort: 3000
}
