/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
const casing = require('eslint-plugin-vue/lib/utils/casing')
const tsUtils = require('./utils/ts-ast-utils')
const { findVariable } = require('eslint-utils')

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
let sourceMetaMap
linter.defineRule("my-rule", {
	create(context) {
		const sourceCode = context.getSourceCode()

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

		function vTextGetTemplateValue(nodeValue) {
			return nodeValue.replace(/[\n\s]/g, '')
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
		 * 获取 template 当前节点前的注释文本，空白的换行节点会被跳过，例如OptionsComponent种VText的上一行
		 * @param {*} node 
		 * @returns 
		 */
		function getTemplateCommentBefore(node) {
			const elementComments = getTemplateCommentsBefore(node)
			const elementComment = commentsToText(elementComments)
			return elementComment
		}
		// 遍历解构对象，支持数组和对象结构对象，传入最终解构的键值对，例如：{a:[b],c:{d:e}} 最终 callBack接收到 b \ d:e
		function forEachPattern(pattern, callBack) {
			pattern.forEach(p => {
				const patternItemValue = p.value
				if (patternItemValue) {
					// 遍历的当前项是对象
					if (patternItemValue.type === 'Identifier') {
						callBack(p)
					}
					if (patternItemValue.type === 'ArrayPattern') {
						forEachPattern(patternItemValue.elements, callBack)
					}
					if (patternItemValue.type === "ObjectPattern") {
						forEachPattern(patternItemValue.properties, callBack)
					}
				} else {
					// 遍历的当前项是数组或变量
					if (p.type === 'Identifier') {
						callBack(p)
					}
					if ('ArrayPattern' === p.type) {
						forEachPattern(p.elements, callBack)
					}
					if (p.type === "ObjectPattern") {
						forEachPattern(p.properties, callBack)
					}
				}
			})
		}
		// 获取所有解构语法的最终变量名，例如：{a:[b],c:{d:e}} 最终返回 [b,e]
		function getPatternNames(expression) {
			const scopeName = []
			forEachPattern(expression, (item) => {
				if (item.type === 'Identifier') {
					scopeName.push(item.name)
				} else {
					scopeName.push(item.value.name)
				}
			})
			return scopeName
		}
		/**
		 * 获取函数调用的函数名和参数
		 * 支持连续调用，不支持多个参数
		 * 不支持多参数 :style="c(d(a.b), a)"，支持 c(d(a.b))=>[a.b,[c,d]]
		 * @param {*} callExpression 
		 * @param {*} names 
		 */
		function getCallExpressionNamesAndParam(callExpression, names = []) {
			const funName = callExpression.callee.name
			const params = callExpression.arguments
			names.push(funName)
			if (params && params.length === 1) {
				const param = params[0]
				if (param.type === 'CallExpression') {
					return getCallExpressionNamesAndParam(param, names)
				} else {
					const callParam = param.type === 'MemberExpression' ? sourceCode.getText(param) : undefined
					return [callParam, names]
				}
			} else {
				return [undefined, names]
			}
		}
		/**
		 * 获取绑定值的信息
		 * @param {*} expression 
		 * @returns [valueName, valueType,scopeName, callNames]
		 */
		function getExpressionInfo(expression) {
			// 只有属性没有值时，例如 v-else
			if (!expression) return []

			// 没有绑定，直接是赋值常量，数值、字符串、布尔值，[常量文本,'VLiteral']
			if (expression.type === 'VLiteral') return [expression.value, expression.type]

			// 绑定指是常量
			if (expression.expression.type === 'Literal') {
				return [expression.expression.raw, expression.expression.type]
			}

			// 绑定值是变量（函数或变量），[变量名(不带引号),'Identifier']
			if (expression.expression.type === 'Identifier') return [expression.expression.name, expression.expression.type]

			// 表达式(e.a)直接返回文本
			if (['MemberExpression'].includes(expression.expression.type)) {
				return [sourceCode.getText(expression.expression), expression.expression.type]
			}

			// 绑定值是函数调用,[函数名,'CallExpression']
			// 函数调用可以层层嵌套的，这里不支持嵌套，只读取第一层的函数名
			// 不支持 :style="c(d(a.b), a)"，:style="c()"
			// 支持 c(d(a.b))
			if (expression.expression.type === 'CallExpression') {
				const [valueName, callNames] = getCallExpressionNamesAndParam(expression.expression)
				return [valueName, expression.expression.type, undefined, callNames]
			}

			// filter filter的顺序做了颠倒和函数一致符合它的调用顺序
			if ('VFilterSequenceExpression' === expression.expression.type) {
				const callNames = expression.expression.filters.map(f => f.callee.name).reverse()
				const valueName = expression.expression.expression.name
				return [valueName, expression.expression.type, undefined, callNames]
			}

			// 绑定值是v-for的值，[遍历的对象，'VForExpression'，遍历的项名[]]
			// 遍历的对象只支持变量
			// 遍历的项名[]，例如 (val, name, index) in object => [val,name,index]
			if (expression.expression.type === 'VForExpression') {
				return [expression.expression.right.type === 'Identifier' ? expression.expression.right.name : undefined, expression.expression.type, getPatternNames(expression.expression.left)]
			}

			// 绑定值是slot-scope或v-slot
			if (expression.expression.type === 'VSlotScopeExpression') {
				const scopeNames = getPatternNames(expression.expression.params)
				return [expression.parent.key.name.name, expression.expression.type, scopeNames]
			}

			// 其他，不支持
			// 例如：:a="'1'"，:class1="{ a }"
			return [undefined, expression.expression.type]
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


		// {templateName,templateCallNames,templateType,attributes,templateComment,children}
		const templateMap = new Map()

		// ——————————————————————————————————————————————————————————————

		const slotSet = new Set()

		// ——————————————————————————————————————————————————————————————

		function getPropType(typeValue) {
			switch (typeValue.type) {
				case 'Identifier':
					return [typeValue.name]
				case 'ArrayExpression':
					return typeValue.elements.map(e => e.name)
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
		function getPropInfoFromOption(propOption, prop) {
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
					// FIXME: tsUtils 来源于 eslint-plugin-vue 中，但是官方没有提供 inferRuntimeType 供外部使用，所以拷贝了整个代码过来
					// tsUtils.inferRuntimeType 支持在本文件递归查找类型的实际定义，从而获取对应的运行时类型
					propType = tsUtils.inferRuntimeType(context, typeAnnotation)
				}
				if (propRequired === undefined) {
					propRequired = !prop.optional
				}
			}
			return [propDefault, propType, propRequired]
		}
		/**
		 * 从 utils.getComponentPropsFromOptions 返回的 props 中提取 propInfo
		 * @param {*} propList 
		 * @returns 
		 */
		function getPropMapFromPropList(propList) {
			const propMap = new Map()

			propList.forEach(propOption => {
				const propName = propOption.propName
				const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption.value)
				const propComments = sourceCode.getCommentsBefore(propOption.key)
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
		 * @param {*} withDefaultsParams 
		 * @returns 
		 */
		function getPropMapFromTypePropList(props, withDefaultsParams) {
			const propMap = new Map()

			const propDefaultNodes = (withDefaultsParams && withDefaultsParams[1]) ? withDefaultsParams[1].properties : []

			props.forEach(prop => {
				const propName = prop.propName

				const propDefaultNode = propDefaultNodes.find(p => p.key.name === propName)
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
		// 遍历变量定义
		function forEachDeclarations(declarations, callBack) {
			declarations.forEach(declaration => {
				const left = declaration.id
				// 当变量的左边是常量时
				// 例如：dataG = ref("") => dataG 的 id.type === 'Identifier'
				if (left.type === 'Identifier') {
					const leftName = left.name
					const leftComments = sourceCode.getCommentsBefore(left)
					const leftComment = commentsToText(leftComments)
					callBack(leftName, leftComment)
				}
				// 当变量的左边是数组解构或对象解构时
				// 例如：const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
				if (['ObjectPattern', 'ArrayPattern'].includes(left.type)) {
					forEachPattern([left], (patternItem) => {
						const itemValue = patternItem.value || patternItem
						const itemName = itemValue.name
						// const [dataD, dataE] = [ref("")]; 和 const {a}={a:1} => dataD,dataE,a
						const itemComments = sourceCode.getCommentsBefore(itemValue)
						const itemComment = commentsToText(itemComments)
						callBack(itemName, itemComment)
					})
				}
			})
		}
		// 从变量定义中添加 setupMap,支持 const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
		function addSetupMapFromDeclarations(declarations, setupMap) {
			const needAddSetupMapDeclarations = declarations.filter(d => {
				return !initUnAddSetupMap(d.init)
			})
			// 遍历允许添加到 setupMap 的变量定义
			// declarations:例如：const provideData = ref(""); => provideData = ref("")
			forEachDeclarations(needAddSetupMapDeclarations, (setupName, setupComment) => {
				const setupInfo = {
					setupName,
					setupComment
				}
				setupMap.set(setupName, setupInfo)
			})
		}
		// {setupName,setupComment}
		let setupMap = new Map()

		// ——————————————————————————————————————————————————————————————

		// 生命周期
		// {lifecycleHookName,lifecycleHookComment}
		// lifecycleHookName在setup中带on，在options、class中不带，
		// 生命周期
		const LIFECYCLE_HOOKS = [
			'beforeCreate',
			'created',
			'beforeMount',
			'mounted',
			'beforeUpdate',
			'updated',
			'activated',
			'deactivated',
			'beforeUnmount', // for Vue.js 3.x
			'unmounted', // for Vue.js 3.x
			'beforeDestroy',
			'destroyed',
			'renderTracked', // for Vue.js 3.x
			'renderTriggered', // for Vue.js 3.x
			'errorCaptured' // for Vue.js 2.5.0+
		]
		const lifecycleHookMap = new Map()

		// ——————————————————————————————————————————————————————————————

		// filters
		const filterMap = new Map()

		// ——————————————————————————————————————————————————————————————

		// 当 defineEmits 参数是对像时获取 value 的类型
		function getEmitTypeFromObjectParamValue(paramValue) {
			const paramValueType = paramValue.type

			if (paramValueType === 'ArrayExpression') return [paramValue.elements.map(element => getEmitTypeFromObjectParamValue(element)[0])]

			if (['FunctionExpression'].includes(paramValueType)) return [sourceCode.getText(paramValue.parent)]

			// ArrowFunctionExpression 箭头函数
			if ('ArrowFunctionExpression' === paramValueType) return [sourceCode.getText(paramValue)]

			if (paramValueType === 'Identifier') return [paramValue.name]
		}
		// 获取 emit 抛出参数的运行时类型
		function getEmitType(emit) {
			const defineEmitsParamType = emit.type
			// defineEmits参数是数组
			if (defineEmitsParamType === 'array') return undefined
			// 参数是对象
			if (defineEmitsParamType === 'object') {
				return getEmitTypeFromObjectParamValue(emit.value)
			}
			// 类型
			if (defineEmitsParamType === 'type') {
				const typeFunParams = emit.node.params.slice(1)
				if (typeFunParams) return typeFunParams.reduce((p, param) => {
					const type = tsUtils.inferRuntimeType(context, param.typeAnnotation.typeAnnotation)
					p.push(type)
					return p
				}, [])
			}
		}

		function setEmitMap(emitMap, emitName, emitType, emitComment) {
			const oldEmit = emitMap.get(emitName)
			if (oldEmit) {
				oldEmit.emitComment = `${oldEmit.emitComment}\n\n${emitComment}`
				const oldEmitType = oldEmit.emitType
				emitType && emitType.forEach((type, index) => {
					if (type) oldEmitType[index] = type
				})
			} else {
				const emitInfo = {
					emitName,
					emitType,
					emitComment
				}
				emitMap.set(emitName, emitInfo)
			}
		}
		function getRuntimeType(node) {
			if (node.typeAnnotation) {
				return tsUtils.inferRuntimeType(context, node.typeAnnotation)
			}
			if (['ObjectExpression'].includes(node.type)) return 'Object'
			if (['ArrayExpression'].includes(node.type)) return 'Array'
			if (['FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) return 'Function'
			if (node.type === 'Literal') return node.raw
			if (node.type === 'MemberExpression') return sourceCode.getText(node)
			if (node.type === 'Identifier') return node.name
			return undefined
		}
		// {emitName,emitType,emitComment}
		const emitMap = new Map()

		// ——————————————————————————————————————————————————————————————
		function forEachDataOptionSetDataMap(dataOptions, dataMap) {
			dataOptions.forEach(dataOption => {
				const dataName = dataOption.key.name
				const dataComments = sourceCode.getCommentsBefore(dataOption)
				const dataComment = commentsToText(dataComments)
				const dataInfo = {
					dataName,
					dataComment
				}
				dataMap.set(dataName, dataInfo)
			})
		}
		// {dataName,dataComment}
		const dataMap = new Map()

		// ——————————————————————————————————————————————————————————————
		function setComputedMap(computedMap, computedName, computedComment) {
			const oldComputed = computedMap.get(computedName)
			if (oldComputed) {
				oldComputed.computedComment = `${oldComputed.computedComment}\n\n${computedComment}`
			} else {
				const computedInfo = {
					computedName,
					computedComment
				}
				computedMap.set(computedName, computedInfo)
			}
		}
		const computedMap = new Map()

		// ——————————————————————————————————————————————————————————————

		// {methodName,methodComment}
		const methodMap = new Map()

		// ——————————————————————————————————————————————————————————————


		// 遍历options中provide的对象添加provideMap
		function forEachProvideOptionSetProvideMap(properties, provideMap) {
			return properties.forEach(provide => {
				let provideName = provide.key.name
				// 如果对象中的key是[变量]的形式
				if (provide.computed) {
					provideName = `[${provideName}]`
				}
				const provideFromKey = sourceCode.getText(provide.value)
				const provideComments = sourceCode.getCommentsBefore(provide)
				const provideComment = commentsToText(provideComments)
				const provideInfo = {
					provideName,
					provideFromKey,
					provideComment
				}
				provideMap.set(provideName, provideInfo)
			})
		}
		// info = {provideName,provideFromKey,provideComment}
		const provideMap = new Map()

		// ——————————————————————————————————————————————————————————————

		function getInjectFromAndDefaultFromInjectOption(injectOption, injectName) {
			if (injectOption === undefined) return [injectName, undefined]
			// 常量字符串
			if (injectOption.type === 'Literal') return [injectOption.raw, undefined]
			// 对象
			if (injectOption.type === 'ObjectExpression') {
				const ret = injectOption.properties.reduce((p, c) => {
					if (c.key.name === 'from') p[0] = c.value.raw
					if (c.key.name === 'default') p[1] = sourceCode.getText(c.value)
					return p
				}, [undefined, undefined])
				if (!ret[0]) ret = injectName
				return ret
			}
			// 变量名
			if (injectOption.type === 'Identifier') return [`[${injectOption.name}]`, undefined]
			return [undefined, undefined]
		}
		// {injectName,injectFrom,injectDefault,injectComment}
		const injectMap = new Map()

		// ——————————————————————————————————————————————————————————————

		const modelOption = {
			prop: 'value',
			event: 'input'
		}

		// ——————————————————————————————————————————————————————————————

		// {casing.kebabCase(key):value}
		const componentMap = new Map()

		// ——————————————————————————————————————————————————————————————

		// {importName,importPath}
		const importMap = new Map()

		// ——————————————————————————————————————————————————————————————

		// 
		let componentName = undefined



		// ——————————————————————————————————————————————————————————————

		let extend = undefined

		// ——————————————————————————————————————————————————————————————

		const mixinSet = new Set()

		// ——————————————————————————————————————————————————————————————

		// filter,components,name,mixins
		function setMapFromComponentCommonOption(optionKeyName, optionValue) {
			if (optionKeyName === 'mixins') {
				optionValue.elements.forEach(mixin => {
					const mixinName = mixin.name
					mixinSet.add(mixinName)
				})
			}

			if (optionKeyName === 'name') {
				componentName = optionValue.value
			}

			if (optionKeyName === 'components') {
				optionValue.properties.forEach(component => {
					if (component.type === 'Property') {
						const componentKey = casing.kebabCase(component.key.value || component.key.name)
						const componentValue = component.value.name
						componentMap.set(`"${componentKey}"`, componentValue)
					}
				})
			}

			// filters只能传对象
			if (optionKeyName === 'filters') {
				optionValue.properties.forEach(filter => {
					const filterName = filter.key.name
					const filterComments = sourceCode.getCommentsBefore(filter)
					const filterComment = commentsToText(filterComments)
					const filterInfo = {
						filterName,
						filterComment
					}
					filterMap.set(filterName, filterInfo)
				})
			}
		}



		return utils.compositingVisitors(
			utils.defineTemplateBodyVisitor(
				context,
				{
					// 标签
					VElement(element) {
						// 标签名
						const templateValue = casing.kebabCase(element.rawName)
						// 标签属性
						const attributes = element.startTag.attributes.map(a => {
							// FIXME: 支持动态绑定
							const name = sourceCode.getText(a.key)
							const [valueName, valueType, scopeNames, callNames] = getExpressionInfo(a.value)
							return {
								name,
								valueName,
								valueType,
								scopeNames,
								callNames
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
						if (templateValue === 'slot') {
							slotSet.add(templateInfo)
						}
						addTemplateMap(element, templateInfo, templateMap)
					},
					// 标签内文本
					'VElement>VText'(node) {
						if (isEmptyVText(node)) return
						const templateInfo = {
							templateValue: vTextGetTemplateValue(node.value),
							templateType: 'VText',
							attributes: undefined,
							templateComment: getTemplateCommentBefore(node),
							children: undefined
						}
						addTemplateMap(node, templateInfo, templateMap)
					},
					// 标签内{{ }}
					'VElement>VExpressionContainer'(node) {
						const [templateName, templateType, , templateCallNames] = getExpressionInfo(node)
						const templateInfo = {
							templateName,
							templateCallNames,
							templateType,
							attributes: undefined,
							templateComment: getTemplateCommentBefore(node),
							children: undefined
						}
						addTemplateMap(node, templateInfo, templateMap)
					}
				},
				// script 解析
				// FIXME:所有的 装饰器参数、prop option 必须是字面量对象
				{
					// class component
					// 以下为Prop相关装饰器
					// class component @Prop
					'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Prop]'(node) {
						const decoratorParams = node.expression.arguments
						const prop = node.parent

						const propName = prop.key.name
						const propOption = decoratorParams[0]

						const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption, prop)

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
						const decoratorParams = node.expression.arguments
						const computed = node.parent

						const propName = decoratorParams[0].value
						const propOption = decoratorParams[1]

						const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption, computed)

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

						// computed
						const computedComment = `all:${propComment}`
						const computedName = computed.key.name
						const computedInfo = {
							computedName,
							computedComment
						}
						computedMap.set(computedName, computedInfo)

						// emit 事件 update:propName
						const emitName = `"update:${propName}"`
						const emitInfo = {
							emitName,
							emitType: [propType],
							emitComment: propComment
						}
						emitMap.set(emitName, emitInfo)
					},
					// class component @Model
					'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Model]'(node) {
						const decoratorParams = node.expression.arguments
						const prop = node.parent

						const propName = prop.key.name
						const propOption = decoratorParams[1]

						const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption, prop)

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

						// modelOption
						const modelEvent = decoratorParams[0].value
						modelOption.event = modelEvent
						modelOption.prop = propName
					},
					// class component @ModelSync
					'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=ModelSync]'(node) {
						// prop
						const computed = node.parent
						const decoratorParams = node.expression.arguments

						const propName = decoratorParams[0].value
						const propOption = decoratorParams[2]

						const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption, computed)

						const decoratorComments = sourceCode.getCommentsBefore(node)
						const propComments = sourceCode.getCommentsBefore(decoratorParams[0])
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

						// modelOption
						modelOption.prop = propName
						const modelEvent = decoratorParams[1].value
						modelOption.event = modelEvent

						// computed
						const computedComment = `all:${propComment}`
						const computedName = computed.key.name
						const computedInfo = {
							computedName,
							computedComment
						}
						computedMap.set(computedName, computedInfo)

						// emit
						const emitInfo = {
							emitName: modelEvent,
							emitType: [propType],
							emitComment: propComment
						}
						emitMap.set(modelEvent, emitInfo)

					},
					// class component @VModel
					'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=VModel]'(node) {
						const computed = node.parent
						const decoratorParams = node.expression.arguments

						const propName = 'value'
						const propOption = decoratorParams[0]

						const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption, computed)

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

						// emit this.$emit('input', value)
						const emitName = 'input'
						const emitInfo = {
							emitName,
							emitType: [propType],
							emitComment: propComment
						}
						emitMap.set(emitName, emitInfo)
					},
					// 属性定义 dataA = "1"
					'ClassDeclaration > ClassBody > PropertyDefinition[decorators=undefined]'(node) {
						const dataName = node.key.name
						const dataComments = sourceCode.getCommentsBefore(node)
						const dataComment = commentsToText(dataComments)
						const dataInfo = {
							dataName,
							dataComment
						}
						dataMap.set(dataName, dataInfo)
					},
					// 方法定义，包括计算属性和方法
					'ClassDeclaration > ClassBody > MethodDefinition'(node) {
						// 有装饰器的不在这里处理
						if (node.decorators) return

						const kind = node.kind
						// 计算属性 get computedA() {}
						if (['get', 'set'].includes(kind)) {
							const computedName = node.key.name
							const computedComments = sourceCode.getCommentsBefore(node)
							const computedComment = `${kind}:${commentsToText(computedComments)}`
							setComputedMap(computedMap, computedName, computedComment)
						}
						if (kind === 'method') {
							const methodName = node.key.name
							const methodComments = sourceCode.getCommentsBefore(node)
							const methodComment = commentsToText(methodComments)
							if (LIFECYCLE_HOOKS.includes(methodName)) {
								// 生命周期
								const lifecycleHookInfo = {
									lifecycleHookName: methodName,
									lifecycleHookComment: methodComment
								}
								lifecycleHookMap.set(methodName, lifecycleHookInfo)
							} else {
								// 方法 methodA() {}

								const methodInfo = {
									methodName,
									methodComment
								}
								methodMap.set(methodName, methodInfo)

							}
						}
					},
					// @Provide/@ProvideReactive
					':matches(ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Provide],ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=ProvideReactive])'(node) {
						// provide
						const provide = node.parent

						const provideName = node.expression.arguments.length ? node.expression.arguments[0].value : provide.key.name
						const dataName = provide.key.name

						const decoratorComments = sourceCode.getCommentsBefore(node)
						const dataComments = sourceCode.getCommentsAfter(node)
						const provideComment = commentsToText([...decoratorComments, ...dataComments])

						const provideInfo = {
							provideName,
							provideFromKey: dataName,
							provideComment
						}
						provideMap.set(provideName, provideInfo)

						// data
						const dataComment = commentsToText(dataComments)

						const dataInfo = {
							dataName,
							dataComment
						}
						dataMap.set(dataName, dataInfo)
					},
					// @Inject/@InjectReactive
					':matches(ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Inject],ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=InjectReactive])'(node) {
						const inject = node.parent
						const injectName = inject.key.name
						const [injectFrom, injectDefault] = getInjectFromAndDefaultFromInjectOption(node.expression.arguments[0], injectName)
						const decoratorComments = sourceCode.getCommentsBefore(node)
						const injectComments = sourceCode.getCommentsAfter(node)
						const injectComment = commentsToText([...decoratorComments, ...injectComments])
						const injectInfo = {
							injectName,
							injectFrom,
							injectDefault,
							injectComment
						}
						injectMap.set(injectName, injectInfo)
					},
					// @Emit
					'ClassDeclaration > ClassBody > MethodDefinition > Decorator[expression.callee.name=Emit]'(node) {
						const decoratorParams = node.expression.arguments[0]
						const emitFun = node.parent
						const emitName = casing.kebabCase(decoratorParams ? decoratorParams.value : emitFun.key.name)
						const emitFunParams = emitFun.value.params

						const emitType = emitFunParams.map(e => {
							const typeAnnotation = e.typeAnnotation
							if (typeAnnotation) {
								const type = tsUtils.inferRuntimeType(context, typeAnnotation.typeAnnotation)
								return type
							}
							return [undefined]
						})
						const emitFunBody = emitFun.value.body.body
						// FIXME：无法获取函数 return 的推导类型，只先获取标注了具体类型
						const emitFunRet = emitFunBody.find(e => e.type === 'ReturnStatement')
						if (emitFunRet) {
							let type = [undefined]
							const emitFunRetParams = emitFunRet.argument
							if (emitFunRetParams.typeAnnotation) {
								type = tsUtils.inferRuntimeType(context, emitFunRet.argument.typeAnnotation)
							} else {
								if (emitFunRetParams.type === 'Literal') {
									type = [emitFunRetParams.raw]
								}
							}
							emitType.unshift(type)
						}
						const decoratorComments = sourceCode.getCommentsBefore(node)
						const emitComments = sourceCode.getCommentsAfter(node)
						const emitComment = commentsToText([...decoratorComments, ...emitComments])
						const emitInfo = {
							emitName,
							emitType,
							emitComment
						}
						emitMap.set(`"${emitName}"`, emitInfo)
					},
					// class组件@component得参数,
					'Decorator[expression.callee.name=Component]'(node) {
						if (node.expression.type === 'CallExpression') {
							const componentOption = node.expression.arguments[0]
							if (componentOption) {
								componentOption.properties.forEach(p => {
									const optionKeyName = p.key.name
									const optionValue = p.value
									setMapFromComponentCommonOption(optionKeyName, optionValue)
								})
							}
						}
					},
					// export default class HomeView extends SuperClass {}
					'ClassDeclaration'(node) {
						if (node.superClass && node.superClass.name !== 'Vue') {
							extend = node.superClass.name
						}
					},

					// option component
					// 可以在一个Vue组件 option 上执行一个回调函数
					...utils.executeOnVueComponent(context, (optionNode) => {
						// props
						// FIXME: utils.getComponentPropsFromOptions(optionNode) 只能获取 props 中的字面量
						// FIXME: utils.getComponentPropsFromOptions(optionNode) 返回中包含 PropType 指向的具体类型，目前只获取运行时类型，不获取ts类型
						const propList = utils.getComponentPropsFromOptions(optionNode).filter(p => p.propName)
						propMap = new Map([...propMap, ...getPropMapFromPropList(propList)])

						// emit，只能获取 emits 配置项中的
						const emits = utils.getComponentEmitsFromOptions(optionNode)
						emits.forEach(emit => {
							const emitName = emit.key.name
							const emitComments = sourceCode.getCommentsBefore(emit.node)
							const emitComment = commentsToText(emitComments)
							let emitType
							const emitValue = emit.value
							if (['FunctionExpression', 'ArrowFunctionExpression'].includes(emitValue.type)) {
								const emitFunParams = emitValue.params
								emitType = emitFunParams.map(p => {
									return getRuntimeType(p)
								})
							}
							setEmitMap(emitMap, emitName, emitType, emitComment)
						})

						// 其他项
						optionNode.properties.forEach(option => {
							const optionKeyName = option.key.name
							const optionValue = option.value

							setMapFromComponentCommonOption(optionKeyName, optionValue)

							// extend
							if (optionKeyName === 'extends') {
								extend = optionValue.name
							}

							// 生命周期
							if (LIFECYCLE_HOOKS.includes(optionKeyName)) {
								const lifecycleHookComments = sourceCode.getCommentsBefore(option)
								const lifecycleHookComment = commentsToText(lifecycleHookComments)
								const lifecycleHookInfo = {
									lifecycleHookName: optionKeyName,
									lifecycleHookComment
								}
								lifecycleHookMap.set(optionKeyName, lifecycleHookInfo)
							}

							// provide
							if (optionKeyName === 'provide') {
								// provide是对象
								if (optionValue.type === 'ObjectExpression') {
									forEachProvideOptionSetProvideMap(optionValue.properties, provideMap)
								}
								if (optionValue.type === 'FunctionExpression') {
									const funBody = optionValue.body.body
									const funRet = funBody.find(f => f.type === 'ReturnStatement')
									forEachProvideOptionSetProvideMap(funRet.argument.properties, provideMap)
								}
							}

							// inject
							if (optionKeyName === 'inject') {
								if (optionValue.type === 'ArrayExpression') {
									optionValue.elements.forEach(inject => {
										const injectName = inject.value
										const injectComments = sourceCode.getCommentsBefore(inject)
										const injectComment = commentsToText(injectComments)
										const injectInfo = {
											injectName,
											injectFrom: injectName,
											injectDefault: undefined,
											injectComment
										}
										injectMap.set(injectName, injectInfo)
									})
								}
								if (optionValue.type === 'ObjectExpression') {
									optionValue.properties.forEach(inject => {
										const injectName = inject.key.name
										const [injectFrom, injectDefault] = getInjectFromAndDefaultFromInjectOption(inject.value, injectName)
										const injectComments = sourceCode.getCommentsBefore(inject)
										const injectComment = commentsToText(injectComments)
										const injectInfo = {
											injectName,
											injectFrom,
											injectDefault,
											injectComment
										}
										injectMap.set(injectName, injectInfo)
									})
								}
							}

							// methods
							if (optionKeyName === 'methods') {
								optionValue.properties.forEach(method => {
									const methodName = method.key.name
									const methodComments = sourceCode.getCommentsBefore(method)
									const methodComment = commentsToText(methodComments)
									const methodInfo = {
										methodName,
										methodComment
									}
									methodMap.set(methodName, methodInfo)
								})
							}

							// computed
							if (optionKeyName === 'computed') {
								const allComments = sourceCode.getCommentsBefore(option)
								const allComment = `all:${commentsToText(allComments)}`
								optionValue.properties.forEach(computed => {
									const computedName = computed.key.name
									const computedComments = sourceCode.getCommentsBefore(computed)
									const computedComment = `all:${commentsToText(computedComments)}`
									const computedValue = computed.value
									setComputedMap(computedMap, computedName, computedComment)
									if (computedValue.type === 'ObjectExpression') {
										computedValue.properties.forEach(item => {
											const kind = item.key.name
											const kindComments = sourceCode.getCommentsBefore(item)
											const kindComment = `${kind}:${commentsToText(kindComments)}`
											setComputedMap(computedMap, computedName, kindComment)
										})
									}
								})
							}

							// data
							if (optionKeyName === 'data') {
								if (optionValue.type === 'FunctionExpression') {
									const funBody = optionValue.body.body
									const funRet = funBody.find(f => f.type === 'ReturnStatement')
									forEachDataOptionSetDataMap(funRet.argument.properties, dataMap)
								}
								if (optionValue.type === 'ObjectExpression') {
									forEachDataOptionSetDataMap(optionValue.properties, dataMap)
								}
							}

							// setup函数
							if (optionKeyName === 'setup') {
								const setupFunBody = optionValue.body.body
								const setupFunReturn = setupFunBody.find(f => f.type === 'ReturnStatement')
								const setupFunReturnProperties = setupFunReturn.argument.properties
								setupFunReturnProperties.forEach(item => {
									const setupName = item.key.name
									const setupValue = item.value
									const keyComments = sourceCode.getCommentsBefore(item)
									const keyComment = commentsToText(keyComments)
									const variable = findVariable(context.getScope(), setupValue)
									const variableDef = variable.defs[0]
									let variableComment = ''
									if (variableDef) {
										forEachDeclarations([variableDef.node], (leftName, allComment) => {
											variableComment = allComment
										})
									}
									const setupComment = [keyComment, variableComment].filter(f => f).join('\n')
									const setupInfo = {
										setupName,
										setupComment
									}
									setupMap.set(setupName, setupInfo)
								})
							}
						})
					}),

					// emit函数调用，option\setup\class
					CallExpression(node) {
						const calleeName = node.callee.property && node.callee.property.name
						if (['$emit', 'emit'].includes(calleeName)) {
							const calleeParams = node.arguments
							const emitName = calleeParams[0].value
							const emitComments = sourceCode.getCommentsBefore(node)
							const emitComment = commentsToText(emitComments)
							const emitType = calleeParams.slice(1).map(p => { return getRuntimeType(p) })
							setEmitMap(emitMap, emitName, emitType, emitComment)
						}
					},

					// script setup 中
					...utils.defineScriptSetupVisitor(context, {
						// prop
						onDefinePropsEnter(node, propList) {
							// 目前 defineProps 在 script setup 中只能使用一次，onDefinePropsEnter 只会获取第一个 defineProps，下面的方法兼容defineProps 被多次使用时
							// FIXME: 这里的 props 包含了类型，但是现在只提取运行时
							let typePropList = []
							let optionPropList = []
							propList.forEach(prop => {
								if (prop.type === 'type') typePropList.push(prop)
								else optionPropList.push(prop)
							})
							const optionPropMap = getPropMapFromPropList(optionPropList)
							const typePropMap = getPropMapFromTypePropList(typePropList, node.parent.arguments)

							propMap = new Map([...propMap, ...optionPropMap, ...typePropMap])
						},
						// 变量定义，包括 data\computed\inject\箭头函数methods 表现为 const dataA = ref('')
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
								const emitType = getEmitType(emit)
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

					// import MyComponent1 from "./ClassComponent.vue";
					ImportDefaultSpecifier(node) {
						const importName = node.local.name
						const importNode = node.parent
						const importPath = importNode.source.value
						importMap.set(importName, importPath)
					},
				},
			),
			{

				"Program:exit"() {
					sourceMetaMap = {
						importMap,
						templateMap,
						slotSet,
						propMap,
						setupMap,
						lifecycleHookMap,
						filterMap,
						emitMap,
						dataMap,
						computedMap,
						methodMap,
						provideMap,
						injectMap,
						modelOption,
						componentName,
						componentMap,
						extend,
						mixinSet
					}
				}
			}
		)
	},
});
const config = {
	parserOptions,
	rules: { "my-rule": "error" },
	parser: 'vueEslintParser'
};
function objToCode(obj, noHandle) {
	if (typeof obj === 'object' && obj !== null) {
		if (Array.isArray(obj)) return `[${obj.map(item => objToCode(item, noHandle)).join(',')}]`
		else return `{${Object.entries(obj).map(
			([key, value]) => {
				const ret = key + ":" + objToCode(value, noHandle || ['componentMap', 'mixinSet', 'extend'].includes(key))
				return ret
			}
		).join(',')}}`
	}
	return noHandle ? obj : JSON.stringify(obj)
}
module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	linter.verify(source, config)
	let newCode = ''
	const importMap = sourceMetaMap.importMap
	if (importMap) {
		let importCode = ''
		importMap.forEach((value, key) => {
			importCode += `import ${key} from '${value}';\n`
		})
		newCode += importCode
	}

	const newSourceObj = Object.keys(sourceMetaMap).reduce((p, key) => {
		if (key === 'importMap') return p
		const value = sourceMetaMap[key]
		if (key === 'templateMap') {
			p['template'] = value.entries().next().value[1]
		} else {
			if (value instanceof Map) {
				p[key] = Object.fromEntries(value)
			} else if (value instanceof Set) {
				p[key] = [...value]
			} else {
				p[key] = value
			}
		}
		return p
	}, {})
	newCode += `export default ${objToCode(newSourceObj)}`
	return newCode;
}
