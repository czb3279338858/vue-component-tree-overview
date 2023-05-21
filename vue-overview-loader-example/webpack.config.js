const path = require('path');

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
            loader: require.resolve('../vue-overview-loader/src/'),
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
  // mode: 'development'
};
