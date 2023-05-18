/**
 * See the webpack docs for more information about plugins:
 * https://webpack.js.org/contribute/writing-a-plugin/#basic-plugin-architecture
 */
const webpack = require('webpack');
class VueOverviewPlugin {
  constructor(options = {}) {
    this.options = options;
  }
  apply(compiler) {
    const options = compiler.options
    const newOptions = {
      ...options,
      output: {
        ...options.output,
        path: `${options.output.path}1`
      },
      plugins: options.plugins.filter(p => !(p instanceof VueOverviewPlugin))
    }
    // webpack(newOptions, (err, stats) => { })
  }
}

module.exports = VueOverviewPlugin;
