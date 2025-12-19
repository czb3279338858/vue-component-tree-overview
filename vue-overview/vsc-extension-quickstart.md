# 欢迎使用你的VS Code扩展

## 文件夹内容

* 此文件夹包含扩展所需的所有文件。
* `package.json` - 这是清单文件，在其中声明你的扩展和命令。
  * 示例插件注册了一个命令并定义其标题和命令名称。通过此信息，VS Code可以在命令面板中显示该命令。它尚不需要加载插件。
* `src/extension.ts` - 这是主要文件，你将在其中提供命令的实现。
  * 该文件导出一个函数 `activate`，当你的扩展首次激活时（在这种情况下通过执行命令）调用该函数。在 `activate` 函数内部，我们调用 `registerCommand`。
  * 我们将包含命令实现的函数作为第二个参数传递给 `registerCommand`。

## 立即开始运行

* 按 `F5` 打开一个已加载扩展的新窗口。
* 通过按（`Ctrl+Shift+P` 或 Mac上的 `Cmd+Shift+P`）并从命令面板中键入 `Hello World` 来运行你的命令。
* 在 `src/extension.ts` 中的代码内设置断点以调试扩展。
* 在原窗口调试控制台中找到扩展的输出。

## 进行更改

* 更改 `src/extension.ts` 中的代码后，可以从调试工具栏重新启动扩展。
* 你还可以重新加载（`Ctrl+R` 或 Mac上的 `Cmd+R`）带有扩展的VS Code窗口以加载更改。

## 探索API

* 当你打开文件 `node_modules/@types/vscode/index.d.ts` 时，可以打开我们完整的API集。

## 运行测试

* 安装 [扩展测试运行器](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)
* 通过 **任务：运行任务** 命令运行"watch"任务。确保此任务正在运行，否则可能无法发现测试。
  * 运行测试执行的是 out/test 目录下的测试文件，所以要先 compile 或 watch 后才能执行
* 从活动栏打开测试视图，然后单击"运行测试"按钮，或使用热键 `Ctrl/Cmd + ; A`
* 在测试结果视图中查看测试结果的输出。
* 对 `src/test/extension.test.ts` 进行更改或在 `test` 文件夹内创建新的测试文件。
  * 提供的测试运行器将仅考虑与名称模式 `**.test.ts` 匹配的文件。
  * 你可以在 `test` 文件夹内创建文件夹，以任意方式构建测试结构。

## 更进一步

* [遵循UX指南](https://code.visualstudio.com/api/ux-guidelines/overview) 创建与VS Code本机界面和模式无缝集成的扩展。
* 通过 [捆绑扩展](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) 减小扩展大小并改善启动时间。
* 在VS Code扩展市场 [发布你的扩展](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)。
* 通过设置 [持续集成](https://code.visualstudio.com/api/working-with-extensions/continuous-integration) 自动化构建。
* 集成到 [报告问题](https://code.visualstudio.com/api/get-started/wrapping-up#issue-reporting) 流程中，以获取用户报告的问题和功能请求。