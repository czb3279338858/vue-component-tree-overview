# 使用方法
- 以 vue routes 导出文件为入口进行打包
  - 会调用 vue-overview-loader 对 .vue | js | ts 文件进行处理
  - 路由信息文件会把 import() 处理为同步导入
  - 其他文件会获取代码大纲
  - 打包的结果会输出到项目输出目录/vue-overview中，点击 index.html 可以直接访问代码大纲
- vue.config.js
```
const { defineConfig } = require('@vue/cli-service')
const VueOverviewPlugin = require('../vue-overview-plugin/src/index')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new VueOverviewPlugin({
        // 入口文件，导出 vue 路由信息的文件
        entry: './src/router/routes.ts',
        // 路由信息包含哪些文件，路由信息文件会把 import() 处理为同步导入
        routes: {
          include: /routes\.ts$/,
        }
      })
    ]
  }
})
```