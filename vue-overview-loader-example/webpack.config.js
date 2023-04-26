const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    routes: {
      import: path.join(__dirname, './src/router/routes.ts'),
      library: {
        name: 'routes',
        type: 'var',
      }
    }
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
            loader: 'vue-overview-loader',
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
      'vue-overview-loader': require.resolve('../vue-overview-loader/src/'),
    },
  },
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['routes'],
      template: './public/index.html'
    })
  ]
};
