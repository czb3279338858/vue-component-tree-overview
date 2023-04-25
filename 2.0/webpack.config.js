const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    route: path.join(__dirname, './src/router/routes.ts'),
    // main: {
    //   dependOn: 'route',
    //   import: path.join(__dirname, './main.ts')
    // }
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.(vue)$/,
        use: [
          {
            loader: 'example-loader',
            options: {},
          },
        ],
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              appendTsSuffixTo: [
                '\\.vue$'
              ],
              happyPackMode: false
            }
          }
        ]
      }
    ],
  },
  resolveLoader: {
    alias: {
      'example-loader': require.resolve('../vue-overview-loader/src/'),
    },
  },
  optimization: {
    minimize: false
  },
  devtool: "source-map",
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['route']
    })
  ]
};
