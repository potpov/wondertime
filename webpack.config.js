var path = require("path");
var webpack = require('webpack');
var ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');

var rootAssetPath = './app/components/Index.js';


module.exports = {
  context: __dirname,

  entry: {
      main: rootAssetPath
  },

  output: {
      path: path.resolve("./static/bundles/"),
      filename: "[name]-[hash].js",
      publicPath: 'http://localhost:8080/static/bundles/'
      // uncomment the next path on deploy!
      //publicPath: 'https://mangia.lattu.ga/static/bundles/'
  },

  plugins: [
    new ManifestRevisionPlugin(path.join('manifest.json'), {
        rootAssetPath: rootAssetPath,
        ignorePaths: ['/stylesheets', '/javascript']
    })
  ],
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  }

};