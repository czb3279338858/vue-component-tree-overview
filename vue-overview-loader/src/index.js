/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	const linter = new Linter()
	const parserOptions = {
		ecmaVersion: 2020,
		sourceType: "module",
		parser: typescriptEslintParser,
		extraFileExtensions: [
			".vue"
		],
		ecmaFeatures: {
			"jsx": true
		}
	}
	linter.defineParser('vueEslintParser', {
		parseForESLint,
		parserOptions
	})
	linter.defineRule("my-rule", {
		create(context) {
			function getAttributesName(attributeKey) {
				if (attributeKey.rawName) return attributeKey.rawName
				const { name, argument, type, modifiers } = attributeKey
				const keyName = `${name.rawName}${name.rawName === ':' ? '' : ':'}${argument ? argument.rawName : ''}${modifiers ? modifiers.map(m => `.${m.rawName}`) : ''}`
				// 指令
				if (type === 'VDirectiveKey' && ![':', '@'].includes(name.rawName)) {
					return `v-${keyName}`
				}
				return keyName
			}
			function getAttributesValue(attributeValue) {
				if (attributeValue.value) return [attributeValue.value, attributeValue.type]
				return [attributeValue.expression.name, attributeValue.expression.type]
			}
			/** 所有的template中的注释都在template节点中 */
			function getElementAllComments(element) {
				if (element.comments) return element.comments
				return getElementAllComments(element.parent)
			}
			/** 根据当前标签代码所在行和列以及上一级（父级或兄弟上级）的行和列来查找当前节点的注释节点 */
			function getElementComments(element) {
				const comments = getElementAllComments(element)
				const parent = element.parent
				const parentChildren = parent.children
				const { line: nodeStartLine, column: nodeStartColumn } = element.startTag.loc.start

				const reverseParentChildren = [...parentChildren].reverse()
				let preNode
				for (const index in reverseParentChildren) {
					const c = reverseParentChildren[index]
					if (preNode === null && !(c.type === 'VText' && /\n+/.test(c.value))) {
						preNode = c
						break;
					}
					if (c === element) preNode = null
				}
				let preNodeEndLine
				let preNodeEndColumn
				// 有上一个兄弟元素
				if (preNode) {
					preNodeEndLine = preNode.loc.end.line
					preNodeEndColumn = preNode.loc.end.column
				} else {
					// 文件的顶层节点
					if (!parent.parent) {
						preNodeEndLine = 1
						preNodeEndColumn = 0
					} else {
						preNodeEndLine = parent.startTag.loc.end.line
						preNodeEndColumn = parent.startTag.loc.end.column
					}
				}
				let nodeComments = []
				for (const key in comments) {
					const comment = comments[key]
					const { loc: { start: { line: startLine, column: startColumn }, end: { line: endLine, column: endColumn } } } = comment
					if (
						(startLine > preNodeEndLine || (startLine === preNodeEndLine && startColumn >= preNodeEndColumn)) && (endLine < nodeStartLine || (endLine === nodeStartLine && endColumn <= nodeStartColumn))
					) {
						nodeComments.push(comment)
					}
				}
				return nodeComments
			}
			const elementMap = new Map()
			return utils.defineTemplateBodyVisitor(
				context,
				{
					VStartTag(startTag) {
						const element = startTag.parent
						const elementName = element.rawName
						const attributes = startTag.attributes.map(a => {
							const name = getAttributesName(a.key)
							const [valueName, valueType] = getAttributesValue(a.value)
							return {
								name,
								valueName,
								valueType
							}
						})
						const elementComments = getElementComments(element)
						const elementComment = elementComments.reduce((p, c) => {
							p = p ? `${p}\n${c.value}` : c.value
							return p
						}, '')
						const elementInfo = {
							elementName,
							attributes,
							elementComment,
							children: []
						}
						const parent = element.parent
						const parentInfo = elementMap.get(parent)
						if (parentInfo) {
							parentInfo.children.push(elementInfo)
						}
						elementMap.set(element, elementInfo)
					},
				}
			)
		},
	});
	const config = {
		parserOptions,
		rules: { "my-rule": "error" },
		parser: 'vueEslintParser'
	};
	linter.verify(source, config)
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
