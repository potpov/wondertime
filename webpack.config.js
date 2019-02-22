var path = require("path");
var webpack = require('webpack');
var ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');

var rootAssetPath = './app/static/src/index';


module.exports = {
  context: __dirname,

  entry: rootAssetPath,

  output: {
      path: path.resolve("./bundles/"),
      filename: "[name]-[hash].js",
      //publicPath: 'http://localhost:8080/static/'
      // uncomment the next path on deploy!
      publicPath: 'https://mangia.lattu.ga/static/'
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
      },
        {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  }

};