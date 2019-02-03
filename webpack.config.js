var path = require("path");
var webpack = require('webpack');
var ManifestRevisionPlugin = require('manifest-revision-webpack-plugin');
var rootAssetPath = './app/frontend/static/src/index';


module.exports = {
  context: __dirname,

  entry: rootAssetPath,

  output: {
      path: path.resolve("./assets/bundles/"),
      filename: "[name]-[hash].js",
      publicPath: 'http://localhost:8080/static/'
  },

  plugins: [
    new ManifestRevisionPlugin(path.join('build', 'manifest.json'), {
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
      }, {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },{
        test: /\.(png|jpg|gif|mp4)$/,
        use: ['url-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  }

};