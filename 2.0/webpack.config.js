const path = require('path');

module.exports = {
  entry: path.join(__dirname, './src/views/OptionsComponent.vue'),
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
  devtool: "source-map"
};
