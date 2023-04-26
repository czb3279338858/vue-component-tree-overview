const { defineConfig } = require('@vue/cli-service')
// const VueOverviewPlugin = require('../vue-overview-plugin/src/index.js');
module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      postcss: {
        postcssOptions: {
          plugins: [
            require('tailwindcss')(),
            require('autoprefixer')()
          ]
        }
      }
    }
  },
  configureWebpack: {
    plugins: [
      // new VueOverviewPlugin({
      //   entry: './src/router/routes.ts'
      // })
    ]
  }
})
