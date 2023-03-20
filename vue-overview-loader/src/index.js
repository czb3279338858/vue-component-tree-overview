/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
/** ast 解析器 */
const { parseForESLint } = require('vue-eslint-parser')
/** eslint-plugin-vue 辅助创建 visitor 对象的工具 */
const utils = require('eslint-plugin-vue/lib/utils')
const Traverser = require('eslint/lib/shared/traverser.js')
const createEmitter = require('eslint/lib/linter/safe-emitter.js')
const CodePathAnalyzer = require("eslint/lib/linter/code-path-analysis/code-path-analyzer.js")
const NodeEventGenerator = require("eslint/lib/linter/node-event-generator.js")
const { SourceCode } = require("eslint")

module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;

	/** 
	 * 解析为 eslint ast 对象，包括如下属性
	 * ast
	 * scopeManager
	 * services
	 * visitorKeys
	 * */
	const eslintSourceCode = parseForESLint(source, {
		"ecmaVersion": 2020,
		"sourceType": "module",
		"parser": "@typescript-eslint/parser",
		"extraFileExtensions": [
			".vue"
		],
		"ecmaFeatures": {
			"jsx": true
		}
	})

	const context = {
		parserServices: eslintSourceCode.services
	}
	// 看到 vue/brace-style

	// VariableDeclaration：一个变量声明，例如 var x = 1 或 let y = 2
	// VariableDeclarator: 选择所有变量声明符节点，例如var x = 1或let y = 2。它是 VariableDeclaration 的子节点，用于指定变量的名称和初始值，例如 x = 1 或 y = 2
	// ConditionalExpression: 选择所有条件表达式节点，例如a ? b : c
	// LogicalExpression: 选择所有逻辑表达式节点，例如a && b或c || d
	// BinaryExpression: 选择所有二元表达式节点，例如a + b或c * d
	//  [operator='>'] 应该是指操作符
	// AssignmentPattern: 用于表示默认参数或解构赋值的语法，例如[x, y] = [1, 2]或{a, b} = {a: 1, b: 2}
	// AssignmentExpression: 选择所有赋值表达式节点，例如a = b或c += d
	// UpdateExpression: 选择所有更新表达式节点，例如a++或–b
	// UnaryExpression: 选择所有一元表达式节点
	// ExpressionStatement 表达式语句
	// RestElement：表示函数参数或数组解构中使用...运算符来收集剩余元素的节点
	// SpreadElement：表示数组或函数调用中使用...运算符来展开可迭代对象的元素的节点
	// SpreadProperty：表示对象字面量中使用...运算符来复制其他对象属性的节点
	// 	ExperimentalSpreadProperty：与SpreadProperty相同，但是使用了新版Babel解析器
	// SequenceExpression：表示一系列逗号分隔的表达式，它们按顺序求值，并返回最后一个表达式的值。for循环的参数

	// AwaitExpression: 选择所有await表达式节点
	// YieldExpression: 选择所有yield表达式节点
	// NewExpression: 选择所有new表达式节点
	// ImportDeclaration 一个静态导入声明，例如 import foo from “mod”
	// ImportExpression 一个动态导入表达式，例如 import(“mod”)
	// ImportSpecifier：一个导入模块成员的绑定，例如 {foo} 在 import {foo} from “mod” 
	// ImportNamespaceSpecifier：一个导入模块命名空间的绑定，例如 * as foo 在 import * as foo from “mod”。
	// ExportNamedDeclaration 一个导出命名值的声明，例如 export {foo, bar} 或 export function foo() {}
	// ExportDefaultDeclaration 一个导出默认值的声明，例如 export default foo
	// ExportSpecifier：一个导出模块成员的绑定，例如 {foo} 在 export {foo}
	// ExportAllDeclaration：一个导出所有模块成员的声明，例如 export * from “mod”
	// DoWhileStatement do-while语句
	// WhileStatement：表示一个while循环，它在一个条件为真时重复执行一个语句块
	// ForInStatement for-in语句
	// ForOfStatement for-of语句
	// ForStatement for语句
	// 	.test: 匹配一个具有test属性的节点
	// 	ForStatement > .test选择器可以匹配for循环语句中的条件部分，即for()中的第二个
	// MethodDefinition if语句
	// IfStatement是一个表示if-else语句的AST节点
	// ReturnStatement
	// SwitchCase 表示一个case子句，它包含一个测试值和一个语句序列
	// SwitchStatement：表示一个switch语句，它根据一个表达式的值匹配不同的case子句，并执行相应的语句块
	// ThrowStatement：表示一个throw语句，它抛出一个异常
	// BreakStatement break语句
	// ContinueStatement
	// TryStatement
	// WithStatement：表示一个with语句，它将一个对象添加到作用域链上，并在该对象上下文中执行一个语句块
	// 	with语句是一种JavaScript语句，它用来指定一个默认对象，以便在访问该对象的属性时可以省略对象名
	// DebuggerStatement：一个 debugger 语句，用于调试代码
	// CatchClause是ast中的一种节点类型，它表示一个捕获异常的语句块，通常与try和finally一起使用
	// LabeledStatement是ast中的一种节点类型，它表示一个带有标签的语句，例如while或switch。

	// Program(node){ }：节点是一个AST的根节点，它表示整个源代码的结构。
	// PropertyDefinition(node) { }：只匹配有子节点的属性定义节点，属性定义节点是指变量定义、函数定义等
	// Identifier是一种AST节点的类型，用来表示标识符，比f如变量名，函数名，模块名等
	//  Identifier.key 表示标识符的名称，返回一个字符串，作为选择器应该是表示有标识符
	//  .就是用来访问该节点的属性
	// MetaProperty是一种表示元属性的AST节点类型，比如new.target或import.meta

	// Property(node)：节点是一个表示对象字面量中的属性的AST节点。
	// ObjectExpression(node)：一个表示对象字面量
	// ObjectPattern 表示对象解构模式 var {x, y} = obj
	// ArrayExpression是一种AST节点的类型，用来表示数组表达式
	// ArrayPattern 数组解构模式
	// MemberExpression 成员表达式，obj.x arr[0]
	// [computed=true]是一种AST节点的属性，用来表示成员表达式中的属性名是否是通过计算得到的,数组的key或者以变量为key的属性名就是通过计算得到的

	// FunctionDeclaration是一个表示函数声明的抽象语法树节点。
	// 	FunctionDeclaration:exit
	// FunctionExpression是一个表示函数表达式的抽象语法树节点，可以是匿名函数
	// ArrowFunctionExpression(node)是一个表示箭头函数表达式的抽象语法树节点
	// ThisExpression是一个表示this表达式的抽象语法树节点
	// Super 构造函数中的
	// CallExpression 函数调用表达式foo(1, 2)
	// ClassDeclaration：表示一个类声明，它定义了一个类名和一个类体
	// ClassExpression：表示一个类表达式，它定义了一个匿名或命名的类，并返回该类作为值
	// StaticBlock：一个静态代码块，在类中定义静态属性或方法
	// PrivateIdentifier是ast中的一种节点类型，它表示一个私有标识符，例如私有类元素。即类的私有属性只允许类内部访问

	// Literal：普通字符串
	// TemplateLiteral：模板字符串

	// TemplateElement(node) { }: 标签

	// .init是一种AST节点的属性，用来表示初始化的值，比如变量声明或者解构模式中的赋值。 var x = 10; var [x = 1, y = 2] = arr;
	// [['VariableDeclaration','FunctionDeclaration']](node) {} ESLint 规则的回调函数可以使用数组字面量的语法来指定多个 ast 节点类型作为参数，这意味着该回调函数会在遇到任何一个指定类型的节点时被触发

	/** 解析规则 */
	const ruleListeners = utils.compositingVisitors(
		utils.defineTemplateBodyVisitor(context, {
			// 标签开始
			VStartTag(node) {
				console.log('VStartTag')
			},
			// 属性
			VAttribute(node) {
				console.log('VAttribute')
			}
			// VAttribute[directive=false] > VLiteral 是一个规则选择器，它用于匹配没有指令修饰符的属性节点下的文本节点。例如，在 <div v-bind:title="‘foo’"></div> 中，‘foo’ 就是一个 VLiteral 节点
		})
	)

	/** 创建ast遍历对象 */
	const nodeQueue = [];
	Traverser.traverse(eslintSourceCode.ast, {
		enter(node, parent) {
			node.parent = parent;
			nodeQueue.push({ isEntering: true, node });
		},
		leave(node) {
			nodeQueue.push({ isEntering: false, node });
		},
		visitorKeys: eslintSourceCode.visitorKeys
	});

	/** 事件对象，把选择器添加到事件对象中 */
	const emitter = createEmitter();
	function addRuleErrorHandler(ruleListener) {
		return function ruleErrorHandler(...listenerArgs) {
			try {
				return ruleListener(...listenerArgs);
			} catch (e) {
				// e.ruleId = ruleId;
				throw e;
			}
		};
	}
	Object.keys(ruleListeners).forEach(selector => {
		emitter.on(
			selector,
			addRuleErrorHandler(ruleListeners[selector])
		);
	});

	/** 遍历 ast，使用事件生成器对象执行选择器代表的事件 */
	const eventGenerator = nodeQueue[0].node.type === "Program"
		? new CodePathAnalyzer(new NodeEventGenerator(emitter, { visitorKeys: eslintSourceCode.visitorKeys, fallback: Traverser.getKeys }))
		: new NodeEventGenerator(emitter, { visitorKeys: eslintSourceCode.visitorKeys, fallback: Traverser.getKeys });

	nodeQueue.forEach(traversalInfo => {
		currentNode = traversalInfo.node;
		try {
			if (traversalInfo.isEntering) {
				eventGenerator.enterNode(currentNode);
			} else {
				eventGenerator.leaveNode(currentNode);
			}
		} catch (err) {
			// err.currentNode = currentNode;
			throw err;
		}
	});


	const newSource = `
	/**
	 * vue-overview-loader
	 *
	 * Resource Location: ${resource}
	 * Loaders chained to module: ${JSON.stringify(loaders)}
	 * Loader API Version: ${version}
	 * Is this in "webpack mode": ${webpack}
	 * This is the users request for the module: ${request}
	 */
	/**
	 * Original Source From Loader
	 */
	${source}`;

	return newSource;
}
