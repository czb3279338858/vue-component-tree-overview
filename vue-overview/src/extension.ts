// 模块 'vscode' 包含 VS Code 扩展 API
// 导入模块并在代码中使用别名 vscode 引用它
import * as vscode from 'vscode';

// 当你的扩展被激活时调用此方法
// 你的扩展在第一次执行命令时被激活
export function activate(context: vscode.ExtensionContext) {

	// 使用控制台输出诊断信息 (console.log) 和错误 (console.error)
	// 这行代码只会在扩展激活时执行一次
	console.log('恭喜，你的扩展 "vue-overview" 现已激活！');

	// 命令已在 package.json 文件中定义
	// 现在使用 registerCommand 提供命令的实现
	// registerCommand 的第一个参数 commandId 必须与 package.json 中的 command 字段匹配
	// command 字段的 title 才是用户实际操作的命令
	const disposable = vscode.commands.registerCommand('vue-overview.helloWorld', () => {
		// 你在这里放置的代码将在每次执行命令时执行
		// 向用户显示消息框
		vscode.window.showInformationMessage('HA HA2!');
	});

	context.subscriptions.push(disposable);
}

// 当你的扩展被停用时调用此方法
export function deactivate() {}
