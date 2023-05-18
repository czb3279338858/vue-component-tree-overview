const { defineConfig } = require('@vue/cli-service')
const VueOverviewPlugin = require('../vue-overview-plugin/src/index')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new VueOverviewPlugin({
        entry: './src/router/routes.ts',
        loaderOptions: {
          exclude: /routes.ts$/
        }
      })
    ]
  }
})
