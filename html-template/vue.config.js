const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // 生成map文件
  productionSourceMap: false,
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
    optimization: {
      // 混淆代码
      // minimize: false,
      // 代码分割
      splitChunks: false
    }
  },
  chainWebpack: config => {
    const htmlPlugin = config.plugin('html')
    htmlPlugin.tap(args => {
      // 不执行js和css注入，js和css通过html模板中的设置内联到模板中
      args[0].inject = false
      return args
    })
    // 字体文件改为内联
    config.module.rule('fonts').clear().test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i).type('asset/inline')

  },
})
