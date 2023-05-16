/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */

const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
const casing = require('eslint-plugin-vue/lib/utils/casing')
const { commentNodesToText, getFormatJsCode, getFunFirstReturnNode, forEachPattern, getFunParamsRuntimeType, getRuntimeTypeFromNode, setSome, getVariableComment, getVariableDeclarationNameAndComments, mergeText, getVariableNode, } = require('./utils/commont')
const { isEmptyVText, formatVText, getTemplateCommentBefore } = require('./utils/template')
const { getExpressionContainerInfo, addTemplateMap, getPropInfoFromPropOption, getPropMapFromPropList, LIFECYCLE_HOOKS, getPropMapFromTypePropList, setEmitMapFromEslintPluginVueEmits, deepSetDataMap, forEachDataOptionSetDataMap, setComputedMap, setMapFromVueCommonOption, setMapFormVueOptions, isUnAddSetupMap, setEmitMapFromEmitCall, getInjectFromAndTypeAndDefaultFromInjectOption, isVueOptions } = require('./utils/script')
const { TemplateInfo, PropInfo, SetupInfo, LifecycleHookInfo, FilterInfo, EmitInfo, DataInfo, MethodInfo, ProvideInfo, InjectInfo, Attribute } = require('./utils/meta')
const { at } = require('eslint-plugin-vue/lib/utils/vue2-builtin-components')

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


/**
 * node:{@link TemplateInfo}
 */
const templateMap = new Map()

/**
 * name:{@link PropInfo}
 */
let propMap = new Map()

/**
 * name:{@link SetupInfo}
 */
let setupMap = new Map()


/**
 * name:{@link LifecycleHookInfo}
 */
const lifecycleHookMap = new Map()


/**
 * name:{@link FilterInfo}
 */
const filterMap = new Map()

/**
 * name:{@link EmitInfo}
 */
const emitMap = new Map()

/**
 * name:{@link DataInfo}
 */
const dataMap = new Map()


/**
 * name:{@link ComputedInfo}
 */
const computedMap = new Map()

/**
 * name:{@link MethodInfo}
 */
const methodMap = new Map()

/**
 * name:{@link ProvideInfo}
 */
const provideMap = new Map()

/**
 * name:{@link InjectInfo}
 */
const injectMap = new Map()

/**
 * {"casing.kebabCase(key)":importName}
 */
const componentMap = new Map()

// string[]
const importSet = new Set()

// importName[]
const mixinSet = new Set()

// extend 是 importName
const nameAndExtendMap = new Map()

const modelOptionMap = new Map()

// script setup 中的 import，需要根据 template 中的使用情况进行过滤，然后合并到 componentMap 中
// importName[]
const setupScriptImportSet = new Set()

const exportSet = new Set()

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
	nameAndExtendMap.set('name', undefined)
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
						const template = casing.kebabCase(element.rawName)
						// 标签属性
						const attributes = element.startTag.attributes.map(a => {
							const keyName = getFormatJsCode(context, a.key)
							const value = a.value
							if (value && value.type === "VLiteral") {
								return new Attribute(keyName, value.value, value.type)
							} else {
								const [valueName, valueType, scopeNames, callNames, callParams] = getExpressionContainerInfo(context, value)
								return new Attribute(keyName, valueName, valueType, scopeNames, callNames, callParams)
							}
						})
						const comment = getTemplateCommentBefore(element)
						const templateInfo = new TemplateInfo(`<${template}>`, 'VElement', attributes, comment, [])
						addTemplateMap(element, templateInfo, templateMap)
					},
					// 标签内文本
					'VElement>VText'(node) {
						if (isEmptyVText(node)) return
						const templateInfo = new TemplateInfo(`"${formatVText(node.value)}"`, 'VText', undefined, getTemplateCommentBefore(node), undefined)
						addTemplateMap(node, templateInfo, templateMap)
					},
					// 标签内{{ }}
					'VElement>VExpressionContainer'(node) {
						const [value, type, , callNames, callParams,] = getExpressionContainerInfo(context, node)
						const templateInfo = new TemplateInfo(`${getFormatJsCode(context, node)}`, type, undefined, getTemplateCommentBefore(node), undefined, value, callNames, callParams)
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

							const name = prop.key.name
							const propOption = decoratorParams[0]

							const [defaultValue, type, required] = getPropInfoFromPropOption(context, propOption, prop)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propNameComments = sourceCode.getCommentsAfter(node)
							const comment = commentNodesToText([...decoratorComments, ...propNameComments])

							const propInfo = new PropInfo(name, defaultValue, type, required, comment)
							propMap.set(name, propInfo)
						},
						// class component @PropSync
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=PropSync]'(node) {
							// prop
							const decoratorParams = node.expression.arguments
							const computed = node.parent

							const name = decoratorParams[0].value
							const propOption = decoratorParams[1]

							const [defaultValue, type, required] = getPropInfoFromPropOption(context, propOption, computed)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const computedComments = sourceCode.getCommentsAfter(node)
							const comment = commentNodesToText([...decoratorComments, ...computedComments])

							const propInfo = new PropInfo(name, defaultValue, type, required, comment)
							propMap.set(name, propInfo)

							// computed
							const computedComment = `all:${comment}`
							const computedName = computed.key.name
							setComputedMap(computedMap, computedName, computedComment)

							// emit 事件 update:propName
							const emitName = `"update:${name}"`
							const emitInfo = new EmitInfo(emitName, [type], comment)
							emitMap.set(emitName, emitInfo)
						},
						// class component @Model
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Model]'(node) {
							const decoratorParams = node.expression.arguments
							const prop = node.parent

							const name = prop.key.name
							const propOption = decoratorParams[1]

							const [defaultValue, type, required] = getPropInfoFromPropOption(context, propOption, prop)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propComments = sourceCode.getCommentsAfter(node)
							const comment = commentNodesToText([...decoratorComments, ...propComments])

							const propInfo = new PropInfo(name, defaultValue, type, required, comment)
							propMap.set(name, propInfo)

							// modelOption
							const modelEvent = decoratorParams[0].value
							modelOptionMap.set('event', modelEvent)
							modelOptionMap.set('prop', name)
						},
						// class component @ModelSync
						'ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=ModelSync]'(node) {
							// prop
							const computed = node.parent
							const decoratorParams = node.expression.arguments

							const name = decoratorParams[0].value
							const propOption = decoratorParams[2]

							const [defaultValue, type, required] = getPropInfoFromPropOption(context, propOption, computed)

							const decoratorComments = sourceCode.getCommentsBefore(node)
							const propComments = sourceCode.getCommentsBefore(decoratorParams[0])
							const computedComments = sourceCode.getCommentsAfter(node)
							const comment = commentNodesToText([...decoratorComments, ...propComments, ...computedComments])

							const propInfo = new PropInfo(name, defaultValue, type, required, comment)
							propMap.set(name, propInfo)

							// modelOption
							modelOptionMap.set('prop', name)
							const modelEvent = decoratorParams[1].value
							modelOptionMap.set('event', modelEvent)

							// computed
							const computedComment = `all:${comment}`
							const computedName = computed.key.name
							setComputedMap(computedMap, computedName, computedComment)

							// emit
							const emitInfo = new EmitInfo(modelEvent, [type], comment)
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

							const propInfo = new PropInfo(propName, propDefault, propType, propRequired, propComment)
							propMap.set(propName, propInfo)

							// emit this.$emit('input', value)
							const emitName = 'input'
							const emitInfo = new EmitInfo(emitName, [propType], propComment)
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
									const lifecycleHookInfo = new LifecycleHookInfo(methodName, methodComment)
									lifecycleHookMap.set(methodName, lifecycleHookInfo)
								} else {
									// 方法 methodA() {}

									const methodInfo = new MethodInfo(methodName, methodComment)
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

							const provideInfo = new ProvideInfo(provideName, 'Identifier', dataName, 'Identifier', provideComment)
							provideMap.set(provideName, provideInfo)

							// data
							const dataComment = commentNodesToText(dataComments)

							const dataInfo = new DataInfo(dataName, dataComment)
							dataMap.set(dataName, dataInfo)
							deepSetDataMap(context, provide, dataMap, dataName, dataComment)
						},
						// @Inject/@InjectReactive
						':matches(ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=Inject],ClassDeclaration > ClassBody > PropertyDefinition > Decorator[expression.callee.name=InjectReactive])'(node) {
							const inject = node.parent
							const injectName = inject.key.name
							const [injectFrom, injectDefault, injectFromType] = getInjectFromAndTypeAndDefaultFromInjectOption(context, node.expression.arguments[0], injectName)
							const decoratorComments = sourceCode.getCommentsBefore(node)
							const injectComments = sourceCode.getCommentsAfter(node)
							const injectComment = commentNodesToText([...decoratorComments, ...injectComments])
							const injectInfo = new InjectInfo(injectName, injectFrom, injectFromType, injectDefault, injectComment)
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
							const emitInfo = new EmitInfo(emitName, emitType, emitComment)
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
						const setupInfo = new SetupInfo(setupName, setupComment)
						setupMap.set(setupName, setupInfo)
					})
				},
				// 函数定义 methods，表现为 function methodA(){}
				'Program>FunctionDeclaration'(node) {
					const setupName = node.id.name
					const setupComments = sourceCode.getCommentsBefore(node)
					const setupComment = commentNodesToText(setupComments)
					const setupInfo = new SetupInfo(setupName, setupComment)
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
							oldLifecycleHook.comment = mergeText(oldLifecycleHook.comment, lifecycleHookComment)
						} else {
							const lifecycleHookInfo = new LifecycleHookInfo(callName, lifecycleHookComment)
							lifecycleHookMap.set(callName, lifecycleHookInfo)
						}
					}
					// provide
					if (callName === 'provide') {
						const params = node.arguments
						const nameNode = params[0]
						const valueNode = params[1]
						const provideName = nameNode.value
						const provideNameType = nameNode.type
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
						const provideInfo = new ProvideInfo(provideName, provideNameType, provideValue, provideValueType, provideComment)
						provideMap.set(provideName, provideInfo)
					}
					// emit 调用
					if (emitMap.get(callName)) {
						setEmitMapFromEmitCall(context, emitMap, node)
					}
				},
				'ImportDeclaration'(node) {
					const specifiers = node.specifiers
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
		const sourceCode = context.getSourceCode()
		return {
			'Program ExportDefaultDeclaration'(node) {
				const declaration = node.declaration
				if (declaration.type !== "Identifier") {
					if (isVueOptions(declaration)) {
						// export default {prop:['a']}
						setMapFormVueOptions(context, declaration, emitMap, propMap, mixinSet, componentMap, filterMap, nameAndExtendMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap)
						const exportCode = getCodeFromMap(templateMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, componentMap, nameAndExtendMap, modelOptionMap, mixinSet)
						exportSet.add(`export default ${exportCode}`)
						initMeta()
					} else {
						// export default {a:1}
						const exportComments = sourceCode.getCommentsBefore(node)
						let exportComment = commentNodesToText(exportComments)
						const variableComment = getVariableComment(context, declaration.name)
						if (variableComment) exportComment = mergeText(exportComment, variableComment)
						exportSet.add(`export default { comment:${JSON.stringify(exportComment)} }`)
					}
				} else {
					const variable = getVariableNode(context, declaration.name)
					const variableInit = variable.init
					if (isVueOptions(variableInit)) {
						// export default VueOption
						setMapFormVueOptions(context, variableInit, emitMap, propMap, mixinSet, componentMap, filterMap, nameAndExtendMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap)
						const exportCode = getCodeFromMap(templateMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, componentMap, nameAndExtendMap, modelOptionMap, mixinSet)
						exportSet.add(`export default ${exportCode}`)
						initMeta()
					} else {
						// export default filterB
						const exportComments = sourceCode.getCommentsBefore(node)
						let exportComment = commentNodesToText(exportComments)
						const variableComment = getVariableComment(context, declaration.name)
						if (variableComment) exportComment = mergeText(exportComment, variableComment)
						exportSet.add(`export default { comment:${JSON.stringify(exportComment)}}`)
					}
				}
			},
			'Program ExportNamedDeclaration'(node) {
				// export { filterE } from './filter-e'
				if (node.source) {
					const exportValue = getFormatJsCode(context, node)
					return exportSet.add(exportValue)
				}
				const declaration = node.declaration
				let exportComments = sourceCode.getCommentsBefore(node)
				let exportComment = commentNodesToText(exportComments)
				// export const filterC = (val: string) => val
				if (declaration && declaration.type === 'VariableDeclaration') {
					const declarations = declaration.declarations
					declarations.forEach(d => {
						const init = d.init
						const [name, comment] = getVariableDeclarationNameAndComments(context, d)
						const variableComment = commentNodesToText(comment)
						const exportName = name
						if (isVueOptions(init)) {
							setMapFormVueOptions(context, init, emitMap, propMap, mixinSet, componentMap, filterMap, nameAndExtendMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap)
							const exportCode = getCodeFromMap(templateMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, componentMap, nameAndExtendMap, modelOptionMap, mixinSet)
							exportSet.add(`export const ${exportName} = ${exportCode}`)
							initMeta()
						} else {
							if (comment) {
								exportSet.add(`export const ${exportName} = { comment:${JSON.stringify(mergeText(exportComment, variableComment))} }`)
							} else {
								exportSet.add(`export const ${exportName} = { comment:${JSON.stringify(exportComment)} }`)
							}
						}
					})
				}
				// export { filterB, filterF }
				// export {filterB as filterD}
				if (node.specifiers.length) {
					const specifiers = node.specifiers
					const exportObj = specifiers.reduce((p, specifier) => {
						const exportName = specifier.exported.name
						const exportComment = commentNodesToText(sourceCode.getCommentsBefore(specifier))
						const variable = getVariableNode(context, specifier.local.name)
						const variableInit = variable.init
						if (isVueOptions(variableInit)) {
							setMapFormVueOptions(context, variableInit, emitMap, propMap, mixinSet, componentMap, filterMap, nameAndExtendMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap)
							const exportCode = getCodeFromMap(templateMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, componentMap, nameAndExtendMap, modelOptionMap, mixinSet)
							p[exportName] = exportCode
							initMeta()
						} else {
							const variableComment = getVariableComment(context, specifier.local.name)
							p[exportName] = `{ comment:${JSON.stringify(mergeText(exportComment, variableComment))} }`
						}
						return p
					}, {})
					// export {filterB as filterD} => export const filterD = {comment:''}
					Object.keys(exportObj).forEach(k => {
						exportSet.add(`export const ${k} = ${exportObj[k]}`)
					})
				}
			}
		}
	}
})
function getCodeFromMetaData(value, noJsonKeys, key) {
	if (value instanceof Map) {
		return getCodeFromMetaData(Object.fromEntries(value), noJsonKeys, key)
	}
	if (value instanceof Set) {
		return getCodeFromMetaData(Array.from(value), noJsonKeys, key)
	}
	if (Array.isArray(value)) {
		if (key === 'mixinSet') {
			return value.length ? `[${value.map(item => item).join(',')}]` : undefined
		} else {
			return value.length ? `[${value.map(item => getCodeFromMetaData(item, noJsonKeys)).join(',')}]` : undefined
		}
	}
	if (typeof value === 'object' && value !== null) {
		const keys = Object.keys(value)
		if (key === 'componentMap') {
			return keys.length ? `{${keys.map(key => `'${key}':${value[key]}`).join(',')}}` : undefined
		} else {
			return keys.length ? `{${keys.map(key => `'${key}':${getCodeFromMetaData(value[key], noJsonKeys, key)}`).join(',')}}` : undefined
		}
	}
	if (key && (noJsonKeys.includes(key) || key === 'extend')) {
		return value
	} else {
		return JSON.stringify(value)
	}
}
function getCodeFromMap(templateMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, componentMap, nameAndExtendMap, modelOptionMap, mixinSet) {
	const template = templateMap.values().next().value
	const name = nameAndExtendMap.get('name')
	const extend = nameAndExtendMap.get('extend')
	const metaData = {
		name,
		modelOptionMap,
		template,
		propMap,
		emitMap,

		setupMap,
		injectMap,
		provideMap,
		lifecycleHookMap,

		computedMap,
		dataMap,
		methodMap,
		filterMap,

		extend,
		mixinSet,

		componentMap,

	}
	return getCodeFromMetaData(metaData, ['importValue'])
}

module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	const { exclude } = this.getOptions()
	if (/node_module/.test(resource) || exclude && exclude.test(resource)) return source
	if (/.vue$/.test(resource)) {
		const config = {
			parserOptions,
			rules: { "vue-loader": "error" },
			parser: 'vueEslintParser'
		};
		linter.verify(source, config)
		let newCode = ''
		importSet.forEach((value) => {
			newCode += `${value}\n`
		})

		// 把 script setup 中 import 的组件写入 componentMap
		if (setupScriptImportSet.size) {
			for (const [, { template }] of templateMap) {
				if (!template) continue
				setSome(setupScriptImportSet, (importName) => {
					const componentName = casing.kebabCase(importName)
					const ret = `<${componentName}>` === template
					if (ret) componentMap.set(componentName, importName)
					return ret
				})
			}
		}
		// 获取新代码
		const exportDefaultCode = getCodeFromMap(templateMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, componentMap, nameAndExtendMap, modelOptionMap, mixinSet)

		newCode += `export default ${exportDefaultCode}`
		initMeta()
		return newCode;
	}
	if (/.[t|j]s$/.test(resource)) {
		const config = {
			parserOptions,
			rules: { "es-loader": "error" },
			parser: 'vueEslintParser'
		};
		linter.verify(source, config)
		const newCode = Array.from(exportSet).join('\n')
		exportSet.clear()
		return newCode
	}
	return source
}
