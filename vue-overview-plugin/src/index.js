/**
 * See the webpack docs for more information about plugins:
 * https://webpack.js.org/contribute/writing-a-plugin/#basic-plugin-architecture
 */

class VueOverviewPlugin {
  apply(compiler) {
    compiler.hooks.environment.tap('VueOverviewPlugin', (
    ) => {
      console.log(compiler.option);
    });
  }
}

module.exports = VueOverviewPlugin;
