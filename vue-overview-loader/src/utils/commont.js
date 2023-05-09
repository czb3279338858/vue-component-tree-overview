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
/**
 * 通过变量名获取这个变量定义的注释
 * 支持函数和变量
 * @param {*} context 
 * @param {*} variableName 
 * @returns 
 */
function getVariableComment(context, variableName) {
  const sourceCode = context.getSourceCode()
  const variableNode = getVariableNode(variableName, context)
  let variableComments = []
  if (variableNode.type === 'FunctionDeclaration') {
    variableComments = sourceCode.getCommentsBefore(variableNode)
  }
  if (variableNode.type === 'VariableDeclarator') {
    const left = variableNode.id
    if (left.type === 'Identifier') {
      const parent = variableNode.parent
      if (parent.declarations.length === 1) {
        variableComments = sourceCode.getCommentsBefore(parent)
      } else {
        variableComments = sourceCode.getCommentsBefore(variableNode.id)
      }
    }
    if (['ObjectPattern', 'ArrayPattern'].includes(left.type)) {
      forEachPattern([left], (patternItem) => {
        const itemValue = patternItem.value || patternItem
        variableComments = sourceCode.getCommentsBefore(itemValue)
      })
    }
  }
  const variableComment = commentNodesToText(variableComments)

  return variableComment
}

// TODO：需要检查c(d(e)) e能不能正确获取
/**
 * 获取函数调用的函数名数组和参数数组
 * 支持连续调用，不支持中途多个参数
 * 支持 c(d(a.b,e)) => [[a.b,e],[c,d]]
 * 不支持 c(d(a.b), a)
 * @param {*} callExpression 
 * @param {*} funNames 
 */
function getCallExpressionParamsAndFunNames(context, callExpression, funNames = []) {
  const sourceCode = context.getSourceCode()
  const funName = callExpression.callee.name
  const params = callExpression.arguments
  funNames.push(funName)
  if (params) {
    if (params.length === 1) {
      const param = params[0]
      if (param.type === 'CallExpression') {
        return getCallExpressionParamsAndFunNames(context, param, funNames)
      } else {
        const callParam = param.type === 'MemberExpression' ? getFormatJsCode(context, param) : undefined
        return [[callParam], funNames]
      }
    } else {
      return [params.map(param => getFormatJsCode(context, param)), funNames]
    }
  } else {
    return [undefined, funNames]
  }
}


/**
 * 把代码节点格式化为代码单行文本
 * 1、把多个空格和换行符转换为单个空格
 * @param {*} context 
 * @param {*} node 
 * @returns 
 */
function getFormatJsCode(context, node) {
  const sourceCode = context.getSourceCode()
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
  forEachPattern,
  getVariableComment,
  isThisMember,
  getVariableNode,
  getFunFirstReturnNode,
  getRuntimeTypeFromNode,
  getFunParamsRuntimeType,
  getFormatJsCode,
  getCallExpressionParamsAndFunNames,
  commentNodesToText,
  getPatternNames
}
