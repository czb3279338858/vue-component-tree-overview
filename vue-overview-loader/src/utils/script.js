const { getCallExpressionParamsAndFunNames, getFormatJsCode, getPatternNames, commentNodesToText, forEachVariableNodes, getFunParamsRuntimeType, getVariableNode, getFunFirstReturnNode } = require("./commont")
const tsUtils = require('./ts-ast-utils')
const casing = require('eslint-plugin-vue/lib/utils/casing')
/**
 * 获取表达式容器的信息
 * 1、适用于标签属性的绑定值
 * 2、适用于{{}}中的绑定值
 * @param {*} container 
 * @returns [valueName, valueType,scopeNames, callNames，callParams,vForName]
 */
function getExpressionContainerInfo(sourceCode, container) {
  // 没有绑定值时，例如 v-else
  if (!container) return []

  // 绑定指是常量
  if (container.expression.type === 'Literal') {
    return [container.expression.raw, container.expression.type]
  }

  // 绑定值是变量（函数或变量），[变量名,'Identifier']
  if (container.expression.type === 'Identifier') return [container.expression.name, container.expression.type]

  // 表达式(e.a)直接返回文本
  if (['MemberExpression'].includes(container.expression.type)) {
    return [getFormatJsCode(sourceCode, container.expression), container.expression.type]
  }

  // 绑定值是函数调用
  if (container.expression.type === 'CallExpression') {
    const [callParams, callNames] = getCallExpressionParamsAndFunNames(sourceCode, container.expression)
    return [getFormatJsCode(sourceCode, container.expression), container.expression.type, undefined, callNames, callParams]
  }

  // filter filter的顺序做了颠倒和函数一致符合它的书写顺序
  if ('VFilterSequenceExpression' === container.expression.type) {
    const callNames = container.expression.filters.map(f => f.callee.name).reverse()
    const callParam = container.expression.expression.name
    return [getFormatJsCode(sourceCode, container.expression), container.expression.type, undefined, callNames, [callParam]]
  }

  // 绑定值是v-for的值
  // 遍历的对象只支持变量
  if (container.expression.type === 'VForExpression') {
    return [getFormatJsCode(sourceCode, container.expression), container.expression.type, getPatternNames(container.expression.left), undefined, undefined, container.expression.right.name]
  }

  // 绑定值是slot-scope或v-slot
  if (container.expression.type === 'VSlotScopeExpression') {
    const scopeNames = getPatternNames(container.expression.params)
    return [getFormatJsCode(sourceCode, container.expression), container.expression.type, scopeNames]
  }

  // 其他
  return [getFormatJsCode(sourceCode, container.expression), container.expression.type]
}

/**
 * 添加 templateInfo 信息到 templateMap 中
 * 会把当前节点添加到父节点的children中
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

/**
 * 通过 propOption 中 type 的配置获取 prop 的运行时的类型
 * 支持 ts
 * @param {*} typeValue 
 * @returns ['Number','String']
 */
function getPropTypeFromPropTypeOption(context, typeValue) {
  switch (typeValue.type) {
    // Number
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
 * 从 propOption 获取 default、type、required
 * @param {*} propOption 
 * @param {*} propNode 
 * @returns [propDefault, propType, propRequired]
 */
function getPropInfoFromPropOption(context, propOption, propNode) {
  const sourceCode = context.getSourceCode()
  let propDefault, propType, propRequired
  // option 中的 prop 可以没有参数
  if (propOption) {
    // 通过prop配置项获取
    switch (propOption.type) {
      // propB: Number
      case 'Identifier':
        propType = getPropTypeFromPropTypeOption(context, propOption)
        break;
      // propA:{default:'propADefault',type:String,require:true}
      case 'ObjectExpression':
        propOption.properties.forEach(d => {
          const key = d.key.name
          switch (key) {
            case 'default':
              propDefault = getFormatJsCode(sourceCode, d.value)
              // TODO: 根据 default 推断 propType
              break;
            case 'type':
              propType = getPropTypeFromPropTypeOption(context, d.value)
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
      // propC: [Number, String]
      case 'ArrayExpression':
        propType = getPropTypeFromPropTypeOption(context, propOption)
        break;
    }
  }
  // 如果没有类型，尝试从ts中获取
  if (propNode && propNode.typeAnnotation) {
    if (!propType) {
      const typeAnnotation = propNode.typeAnnotation.typeAnnotation
      propType = tsUtils.inferRuntimeType(context, typeAnnotation)
    }
    if (propRequired === undefined) {
      propRequired = !propNode.optional
    }
  }
  return [propDefault, propType, propRequired]
}

/**
 * 从 utils.getComponentPropsFromOptions 返回的 props 中提取 propInfo 生成 propMap 并返回
 * @param {*} propList 
 * @returns 返回 map key:{propName,propDefault,propType,propRequired,propComment}
 */
function getPropMapFromPropList(context, propList) {
  const sourceCode = context.getSourceCode()
  const propMap = new Map()

  propList.forEach(propOption => {
    const propName = propOption.propName
    const [propDefault, propType, propRequired] = getPropInfoFromPropOption(context, propOption.value)
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
 * setup中的变量初始化不需要添加setupMap中的项
 * 1.没有初始化的变量
 * 2.初始化是函数调用，函数名为特定项
 * 3.初始化是常量
 * @param {*} init 
 * @returns 
 */
function isUnAddSetupMap(init) {
  return !init
    || (
      init
      && (
        (init.type === 'CallExpression' && ['defineEmits', 'defineProps', 'useContext'].includes(init.callee.name))
        || init.type === 'Literal'
      )
    )
}
/**
 * 在 <script setup> 中
 * 从变量定义中添加 setupMap
 * 支持 const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
 * @param {*} sourceCode 
 * @param {*} variable 
 * @param {*} setupMap 
 */
function addSetupMapFromVariable(sourceCode, variable, setupMap) {
  const needAddSetupMapDeclarations = variable.filter(d => {
    return !isUnAddSetupMap(d.init)
  })
  // 遍历允许添加到 setupMap 的变量定义
  // declarations:例如：const provideData = ref(""); => provideData = ref("")
  forEachVariableNodes(sourceCode, needAddSetupMapDeclarations, (setupName, setupComment) => {
    const setupInfo = {
      setupName,
      setupComment
    }
    setupMap.set(setupName, setupInfo)
  })
}
/**
 * script setup 中 withDefaults(defineProps<Props>(), {}) 提取 propInfo 生成 propMap 返回
 * @param {*} props 
 * @param {*} withDefaultsParams
 * @returns 返回 map key:{propName,propDefault,propType,propRequired,propComment}
 */
function getPropMapFromTypePropList(sourceCode, props, withDefaultsParams) {
  const propMap = new Map()

  const propDefaultNodes = (withDefaultsParams && withDefaultsParams[1]) ? withDefaultsParams[1].properties : []

  props.forEach(prop => {
    const propName = prop.propName

    const propDefaultNode = propDefaultNodes.find(p => p.key.name === propName)
    const propDefault = propDefaultNode ? getFormatJsCode(sourceCode, propDefaultNode.value) : undefined

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

/**
 * 不带on的生命周期
 */
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

/**
 * defineEmits 中获取 emit 的校验函数文本
 * @param {*} emit 
 * @param {*} sourceCode 
 * @returns 
 */
function getEmitParamsVerifyFromDefineEmits(emit, sourceCode) {
  const defineEmitsParamType = emit.type
  if (['array', 'type'].includes(defineEmitsParamType)) return undefined
  const emitValue = emit.value
  const emitValueType = emitValue.type

  if (['FunctionExpression'].includes(emitValueType)) return getFormatJsCode(sourceCode, emitValue.parent)

  // ArrowFunctionExpression 箭头函数
  if ('ArrowFunctionExpression' === emitValueType) return getFormatJsCode(sourceCode, emitValue)

  return undefined
}
/**
 * 获取 OnDefineEmitsEnter 选择器中 emits 中单个 emit 的参数的类型
 * @param {*} context 
 * @param {*} emit 
 * @returns // 2个参数的话[['String','Number'],['Number']]
 */
function getEmitParamsTypeFromDefineEmits(context, emit) {
  const defineEmitsParamType = emit.type

  // 参数是对象
  if (defineEmitsParamType === 'object') {
    const emitValue = emit.value
    if (['ArrowFunctionExpression', 'FunctionExpression'].includes(emitValue.type)) return getFunParamsRuntimeType(emitValue.params, context)
    return undefined
  }
  // 类型
  if (defineEmitsParamType === 'type') {
    const typeFunParams = emit.node.params.slice(1)
    if (typeFunParams) {
      return typeFunParams.reduce((p, param) => {
        const type = tsUtils.inferRuntimeType(context, param.typeAnnotation.typeAnnotation)
        p.push(type)
        return p
      }, [])
    }
  }
  return undefined
}
/**
 * emit分为定义时和调用时，都可以获取注释和参数类型，统一在这里整合
 * @param {*} emitMap 
 * @param {*} emitName 
 * @param {*} emitType 
 * @param {*} emitComment 
 * @param {*} emitParamsVerify 
 */
function setEmitMap(emitMap, emitName, emitType, emitComment, emitParamsVerify) {
  const oldEmit = emitMap.get(emitName)
  if (oldEmit) {
    oldEmit.emitComment = `${oldEmit.emitComment}\n\n${emitComment}`
    const oldEmitType = oldEmit.emitType
    emitType && emitType.forEach((type, index) => {
      if (type && !oldEmitType[index]) oldEmitType[index] = type
    })
    if (emitParamsVerify && !oldEmit.emitParamsVerify) {
      oldEmit.emitParamsVerify = emitParamsVerify
    }
  } else {
    const emitInfo = {
      emitName,
      emitType,
      emitComment,
      emitParamsVerify
    }
    emitMap.set(emitName, emitInfo)
  }
}

/**
 * eslintPluginVue提供了几种方法获取emits，这些emit的数据格式是一致的
 * 1、utils.getComponentEmitsFromOptions
 * 2、onDefineEmitsEnter
 * @param {*} emits 
 * @param {*} context 
 * @param {*} emitMap 
 */
function setEmitMapFromEslintPluginVueEmits(emits, context, emitMap) {
  const sourceCode = context.getSourceCode()
  emits.forEach(emit => {
    const emitName = emit.emitName
    const emitComments = sourceCode.getCommentsBefore(emit.node)
    const emitComment = commentNodesToText(emitComments)
    const emitType = getEmitParamsTypeFromDefineEmits(context, emit)
    const emitParamsVerify = getEmitParamsVerifyFromDefineEmits(emit, sourceCode)
    setEmitMap(emitMap, emitName, emitType, emitComment, emitParamsVerify)
  })
}
/**
 * 如果 data 的 value 是对象或函数调用，则会递归遍历其内部的属性，设置dataMap
 * data:{a:{b:1}} => dataMap {a:{dataName:'a',dataComment:'xxx'},a.b:{dataName:'a.b',dataComment:'xxx'}}
 * a.b的dataComment是a的dataComment和b的dataComment的合并
 * @param {*} dataOption 
 * @param {*} dataMap 
 * @param {*} dataName 
 * @param {*} parentDataComment 
 */
function deepSetDataMap(context, dataOption, dataMap, dataName, parentDataComment) {
  const dataValue = dataOption.value
  if (dataValue.type === 'ObjectExpression') {
    forEachDataOptionSetDataMap(context, dataValue.properties, dataMap, parentDataComment, dataName)
  }
  if (dataValue.type === 'CallExpression') {
    const variableNode = getVariableNode(dataValue.callee, context)
    if (variableNode) {
      const returnNode = getFunFirstReturnNode(variableNode)
      if (returnNode && returnNode.argument.type === "ObjectExpression") {
        forEachDataOptionSetDataMap(context, returnNode.argument.properties, dataMap, parentDataComment, dataName)
      }
    }
  }
}
/**
 * 遍历dataOption，设置dataMap，
 * 如果 data 的 value 是对象或函数调用，则会递归遍历其内部的属性，设置dataMap
 * data:{a:{b:1}} => dataMap {a:{dataName:'a',dataComment:'xxx'},a.b:{dataName:'a.b',dataComment:'xxx'}}
 * @param {*} dataOptions 
 * @param {*} dataMap 
 * @param {*} parentComment 
 * @param {*} parentName 
 */
function forEachDataOptionSetDataMap(context, dataOptions, dataMap, parentComment, parentName) {
  const sourceCode = context.getSourceCode()
  dataOptions.forEach(dataOption => {
    const dataName = parentName ? `${parentName}.${dataOption.key.name}` : dataOption.key.name
    const dataComments = sourceCode.getCommentsBefore(dataOption)
    const dataComment = commentNodesToText(dataComments)
    const dataInfo = {
      dataName,
      dataComment: parentComment ? `${parentComment}\n\n${dataComment}` : dataComment
    }
    dataMap.set(dataName, dataInfo)
    deepSetDataMap(context, dataOption, dataMap, dataName, dataInfo.dataComment)
  })
}
/**
 * 计算属性的注释可能有多个来源，专门在这里处理
 * @param {*} computedMap 
 * @param {*} computedName 
 * @param {*} computedComment 
 */
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
/**
 * 遍历provide的配置对象 set provideMap
 * @param {*} properties 
 * @param {*} provideMap 
 * @returns 
 */
function forEachProvideOptionSetProvideMap(properties, provideMap, sourceCode) {
  return properties.forEach(provide => {
    let provideName = provide.key.name
    // 如果对象中的key是[变量]的形式
    if (provide.computed) {
      provideName = `[${provideName}]`
    }
    const provideFromKey = getFormatJsCode(sourceCode, provide.value)
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
/**
 * 从 injectOption 中获取 from 和 default
 * @param {*} injectOption 
 * @param {*} injectName 
 * @returns 
 */
function getInjectFromAndDefaultFromInjectOption(injectOption, injectName, sourceCode) {
  if (injectOption === undefined) return [injectName, undefined]
  // 常量字符串
  if (injectOption.type === 'Literal') return [injectOption.raw, undefined]
  // 对象
  if (injectOption.type === 'ObjectExpression') {
    const ret = injectOption.properties.reduce((p, c) => {
      if (c.key.name === 'from') p[0] = c.value.raw
      if (c.key.name === 'default') p[1] = getFormatJsCode(sourceCode, c.value)
      return p
    }, [undefined, undefined])
    if (!ret[0]) ret = injectName
    return ret
  }
  // 变量名
  if (injectOption.type === 'Identifier') return [`${injectOption.name}`, undefined]
  return [undefined, undefined]
}

/**
 * 根据vue option设置对应的map
 * 包括filter,components,name,mixins
 * @param {*} optionKeyName 
 * @param {*} optionValue 
 * @param {*} mixinSet 
 * @param {*} componentMap 
 * @param {*} filterMap 
 * @param {*} otherOptionMap 
 */
function setMapFromVueCommonOption(context, optionKeyName, optionValue, mixinSet, componentMap, filterMap, otherOptionMap) {
  const sourceCode = context.getSourceCode()
  if (optionKeyName === 'mixins') {
    optionValue.elements.forEach(mixin => {
      const mixinName = mixin.name
      mixinSet.add(mixinName)
    })
  }

  if (optionKeyName === 'name') {
    otherOptionMap.set('componentName', optionValue.value)
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
      const filterValueNode = getVariableNode(filter.value, context)
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
module.exports = {
  setMapFromVueCommonOption,
  getInjectFromAndDefaultFromInjectOption,
  forEachProvideOptionSetProvideMap,
  setComputedMap,
  deepSetDataMap,
  forEachDataOptionSetDataMap,
  setEmitMapFromEslintPluginVueEmits,
  setEmitMap,
  getEmitParamsTypeFromDefineEmits,
  getEmitParamsVerifyFromDefineEmits,
  LIFECYCLE_HOOKS,
  getPropMapFromTypePropList,
  addSetupMapFromVariable,
  getPropMapFromPropList,
  addTemplateMap,
  getExpressionContainerInfo,
  getPropInfoFromPropOption
}