const tsUtils = require('./ts-ast-utils')
const casing = require('eslint-plugin-vue/lib/utils/casing')
const { findVariable } = require('eslint-utils')
/**
 * 将注释节点拼装成注释字符串
 * template和js中通用
 * @param {*} commentNodes 
 * @returns 
 */
function commentNodesToText(commentNodes) {
  const commentText = commentNodes.reduce((p, c) => {
    p = p ? `${p}\n${c.value}` : c.value
    return p
  }, '')
  return commentText
}


/**
 * 遍历解构对象，支持数组和对象结构对象，传入最终解构的node
 * 例如：{a:[b],c:{d:e}} 最终 callBack 接收到 b \ d:e 对应的node
 * @param {*} pattern 
 * @param {*} callBack 
 */
function forEachPattern(pattern, callBack) {
  pattern.forEach(p => {
    const patternItemValue = p.value
    if (patternItemValue) {
      // 遍历的当前项是对象
      if (patternItemValue.type === 'Identifier') {
        callBack(p)
      }
      if (patternItemValue.type === 'ArrayPattern') {
        forEachPattern(patternItemValue.elements, callBack)
      }
      if (patternItemValue.type === "ObjectPattern") {
        forEachPattern(patternItemValue.properties, callBack)
      }
    } else {
      // 遍历的当前项是数组或变量
      if (p.type === 'Identifier') {
        callBack(p)
      }
      if ('ArrayPattern' === p.type) {
        forEachPattern(p.elements, callBack)
      }
      if (p.type === "ObjectPattern") {
        forEachPattern(p.properties, callBack)
      }
    }
  })
}

/**
 * 获取所有解构语法的最终变量名，例如：{a:[b],c:{d:e}} 最终返回 [b,e]
 * @param {*} expression 
 * @returns 
 */
function getPatternNames(expression) {
  const scopeName = []
  forEachPattern(expression, (item) => {
    if (item.type === 'Identifier') {
      scopeName.push(item.name)
    } else {
      scopeName.push(item.value.name)
    }
  })
  return scopeName
}

function getIdentifierVariableComment(sourceCode, variableNode) {
  let variableComments = []
  if (variableNode.type === 'FunctionDeclaration') {
    variableComments = sourceCode.getCommentsBefore(variableNode)
  }
  if (variableNode.type === 'VariableDeclarator') {
    const parent = variableNode.parent
    if (parent.declarations.length === 1) {
      variableComments = sourceCode.getCommentsBefore(parent)
    } else {
      variableComments = sourceCode.getCommentsBefore(variableNode.id)
    }
  }
  const variableComment = commentNodesToText(variableComments)
  return variableComment
}
/**
 * 遍历变量定义，支持
 * const a=''
 * let a,b=''
 * function a(){}
 * callback接收3个参数，1.变量名，2.变量注释,3.当前变量节点
 * @param {*} variableNodes 
 * @param {*} callBack 
 */
function forEachVariableNodes(sourceCode, variableNodes, callBack) {
  variableNodes.forEach(declaration => {
    const left = declaration.id
    // 当变量的左边是常量时
    // 例如：dataG = ref("") => dataG 的 id.type === 'Identifier'
    if (left.type === 'Identifier') {
      const leftName = left.name
      const leftComment = getIdentifierVariableComment(sourceCode, declaration)
      callBack(leftName, leftComment, declaration)
    }
    // 当变量的左边是数组解构或对象解构时
    // 例如：const [dataD, dataE] = [ref("")]; 和 const {a}={a:1}
    if (['ObjectPattern', 'ArrayPattern'].includes(left.type)) {
      forEachPattern([left], (patternItem) => {
        const itemValue = patternItem.value || patternItem
        const itemName = itemValue.name
        // const [dataD, dataE] = [ref("")]; 和 const {a}={a:1} => dataD,dataE,a
        const itemComments = sourceCode.getCommentsBefore(itemValue)
        const itemComment = commentNodesToText(itemComments)
        callBack(itemName, itemComment, declaration)
      })
    }
  })
}

// TODO：需要检查c(d(e)) e能不能正确获取
/**
 * 获取函数调用的函数名和参数
 * 支持连续调用，不支持中途多个参数
 * 支持 c(d(a.b,e)) => [[a.b,e],[c,d]]
 * 不支持 c(d(a.b), a)
 * @param {*} callExpression 
 * @param {*} funNames 
 */
function getCallExpressionParamsAndFunNames(sourceCode, callExpression, funNames = []) {
  const funName = callExpression.callee.name
  const params = callExpression.arguments
  funNames.push(funName)
  if (params) {
    if (params.length === 1) {
      const param = params[0]
      if (param.type === 'CallExpression') {
        return getCallExpressionParamsAndFunNames(sourceCode, param, funNames)
      } else {
        const callParam = param.type === 'MemberExpression' ? getFormatJsCode(sourceCode, param) : undefined
        return [[callParam], funNames]
      }
    } else {
      return [params.map(param => getFormatJsCode(sourceCode, param)), funNames]
    }
  } else {
    return [undefined, funNames]
  }
}


/**
 * 把代码节点格式化为代码单行文本
 * 1、把多个空格和换行符转换为单个空格
 * @param {*} sourceCode 
 * @param {*} node 
 * @returns 
 */
function getFormatJsCode(sourceCode, node) {
  const ret = sourceCode.getText(node)
  return ret.replace(/[\n\s]+/g, ' ')
}
/**
 * 获取当前节点运行时类型
 * @param {*} node 
 * @param {*} context 
 * @returns 'Object' | 'Array' 等
 */
function getRuntimeTypeFromNode(node, context) {
  if (node.typeAnnotation) {
    const ret = tsUtils.inferRuntimeType(context, node.typeAnnotation.typeAnnotation)
    return ret
  }
  if (['ObjectExpression', 'ObjectPattern'].includes(node.type)) return 'Object'
  if (['ArrayExpression', 'ArrayPattern'].includes(node.type)) return 'Array'
  if (['FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) return 'Function'
  if (node.type === 'Literal') {
    const value = node.value
    if (Array.isArray(value)) return 'Array'
    if (value === null) return 'null'
    return casing.pascalCase(typeof node.value)
  }
  return undefined
}

/**
 * 获取函数参数的运行时类型
 * @param {*} params 
 * @returns [['String','Number'],['String']]
 */
function getFunParamsRuntimeType(params, context) {
  return params.map(p => {
    let type = getRuntimeTypeFromNode(p, context)
    if (!type && p.right) {
      type = getRuntimeTypeFromNode(p.right, context)
    }
    return [type]
  })
}
/**
 * 获取函数第一个 return 节点
 * @param {*} funNode 
 * @returns 
 */
function getFunFirstReturnNode(funNode) {
  const funBody = funNode.body.body
  const funRet = funBody.find(f => f.type === 'ReturnStatement')
  return funRet
}
/**
 * 获取变量在当前作用域（文档）的定义节点
 * @param {*} identifierNode 
 * @param {*} context 
 * @returns 
 */
function getVariableNode(identifierNode, context) {
  const variable = findVariable(context.getScope(), identifierNode)
  return variable && variable.defs[0] && variable.defs[0].node
}
/**
 * 成员表达式是由 this 开始的
 * @param {*} memberExpression 
 * @returns 
 */
function isThisMember(memberExpression) {
  if (memberExpression.object) {
    if (memberExpression.object.type === 'ThisExpression') {
      return true
    } else {
      return isThisMember(memberExpression.object)
    }
  }
  return false
}
module.exports = {
  isThisMember,
  getVariableNode,
  getFunFirstReturnNode,
  getRuntimeTypeFromNode,
  getFunParamsRuntimeType,
  getFormatJsCode,
  getCallExpressionParamsAndFunNames,
  forEachVariableNodes,
  commentNodesToText,
  getPatternNames
}
