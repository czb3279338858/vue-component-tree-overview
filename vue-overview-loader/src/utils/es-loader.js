const { getCodeFromMap } = require('./code')
const { commentNodesToText, getFormatJsCode, getVariableComment, getVariableDeclarationNameAndComments, mergeText, getVariableNode, } = require('./commont')
const { setMapFormVueOptions, isVueOptions } = require('./script')
function getEsLoader(context, exportSet, templateMap, componentMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, nameAndExtendMap, modelOptionMap, mixinSet, initMeta) {
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
          // export default new ClassName()
          const exportComments = sourceCode.getCommentsBefore(node)
          let exportComment = commentNodesToText(exportComments)
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
module.exports = { getEsLoader }