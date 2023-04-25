/**
 * See the webpack docs for more information about plugins:
 * https://webpack.js.org/contribute/writing-a-plugin/#basic-plugin-architecture
 */

class VueOverviewPlugin {
  constructor(options = {}) {
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.environment.tap('VueOverviewPlugin', (
    ) => {
      const config = compiler.options;
      const newConfig = {
        ...config,
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
        entry: {
          routes: {
            import: path.join(compiler.context, this.options.entry),
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
      }
    });
  }
}

module.exports = VueOverviewPlugin;
