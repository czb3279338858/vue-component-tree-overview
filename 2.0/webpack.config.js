const path = require('path');

module.exports = {
  entry: path.join(__dirname, './src/router/routes.ts'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|jsx|tsx|vue)$/,
        use: [
          {
            loader: 'example-loader',
            options: {},
          },
        ],
      },
    ],
  },
  resolveLoader: {
    alias: {
      'example-loader': require.resolve('D:/git/vue-component-tree-overview/vue-overview-loader/src/'),
    },
  },
};
