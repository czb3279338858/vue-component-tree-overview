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
                loader: path.join(__dirname, '../node_modules/vue-overview-loader/src/index.js'),
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
                loader: path.join(__dirname, '../node_modules/babel-loader/lib/index.js')
              },
              {
                loader: path.join(__dirname, '../node_modules/ts-loader/index.js'),
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
    this.webpackPromise = new Promise((resolve, reject) => {
      webpack(newOptions, (err, stats) => {
        resolve()
        if (err) {
          console.error('vue-overview-plugin:打包失败', err)
        } else {
          console.log('vue-overview-plugin:打包完成')
        }
      })
    })
    compiler.hooks.afterEmit.tapAsync('VueOverviewPlugin', async (compilation, callback) => {
      await this.webpackPromise
      callback()
    })
  }
}

module.exports = VueOverviewPlugin;
