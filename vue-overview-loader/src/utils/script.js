const { getCallExpressionParamsAndFunNames, getFormatJsCode, getPatternNames, commentNodesToText, getFunParamsRuntimeType, getVariableNode, getFunFirstReturnNode, isThisMember, getVariableComment, getRuntimeTypeFromNode, mergeText } = require("./commont")
const { PropInfo, LifecycleHookInfo, filterInfo, FilterInfo, EmitInfo, DataInfo, ComputedInfo, MethodInfo, ProvideInfo, InjectInfo, SetupInfo } = require("./meta")
const tsUtils = require('./ts-ast-utils')
const casing = require('eslint-plugin-vue/lib/utils/casing')
const utils = require('eslint-plugin-vue/lib/utils/index')
/**
 * 获取表达式容器的信息
 * 1、适用于标签属性的绑定值
 * 2、适用于{{}}中的绑定值
 * @param {*} container 
 * @returns [valueName, valueType,scopeNames, callNames，callParams]
 */
function getExpressionContainerInfo(context, container) {
  // 没有绑定值时，例如 v-else
  if (!container) return []

  // 绑定指是常量
  if (container.expression.type === 'Literal') {
    return [getFormatJsCode(context, container.expression), container.expression.type, , , [container.expression.raw]]
  }

  // 绑定值是变量（函数或变量），[变量名,'Identifier']
  if (container.expression.type === 'Identifier') return [getFormatJsCode(context, container.expression), container.expression.type, , , [container.expression.name]]

  // 表达式(e.a)直接返回文本
  if (['MemberExpression'].includes(container.expression.type)) {
    const expressionText = getFormatJsCode(context, container.expression)
    return [expressionText, container.expression.type, , , [expressionText]]
  }

  // 绑定值是函数调用
  if (container.expression.type === 'CallExpression') {
    const [callParams, callNames] = getCallExpressionParamsAndFunNames(context, container.expression)
    return [getFormatJsCode(context, container.expression), container.expression.type, undefined, callNames, callParams]
  }

  // filter filter的顺序做了颠倒和函数一致符合它的书写顺序
  if ('VFilterSequenceExpression' === container.expression.type) {
    const callNames = container.expression.filters.map(f => f.callee.name).reverse()
    const callParam = container.expression.expression.name
    return [getFormatJsCode(context, container.expression), container.expression.type, undefined, callNames, [callParam]]
  }

  // 绑定值是v-for的值
  // 遍历的对象只支持变量
  if (container.expression.type === 'VForExpression') {
    return [getFormatJsCode(context, container.expression), container.expression.type, getPatternNames(container.expression.left), undefined, [container.expression.right.name]]
  }

  // 绑定值是slot-scope或v-slot
  if (container.expression.type === 'VSlotScopeExpression') {
    const scopeNames = getPatternNames(container.expression.params)
    return [getFormatJsCode(context, container.expression), container.expression.type, scopeNames]
  }

  // 其他
  return [getFormatJsCode(context, container.expression), container.expression.type]
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
 * 从 propOption 的 default 获取 prop type 的运行时类型
 * @param {*} context 
 * @param {*} propDefault 
 * @returns ['Array']
 */
function getPropTypeFromPropDefault(context, propDefault) {
  if (!propDefault) return undefined
  if (['FunctionDeclaration', 'ArrowFunctionExpression'].includes(propDefault.type)) {
    const returnNode = getFunFirstReturnNode(propDefault)
    if (returnNode) {
      return getRuntimeTypeFromNode(context, returnNode.argument)
    }
    return undefined
  } else {
    return getRuntimeTypeFromNode(context, propDefault)
  }
}
/**
 * 从 propOption 获取 default、type、required
 * @param {*} propOption 
 * @param {*} propNode 
 * @returns [propDefault, propType, propRequired]
 */
function getPropInfoFromPropOption(context, propOption, propNode) {
  let propDefault, propType, propRequired, propTypeFromDefault
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
              propDefault = getFormatJsCode(context, d.value)
              propTypeFromDefault = getPropTypeFromPropDefault(context, d.value)
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
  // 如果还没有类型，把 default 的类型作为类型
  if (!propType) {
    propType = propTypeFromDefault
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
    const name = propOption.propName
    const [defaultValue, type, required] = getPropInfoFromPropOption(context, propOption.value)
    const propComments = sourceCode.getCommentsBefore(propOption.key)
    const comment = commentNodesToText(propComments)
    const propInfo = new PropInfo(name, defaultValue, type, required, comment)
    propMap.set(name, propInfo)
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
  return init
    && (
      (init.type === 'CallExpression' && ['defineEmits', 'defineProps', 'useContext'].includes(init.callee.name))
      || init.type === 'Literal'
    )
}

/**
 * script setup 中 withDefaults(defineProps<Props>(), {}) 提取 propInfo 生成 propMap 返回
 * @param {*} props 
 * @param {*} withDefaultsParams
 * @returns 返回 map key:{propName,propDefault,propType,propRequired,propComment}
 */
function getPropMapFromTypePropList(context, props, withDefaultsParams) {
  const sourceCode = context.getSourceCode()
  const propMap = new Map()

  const propDefaultNodes = (withDefaultsParams && withDefaultsParams[1]) ? withDefaultsParams[1].properties : []

  props.forEach(prop => {
    const propName = prop.propName

    const propDefaultNode = propDefaultNodes.find(p => p.key.name === propName)
    const propDefault = propDefaultNode ? getFormatJsCode(context, propDefaultNode.value) : undefined

    const propType = prop.types
    const propRequired = prop.required

    const typeComments = sourceCode.getCommentsBefore(prop.key)
    const defaultComments = propDefaultNode ? sourceCode.getCommentsBefore(propDefaultNode) : []
    const propComment = commentNodesToText([...typeComments, ...defaultComments])

    const propInfo = new PropInfo(propName, propDefault, propType, propRequired, propComment)
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
 * @param {*} context 
 * @returns 
 */
function getEmitParamsVerifyFromDefineEmits(context, emit) {
  const defineEmitsParamType = emit.type
  if (['array', 'type'].includes(defineEmitsParamType)) return undefined
  const emitValue = emit.value
  const emitValueType = emitValue.type

  if (['FunctionExpression'].includes(emitValueType)) return getFormatJsCode(context, emitValue.parent)

  // ArrowFunctionExpression 箭头函数
  if ('ArrowFunctionExpression' === emitValueType) return getFormatJsCode(context, emitValue)

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
    if (['ArrowFunctionExpression', 'FunctionExpression'].includes(emitValue.type)) return getFunParamsRuntimeType(context, emitValue.params)
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
    oldEmit.comment = mergeText(oldEmit.comment, emitComment)
    const oldEmitType = oldEmit.type
    emitType && emitType.forEach((type, index) => {
      if (type && (!oldEmitType[index] || oldEmitType[index].every(t => type.includes(t)))) oldEmitType[index] = type
    })
    if (emitParamsVerify && !oldEmit.paramsVerify) {
      oldEmit.paramsVerify = emitParamsVerify
    }
  } else {
    const emitInfo = new EmitInfo(emitName, emitType, emitComment, emitParamsVerify)
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
function setEmitMapFromEslintPluginVueEmits(context, emits, emitMap) {
  const sourceCode = context.getSourceCode()
  emits.forEach(emit => {
    const emitName = emit.emitName
    const emitComments = sourceCode.getCommentsBefore(emit.node)
    const emitComment = commentNodesToText(emitComments)
    const emitType = getEmitParamsTypeFromDefineEmits(context, emit)
    const emitParamsVerify = getEmitParamsVerifyFromDefineEmits(context, emit)
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
    const variableNode = getVariableNode(context, dataValue.callee)
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
    const dataInfo = new DataInfo(dataName, mergeText(parentComment, dataComment))
    dataMap.set(dataName, dataInfo)
    deepSetDataMap(context, dataOption, dataMap, dataName, dataInfo.comment)
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
    oldComputed.computedComment = mergeText(oldComputed.computedComment, computedComment)
  } else {
    const computedInfo = new ComputedInfo(computedName, computedComment)
    computedMap.set(computedName, computedInfo)
  }
}


/**
 * 获取 provide option 中 value 的值和类型
 * @param {*} context 
 * @param {*} provideOption 
 * @param {*} provide 
 * @returns {provideValue:'provideSymbolFrom.a',provideValueType:'MemberExpression'|'Literal'}
 */
function getProvideValueAndValueType(context, provideOption, provide) {
  const sourceCode = context.getSourceCode()
  let provideValue
  let provideValueType
  if (provideOption.type === 'FunctionExpression') {
    const value = provide.value
    if (value.type === 'MemberExpression' && isThisMember(value)) {
      const valueText = sourceCode.getText(value)
      provideValue = valueText.replace('this.', '')
      provideValueType = 'Identifier'
    }
    if (value.type === 'Literal') {
      provideValue = value.value
      provideValueType = value.type
    }
  }
  if (provideOption.type === 'ObjectExpression') {
    provideValue = provide.value.value
    provideValueType = 'Identifier'
  }
  return {
    provideValue,
    provideValueType
  }
}
/**
 * 遍历provide的配置对象 set provideMap
 * @param {*} provideOption 
 * @param {*} provideMap 
 * @returns 
 */
function forEachProvideOptionSetProvideMap(context, provideOption, provideMap) {
  const sourceCode = context.getSourceCode()
  let properties = []
  if (provideOption.type === 'ObjectExpression') {
    properties = provideOption.properties
  }
  if (provideOption.type === 'FunctionExpression') {
    const funRet = getFunFirstReturnNode(provideOption)
    properties = funRet.argument.properties
  }
  return properties.forEach(provide => {
    const provideName = provide.key.name
    let provideNameType = 'Literal'
    // 如果对象中的key是[变量]的形式
    if (provide.computed) {
      provideNameType = 'Identifier'
    }
    const { provideValue, provideValueType } = getProvideValueAndValueType(context, provideOption, provide)
    const provideComments = sourceCode.getCommentsBefore(provide)
    const provideComment = commentNodesToText(provideComments)
    const provideInfo = new ProvideInfo(provideName, provideNameType, provideValue, provideValueType, provideComment)
    provideMap.set(provideName, provideInfo)
  })
}
/**
 * 从 injectOption 中获取 from 和 default 和 fromType
 * @param {*} injectOption 
 * @param {*} injectName 
 * @returns 
 */
function getInjectFromAndTypeAndDefaultFromInjectOption(context, injectOption, injectName) {
  if (injectOption === undefined) return [injectName, undefined, 'Literal']
  // 常量字符串
  if (injectOption.type === 'Literal') return [injectOption.raw, undefined, injectOption.type]
  // 对象
  if (injectOption.type === 'ObjectExpression') {
    const ret = injectOption.properties.reduce((p, c) => {
      if (c.key.name === 'from') p[0] = c.value.raw
      if (c.key.name === 'default') p[1] = getFormatJsCode(context, c.value)
      return p
    }, [undefined, undefined, 'Literal'])
    if (!ret[0]) ret = [injectName]
    return ret
  }
  // 变量名
  if (injectOption.type === 'Identifier') return [injectOption.name, undefined, injectOption.type]
  return [undefined, undefined, undefined]
}

/**
 * 根据vue option设置对应的map
 * 包括filter,components,name,mixins
 * @param {*} optionKeyName 
 * @param {*} optionValue 
 * @param {*} mixinSet 
 * @param {*} componentMap 
 * @param {*} filterMap 
 * @param {*} nameAndExtendMap 
 */
function setMapFromVueCommonOption(context, optionKeyName, optionValue, mixinSet, componentMap, filterMap, nameAndExtendMap) {
  const sourceCode = context.getSourceCode()
  if (optionKeyName === 'mixins') {
    optionValue.elements.forEach(mixin => {
      const mixinName = mixin.name
      mixinSet.add(mixinName)
    })
  }

  if (optionKeyName === 'name') {
    nameAndExtendMap.set('name', optionValue.value)
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
      let filterComment = commentNodesToText(filterComments)
      const filterValueNode = getVariableNode(context, filter.value)
      let importValue = undefined
      if (filterValueNode) {
        if (['ImportSpecifier', 'ImportDefaultSpecifier'].includes(filterValueNode.type)) {
          importValue = filter.value.name
        } else {
          const variableComment = getVariableComment(context, filter.value)
          if (variableComment)
            filterComment = mergeText(filterComment, variableComment)
        }
      }
      const filterInfo = new FilterInfo(filterName, filterComment, importValue)
      filterMap.set(filterName, filterInfo)
    })
  }
}
// 从options中提取name\extends\mixins\components\filters\生命周期\props\computed\methods\setup\emits\provide\inject\data塞入对应的map对象中
function setMapFormVueOptions(context, optionNode, emitMap, propMap, mixinSet, componentMap, filterMap, nameAndExtendMap, lifecycleHookMap, provideMap, injectMap, methodMap, computedMap, dataMap, setupMap) {
  const sourceCode = context.getSourceCode()
  // props
  const propList = utils.getComponentPropsFromOptions(optionNode).filter(p => p.propName)
  const addPropMap = getPropMapFromPropList(context, propList)
  for (const [key, value] of addPropMap) {
    propMap.set(key, value)
  }

  // emit，只能获取 emits 配置项中的
  const emits = utils.getComponentEmitsFromOptions(optionNode)
  setEmitMapFromEslintPluginVueEmits(context, emits, emitMap)

  // 其他项
  optionNode.properties.forEach(option => {
    const optionKeyName = option.key.name
    const optionValue = option.value

    setMapFromVueCommonOption(context, optionKeyName, optionValue, mixinSet, componentMap, filterMap, nameAndExtendMap)

    // extend
    if (optionKeyName === 'extends') {
      nameAndExtendMap.set('extend', optionValue.name)
    }

    // 生命周期
    if (LIFECYCLE_HOOKS.includes(optionKeyName)) {
      const lifecycleHookComments = sourceCode.getCommentsBefore(option)
      const lifecycleHookComment = commentNodesToText(lifecycleHookComments)
      const lifecycleHookInfo = new LifecycleHookInfo(optionKeyName, lifecycleHookComment)
      lifecycleHookMap.set(optionKeyName, lifecycleHookInfo)
    }

    // provide
    if (optionKeyName === 'provide') {
      forEachProvideOptionSetProvideMap(context, optionValue, provideMap)
    }

    // inject
    if (optionKeyName === 'inject') {
      if (optionValue.type === 'ArrayExpression') {
        optionValue.elements.forEach(inject => {
          const injectName = inject.value
          const injectComments = sourceCode.getCommentsBefore(inject)
          const injectComment = commentNodesToText(injectComments)
          const injectInfo = new InjectInfo(injectName, injectName, 'Literal', undefined, injectComment)
          injectMap.set(injectName, injectInfo)
        })
      }
      if (optionValue.type === 'ObjectExpression') {
        optionValue.properties.forEach(inject => {
          const injectName = inject.key.name
          const [injectFrom, injectDefault, injectFromType] = getInjectFromAndTypeAndDefaultFromInjectOption(context, inject.value, injectName)
          const injectComments = sourceCode.getCommentsBefore(inject)
          const injectComment = commentNodesToText(injectComments)
          const injectInfo = new InjectInfo(injectName, injectFrom, injectFromType, injectDefault, injectComment)
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
        const methodInfo = new MethodInfo(methodName, methodComment)
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
        let variableComment = getVariableComment(context, setupValue)
        const setupComment = mergeText(keyComment, variableComment)
        const setupInfo = new SetupInfo(setupKeyName, setupComment)
        setupMap.set(setupKeyName, setupInfo)
      })
    }
  })
}
/**
 * 从 emit 调用中设置 emitMap
 * @param {} context 
 * @param {*} emitMap 
 * @param {*} callExpression 
 */
function setEmitMapFromEmitCall(context, emitMap, callExpression) {
  const sourceCode = context.getSourceCode()
  const calleeParams = callExpression.arguments
  const emitName = calleeParams[0].value
  const emitComments = sourceCode.getCommentsBefore(callExpression)
  const emitComment = commentNodesToText(emitComments)
  const emitType = getFunParamsRuntimeType(context, calleeParams.slice(1))
  setEmitMap(emitMap, emitName, emitType, emitComment)
}
const VueOptionKeys = ['props', 'name', 'extends', 'mixins', 'components', 'filters', ...LIFECYCLE_HOOKS, 'provide', 'inject', 'emits', 'methods', 'setup', 'computed', 'data',]
function isVueOptions(node) {
  return node && node.type === 'ObjectExpression' && node.properties.every(p => VueOptionKeys.includes(p.key.name))
}
// 用来判断导出是否一个class组件，但是vue-eslint-parser在解析js\ts和vue时不太一致
function isClassComponent(node) {
  if (node.type === 'ClassExpression') {
    if (node.superClass) {
      return node.superClass.name === "Vue"
    }
    // 是否有名为Component得装饰器
    const decorateParent = node.parent.parent.parent
    const componentDecorate = decorateParent.body.find(b => b.type === 'ExpressionStatement' && b.expression.right && b.expression.right.type === 'CallExpression' && b.expression.right.callee.name === '__decorate' && b.expression.right.arguments[0] && b.expression.right.arguments[0].elements.some(e => e.name === 'Component' || (e.type === 'CallExpression' && e.callee.name === 'Component')))
    return componentDecorate
  }
  return false
}
module.exports = {
  isClassComponent,
  isVueOptions,
  getInjectFromAndTypeAndDefaultFromInjectOption,
  setEmitMapFromEmitCall,
  isUnAddSetupMap,
  setMapFormVueOptions,
  setMapFromVueCommonOption,
  setComputedMap,
  deepSetDataMap,
  forEachDataOptionSetDataMap,
  setEmitMapFromEslintPluginVueEmits,
  setEmitMap,
  getEmitParamsTypeFromDefineEmits,
  LIFECYCLE_HOOKS,
  getPropMapFromTypePropList,
  getPropMapFromPropList,
  addTemplateMap,
  getExpressionContainerInfo,
  getPropInfoFromPropOption
}