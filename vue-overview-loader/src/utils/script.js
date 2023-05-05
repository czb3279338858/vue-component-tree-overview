const { getCallExpressionParamsAndFunNames, getFormatJsCode, getPatternNames, commentNodesToText, forEachVariableNodes } = require("./commont")
const tsUtils = require('./utils/ts-ast-utils')
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
    const [callParams, callNames] = getCallExpressionParamsAndFunNames(container.expression)
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
     * 通过 propOption 中type 的配置获取 prop 的运行时的类型
     * @param {*} typeValue 
     * @returns ['Number','String']
     */
function getPropTypeFromPropTypeOption(typeValue) {
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
function getPropInfoFromPropOption(propOption, propNode) {
  let propDefault, propType, propRequired
  // option 中的 prop 可以没有参数
  if (propOption) {
    // 通过prop配置项获取
    switch (propOption.type) {
      // propB: Number
      case 'Identifier':
        propType = getPropTypeFromPropTypeOption(propOption)
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
              propType = getPropTypeFromPropTypeOption(d.value)
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
        propType = getPropTypeFromPropTypeOption(propOption)
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
function getPropMapFromPropList(sourceCode, propList) {
  const propMap = new Map()

  propList.forEach(propOption => {
    const propName = propOption.propName
    const [propDefault, propType, propRequired] = getPropInfoFromPropOption(propOption.value)
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
    return !initUnAddSetupMap(d.init)
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

module.exports = {
  LIFECYCLE_HOOKS,
  getPropMapFromTypePropList,
  addSetupMapFromVariable,
  getPropMapFromPropList,
  addTemplateMap,
  getExpressionContainerInfo,
  getPropTypeFromPropTypeOption,
  getPropInfoFromPropOption,
  initUnAddSetupMap
}