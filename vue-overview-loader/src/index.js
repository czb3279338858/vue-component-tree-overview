/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
const tsUtils = require('./utils/ts-ast-utils')

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

			/**
			 * template 中获取 {{ }} 节点的 name 和 type
			 * 不支持 {{ val.id + index }} 、 {{ `${val.id}${index}` }} 、 {{ "111" }}
			 * @param {*} VExpressionContainer 
			 * @returns 
			 */
			function getVExpressionContainerNameAndType(VExpressionContainer) {

				// 绑定值是变量，[函数名、变量名,'Identifier']
				if (VExpressionContainer.expression.type === 'Identifier') return [VExpressionContainer.expression.name, VExpressionContainer.expression.type]

				// 绑定值是函数调用,[函数名,'CallExpression']
				// 函数调用可以层层嵌套的，这里不支持嵌套，只读取第一层的函数名
				if (VExpressionContainer.expression.type === 'CallExpression') {
					return [VExpressionContainer.expression.callee.name, VExpressionContainer.expression.type]
				}

				// 表达式直接返回文本、filter
				if (['MemberExpression', 'VFilterSequenceExpression'].includes(VExpressionContainer.expression.type)) {
					return [sourceCode.getText(VExpressionContainer.expression), VExpressionContainer.expression.type]
				}

				// 其他
				return [undefined, VExpressionContainer.expression.type]
			}
			/**
			 * 将注释节点拼装成注释字符串
			 * @param {*} comments 
			 * @returns 
			 */
			function commentsToText(comments) {
				return comments.reduce((p, c) => {
					p = p ? `${p}\n${c.value}` : c.value
					return p
				}, '')
			}
			/**
			 * 当前节点是否只有换行符和空格组成的 VText
			 * @param {*} node 
			 * @returns 
			 */
			function isEmptyVText(node) {
				return node.type === 'VText' && /^[\n\s]*$/.test(node.value)
			}
			/**
			 * 获取 template 中的所有注释节点，template 所有注释节点都在 template 上
			 * @param {*} element 
			 * @returns 
			 */
			function getTemplateAllComments(element) {
				if (element.comments) return element.comments
				return getTemplateAllComments(element.parent)
			}
			/**
			 * 根据当前节点所在行和列以及上一级（父级或兄弟上级）的行和列来查找当前节点前的注释节点 
			 * @param {*} node 一个 template 节点，不是 startTag 节点
			 * @returns 
			 */
			function getTemplateCommentsBefore(node) {
				const comments = getTemplateAllComments(node)
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
			/**
			 * 获取 template 当前节点前的注释文本
			 * @param {*} node 
			 * @returns 
			 */
			function getTemplateCommentBefore(node) {
				const elementComments = getTemplateCommentsBefore(node)
				const elementComment = commentsToText(elementComments)
				return elementComment
			}
			/**
			 * 获取 template 的 attributes
			 * @param {*} attributeValue 
			 * @returns [valueName, valueType, vForLeft]
			 */
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

				// 表达式直接返回文本、绑定filter
				if (['MemberExpression', 'VFilterSequenceExpression'].includes(attributeValue.expression.type)) {
					return [sourceCode.getText(attributeValue.expression), attributeValue.expression.type]
				}

				// 绑定值是slot-scope
				if (attributeValue.expression.type === 'VSlotScopeExpression') {
					return [attributeValue.parent.key.name.name, attributeValue.expression.type, attributeValue.expression.params.map(p => p.name)]
				}

				// 其他，不支持
				// 例如：:a="'1'"
				return [undefined, attributeValue.expression.type]
			}
			/**
			 * 添加 templateInfo 信息到 templateMap 中
			 * @param {*} node 
			 * @param {*} templateInfo 
			 * @param {*} templateMap 
			 */
			function addTemplateMap(node, templateInfo, templateMap) {
				const parent = node.parent
				const parentInfo = templateMap.get(parent)
				if (parentInfo) {
					parentInfo.children.push(templateInfo)
				}
				templateMap.set(node, templateInfo)
			}

			const templateMap = new Map()

			// ——————————————————————————————————————————————————————————————

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
			/**
			 * 从 propOption 的参数和 ts 类型来获取 default、type、required
			 * @param {*} propOption 
			 * @param {*} prop 
			 * @returns 
			 */
			function getPropOptionInfo(propOption, prop) {
				let propDefault, propType, propRequired
				// option 中的 prop 可以没有参数
				if (propOption) {
					// 通过prop配置项获取
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
				if (prop && prop.typeAnnotation) {
					if (!propType) {
						const typeAnnotation = prop.typeAnnotation.typeAnnotation
						// TODO: tsUtils 来源于 eslint-plugin-vue 中，但是官方没有提供 inferRuntimeType 供外部使用，所以拷贝了整个代码过来
						// tsUtils.inferRuntimeType 支持在本文件递归查找类型的实际定义，从而获取对应的运行时类型
						const runtimeType = tsUtils.inferRuntimeType(context, typeAnnotation)
						propType = runtimeType
					}
					if (propRequired === undefined) {
						propRequired = !prop.optional
					}
				}
				return [propDefault, propType, propRequired]
			}
			/**
			 * 从 utils.getComponentPropsFromOptions 返回的 props 中提取 propInfo
			 * @param {*} props 
			 * @returns 
			 */
			function getDefinePropsInfoMap(props) {
				const propMap = new Map()

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
					propMap.set(propName, propInfo)
				})
				return propMap
			}
			/**
			 * script setup 中 withDefaults(defineProps<Props>(), {}) 获取 propInfo
			 * @param {*} props 
			 * @param {*} withDefaultsArguments 
			 * @returns 
			 */
			function getWithDefaultsDefinePropsInfoMap(props, withDefaultsArguments) {
				const propMap = new Map()

				const propsDefaultNode = (withDefaultsArguments && withDefaultsArguments[1]) ? withDefaultsArguments[1].properties : []

				props.forEach(prop => {
					const propName = prop.propName

					const propDefaultNode = propsDefaultNode.find(p => p.key.name === propName)
					const propDefault = propDefaultNode ? sourceCode.getText(propDefaultNode.value) : undefined

					const propType = prop.types
					const propRequired = prop.required

					const typeComments = sourceCode.getCommentsBefore(prop.key)
					const defaultComments = propDefaultNode ? sourceCode.getCommentsBefore(propDefaultNode) : []
					const propComment = commentsToText([...typeComments, ...defaultComments])

					const propInfo = {
						propName,
						propDefault,
						propType,
						propRequired,
						propComment
					}
					propMap.set(propName, propInfo)
				})
				return propMap
			}

			let propMap = new Map()


			// ——————————————————————————————————————————————————————————————

			// setup中的变量定义不需要添加setupMap中的项
			// 1.没有初始化的变量
			// 2.初始化是函数调用，函数名为特定项
			// 3.初始化是常量
			function initUnAddSetupMap(init) {
				return !init
					|| (
						init
						&& (
							(init.type === 'CallExpression' && ['defineEmits', 'defineProps', 'useContext'].includes(init.callee.name))
							|| init.type === 'Literal'
						)
					)
			}
			// 获取 id 对应的 init
			function getIdInit(init, idIndex) {
				if (idIndex !== undefined) {
					if (init.type === 'ObjectExpression') return init.properties[idIndex]
					if (init.type === 'ArrayExpression') return init.elements[idIndex]
				}
				return init
			}
			// 从变量定义中添加 setupMap,支持 const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
			function addSetupMapFromDeclarations(declarations, setupMap, isRecursion) {
				const needAddSetupMapDeclarations = declarations.filter(d => {
					return !initUnAddSetupMap(d.init)
				})
				// 遍历允许添加到 setupMap 的变量定义
				// declarations:例如：const provideData = ref(""); => provideData = ref("")
				needAddSetupMapDeclarations.forEach(declarations => {
					const id = declarations.id
					const init = declarations.init
					// 当变量的左边是常量时
					// 例如：dataG = ref("") => dataG 的 id.type === 'Identifier'
					if (id.type === 'Identifier') {
						const setupName = id.name
						let variableDeclarationComments = []
						if (!isRecursion) {
							const variableDeclarationNode = declarations.parent
							variableDeclarationComments = sourceCode.getCommentsBefore(variableDeclarationNode)
						}
						const idComments = sourceCode.getCommentsBefore(id)
						const setupComment = commentsToText([...variableDeclarationComments, ...idComments])
						const setupInfo = {
							setupName,
							setupComment
						}
						setupMap.set(setupName, setupInfo)
					}
					// 当变量的左边是数组或对象时
					// 例如：const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
					if (['ObjectPattern', 'ArrayPattern'].includes(id.type)) {
						const objectIds = id.type === 'ArrayPattern' ? id.elements : id.properties
						const childrenDeclarations = []
						objectIds.forEach((objectId, index) => {
							const idInit = getIdInit(init, index)
							if (!initUnAddSetupMap(idInit)) {
								const objectIdKey = id.type === 'ArrayPattern' ? objectId : objectId.value
								// 如果左边 id 是常量
								if (objectIdKey.type === 'Identifier') {
									const setupName = objectIdKey.name
									const setupComments = sourceCode.getCommentsBefore(objectIdKey)
									const setupComment = commentsToText(setupComments)
									const setupInfo = {
										setupName,
										setupComment
									}
									setupMap.set(setupName, setupInfo)
								}
								// 如果不是常量，例如 const[[a]]=[[1]] 左边是 [a]
								if (['ObjectPattern', 'ArrayPattern'].includes(objectIdKey.type)) {
									childrenDeclarations.push({
										id: objectIdKey,
										init: idInit
									})
								}
							}
						})
						if (childrenDeclarations.length) {
							addSetupMapFromDeclarations(childrenDeclarations, setupMap, true)
						}
					}
				})
			}

			let setupMap = new Map()

			// ——————————————————————————————————————————————————————————————

			// 生命周期
			const lifecycleHookMap = new Map()

			// ——————————————————————————————————————————————————————————————

			// 当 defineEmits 参数是对像时获取 value 的类型
			function getObjectEmitValueType(value) {
				const valueType = value.type
				if (['FunctionExpression'].includes(valueType)) return [sourceCode.getText(value.parent)]
				if ('ArrowFunctionExpression' === valueType) return [sourceCode.getText(value)]
				if (valueType === 'Identifier') return [value.name]
				if (valueType === 'ArrayExpression') return value.elements.map(element => getObjectEmitValueType(element)[0])
			}
			// 获取 emit 抛出参数的运行时类型
			function getEmitTypes(emit) {
				const emitType = emit.type
				if (emitType === 'array') return undefined
				if (emitType === 'object') {
					return getObjectEmitValueType(emit.value)
				}
				if (emitType === 'type') {
					const value = emit.node.params[1]
					if (value) return tsUtils.inferRuntimeType(context, value.typeAnnotation.typeAnnotation)
				}
			}

			const emitMap = new Map()

			// ——————————————————————————————————————————————————————————————

			const dataMap = new Map()

			// ——————————————————————————————————————————————————————————————

			const computedMap = new Map()

			// ——————————————————————————————————————————————————————————————

			const methodMap = new Map()

			// ——————————————————————————————————————————————————————————————

			const provideMap = new Map()

			// ——————————————————————————————————————————————————————————————

			function getInjectFrom(inject) {
				const decorator = inject.decorators[0]
				const argument = decorator.expression.arguments[0]
				if (argument === undefined) return inject.key.name
				if (argument.type === 'Literal') return argument.raw
				if (argument.type === 'ObjectExpression') {
					const from = argument.properties.find(p => p.key.name === 'from')
					return from.value.raw
				}
			}
			const injectMap = new Map()

			// ——————————————————————————————————————————————————————————————

			// function getDataInfo(dataBody) {
			// 	const dataSet = new Set()
			// 	dataBody.forEach(data => {
			// 		const dataName = data.key.name
			// 		const retDataComments = sourceCode.getCommentsBefore(data.key)

			// 		const variable = utils.findVariableByIdentifier(context, data.value.type === 'CallExpression' ? data.value.callee : data.value)

			// 		let defNodeComments = []
			// 		if (variable) {
			// 			const def = variable.defs[0]
			// 			const defNode = def.node.type === 'VariableDeclarator' ? def.node.parent : def.node
			// 			defNodeComments = sourceCode.getCommentsBefore(defNode)
			// 		}
			// 		const dataComment = commentsToText([...retDataComments, ...defNodeComments])
			// 		const dataInfo = {
			// 			dataName,
			// 			dataComment
			// 		}
			// 		dataSet.add(dataInfo)
			// 	})
			// 	return dataSet
			// }
			// const ScriptSetupDataFunNames = ['ref', 'reactive', 'toRef', 'toRefs', 'readonly', 'shallowRef', 'shallowReactive']
			// function getComputedComments(computedNode, computedType) {
			// 	const computedComments = sourceCode.getCommentsBefore(computedNode)
			// 	if (computedComments.length) {
			// 		computedComments.unshift({ value: `${computedType}:` })
			// 	}
			// 	return computedComments
			// }

			// let computedMap = new Map()


			return utils.compositingVisitors(
				utils.defineTemplateBodyVisitor(
					context,
					{
						// 标签
						VElement(element) {
							const templateValue = element.rawName
							const attributes = element.startTag.attributes.map(a => {
								const name = sourceCode.getText(a.key)
								const [valueName, valueType, scopeNames] = getAttributesValue(a.value)
								return {
									name,
									valueName,
									valueType,
									scopeNames
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
							addTemplateMap(element, templateInfo, templateMap)
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
							addTemplateMap(node, templateInfo, templateMap)
						},
						// 标签内{{ }}
						'VElement>VExpressionContainer'(node) {
							const [templateName, templateType] = getVExpressionContainerNameAndType(node)
							const templateInfo = {
								templateName,
								templateType,
								attributes: undefined,
								templateComment: getTemplateCommentBefore(node),
								children: undefined
							}
							addTemplateMap(node, templateInfo, templateMap)
						}
					},

					// script 解析

					// TODO:所有的 装饰器参数、prop option 必须是字面量对象
					{
						// class component
						// 以下为Prop相关装饰器
						// class component @Prop
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Prop]'(node) {
							const decoratorArgument = node.expression.arguments
							const prop = node.parent

							const propName = prop.key.name
							const propOption = decoratorArgument[0]

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
							propMap.set(propName, propInfo)
						},
						// class component @PropSync
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=PropSync]'(node) {
							// prop
							const decoratorArgument = node.expression.arguments
							const computed = node.parent

							const propName = decoratorArgument[0].value
							const propOption = decoratorArgument[1]

							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, computed)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const computedComments = sourceCode.getCommentsAfter(node)
							const propComment = commentsToText([...decoratorComments, ...computedComments])

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propMap.set(propName, propInfo)

							// TODO：计算属性和emit事件 update:propName
							// computed
							// @PropSync装饰的计算属性创建了一个 prop，这个计算属性直接返回这个 prop，所以他们的注释是通用的
							// const computedComment = `all:\n${propComment}`
							// const computedName = computed.key.name
							// const computedInfo = {
							// 	computedName,
							// 	computedComment
							// }
							// computedMap.set(computedName, computedInfo)
						},
						// class component @Model
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Model]'(node) {
							const decoratorArgument = node.expression.arguments
							const prop = node.parent

							const propName = prop.key.name
							const propOption = decoratorArgument[1]

							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, prop)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propComments = sourceCode.getCommentsAfter(node)
							const propComment = commentsToText([...decoratorComments, ...propComments])

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propMap.set(propName, propInfo)

							// TODO: 需要获取 model 配置项
						},
						// class component @ModelSync
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=ModelSync]'(node) {
							// prop
							const computed = node.parent
							const decoratorArgument = node.expression.arguments

							const propName = decoratorArgument[0].value
							const propOption = decoratorArgument[2]

							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, computed)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propComments = sourceCode.getCommentsBefore(decoratorArgument[0])
							const computedComments = sourceCode.getCommentsAfter(node)
							const propComment = commentsToText([...decoratorComments, ...propComments, ...computedComments])

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propMap.set(propName, propInfo)

							// TODO: 计算属性、model配置、emit change
							// computed
							// const computedComments = sourceCode.getCommentsAfter(node)
							// let computedComment = commentsToText(computedComments)
							// computedComment = `all:\n${computedComment}`
							// const computedName = node.parent.key.name
							// const computedInfo = {
							// 	computedName,
							// 	computedComment
							// }
							// computedMap.set(computedName, computedInfo)
						},
						// class component @VModel
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=VModel]'(node) {
							const computed = node.parent
							const decoratorArgument = node.expression.arguments

							const propName = 'value'
							const propOption = decoratorArgument[0]

							const [propDefault, propType, propRequired] = getPropOptionInfo(propOption, computed)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const computedComments = sourceCode.getCommentsAfter(node)
							const propComment = commentsToText([...decoratorComments, ...computedComments])

							const propInfo = {
								propName,
								propDefault,
								propType,
								propRequired,
								propComment
							}
							propMap.set(propName, propInfo)

							// TODO:emit this.$emit('input', value)
						},
						// 属性定义 dataA = "1"
						'ClassDeclaration > ClassBody > PropertyDefinition[decorators=undefined]'(node) {
							const dataName = node.key.name
							const dataComments = sourceCode.getCommentsBefore(node)
							const dataComment = commentsToText(dataComments)
							const dataInfo = {
								setupName: dataName,
								setupComment: dataComment
							}
							dataMap.set(dataName, dataInfo)
						},
						// 方法定义，包括计算属性和方法
						'ClassDeclaration > ClassBody > MethodDefinition'(node) {
							const kind = node.kind
							// 计算属性 get computedA() {}
							if (['get', 'set'].includes(kind)) {
								const computedName = node.key.name
								const computedComments = sourceCode.getCommentsBefore(node)
								const computedComment = commentsToText(computedComments)
								const oldComputed = computedMap.get(computedName)
								if (oldComputed) {
									oldComputed.computedComment = `${oldComputed.computedComment}\n\n${kind}:${computedComment}`
								} else {
									const computedInfo = {
										computedName,
										computedComment: `${kind}:${computedComment}`
									}
									computedMap.set(computedName, computedInfo)
								}
							}
							// 方法 methodA() {}
							if (kind === 'method') {
								const methodName = node.key.name
								const methodComments = sourceCode.getCommentsBefore(node)
								const methodComment = commentsToText(methodComments)
								const methodInfo = {
									methodName,
									methodComment
								}
								methodMap.set(methodName, methodInfo)
							}
						},
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Provide]'(node) {
							const provide = node.parent
							// TODO: setupComponent 的 provide 要看看怎么处理
							// provide
							const provideName = node.expression.arguments.length ? node.expression.arguments[0].value : provide.key.name
							const decoratorComments = sourceCode.getCommentsBefore(node)
							const dataComments = sourceCode.getCommentsAfter(node)
							const provideComment = commentsToText([...decoratorComments, ...dataComments])
							const provideInfo = {
								provideName,
								provideComment
							}
							provideMap.set(provideName, provideInfo)

							// data
							const dataName = provide.key.name
							const dataComment = commentsToText(dataComments)
							const dataInfo = {
								dataName,
								dataComment
							}
							dataMap.set(dataName, dataInfo)
						},
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Inject]'(node) {
							const inject = node.parent
							const injectName = inject.key.name
							const injectFrom = getInjectFrom(inject)
							debugger
						},

						// option component
						// 可以在一个Vue组件 option 上执行一个回调函数
						...utils.executeOnVueComponent(context, (optionNode) => {
							// props
							// TODO: utils.getComponentPropsFromOptions(optionNode) 只能获取 props 中的字面量
							// TODO: utils.getComponentPropsFromOptions(optionNode) 返回中包含 PropType 指向的具体类型，目前只获取运行时类型，不获取ts类型
							const props = utils.getComponentPropsFromOptions(optionNode).filter(p => p.propName)
							propMap = new Map([...propMap, ...getDefinePropsInfoMap(props)])

							// datas
							// const datas = utils.findProperty(optionNode, 'data')
							// if (datas.value.type === 'FunctionExpression') {
							// 	const funBody = datas.value.body.body
							// 	const returnStatement = funBody.find(b => b.type === 'ReturnStatement')
							// 	if (returnStatement) {
							// 		const returnBody = returnStatement.argument.properties
							// 		if (returnBody) {
							// 			dataSet = getDataInfo(returnBody)
							// 		}
							// 	}
							// }
							// if (datas.value.type === 'ObjectExpression') {
							// 	const dataBody = datas.value.properties
							// 	dataSet = getDataInfo(dataBody)
							// }
						}),

						// script setup 中
						...utils.defineScriptSetupVisitor(context, {
							// prop
							onDefinePropsEnter(node, props) {
								// 目前 defineProps 在 script setup 中只能使用一次，onDefinePropsEnter 只会获取第一个 defineProps，下面的方法兼容defineProps 被多次使用时
								// TODO: 这里的 props 包含了类型，但是现在只提取运行时
								let withDefaultsDefineProps = []
								let defineProps = []
								props.forEach(prop => {
									if (prop.type === 'type') withDefaultsDefineProps.push(prop)
									else defineProps.push(prop)
								})
								const otherPropMap = getDefinePropsInfoMap(defineProps)
								const withDefaultsPropMap = getWithDefaultsDefinePropsInfoMap(withDefaultsDefineProps, node.parent.arguments)

								propMap = new Map([...propMap, ...otherPropMap, ...withDefaultsPropMap])
							},
							// 变量定义，包括 data\computed\inject\methods 表现为 const dataA = ref('')
							'Program>VariableDeclaration'(node) {
								// 过滤掉没有初始化和初始化不允许添加进setupMap的变量定义，针对 let dataF,dataG=ref('')
								const declarations = node.declarations
								addSetupMapFromDeclarations(declarations, setupMap)
							},
							// 函数定义 methods，表现为 function methodA(){}
							'Program>FunctionDeclaration'(node) {
								const setupName = node.id.name
								const setupComments = sourceCode.getCommentsBefore(node)
								const setupComment = commentsToText(setupComments)
								const setupInfo = {
									setupName,
									setupComment
								}
								setupMap.set(setupName, setupInfo)
							},
							// 生命周期，表现为 onMounted(()=>{})
							'Program CallExpression'(node) {
								const LIFECYCLE_HOOKS = [
									'onBeforeMount',
									'onBeforeUnmount',
									'onBeforeUpdate',
									'onErrorCaptured',
									'onMounted',
									'onRenderTracked',
									'onRenderTriggered',
									'onUnmounted',
									'onUpdated',
									'onActivated',
									'onDeactivated'
								]
								const lifecycleHookName = node.callee.name
								if (LIFECYCLE_HOOKS.includes(lifecycleHookName)) {
									const lifecycleHookComments = sourceCode.getCommentsBefore(node)
									const lifecycleHookComment = commentsToText(lifecycleHookComments)
									const oldLifecycleHook = lifecycleHookMap.get(lifecycleHookName)
									if ((lifecycleHookComment && oldLifecycleHook)) {
										oldLifecycleHook.lifecycleHookComment = `${oldLifecycleHook.lifecycleHookComment}\n\n${lifecycleHookComment}`
									} else {
										const lifecycleHookInfo = {
											lifecycleHookName,
											lifecycleHookComment
										}
										lifecycleHookMap.set(lifecycleHookName, lifecycleHookInfo)
									}
								}
							},
							// emit
							onDefineEmitsEnter(node, emits) {
								emits.forEach(emit => {
									const emitName = emit.emitName
									const emitType = getEmitTypes(emit)
									const emitComments = sourceCode.getCommentsBefore(emit.node)
									const emitComment = commentsToText(emitComments)
									const emitInfo = {
										emitName,
										emitType,
										emitComment
									}
									emitMap.set(emitName, emitInfo)
								})
							}
						}),

						// class component data
						// TODO:PropertyDefinition 表示对象字面量中的属性定义的AST节点。它有一个key属性，用来表示属性的键，一个value属性，用来表示属性的值，一个computed属性，用来表示键是否是计算属性，一个kind属性，用来表示属性的种类（init, get或set），一个method属性，用来表示属性是否是方法，和一个shorthand属性，用来表示属性是否是简写形式
						// 'ClassBody > PropertyDefinition:not([decorators])'(node) {
						// 	const dataName = node.key.name
						// 	const dataComments = sourceCode.getCommentsBefore(node)
						// 	const dataComment = commentsToText(dataComments)
						// 	const dataInfo = {
						// 		dataName,
						// 		dataComment
						// 	}
						// 	dataSet.add(dataInfo)
						// },
						// // class component computed
						// 'ClassBody > MethodDefinition[kind]'(node) {
						// 	const computedName = node.key.name
						// 	const computedComments = sourceCode.getCommentsBefore(node)
						// 	const computedComment = `${node.kind}:${commentsToText(computedComments)}`
						// 	let computedInfo = computedMap.get(computedName)
						// 	if (computedInfo) {
						// 		if (computedComment) {
						// 			computedInfo.computedComment = `${computedInfo.computedComment}\n${computedComment}`
						// 		}
						// 	} else {
						// 		computedInfo = {
						// 			computedName,
						// 			computedComment
						// 		}
						// 	}
						// 	computedMap.set(computedName, computedInfo)
						// },

						// ...utils.defineVueVisitor(context, {
						// 	onVueObjectEnter(node) {
						// 		// option component computed
						// 		const computeds = utils.getComputedProperties(node)
						// 		computeds.forEach(computed => {
						// 			const computedName = computed.key
						// 			const computedGetNode = computed.value.parent.parent
						// 			const computedCommentMap = new Map()
						// 			computedCommentMap.set('get', getComputedComments(computedGetNode, 'get'))
						// 			if (computedGetNode.parent.parent.key.name === computedName) {
						// 				computedCommentMap.set('all', getComputedComments(computedGetNode.parent.parent, 'all'))
						// 				const properties = computedGetNode.parent.properties
						// 				const computedSetNode = properties.find(p => p.key.name === 'set')
						// 				if (computedSetNode) {
						// 					computedCommentMap.set('set', getComputedComments(computedSetNode, 'set'))
						// 				}
						// 			}
						// 			const computedComments = [
						// 				commentsToText(computedCommentMap.get('all') || []),
						// 				commentsToText(computedCommentMap.get('get') || []),
						// 				commentsToText(computedCommentMap.get('set') || [])
						// 			].filter(c => c)
						// 			const computedComment = computedComments.reduce((p, c) => {
						// 				p = p ? `${p}\n\n${c}` : c
						// 				return p
						// 			}, '')
						// 			const computedInfo = {
						// 				computedName,
						// 				computedComment
						// 			}
						// 			computedMap.set(computedName, computedInfo)
						// 		})
						// 	},
						// }),

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
