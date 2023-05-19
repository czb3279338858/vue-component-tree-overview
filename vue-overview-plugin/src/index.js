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
  }
  apply(compiler) {
    const { entry, routes } = this.options
    const webpackVersion = webpack.version
    const options = compiler.options
    const newPlugins = options.plugins.filter(p => !(p instanceof VueOverviewPlugin || p instanceof HtmlWebpackPlugin || p.__pluginConstructorName === 'VueLoaderPlugin'))
    const entryOption = webpackVersion.startsWith('4') ? path.join(options.context, entry) : {
      routes: {
        import: path.join(options.context, entry),
        library: {
          name: 'routes',
          type: 'var',
        }
      }
    }
    const newOptions = {
      ...options,
      performance: {
        hints: false
      },
      entry: entryOption,
      output: {
        ...options.output,
        path: path.join(options.output.path, 'vue-overview'),
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
        ...newPlugins,
        new HtmlWebpackPlugin({
          template: path.join(__dirname, './index.html'),
          inject: false
        })
      ]
    }
    webpack(newOptions, (err, stats) => {
      if (err) {
        console.error('vue-overview-plugin:打包失败', err)
      } else {
        console.log('vue-overview-plugin:打包完成')
      }
    })
  }
}

module.exports = VueOverviewPlugin;
