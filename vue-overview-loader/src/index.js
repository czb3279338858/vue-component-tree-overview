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

module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	console.log('vue-overview-loader');
	/** 解析为 ast */
	const sourceCode = parseForESLint(source, {
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

	const ruleListeners = utils.defineTemplateBodyVisitor({
		parserServices: sourceCode.services
	}, {
		// 标签开始
		VStartTag() {
			console.log('VStartTag')
		},
		// 属性
		VAttribute(node) {
			console.log('VAttribute')

		}
	})


	const nodeQueue = [];
	Traverser.traverse(sourceCode.ast, {
		enter(node, parent) {
			node.parent = parent;
			nodeQueue.push({ isEntering: true, node });
		},
		leave(node) {
			nodeQueue.push({ isEntering: false, node });
		},
		visitorKeys: sourceCode.visitorKeys
	});



	function addRuleErrorHandler(ruleListener) {
		return function ruleErrorHandler(...listenerArgs) {
			try {
				return ruleListener(...listenerArgs);
			} catch (e) {
				e.ruleId = ruleId;
				throw e;
			}
		};
	}

	/** 事件对象 */
	const emitter = createEmitter();

	Object.keys(ruleListeners).forEach(selector => {
		emitter.on(
			selector,
			addRuleErrorHandler(ruleListeners[selector])
		);
	});

	const eventGenerator = nodeQueue[0].node.type === "Program"
		? new CodePathAnalyzer(new NodeEventGenerator(emitter, { visitorKeys: sourceCode.visitorKeys, fallback: Traverser.getKeys }))
		: new NodeEventGenerator(emitter, { visitorKeys: sourceCode.visitorKeys, fallback: Traverser.getKeys });

	nodeQueue.forEach(traversalInfo => {
		currentNode = traversalInfo.node;

		try {
			if (traversalInfo.isEntering) {
				eventGenerator.enterNode(currentNode);
			} else {
				eventGenerator.leaveNode(currentNode);
			}
		} catch (err) {
			err.currentNode = currentNode;
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
