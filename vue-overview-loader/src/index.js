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
const { getVueMetaFromMiddleData, getCodeFromVueMeta } = require('./utils/code')
const { commentNodesToText, forEachVariableNodes, getFormatJsCode, getRuntimeTypeFromNode, getFunFirstReturnNode, getVariableNode, } = require('./utils/commont')
const { isEmptyVText, formatVText, getTemplateCommentBefore } = require('./utils/template')
const { getExpressionContainerInfo, addTemplateMap, getPropInfoFromPropOption, getPropMapFromPropList, LIFECYCLE_HOOKS, addSetupMapFromVariable, getPropMapFromTypePropList, setEmitMap, setEmitMapFromEslintPluginVueEmits, deepSetDataMap, forEachDataOptionSetDataMap, setComputedMap, forEachProvideOptionSetProvideMap, getInjectFromAndDefaultFromInjectOption, setMapFromVueCommonOption } = require('./utils/script')

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

		// {templateValue,templateCallNames,templateType,attributes,templateComment,children}
		const templateMap = new Map()

		// {propName,propDefault,propType,propRequired,propComment}
		let propMap = new Map()

		// {setupName,setupComment}
		let setupMap = new Map()

		// {lifecycleHookName,lifecycleHookComment} 
		// lifecycleHookName在setup中带on，在options、class中不带
		const lifecycleHookMap = new Map()

		// {filterName,filterComment,filterValue}
		// filterName是方法名，filterValue是方法实体，用来关联import的方法
		const filterMap = new Map()

		// {emitName,emitType,emitComment,emitParamsVerify}
		const emitMap = new Map()

		// {dataName,dataComment}
		// data:{a:{b:1}} => dataMap {a:{dataName:'a',dataComment:'xxx'},a.b:{dataName:'a.b',dataComment:'xxx'}}
		const dataMap = new Map()

		// {computedName,computedComment}
		const computedMap = new Map()

		// {methodName,methodComment}
		const methodMap = new Map()

		// {provideName,provideFromKey,provideComment}
		const provideMap = new Map()


		// {injectName,injectFrom,injectDefault,injectComment}
		const injectMap = new Map()

		const modelOption = {
			prop: 'value',
			event: 'input'
		}

		// {"casing.kebabCase(key)":value}
		const componentMap = new Map()

		// string
		const importSet = new Set()

		// extend 可以是配置对象或构造函数
		const otherOptionMap = new Map([['componentName', undefined], ['extend', undefined]])


		// [变量名] 保持 import 关系
		const mixinSet = new Set()



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
		function setMapFormVueOptions(optionNode, emitMap, propMap, mixinSet, componentMap, filterMap, otherOptionMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap) {
			// props
			// FIXME: utils.getComponentPropsFromOptions(optionNode) 只能获取 props 中的字面量
			// FIXME: utils.getComponentPropsFromOptions(optionNode) 返回中包含 PropType 指向的具体类型，目前只获取运行时类型，不获取ts类型
			const propList = utils.getComponentPropsFromOptions(optionNode).filter(p => p.propName)
			const addPropMap = getPropMapFromPropList(context, propList)
			for (const [key, value] of addPropMap) {
				propMap.set(key, value)
			}

			// emit，只能获取 emits 配置项中的
			const emits = utils.getComponentEmitsFromOptions(optionNode)
			setEmitMapFromEslintPluginVueEmits(emits, context, emitMap)

			// 其他项
			optionNode.properties.forEach(option => {
				const optionKeyName = option.key.name
				const optionValue = option.value

				setMapFromVueCommonOption(context, optionKeyName, optionValue, mixinSet, componentMap, filterMap, otherOptionMap)

				// extend
				if (optionKeyName === 'extends') {
					otherOptionMap.set('extend', optionValue.name)
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
						forEachProvideOptionSetProvideMap(optionValue.properties, provideMap, sourceCode)
					}
					if (optionValue.type === 'FunctionExpression') {
						const funRet = getFunFirstReturnNode(optionValue)
						forEachProvideOptionSetProvideMap(funRet.argument.properties, provideMap, sourceCode)
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
							const [injectFrom, injectDefault] = getInjectFromAndDefaultFromInjectOption(inject.value, injectName, sourceCode)
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
						const funRet = getFunFirstReturnNode(optionValue)
						forEachDataOptionSetDataMap(context, funRet.argument.properties, dataMap, undefined, undefined)
					}
					if (optionValue.type === 'ObjectExpression') {
						forEachDataOptionSetDataMap(context, optionValue.properties, dataMap, undefined, undefined)
					}
				}

				// setup函数
				if (optionKeyName === 'setup') {
					const setupFunReturn = getFunFirstReturnNode(optionValue)
					const setupFunReturnProperties = setupFunReturn.argument.properties
					setupFunReturnProperties.forEach(item => {
						const setupKeyName = item.key.name
						const setupValue = item.value
						const keyComments = sourceCode.getCommentsBefore(item)
						const keyComment = commentNodesToText(keyComments)
						const variableNode = getVariableNode(setupValue, context)
						let variableComment = ''
						if (variableNode) {
							forEachVariableNodes(sourceCode, [variableNode], (leftName, comment) => {
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
				otherOptionMap,
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
			otherOptionMap.set('components', undefined)
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
			otherOptionMap.set('extends', undefined)
			mixinSet.clear()
		}
		function addExportSetFromVueOption(optionNode, exportSet, exportType, variableKey) {
			setMapFormVueOptions(optionNode, emitMap)
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
			// <script setup> 中
			utils.defineScriptSetupVisitor(context, {
				// props
				onDefinePropsEnter(node, propList) {
					// 目前 defineProps 在 script setup 中只能使用一次，onDefinePropsEnter 只会获取第一个 defineProps，下面的方法兼容defineProps 被多次使用时
					// FIXME: 这里的 props 包含了类型，但是现在只提取运行时
					let typePropList = []
					let optionPropList = []
					propList.forEach(prop => {
						if (prop.type === 'type') typePropList.push(prop)
						else optionPropList.push(prop)
					})
					const optionPropMap = getPropMapFromPropList(context, optionPropList)
					const typePropMap = getPropMapFromTypePropList(sourceCode, typePropList, node.parent.arguments)

					propMap = new Map([...propMap, ...optionPropMap, ...typePropMap])
				},
				// 变量定义，包括 data\computed\inject\箭头函数methods 表现为 const dataA = ref('')
				'Program>VariableDeclaration'(node) {
					// 过滤掉没有初始化和初始化不允许添加进setupMap的变量定义，针对 let dataF,dataG=ref('')
					const variable = node.declarations
					addSetupMapFromVariable(sourceCode, variable, setupMap)
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
				// emits
				onDefineEmitsEnter(node, emits) {
					setEmitMapFromEslintPluginVueEmits(emits, context, emitMap)
				}
			}),
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
							const keyName = getFormatJsCode(sourceCode, a.key)
							const value = a.value
							if (value && value.type === "VLiteral") {
								return {
									keyName,
									valueName: value.value,
									valueType: value.type
								}
							} else {
								const [valueName, valueType, scopeNames, callNames, callParams, vForName] = getExpressionContainerInfo(sourceCode, value)
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
						const [templateName, templateType, , templateCallNames, templateCallParams,] = getExpressionContainerInfo(sourceCode, node)
						const templateInfo = {
							// 包含{{}}的值
							templateValue: `${getFormatJsCode(sourceCode, node)}`,
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

							const [propDefault, propType, propRequired] = getPropInfoFromPropOption(context, propOption, prop)

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

							const [propDefault, propType, propRequired] = getPropInfoFromPropOption(context, propOption, computed)

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
							setComputedMap(computedMap, computedName, computedComment)

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

							const [propDefault, propType, propRequired] = getPropInfoFromPropOption(context, propOption, prop)

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

							const [propDefault, propType, propRequired] = getPropInfoFromPropOption(context, propOption, computed)

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
							setComputedMap(computedMap, computedName, computedComment)

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

							const [propDefault, propType, propRequired] = getPropInfoFromPropOption(context, propOption, computed)

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
							forEachDataOptionSetDataMap(context, [node], dataMap)
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
							deepSetDataMap(context, provide, dataMap, dataName, dataComment)
						},
						// @Inject/@InjectReactive
						':matches(ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Inject],ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=InjectReactive])'(node) {
							const inject = node.parent
							const injectName = inject.key.name
							const [injectFrom, injectDefault] = getInjectFromAndDefaultFromInjectOption(node.expression.arguments[0], injectName, sourceCode)
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
							// TODO:函数可能有多个return，需要根据所有的进行组合
							const emitFunRet = getFunFirstReturnNode(emitFun.value)
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
										setMapFromVueCommonOption(context, optionKeyName, optionValue, mixinSet, componentMap, filterMap, otherOptionMap)
									})
								}
							}
						},
						// export default class HomeView extends SuperClass {}
						'ClassDeclaration'(node) {
							if (node.superClass && node.superClass.name !== 'Vue') {
								otherOptionMap.set('extend', node.superClass.name)
							}
						},
					},

					// option component
					// 可以在一个Vue组件 option 上执行一个回调函数
					...utils.executeOnVueComponent(context, (optionNode) => {
						setMapFormVueOptions(optionNode, emitMap, propMap, mixinSet, componentMap, filterMap, otherOptionMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap)
					}),

					// emit函数调用，option\setup\class
					CallExpression(node) {
						const calleeName = node.callee.property && node.callee.property.name
						if (['$emit', 'emit'].includes(calleeName)) {
							const calleeParams = node.arguments
							const emitName = calleeParams[0].value
							const emitComments = sourceCode.getCommentsBefore(node)
							const emitComment = commentNodesToText(emitComments)
							const emitType = calleeParams.slice(1).map(p => { return [getRuntimeTypeFromNode(p, context)] })
							setEmitMap(emitMap, emitName, emitType, emitComment)
						}
					},

					// import MyComponent1 from "./ClassComponent.vue";
					// import { mixinA, mixinB } from "./mixinOption";
					'ImportDeclaration'(node) {
						importSet.add(getFormatJsCode(sourceCode, node))
					},
				},
			),
			{
				// 处理ts\js种的option配置
				':matches(:not(Program[templateBody]) ExportNamedDeclaration,:not(Program[templateBody]) ExportDefaultDeclaration)'(node) {
					// const exportDeclaration = node.declaration
					// const exportType = node.type
					// // export default filterB
					// if (exportDeclaration.type === 'Identifier') {
					// 	const variable = getVariableNode(exportDeclaration)
					// 	const exportComment = sourceCode.getCommentsBefore(node)
					// 	let variableComment = []
					// 	if (variable) {
					// 		variableComment = sourceCode.getCommentsBefore(variable)
					// 	}
					// 	debugger
					// }
					// if (exportDeclaration.type === 'VariableDeclaration') {
					// 	const variable = exportDeclaration.declarations[0]
					// 	const variableKey = variable.id.name
					// 	// 导出的对象有初始值且初始值是vue option配置
					// 	if (variable.init && isVueOption(variable.init)) {
					// 		return addExportSetFromVueOption(variable.init, exportSet, exportType, variableKey)
					// 	}
					// 	const exportComment = sourceCode.getCommentsBefore(node)
					// 	const exportInfo = {
					// 		exportType,
					// 		variableKey,
					// 		newSourceCode: exportComment,
					// 	}
					// 	exportSet.add(exportInfo)
					// }
					// if (exportDeclaration.type === 'ObjectExpression') {
					// 	if (isVueOption(exportDeclaration)) {
					// 		return addExportSetFromVueOption(exportDeclaration, exportSet, exportType)
					// 	}
					// }
					// debugger
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
