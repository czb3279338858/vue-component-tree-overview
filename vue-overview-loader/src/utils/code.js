const casing = require("eslint-plugin-vue/lib/utils/casing")
const { setSome } = require("./commont")

function getCodeFromMetaData(value, noJsonKeys, key) {
  if (value instanceof Map) {
    return getCodeFromMetaData(Object.fromEntries(value), noJsonKeys, key)
  }
  if (value instanceof Set) {
    return getCodeFromMetaData(Array.from(value), noJsonKeys, key)
  }
  if (Array.isArray(value)) {
    if (key === 'mixinSet') {
      return `[${value.map(item => item).join(',')}]`
    } else {
      return `[${value.map(item => getCodeFromMetaData(item, noJsonKeys)).join(',')}]`
    }
  }
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value)
    if (key === 'componentMap') {
      return `{${keys.map(key => `'${key}':${value[key]}`).join(',')}}`
    } else {
      return `{${keys.map(key => `'${key}':${getCodeFromMetaData(value[key], noJsonKeys, key)}`).join(',')}}`
    }
  }
  if (key && (noJsonKeys.includes(key) || key === 'extend')) {
    return value
  } else {
    if (value === undefined) {
      return 'undefined'
    }
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
function runLinterGetVueExportCode(linter, source, setupScriptImportSet, templateMap, componentMap, propMap, setupMap, provideMap, lifecycleHookMap, filterMap, computedMap, emitMap, dataMap, methodMap, injectMap, nameAndExtendMap, modelOptionMap, mixinSet, parserOptions) {
  const config = {
    parserOptions,
    rules: { "vue-loader": "error" },
    parser: 'vueEslintParser'
  };
  linter.verify(source, config)

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
  return exportDefaultCode
}
module.exports = {
  getCodeFromMap,
  runLinterGetVueExportCode
}