/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */

const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const { TemplateInfo, PropInfo, SetupInfo, LifecycleHookInfo, FilterInfo, EmitInfo, DataInfo, MethodInfo, ProvideInfo, InjectInfo } = require('./utils/meta')
const { runLinterGetVueExportCode } = require('./utils/code')
const { getVueLoader } = require('./utils/vue-loader')
const { getEsLoader } = require('./utils/es-loader')
const { clearTemplateAllComments } = require('./utils/template')

const linter = new Linter()
const parserOptions = {
	ecmaVersion: 2020,
	sourceType: "module",
	parser: '@typescript-eslint/parser',
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
	mixinSet.clear()
	nameAndExtendMap.set('name', undefined)
	nameAndExtendMap.set('extend', undefined)
	modelOptionMap.set('prop', 'value')
	modelOptionMap.set('event', 'input')
}
initMeta()
importSet.clear()
exportSet.clear()


linter.defineRule("vue-loader", {
	create(context) {
		return getVueLoader(context, setupScriptImportSet, templateMap, componentMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, nameAndExtendMap, modelOptionMap, mixinSet, importSet)
	},
});

linter.defineRule('es-loader', {
	create(context) {
		return getEsLoader(context, exportSet, templateMap, componentMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, nameAndExtendMap, modelOptionMap, mixinSet, initMeta, importSet)
	}
})


module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	const { routes: { include } } = this.query
	if (/node_module/.test(resource) || (include && include.test(resource))) return source
	if (/.vue$/.test(resource)) {
		clearTemplateAllComments()
		const exportDefaultCode = runLinterGetVueExportCode(linter, source, setupScriptImportSet, templateMap, componentMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, nameAndExtendMap, modelOptionMap, mixinSet, parserOptions, resource)
		let newCode = ''
		importSet.forEach((value) => {
			newCode += `${value}\n`
		})
		newCode += `export default ${exportDefaultCode}`
		initMeta()
		importSet.clear()
		exportSet.clear()
		return newCode;
	}
	if (/.[t|j]s$/.test(resource)) {
		const config = {
			parserOptions,
			rules: { "es-loader": "error" },
			parser: 'vueEslintParser'
		};
		linter.verify(source, config)
		let newCode = ''
		importSet.forEach((value) => {
			newCode += `${value}\n`
		})
		newCode += Array.from(exportSet).join('\n')
		exportSet.clear()
		importSet.clear()
		return newCode
	}
	return source
}
