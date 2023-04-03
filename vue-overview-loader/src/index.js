/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
const tsUtils = require('./utils/ts-ast-utils')
const { findVariable } = require('eslint-utils')

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

				// 没有绑定直接是赋值常量，数值、字符串、布尔值，[常量文本,'VLiteral']
				if (attributeValue.type === 'VLiteral') return [attributeValue.value, attributeValue.type]

				// 绑定值是变量，[函数名、变量名,'Identifier']
				if (attributeValue.expression.type === 'Identifier') return [attributeValue.expression.name, attributeValue.expression.type]

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
				if (attributeValue.expression.type === 'MemberExpression') {
					return [sourceCode.getText(attributeValue.expression), attributeValue.expression.type]
				}

				// 其他，不支持
				// 例如：:a="'1'"
				return [undefined, attributeValue.expression.type]
			}
			/**
			 * 不支持 {{ val.id + index }} 、 {{ `${val.id}${index}` }} 、 {{ "111" }}
			 * @param {*} VExpressionContainer 
			 * @returns 
			 */
			function getVExpressionContainerExpression(VExpressionContainer) {

				// 绑定值是变量，[函数名、变量名,'Identifier']
				if (VExpressionContainer.expression.type === 'Identifier') return [VExpressionContainer.expression.name, VExpressionContainer.expression.type]

				// 绑定值是函数调用,[函数名,'CallExpression']
				// 函数调用可以层层嵌套的，这里不支持嵌套，只读取第一层的函数名
				if (VExpressionContainer.expression.type === 'CallExpression') {
					return [VExpressionContainer.expression.callee.name, VExpressionContainer.expression.type]
				}

				// 表达式直接返回文本
				if (['MemberExpression'].includes(VExpressionContainer.expression.type)) {
					return [sourceCode.getText(VExpressionContainer.expression), VExpressionContainer.expression.type]
				}

				// 其他
				return [undefined, VExpressionContainer.expression.type]
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
			function commentsToText(comments) {
				return comments.reduce((p, c) => {
					p = p ? `${p}\n${c.value}` : c.value
					return p
				}, '')
			}
			function getTemplateCommentBefore(node) {
				const elementComments = getTemplateCommentsBefore(node)
				const elementComment = commentsToText(elementComments)
				return elementComment
			}
			function addTemplateMap(node, elementInfo) {
				const parent = node.parent
				const parentInfo = templateMap.get(parent)
				if (parentInfo) {
					parentInfo.children.push(elementInfo)
				}
				templateMap.set(node, elementInfo)
			}
			function getPropsInfoSet(props) {
				const propSet = new Set()
				props.forEach(prop => {
					const propName = prop.propName
					const [propDefault, propType, propRequired] = getPropOptionInfo(prop.value)
					const propComments = sourceCode.getCommentsBefore(prop.key)
					const propComment = commentsToText(propComments)
					const propInfo = {
						propName,
						propDefault,
						propType,
						propRequired,
						propComment
					}
					propSet.add(propInfo)
				})
				return propSet
			}
			function getWithDefaultsPropInfoSet(props, withDefaultsArguments) {
				const propSet = new Set()
				const propDefaultNodes = withDefaultsArguments ? withDefaultsArguments[1].properties : []
				props.forEach(prop => {
					const propName = prop.propName
					const propDefaultNode = propDefaultNodes.find(p => p.key.name === propName)
					const propDefault = propDefaultNode ? sourceCode.getText(propDefaultNode.value) : undefined
					const propType = prop.types
					const propRequired = prop.required
					const propComments = sourceCode.getCommentsBefore(prop.key)
					const propComment = commentsToText(propComments)
					const propInfo = {
						propName,
						propDefault,
						propType,
						propRequired,
						propComment
					}
					propSet.add(propInfo)
				})
				return propSet
			}
			function getPropType(decoratorArgumentTypeValue) {
				switch (decoratorArgumentTypeValue.type) {
					case 'Identifier':
						return [decoratorArgumentTypeValue.name]
					case 'ArrayExpression':
						return decoratorArgumentTypeValue.elements.map(e => e.name)
					default:
						return []
				}
			}
			function getPropOptionInfo(propOption, prop) {
				let propDefault, propType, propRequired
				// option 中的 prop 可以没有参数
				if (propOption) {
					// 通过prop配置项获取ts
					switch (propOption.type) {
						case 'Identifier':
							propType = getPropType(propOption)
							break;
						case 'ObjectExpression':
							propOption.properties.forEach(d => {
								const key = d.key.name
								switch (key) {
									case 'default':
										propDefault = sourceCode.getText(d.value)
										break;
									case 'type':
										propType = getPropType(d.value)
										break;
									case 'required':
										if (d.value.raw === 'true') {
											propRequired = true
										} else {
											propRequired = false
										}
										break;
								}
							})
							break;
						case 'ArrayExpression':
							propType = getPropType(propOption)
							break;
					}
				}
				// 如果没有类型，尝试从ts中获取
				if (prop && !propType && prop.typeAnnotation) {
					const typeAnnotation = prop.typeAnnotation.typeAnnotation
					const runtimeType = tsUtils.inferRuntimeType(context, typeAnnotation)
					propType = runtimeType
				}
				if (prop && propRequired === undefined && prop.typeAnnotation) {
					propRequired = !prop.optional
				}
				return [propDefault, propType, propRequired]
			}
			const templateMap = new Map()
			let propSet = new Set()
			let dataSet = new Set()
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
								attributes: undefined,
								templateComment: getTemplateCommentBefore(node),
								children: undefined
							}
							addTemplateMap(node, templateInfo)
						},
						// 不支持在{{ }}内部写 // 注释，只支持在{{ }}之前
						'VElement>VExpressionContainer'(node) {
							const [templateName, templateType] = getVExpressionContainerExpression(node)
							const templateInfo = {
								templateName,
								templateType,
								attributes: undefined,
								templateComment: getTemplateCommentBefore(node),
								children: undefined
							}
							addTemplateMap(node, templateInfo)
						}
					},
					// script 解析
					{
						// class component @Prop
						'Decorator[expression.callee.name=Prop]'(node) {
							const prop = node.parent

							const propName = prop.key.name
							// 装饰器参数
							const propOption = node.expression.arguments[0]

							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, prop)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propNameComments = sourceCode.getCommentsAfter(node)
							const propComment = commentsToText([...decoratorComments, ...propNameComments])

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propSet.add(propInfo)
						},
						// class component @PropSync
						'Decorator[expression.callee.name=PropSync]'(node) {
							const decoratorArgument = node.expression.arguments
							const prop = node.parent

							const propName = decoratorArgument[0].value
							const propOption = decoratorArgument[1] || undefined
							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, prop)

							const comments = sourceCode.getCommentsBefore(node)
							const propComment = commentsToText(comments)

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propSet.add(propInfo)
						},
						// class component @Model
						'Decorator[expression.callee.name=Model]'(node) {
							const prop = node.parent
							const propName = prop.key.name

							const decoratorArgument = node.expression.arguments
							const propOption = decoratorArgument[1] || undefined
							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, prop)

							const comments = sourceCode.getCommentsAfter(node)
							const propComment = commentsToText(comments)

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propSet.add(propInfo)
						},
						// class component @ModelSync
						'Decorator[expression.callee.name=ModelSync]'(node) {
							const decoratorArgument = node.expression.arguments

							const propName = decoratorArgument[0].value
							const propOption = decoratorArgument[2]
							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, node.parent)

							const comments = sourceCode.getCommentsBefore(decoratorArgument[0])
							const propComment = commentsToText(comments)

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propSet.add(propInfo)
						},
						// class component @VModel
						'Decorator[expression.callee.name=VModel]'(node) {
							const propName = 'value'
							const decoratorArgument = node.expression.arguments
							const propOption = decoratorArgument[0]
							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, node.parent)
							const comments = sourceCode.getCommentsBefore(node)
							const propComment = commentsToText(comments)

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propSet.add(propInfo)
						},
						// 可以在一个Vue组件 option 上执行一个回调函数
						...utils.executeOnVueComponent(context, (optionNode) => {
							// props
							const props = utils.getComponentPropsFromOptions(optionNode)
							propSet = getPropsInfoSet(props)
							// data
							const data = utils.findProperty(optionNode, 'data')
							if (data.value.type === 'FunctionExpression') {
								const ret = data.value.body.body.find(b => b.type === 'ReturnStatement')
								const retBody = ret.argument.properties
								retBody.forEach(data => {
									const dataName = data.key.name
									const comments = sourceCode.getCommentsBefore(data.key)
									const dataComment = commentsToText(comments)
									const dataInfo = {
										dataName,
										dataComment
									}
									dataSet.add(dataInfo)
									debugger
								})
								debugger
							} else {

							}
							debugger
						}),
						// script setup 中
						...utils.defineScriptSetupVisitor(context, {
							// 这里的props会包含ts中的类型，不过是转换为js的类型，例如interface=>object
							onDefinePropsEnter(node, props) {
								// 目前defineProps在setup只能使用一次，onDefinePropsEnter只会获取第一个defineProps，下面的方法兼容defineProps被多次使用时
								// defineProps和withDefaults配合使用时
								let withDefaultsProps = []
								// 普通defineProps
								let otherProps = []
								props.forEach(prop => {
									if (prop.type === 'type') withDefaultsProps.push(prop)
									else otherProps.push(prop)
								})
								const otherPropSet = getPropsInfoSet(otherProps)
								const withDefaultsPropSet = getWithDefaultsPropInfoSet(withDefaultsProps, node.parent.arguments)
								propSet = new Set([...otherPropSet, ...withDefaultsPropSet])
							}
						})
					}
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
