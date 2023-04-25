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
    },
    main: {
      dependOn: 'routes',
      import: path.join(__dirname, './main.ts')
    }
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        include: [path.resolve(__dirname, './App.vue')],
        use: [
          {
            loader: 'vue-loader-v15',
            options: {
              compilerOptions: {
                whitespace: 'condense'
              }
            }
          }
        ]
      },
      {
        test: /\.(vue)$/,
        include: [path.resolve(__dirname, 'src')],
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
      chunks: ['main', 'routes'],
      template: './public/index.html'
    })
  ]
};
