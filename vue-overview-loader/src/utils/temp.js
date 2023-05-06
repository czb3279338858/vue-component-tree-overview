// export，只有ts\js文件有
const exportSet = new Set()
function isVueOption(node) {
	if (node.type !== 'ObjectExpression') return false
	const properties = node.properties
	const noOptionKey = properties.some(p => !['extends', 'mixins', 'filters', 'provide', 'inject', 'emits', 'methods', 'setup', 'computed', 'data', 'props'].includes(p.key.name))
	if (noOptionKey) return false
	return true
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



// {
// 	// 处理ts\js种的option配置
// 	':matches(:not(Program[templateBody]) ExportNamedDeclaration,:not(Program[templateBody]) ExportDefaultDeclaration)'(node) {
// 		// const exportDeclaration = node.declaration
// 		// const exportType = node.type
// 		// // export default filterB
// 		// if (exportDeclaration.type === 'Identifier') {
// 		// 	const variable = getVariableNode(exportDeclaration)
// 		// 	const exportComment = sourceCode.getCommentsBefore(node)
// 		// 	let variableComment = []
// 		// 	if (variable) {
// 		// 		variableComment = sourceCode.getCommentsBefore(variable)
// 		// 	}
// 		// 	debugger
// 		// }
// 		// if (exportDeclaration.type === 'VariableDeclaration') {
// 		// 	const variable = exportDeclaration.declarations[0]
// 		// 	const variableKey = variable.id.name
// 		// 	// 导出的对象有初始值且初始值是vue option配置
// 		// 	if (variable.init && isVueOption(variable.init)) {
// 		// 		return addExportSetFromVueOption(variable.init, exportSet, exportType, variableKey)
// 		// 	}
// 		// 	const exportComment = sourceCode.getCommentsBefore(node)
// 		// 	const exportInfo = {
// 		// 		exportType,
// 		// 		variableKey,
// 		// 		newSourceCode: exportComment,
// 		// 	}
// 		// 	exportSet.add(exportInfo)
// 		// }
// 		// if (exportDeclaration.type === 'ObjectExpression') {
// 		// 	if (isVueOption(exportDeclaration)) {
// 		// 		return addExportSetFromVueOption(exportDeclaration, exportSet, exportType)
// 		// 	}
// 		// }
// 		// debugger
// 	}
// }