/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */

const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
const casing = require('eslint-plugin-vue/lib/utils/casing')
const { commentNodesToText, getFormatJsCode, getFunFirstReturnNode, forEachPattern, getFunParamsRuntimeType, getRuntimeTypeFromNode, setSome, } = require('./utils/commont')
const { isEmptyVText, formatVText, getTemplateCommentBefore } = require('./utils/template')
const { getExpressionContainerInfo, addTemplateMap, getPropInfoFromPropOption, getPropMapFromPropList, LIFECYCLE_HOOKS, getPropMapFromTypePropList, setEmitMapFromEslintPluginVueEmits, deepSetDataMap, forEachDataOptionSetDataMap, setComputedMap, getInjectFromAndDefaultFromInjectOption, setMapFromVueCommonOption, setMapFormVueOptions, isUnAddSetupMap, setEmitMapFromEmitCall } = require('./utils/script')

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

// node:{templateValue,templateCallNames,templateType,attributes,templateComment,children}
const templateMap = new Map()

// propName:{propName,propDefault,propType,propRequired,propComment}
let propMap = new Map()

// setupName:{setupName,setupComment}
let setupMap = new Map()

// lifecycleHookName:{lifecycleHookName,lifecycleHookComment} 
// lifecycleHookName在setup中带on，在options、class中不带
const lifecycleHookMap = new Map()

// filterName:{filterName,filterComment,fromValue:{value:'',comment:''}}
// filterName是方法名
const filterMap = new Map()

// emitName:{emitName,emitType,emitComment,emitParamsVerify}
// emitParamsVerify 是 emits 配置中完整的校验函数
const emitMap = new Map()

// dataName:{dataName,dataComment}
// data:{a:{b:1}} => dataMap {a:{dataName:'a',dataComment:'xxx'},a.b:{dataName:'a.b',dataComment:'xxx'}}
const dataMap = new Map()

// computedName:{computedName,computedComment}
const computedMap = new Map()

// methodName:{methodName,methodComment}
const methodMap = new Map()

// provideName:{provideName,provideValue,provideValueType,provideComment}
// [s]: this.provideSymbolFrom => {provideName:"[s]",provideValue:'provideSymbolFrom',provideValueType:'Identifier',provideComment:'xxx'}
// provideValueType只有Literal和Identifier
const provideMap = new Map()

// injectName:{injectName,injectFrom,injectDefault,injectComment}
// {injectName:"injectB",injectFrom:'[injectSymbol]',injectDefault:undefined,injectComment:'xxx'}
const injectMap = new Map()

// {"casing.kebabCase(key)":importValue}
const componentMap = new Map()

// string[]
const importSet = new Set()

// importValue[]
const mixinSet = new Set()

// extend 是 importValue
const nameAndExtendMap = new Map()

const modelOptionMap = new Map()

// script setup 中的 import，需要根据 template 中的使用情况进行过滤，然后合并到 componentMap 中
// importName[]
const setupScriptImportSet = new Set()

function initMeta() {
	setupScriptImportSet.clear()
	templateMap.clear()
	propMap.clear()
	setupMap.clear()
	lifecycleHookMap.clear()
	filterMap.clear()
	emitMap.clear()
	dataMap.clear()
	computedMap.clear()
	methodMap.clear()
	provideMap.clear()
	injectMap.clear()
	componentMap.clear()
	importSet.clear()
	mixinSet.clear()
	nameAndExtendMap.set('componentName', undefined)
	nameAndExtendMap.set('extend', undefined)
	modelOptionMap.set('prop', 'value')
	modelOptionMap.set('event', 'input')
}
initMeta()


linter.defineRule("vue-loader", {
	create(context) {
		const sourceCode = context.getSourceCode()

		const ret = utils.compositingVisitors(
			utils.defineTemplateBodyVisitor(
				context,
				{
					// 标签
					VElement(element) {
						// 标签名
						const templateValue = casing.kebabCase(element.rawName)
						// 标签属性
						const attributes = element.startTag.attributes.map(a => {
							const keyName = getFormatJsCode(context, a.key)
							const value = a.value
							if (value && value.type === "VLiteral") {
								return {
									keyName,
									valueName: value.value,
									valueType: value.type
								}
							} else {
								const [valueName, valueType, scopeNames, callNames, callParams, vForName] = getExpressionContainerInfo(context, value)
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
						addTemplateMap(element, templateInfo, templateMap)
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
						const [templateName, templateType, , templateCallNames, templateCallParams,] = getExpressionContainerInfo(context, node)
						const templateInfo = {
							// 包含{{}}的值
							templateValue: `${getFormatJsCode(context, node)}`,
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
				{
					// option component
					...utils.executeOnVueComponent(context, (optionNode) => {
						setMapFormVueOptions(context, optionNode, emitMap, propMap, mixinSet, componentMap, filterMap, nameAndExtendMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap)
					}),

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
							modelOptionMap.set('event', modelEvent)
							modelOptionMap.set('prop', propName)
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
							modelOptionMap.set('prop', propName)
							const modelEvent = decoratorParams[1].value
							modelOptionMap.set('event', modelEvent)

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
							const provideComment = commentNodesToText([...decoratorComments])

							const provideInfo = {
								provideName,
								provideValue: dataName,
								provideValueType: 'Identifier',
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
							const [injectFrom, injectDefault] = getInjectFromAndDefaultFromInjectOption(context, node.expression.arguments[0], injectName)
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

							const emitType = getFunParamsRuntimeType(context, emitFunParams)
							const emitFunRet = getFunFirstReturnNode(emitFun.value)
							if (emitFunRet) {
								emitType.unshift(getRuntimeTypeFromNode(context, emitFunRet.argument))
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
										setMapFromVueCommonOption(context, optionKeyName, optionValue, mixinSet, componentMap, filterMap, nameAndExtendMap)
									})
								}
							}
						},
						'ClassDeclaration'(node) {
							if (node.superClass && node.superClass.name !== 'Vue') {
								if (node.superClass.type === 'CallExpression' && node.superClass.callee.name === 'mixins') {
									// export default class ClassComponent extends mixins(ExtendClassComponent) {}
									const mixins = node.superClass.arguments
									mixins.forEach(m => {
										if (m.type === 'Identifier') {
											mixinSet.add(m.name)
										}
									})
								} else {
									// export default class HomeView extends SuperClass {}
									nameAndExtendMap.set('extend', node.superClass.name)
								}
							}
						},
					},

					// emit函数调用，option\setup\class
					CallExpression(node) {
						const calleeName = node.callee.property && node.callee.property.name
						if (['$emit', 'emit'].includes(calleeName)) {
							setEmitMapFromEmitCall(context, emitMap, node)
						}
					},

					// import
					'ImportDeclaration'(node) {
						importSet.add(getFormatJsCode(context, node))
					},
				},
			),
			// <script setup> 中
			utils.defineScriptSetupVisitor(context, {
				// props
				onDefinePropsEnter(node, propList) {
					// 目前 defineProps 在 script setup 中只能使用一次，onDefinePropsEnter 只会获取第一个 defineProps，下面的方法兼容defineProps 被多次使用时
					let typePropList = []
					let optionPropList = []
					propList.forEach(prop => {
						if (prop.type === 'type') typePropList.push(prop)
						else optionPropList.push(prop)
					})
					const optionPropMap = getPropMapFromPropList(context, optionPropList)
					const typePropMap = getPropMapFromTypePropList(context, typePropList, node.parent.arguments)

					propMap = new Map([...propMap, ...optionPropMap, ...typePropMap])
				},
				// emits
				onDefineEmitsEnter(node, emits) {
					setEmitMapFromEslintPluginVueEmits(context, emits, emitMap)
				},
				// 变量定义，包括 data\computed\inject\箭头函数methods 表现为 const dataA = ref('')
				'Program > VariableDeclaration'(node) {
					const declarations = node.declarations
					declarations.forEach(declaration => {
						if (isUnAddSetupMap(declaration.init)) return
						const left = declaration.id
						let setupName
						let setupComments
						// a = 1 或 a,b=1
						if (left.type === 'Identifier') {
							// a = ref('')
							setupName = left.name
							if (declarations.length === 1) {
								// const a = 1
								setupComments = sourceCode.getCommentsBefore(node)
							} else {
								// let a,b=1
								setupComments = sourceCode.getCommentsBefore(declaration.id)
							}
						}
						if (['ObjectPattern', 'ArrayPattern'].includes(left.type)) {
							forEachPattern([left], (patternItem) => {
								const itemValue = patternItem.value || patternItem
								setupComments = sourceCode.getCommentsBefore(itemValue)
								setupName = itemValue.name
							})
						}
						const setupComment = commentNodesToText(setupComments)
						const setupInfo = {
							setupName,
							setupComment
						}
						setupMap.set(setupName, setupInfo)
					})
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
				// 函数调用
				'Program CallExpression'(node) {
					// 生命周期，表现为 onMounted(()=>{})
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
					const callName = node.callee.name
					if (LIFECYCLE_HOOKS.includes(callName)) {
						const lifecycleHookComments = sourceCode.getCommentsBefore(node)
						const lifecycleHookComment = commentNodesToText(lifecycleHookComments)
						const oldLifecycleHook = lifecycleHookMap.get(callName)
						if ((lifecycleHookComment && oldLifecycleHook)) {
							oldLifecycleHook.lifecycleHookComment = `${oldLifecycleHook.lifecycleHookComment}\n\n${lifecycleHookComment}`
						} else {
							const lifecycleHookInfo = {
								lifecycleHookName: callName,
								lifecycleHookComment
							}
							lifecycleHookMap.set(callName, lifecycleHookInfo)
						}
					}
					// provide
					if (callName === 'provide') {
						const params = node.arguments
						const nameNode = params[0]
						const valueNode = params[1]
						let provideName
						if (nameNode.type === 'Literal') {
							provideName = nameNode.value
						}
						if (nameNode.type === 'Identifier') {
							provideName = `[${nameNode.name}]`
						}
						let provideValue
						const provideValueType = valueNode.type
						if (provideValueType === 'Literal') {
							provideValue = valueNode.value
						}
						if (provideValueType === 'Identifier') {
							provideValue = valueNode.name
						}
						const provideComments = sourceCode.getCommentsBefore(node)
						const provideComment = commentNodesToText(provideComments)
						const provideInfo = {
							provideName,
							provideValue,
							provideValueType,
							provideComment
						}
						provideMap.set(provideName, provideInfo)
					}
					// emit 调用
					if (emitMap.get(callName)) {
						setEmitMapFromEmitCall(context, emitMap, node)
					}
				},
				'ImportDeclaration'(node) {
					const specifiers = node.specifiers
					const source = node.source.value
					specifiers.forEach(specifier => {
						const importType = specifier.type
						// import { default as ClassComponent2 } from "./ClassComponent.vue";
						// import ClassComponent from "./ClassComponent.vue";
						if ((importType === 'ImportSpecifier' && specifier.imported.name === 'default') || importType === "ImportDefaultSpecifier") {
							const importName = specifier.local.name
							setupScriptImportSet.add(importName)
						}
					})
				}
			}),
		)
		return ret
	},
});

linter.defineRule('es-loader', {
	create(context) {
		return {

		}
	}
})



module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	const { exclude } = this.getOptions()
	if (exclude && exclude.test(resource)) return source
	if (!/.vue$/.test(resource)) return source
	if (/.vue$/.test(resource)) {
		const config = {
			parserOptions,
			rules: { "vue-loader": "error" },
			parser: 'vueEslintParser'
		};
		linter.verify(source, config)

		if (setupScriptImportSet.size) {
			for (const [node, { templateValue }] of templateMap) {
				if (!templateValue) continue
				setSome(setupScriptImportSet, (importName) => {
					const componentName = casing.kebabCase(importName)
					const ret = `<${componentName}>` === templateValue
					if (ret) componentMap.set(componentName, importName)
					return ret
				})
			}
		}

		let newCode = ''
		importSet.forEach((value) => {
			newCode += `${value}\n`
		})
		// newCode += `export default ${getCodeFromVueMeta(vueMeta)}`
		initMeta()
		return newCode;
	}
}
