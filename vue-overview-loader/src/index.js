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
const { getVueMetaFromMiddleData, getCodeFromVueMeta } = require('./utils/code')
const { commentNodesToText, getPatternNames, forEachVariableNodes } = require('./utils/commont')
const { isEmptyVText, formatVText, getTemplateCommentsBefore, getTemplateCommentBefore } = require('./utils/template')

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
// 用于从rule传递对象loader中
let middleData


linter.defineRule("my-rule", {
	create(context) {
		const sourceCode = context.getSourceCode()

		function sourceCodeGetText(node) {
			const ret = sourceCode.getText(node)
			return ret.replace(/\n/g, '').replace(/\s+/g, ' ')
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
			if (params) {
				if (params.length === 1) {
					const param = params[0]
					if (param.type === 'CallExpression') {
						return getCallExpressionNamesAndParam(param, names)
					} else {
						const callParam = param.type === 'MemberExpression' ? sourceCodeGetText(param) : undefined
						return [[callParam], names]
					}
				} else {
					return [params.map(param => sourceCodeGetText(param)), names]
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
				return [sourceCodeGetText(expression.expression), expression.expression.type]
			}

			// 绑定值是函数调用,[函数名,'CallExpression']
			// 函数调用可以层层嵌套的，这里不支持嵌套，只读取第一层的函数名
			// 不支持 :style="c(d(a.b), a)"，:style="c()"
			// 支持 c(d(a.b))
			if (expression.expression.type === 'CallExpression') {
				const [callParams, callNames] = getCallExpressionNamesAndParam(expression.expression)
				return [sourceCodeGetText(expression.expression), expression.expression.type, undefined, callNames, callParams]
			}

			// filter filter的顺序做了颠倒和函数一致符合它的调用顺序
			if ('VFilterSequenceExpression' === expression.expression.type) {
				const callNames = expression.expression.filters.map(f => f.callee.name).reverse()
				const callParam = expression.expression.expression.name
				return [sourceCodeGetText(expression.expression), expression.expression.type, undefined, callNames, [callParam]]
			}

			// 绑定值是v-for的值，[遍历的对象，'VForExpression'，遍历的项名[]]
			// 遍历的对象只支持变量
			// 遍历的项名[]，例如 (val, name, index) in object => [val,name,index]
			if (expression.expression.type === 'VForExpression') {
				return [sourceCodeGetText(expression.expression), expression.expression.type, getPatternNames(expression.expression.left), undefined, undefined, expression.expression.right.name]
			}

			// 绑定值是slot-scope或v-slot
			if (expression.expression.type === 'VSlotScopeExpression') {
				const scopeNames = getPatternNames(expression.expression.params)
				return [sourceCodeGetText(expression.expression), expression.expression.type, scopeNames]
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


		// {templateValue,templateCallNames,templateType,attributes,templateComment,children}
		const templateMap = new Map()

		// ——————————————————————————————————————————————————————————————


		function getPropType(typeValue) {
			switch (typeValue.type) {
				case 'Identifier':
					return [typeValue.name]
				case 'ArrayExpression':
					return typeValue.elements.map(e => e.name)
				case 'TSAsExpression':
					return tsUtils.inferRuntimeType(context, typeValue.typeAnnotation.typeParameters.params[0])
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
									propDefault = sourceCodeGetText(d.value)
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
				const propComment = commentNodesToText(propComments)
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
				const propDefault = propDefaultNode ? sourceCodeGetText(propDefaultNode.value) : undefined

				const propType = prop.types
				const propRequired = prop.required

				const typeComments = sourceCode.getCommentsBefore(prop.key)
				const defaultComments = propDefaultNode ? sourceCode.getCommentsBefore(propDefaultNode) : []
				const propComment = commentNodesToText([...typeComments, ...defaultComments])

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

		// 从变量定义中添加 setupMap,支持 const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
		function addSetupMapFromDeclarations(declarations, setupMap) {
			const needAddSetupMapDeclarations = declarations.filter(d => {
				return !initUnAddSetupMap(d.init)
			})
			// 遍历允许添加到 setupMap 的变量定义
			// declarations:例如：const provideData = ref(""); => provideData = ref("")
			forEachVariableNodes(needAddSetupMapDeclarations, (setupName, setupComment) => {
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

			if (paramValueType === 'ArrayExpression') return paramValue.elements.map(element => getEmitTypeFromObjectParamValue(element)[0])

			if (['FunctionExpression'].includes(paramValueType)) return [sourceCodeGetText(paramValue.parent)]

			// ArrowFunctionExpression 箭头函数
			if ('ArrowFunctionExpression' === paramValueType) return [sourceCodeGetText(paramValue)]

			if (paramValueType === 'Identifier') return [paramValue.name]
		}
		// 获取 emit 抛出参数的运行时类型
		function getEmitType(emit) {
			const defineEmitsParamType = emit.type
			// defineEmits参数是数组
			if (defineEmitsParamType === 'array') return [undefined]
			// 参数是对象
			if (defineEmitsParamType === 'object') {
				return [getEmitTypeFromObjectParamValue(emit.value)]
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
		function isGoodType(type) {
			return ['Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'RegExp'].includes(type)
		}
		function setEmitMap(emitMap, emitName, emitType, emitComment) {
			const oldEmit = emitMap.get(emitName)
			if (oldEmit) {
				oldEmit.emitComment = `${oldEmit.emitComment}\n\n${emitComment}`
				const oldEmitType = oldEmit.emitType
				emitType && emitType.forEach((type, index) => {
					if (type && isGoodType(type)) oldEmitType[index] = type
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
				const ret = tsUtils.inferRuntimeType(context, node.typeAnnotation.typeAnnotation)
				return ret
			}
			if (['ObjectExpression', 'ObjectPattern'].includes(node.type)) return 'Object'
			if (['ArrayExpression', 'ArrayPattern'].includes(node.type)) return 'Array'
			if (['FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) return 'Function'
			if (node.type === 'Literal') {
				const value = node.value
				if (Array.isArray(value)) return 'Array'
				if (value === null) return 'null'
				return casing.pascalCase(typeof node.value)
			}
			return undefined
		}
		// {emitName,emitType,emitComment}
		const emitMap = new Map()

		// ——————————————————————————————————————————————————————————————
		function getFunReturnNode(funNode) {
			const funBody = funNode.body.body
			const funRet = funBody.find(f => f.type === 'ReturnStatement')
			return funRet
		}
		function getVariableNode(identifierNode) {
			const variable = findVariable(context.getScope(), identifierNode)
			return variable && variable.defs[0] && variable.defs[0].node
		}
		function deepAddDataMap(dataOption, dataMap, dataName, dataComment) {
			const dataValue = dataOption.value
			if (dataValue.type === 'ObjectExpression') {
				forEachDataOptionSetDataMap(dataValue.properties, dataMap, dataComment, dataName)
			}
			if (dataValue.type === 'CallExpression') {
				const variableNode = getVariableNode(dataValue.callee)
				if (variableNode) {
					const returnNode = getFunReturnNode(variableNode)
					if (returnNode && returnNode.argument.type === "ObjectExpression") {
						forEachDataOptionSetDataMap(returnNode.argument.properties, dataMap, dataComment, dataName)
					}
				}
			}
		}
		function forEachDataOptionSetDataMap(dataOptions, dataMap, parentComment, parentName) {
			dataOptions.forEach(dataOption => {
				const dataName = parentName ? `${parentName}.${dataOption.key.name}` : dataOption.key.name
				const dataComments = sourceCode.getCommentsBefore(dataOption)
				const dataComment = commentNodesToText(dataComments)
				const dataInfo = {
					dataName,
					dataComment: parentComment ? `${parentComment}\n\n${dataComment}` : dataComment
				}
				dataMap.set(dataName, dataInfo)
				deepAddDataMap(dataOption, dataMap, dataName, dataComment)
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
				const provideFromKey = sourceCodeGetText(provide.value)
				const provideComments = sourceCode.getCommentsBefore(provide)
				const provideComment = commentNodesToText(provideComments)
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
					if (c.key.name === 'default') p[1] = sourceCodeGetText(c.value)
					return p
				}, [undefined, undefined])
				if (!ret[0]) ret = injectName
				return ret
			}
			// 变量名
			if (injectOption.type === 'Identifier') return [`${injectOption.name}`, undefined]
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

		// string
		const importSet = new Set()

		// ——————————————————————————————————————————————————————————————

		// 
		let componentName = undefined



		// ——————————————————————————————————————————————————————————————

		// 可以是配置对象或构造函数
		let extend = undefined

		// ——————————————————————————————————————————————————————————————

		// 配置对象
		const mixinSet = new Set()

		// ——————————————————————————————————————————————————————————————

		// filter,components,name,mixins
		function setMapFromVueCommonOption(optionKeyName, optionValue) {
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
					const filterComment = commentNodesToText(filterComments)
					const filterValueNode = getVariableNode(filter.value)
					let filterValue = undefined
					if (filterValueNode && ['ImportSpecifier', 'ImportDefaultSpecifier'].includes(filterValueNode.type)) {
						filterValue = filter.value.name
					}
					const filterInfo = {
						filterName,
						filterComment,
						filterValue
					}
					filterMap.set(filterName, filterInfo)
				})
			}
		}

		// ——————————————————————————————————————————————————————————————

		// export，只有ts\js文件有
		const exportSet = new Set()
		function isVueOption(node) {
			if (node.type !== 'ObjectExpression') return false
			const properties = node.properties
			const noOptionKey = properties.some(p => !['extends', 'mixins', 'filters', 'provide', 'inject', 'emits', 'methods', 'setup', 'computed', 'data', 'props'].includes(p.key.name))
			if (noOptionKey) return false
			return true
		}
		// 从options中提取name\extends\mixins\components\filters\生命周期\props\computed\methods\setup\emits\provide\inject\data塞入对应的map对象中
		function setMapFormVueOptions(optionNode) {
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
				const emitComment = commentNodesToText(emitComments)
				let emitType
				const emitValue = emit.value
				if (['FunctionExpression', 'ArrowFunctionExpression'].includes(emitValue.type)) {
					const emitFunParams = emitValue.params
					emitType = emitFunParams.map(p => {
						return [getRuntimeType(p)]
					})
				}
				setEmitMap(emitMap, emitName, emitType, emitComment)
			})

			// 其他项
			optionNode.properties.forEach(option => {
				const optionKeyName = option.key.name
				const optionValue = option.value

				setMapFromVueCommonOption(optionKeyName, optionValue)

				// extend
				if (optionKeyName === 'extends') {
					extend = optionValue.name
				}

				// 生命周期
				if (LIFECYCLE_HOOKS.includes(optionKeyName)) {
					const lifecycleHookComments = sourceCode.getCommentsBefore(option)
					const lifecycleHookComment = commentNodesToText(lifecycleHookComments)
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
						const funRet = getFunReturnNode(optionValue)
						forEachProvideOptionSetProvideMap(funRet.argument.properties, provideMap)
					}
				}

				// inject
				if (optionKeyName === 'inject') {
					if (optionValue.type === 'ArrayExpression') {
						optionValue.elements.forEach(inject => {
							const injectName = inject.value
							const injectComments = sourceCode.getCommentsBefore(inject)
							const injectComment = commentNodesToText(injectComments)
							const injectInfo = {
								injectName,
								injectFrom: `"${injectName}"`,
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
							const injectComment = commentNodesToText(injectComments)
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
						const methodComment = commentNodesToText(methodComments)
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
					const allComment = `all:${commentNodesToText(allComments)}`
					optionValue.properties.forEach(computed => {
						const computedName = computed.key.name
						const computedComments = sourceCode.getCommentsBefore(computed)
						const computedComment = `all:${commentNodesToText(computedComments)}`
						const computedValue = computed.value
						setComputedMap(computedMap, computedName, computedComment)
						if (computedValue.type === 'ObjectExpression') {
							computedValue.properties.forEach(item => {
								const kind = item.key.name
								const kindComments = sourceCode.getCommentsBefore(item)
								const kindComment = `${kind}:${commentNodesToText(kindComments)}`
								setComputedMap(computedMap, computedName, kindComment)
							})
						}
					})
				}

				// data
				if (optionKeyName === 'data') {
					if (optionValue.type === 'FunctionExpression') {
						const funRet = getFunReturnNode(optionValue)
						forEachDataOptionSetDataMap(funRet.argument.properties, dataMap)
					}
					if (optionValue.type === 'ObjectExpression') {
						forEachDataOptionSetDataMap(optionValue.properties, dataMap)
					}
				}

				// setup函数
				if (optionKeyName === 'setup') {
					const setupFunReturn = getFunReturnNode(optionValue)
					const setupFunReturnProperties = setupFunReturn.argument.properties
					setupFunReturnProperties.forEach(item => {
						const setupKeyName = item.key.name
						const setupValue = item.value
						const keyComments = sourceCode.getCommentsBefore(item)
						const keyComment = commentNodesToText(keyComments)
						const variableNode = getVariableNode(setupValue)
						let variableComment = ''
						if (variableNode) {
							forEachVariableNodes([variableNode], (leftName, comment) => {
								variableComment = comment
							})
						}
						const setupComment = [keyComment, variableComment].filter(f => f).join('\n')
						const setupInfo = {
							setupName: setupKeyName,
							setupComment
						}
						setupMap.set(setupKeyName, setupInfo)
					})
				}
			})
		}
		// 
		function getMiddleData() {
			return {
				importSet,
				componentName,
				templateMap,
				propMap,
				emitMap,
				modelOption,
				setupMap,
				lifecycleHookMap,
				provideMap,
				injectMap,
				filterMap,
				dataMap,
				// computedMap,
				// methodMap,
				// componentMap,
				// extend,
				// mixinSet
			}
		}
		function cleanVueMetaOrigin() {
			importSet.clear()
			componentName = ''
			templateMap.clear()
			propMap.clear()
			emitMap.clear()
			modelOption = {
				prop: 'value',
				event: 'input'
			}
			setupMap.clear()
			lifecycleHookMap.clear()
			provideMap.clear()
			injectMap.clear()
			filterMap.clear()
			dataMap.clear()
			computedMap.clear()
			methodMap.clear()
			componentMap.clear()
			extend = undefined
			mixinSet.clear()
		}
		function addExportSetFromVueOption(optionNode, exportSet, exportType, variableKey) {
			setMapFormVueOptions(optionNode)
			const middleData = getMiddleData()
			const vueMeta = getVueMetaFromMiddleData(middleData)
			const newSourceCode = getCodeFromVueMeta(vueMeta)
			const exportInfo = {
				exportType,
				variableKey,
				newSourceCode
			}
			exportSet.add(exportInfo)
			cleanVueMetaOrigin()
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
							const keyName = sourceCodeGetText(a.key)
							const [valueName, valueType, scopeNames, callNames, callParams, vForName] = getExpressionInfo(a.value)
							return {
								// attr左边
								keyName,
								// attr右边
								valueName,
								// attr右边的类型
								valueType,
								// v-for,v-slot,slot-scope有作用域
								scopeNames,
								// attr右边是函数调用或filter
								callNames,
								// attr右边是函数调用或filter的参数
								callParams,
								// v-for的值
								vForName
							}
						})
						const templateComment = getTemplateCommentBefore(element)
						const templateInfo = {
							templateValue: `<${templateValue}>`,
							templateType: 'VElement',
							attributes,
							templateComment,
							children: []
						}
					},
					// 标签内文本
					'VElement>VText'(node) {
						if (isEmptyVText(node)) return
						const templateInfo = {
							templateValue: `"${formatVText(node.value)}"`,
							templateType: 'VText',
							attributes: undefined,
							templateComment: getTemplateCommentBefore(node),
							children: undefined
						}
						addTemplateMap(node, templateInfo, templateMap)
					},
					// 标签内{{ }}
					'VElement>VExpressionContainer'(node) {
						const [templateName, templateType, , templateCallNames, templateCallParams,] = getExpressionInfo(node)
						const templateInfo = {
							// 包含{{}}的值
							templateValue: `${sourceCodeGetText(node)}`,
							templateType,
							attributes: undefined,
							templateComment: getTemplateCommentBefore(node),
							children: undefined,
							// {{}}内的值
							templateName,
							templateCallNames,
							templateCallParams
						}
						addTemplateMap(node, templateInfo, templateMap)
					}
				},
				// script 解析
				// FIXME:所有的 装饰器参数、prop option 必须是字面量对象
				{
					// class component
					...{
						// class component @Prop
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Prop]'(node) {
							const decoratorParams = node.expression.arguments
							const prop = node.parent

							const propName = prop.key.name
							const propOption = decoratorParams[0]

							const [propDefault, propType, propRequired] = getPropInfoFromOption(propOption, prop)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propNameComments = sourceCode.getCommentsAfter(node)
							const propComment = commentNodesToText([...decoratorComments, ...propNameComments])

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
							const propComment = commentNodesToText([...decoratorComments, ...computedComments])

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
							const propComment = commentNodesToText([...decoratorComments, ...propComments])

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
							const propComment = commentNodesToText([...decoratorComments, ...propComments, ...computedComments])

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
							const propComment = commentNodesToText([...decoratorComments, ...computedComments])

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
							forEachDataOptionSetDataMap([node], dataMap)
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
								const computedComment = `${kind}:${commentNodesToText(computedComments)}`
								setComputedMap(computedMap, computedName, computedComment)
							}
							if (kind === 'method') {
								const methodName = node.key.name
								const methodComments = sourceCode.getCommentsBefore(node)
								const methodComment = commentNodesToText(methodComments)
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
							const provideComment = commentNodesToText([...decoratorComments, ...dataComments])

							const provideInfo = {
								provideName,
								provideFromKey: dataName,
								provideComment
							}
							provideMap.set(provideName, provideInfo)

							// data
							const dataComment = commentNodesToText(dataComments)

							const dataInfo = {
								dataName,
								dataComment
							}
							dataMap.set(dataName, dataInfo)
							deepAddDataMap(provide, dataMap, dataName, dataComment)
						},
						// @Inject/@InjectReactive
						':matches(ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Inject],ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=InjectReactive])'(node) {
							const inject = node.parent
							const injectName = inject.key.name
							const [injectFrom, injectDefault] = getInjectFromAndDefaultFromInjectOption(node.expression.arguments[0], injectName)
							const decoratorComments = sourceCode.getCommentsBefore(node)
							const injectComments = sourceCode.getCommentsAfter(node)
							const injectComment = commentNodesToText([...decoratorComments, ...injectComments])
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
							// FIXME：无法获取函数 return 的推导类型，只先获取标注了具体类型
							const emitFunRet = getFunReturnNode(emitFun.value)
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
							const emitComment = commentNodesToText([...decoratorComments, ...emitComments])
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
										setMapFromVueCommonOption(optionKeyName, optionValue)
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
							const setupComment = commentNodesToText(setupComments)
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
								const lifecycleHookComment = commentNodesToText(lifecycleHookComments)
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
								const emitComment = commentNodesToText(emitComments)
								const emitInfo = {
									emitName,
									emitType,
									emitComment
								}
								emitMap.set(emitName, emitInfo)
							})
						}
					}),

					// option component
					// 可以在一个Vue组件 option 上执行一个回调函数
					...utils.executeOnVueComponent(context, (optionNode) => {
						setMapFormVueOptions(optionNode)
					}),

					// emit函数调用，option\setup\class
					CallExpression(node) {
						const calleeName = node.callee.property && node.callee.property.name
						if (['$emit', 'emit'].includes(calleeName)) {
							const calleeParams = node.arguments
							const emitName = calleeParams[0].value
							const emitComments = sourceCode.getCommentsBefore(node)
							const emitComment = commentNodesToText(emitComments)
							const emitType = calleeParams.slice(1).map(p => { return [getRuntimeType(p)] })
							setEmitMap(emitMap, emitName, emitType, emitComment)
						}
					},

					// import MyComponent1 from "./ClassComponent.vue";
					// import { mixinA, mixinB } from "./mixinOption";
					'ImportDeclaration'(node) {
						importSet.add(sourceCodeGetText(node))
					},
				},
			),
			{
				// 处理ts\js种的option配置
				':matches(:not(Program[templateBody]) ExportNamedDeclaration,:not(Program[templateBody]) ExportDefaultDeclaration)'(node) {
					const exportDeclaration = node.declaration
					const exportType = node.type
					// export default filterB
					if (exportDeclaration.type === 'Identifier') {
						const variable = getVariableNode(exportDeclaration)
						const exportComment = sourceCode.getCommentsBefore(node)
						let variableComment = []
						if (variable) {
							variableComment = sourceCode.getCommentsBefore(variable)
						}
						debugger
					}
					if (exportDeclaration.type === 'VariableDeclaration') {
						const variable = exportDeclaration.declarations[0]
						const variableKey = variable.id.name
						// 导出的对象有初始值且初始值是vue option配置
						if (variable.init && isVueOption(variable.init)) {
							return addExportSetFromVueOption(variable.init, exportSet, exportType, variableKey)
						}
						const exportComment = sourceCode.getCommentsBefore(node)
						const exportInfo = {
							exportType,
							variableKey,
							newSourceCode: exportComment,
						}
						exportSet.add(exportInfo)
					}
					if (exportDeclaration.type === 'ObjectExpression') {
						if (isVueOption(exportDeclaration)) {
							return addExportSetFromVueOption(exportDeclaration, exportSet, exportType)
						}
					}
					debugger
				}
			},
			{
				"Program:exit"(node) {
					middleData = getMiddleData()
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


module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	const { exclude } = this.getOptions()
	if (exclude && exclude.test(resource)) return source

	linter.verify(source, config)
	let newCode = ''
	const importSet = middleData.importSet
	if (importSet) {
		let importCode = ''
		importSet.forEach((value) => {
			importCode += `${value}\n`
		})
		newCode += importCode
	}

	const vueMeta = getVueMetaFromMiddleData(middleData)
	newCode += `export default ${getCodeFromVueMeta(vueMeta)}`
	return newCode;
}
