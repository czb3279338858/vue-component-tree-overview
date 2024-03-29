/**
 * See the webpack docs for more information about plugins:
 * https://webpack.js.org/contribute/writing-a-plugin/#basic-plugin-architecture
 */
const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
class VueOverviewPlugin {
  constructor(options = {}) {
    this.options = options;
    this.webpackPromise
  }
  apply(compiler) {
    const { entry, routes } = this.options
    const options = compiler.options
    const newOptions = {
      performance: {
        hints: false
      },
      entry: {
        routes: {
          import: path.join(options.context, entry),
          library: {
            name: 'routes',
            type: 'var',
          }
        }
      },
      output: {
        path: path.join(options.output.path, 'vue-overview'),
        asyncChunks: false
      },
      resolve: {
        alias: options.resolve.alias,
        extensions: options.resolve.extensions
      },
      module: {
        rules: [
          {
            test: /\.(ts|js|vue)$/,
            use: [
              {
                loader: require.resolve('vue-overview-loader'),
                options: {
                  routes
                },
              },
            ],
          },
          {
            test: /\.ts$/,
            use: [
              {
                loader: require.resolve('babel-loader'),
              },
              {
                loader: require.resolve('ts-loader'),
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
      plugins: [
        new HtmlWebpackPlugin({
          template: path.join(__dirname, './index.html'),
          inject: false
        })
      ]
    }
    webpack(newOptions, (err, stats) => {
      if (stats.hasErrors()) {
        const info = stats.toJson();
        console.error('\nvue-loader-plugin:打包失败');
        info.errors.forEach((error, index) => {
          console.error(`错误：${index}`);
          console.error(error);
        })
        return
      }
      console.log('vue-overview-plugin:打包完成')
    })
  }
}

module.exports = VueOverviewPlugin;
