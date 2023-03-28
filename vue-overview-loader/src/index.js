/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
const ts = require('typescript')

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
			const sourceCode = context.getSourceCode()

			// TODO:获取属性的key，这个方法暂时由sourceCode.getText(a.key)代替，以后看看是否扩充为支持动态绑定 v-on:[event]="doThis"
			function getAttributesName(attributeKey) {
				if (attributeKey.rawName) return attributeKey.rawName
				const { name, argument, type, modifiers } = attributeKey
				let keyName = name.rawName
				if (argument) {
					// 属性中有参数，例如`:style="styleName"`中的style
					// 动态事件和绑定v-on:[event]="doThis"、v-bind:[key]="value"直接显示文本
					const argumentName = argument ? (argument.rawName ? argument.rawName : sourceCode.getText(argument)) : undefined
					keyName = argumentName ? (keyName === ':' ? `${keyName}${argumentName}` : `${keyName}:${argumentName}`) : keyName
				}
				if (modifiers) {
					keyName = `${keyName}${modifiers.map(m => `.${m.rawName}`)}`
				}
				// 指令
				if (type === 'VDirectiveKey' && ![':', '@'].includes(name.rawName)) {
					return `v-${keyName}`
				}
				return keyName
			}
			function getAttributesValue(attributeValue) {
				// 只有属性没有值时，例如 v-else
				if (!attributeValue) return []

				// 绑定值是常量，数值、字符串、布尔值，[常量文本,'VLiteral']
				if (attributeValue.type === 'VLiteral') return [attributeValue.value, attributeValue.type]

				// 绑定值是变量，[函数名、变量名,'Identifier']
				if (attributeValue.expression.Identifier === 'Identifier') return [attributeValue.expression.name, attributeValue.expression.type]

				// 绑定值是函数调用,[函数名,'CallExpression']
				// 函数调用可以层层嵌套的，这里不支持嵌套，只读取第一层的函数名
				if (attributeValue.expression.type === 'CallExpression') {
					return [attributeValue.expression.callee.name, attributeValue.expression.type]
				}

				// 绑定值是v-for的值，[遍历的对象，'VForExpression'，遍历的项名[]]
				// 遍历的对象只支持变量
				// 遍历的项名[]，例如 (val, name, index) in object => [val,name,index]
				if (attributeValue.expression.type === 'VForExpression') {
					return [attributeValue.expression.right.type === 'Identifier' ? attributeValue.expression.right.name : undefined, attributeValue.expression.type, attributeValue.expression.left.map(l => l.name)]
				}

				// 表达式直接返回文本
				// 包括:attr="'string'" 这个时候返回["'string'",'VExpressionContainer']
				if (attributeValue.expression.type === 'VExpressionContainer') {
					return [sourceCode.getText(attributeValue), attributeValue.expression.type]
				}

				// 其他，好像没其他了
				return [undefined, attributeValue.expression.type]
			}
			/** 所有的template中的注释都在template节点中 */
			function getAllComments(element) {
				if (element.comments) return element.comments
				return getAllComments(element.parent)
			}
			function isEmptyVText(node) {
				return node.type === 'VText' && /^[\n\s]*$/.test(node.value)
			}
			/** 
			 * 根据当前节点所在行和列以及上一级（父级或兄弟上级）的行和列来查找当前节点的注释节点 
			 * 注意，上一级有可能是个VElement它需要获取开始标签来做判断
			 * node不允许使用startTag，应该传如它的VElement
			 * */
			function getTemplateCommentsBefore(node) {
				const comments = getAllComments(node)
				const parent = node.parent
				const parentChildren = parent.children
				const startNode = node.type === 'VElement' ? node.startTag : node
				const { line: nodeStartLine, column: nodeStartColumn } = startNode.loc.start

				const reverseParentChildren = [...parentChildren].reverse()

				let preNode
				// 在子级中查找同级的上一个兄弟元素
				for (const index in reverseParentChildren) {
					const c = reverseParentChildren[index]
					if (preNode === null && !(isEmptyVText(c))) {
						preNode = c
						break;
					}
					if (c === node) preNode = null
				}
				let preNodeEndLine
				let preNodeEndColumn
				// 有同级的上一个兄弟元素
				if (preNode) {
					preNodeEndLine = preNode.loc.end.line
					preNodeEndColumn = preNode.loc.end.column
				} else {
					// template节点
					if (!parent.parent) {
						preNodeEndLine = 1
						preNodeEndColumn = 0
					} else {
						preNodeEndLine = parent.type === 'VElement' ? parent.startTag.loc.end.line : parent.loc.end.line
						preNodeEndColumn = parent.type === 'VElement' ? parent.startTag.loc.end.column : parent.loc.end.column
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
			function getTemplateCommentBefore(node) {
				const elementComments = getTemplateCommentsBefore(node)
				const elementComment = elementComments.reduce((p, c) => {
					p = p ? `${p}\n${c.value}` : c.value
					return p
				}, '')
				return elementComment
			}
			function addTemplateMap(node, elementInfo) {
				const parent = node.parent
				const parentInfo = templateMap.get(parent)
				if (parentInfo) {
					parentInfo.children.push(elementInfo)
				} else {
					rootTemplate.add(elementInfo)
				}
				templateMap.set(node, elementInfo)
			}
			const rootTemplate = new Set()
			const templateMap = new Map()

			return utils.compositingVisitors(
				utils.defineTemplateBodyVisitor(
					context,
					{
						// 标签
						VElement(element) {
							const templateValue = element.rawName
							// TODO：v-for的循环值被绑定后无法和其他值区分出来
							const attributes = element.startTag.attributes.map(a => {
								const name = sourceCode.getText(a.key)
								// const name = getAttributesName(a.key)
								const [valueName, valueType, vForLeft] = getAttributesValue(a.value)
								return {
									name,
									valueName,
									valueType,
									vForLeft
								}
							})
							const templateComment = getTemplateCommentBefore(element)
							const templateInfo = {
								templateValue,
								templateType: 'VElement',
								attributes,
								templateComment,
								children: []
							}
							addTemplateMap(element, templateInfo)
						},
						// 标签内文本
						'VElement>VText'(node) {
							if (isEmptyVText(node)) return
							const templateInfo = {
								templateValue: node.value,
								templateType: 'VText',
								attributes: [],
								templateComment: getTemplateCommentBefore(node),
								children: []
							}
							addTemplateMap(node, templateInfo)
						},
						// 不支持在{{ }}内部写 // 注释，只支持在{{ }}之前
						// 只支持变量、函数调用、
						'VElement>VExpressionContainer'(node) {
							const templateInfo = {
								templateName: sourceCode.getText(node.expression),
								templateType: 'VExpressionContainer',
								attributes: [],
								templateComment: getTemplateCommentBefore(node),
								children: []
							}

						}
					},
					// script 解析
					// {
					// 	// class component @Prop
					// 	'Decorator[expression.callee.name=Prop]'(node) {
					// 		const prop = node.parent
					// 		const propName = prop.key.name
					// 		const decoratorArgument = node.expression.arguments[0]
					// 		let { default: propDefault, type: propType, required: propRequired } = decoratorArgument.properties.reduce((p, c) => {
					// 			// TODO:default如果是个函数需要获取函数返回值，这里暂不支持
					// 			if (c.key.name === 'default') p['default'] = sourceCode.getText(c.value)
					// 			if (c.key.name === 'type') p['type'] = sourceCode.getText(c.value)
					// 			if (c.key.name === 'required') p['required'] = c.value.raw
					// 			return p
					// 		}, {})
					// 		if (prop.typeAnnotation) {
					// 			const text = sourceCode.getText(prop.parent.parent)
					// 			const sourceFile = ts.createSourceFile('', text)
					// 			const classDeclaration = sourceFile.statements[0]
					// 			const classDeclarationMembers = classDeclaration.members;
					// 			const classDeclarationMember = classDeclarationMembers[0]
					// 			const classDeclarationMemberType = classDeclarationMember.type;
					// 			const a = classDeclarationMemberType.getText(sourceFile)
					// 			// const sourceCodes = ts.createSourceFile('test.ts', text)
					// 			// const program = ts.createProgram({
					// 			// 	rootNames: ["file.ts"],
					// 			// 	options: {},
					// 			// })
					// 			// const typeChecker = program.getTypeChecker()
					// 			// const type = typeChecker.getTypeFromTypeNode(sourceCodes)

					// 			debugger
					// 		}
					// 		debugger
					// 	}
					// }
				),
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
