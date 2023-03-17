/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
/** ast 解析器 */
const { parseForESLint } = require('vue-eslint-parser')
/** ast 遍历器 */
const estraverse = require("estraverse");
/** eslint-plugin-vue 辅助创建 visitor 对象的工具 */
const utils = require('eslint-plugin-vue/lib/utils')

module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	console.log('vue-overview-loader');
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
	const visitor = utils.defineTemplateBodyVisitor({
		parserServices: sourceCode.services
	}, {
		VStartTag() {
			console.log('VStartTag')
		},
		VAttribute(node) {
			console.log('VAttribute')

		}
	})

	estraverse.traverse(sourceCode.ast, {
		leave(node) {
			visitor['Program:exit'](node)
		}
	})
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
