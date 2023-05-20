const VueOverviewPlugin = require('../vue-overview-plugin/src/index.js')

module.exports = {
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
}
