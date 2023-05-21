const path = require('path');

module.exports = {
  performance: {
    hints: false
  },
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
    path: path.join(__dirname, './dist'),
  },
  resolve: {
    extensions: [
      '.ts',
      '.js',
      '.vue',
    ],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js|vue)$/,
        use: [
          {
            loader: path.join(__dirname, './node_modules/vue-overview-loader/src/index.js'),
            options: {
              routes: {
                include: /routes.ts$/
              }
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: path.join(__dirname, './node_modules/babel-loader/lib/index.js')
          },
          {
            loader: path.join(__dirname, './node_modules/ts-loader/index.js'),
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
  mode: 'development'
};
