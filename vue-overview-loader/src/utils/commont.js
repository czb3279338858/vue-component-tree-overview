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
 * 把代码节点格式化为代码单行文本
 * 1、把多个空格和换行符转换为单个空格
 * @param {*} context 
 * @param {*} node 
 * @returns 
 */
function getFormatJsCode(context, node) {
  const sourceCode = context.getSourceCode()
  const ret = sourceCode.getText(node)
  return ret.replace(/\/\/.*/g, '').replace(/[\n\s]+/g, ' ')
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
 * 从变量定义中获取变量名和变量注释
 * a=1 => ['a','***']
 * @param {*} context 
 * @param {*} declaration 
 * @returns 
 */
function getVariableDeclarationNameAndComments(context, declaration) {
  const sourceCode = context.getSourceCode()
  const left = declaration.id
  let variableName
  let variableComments
  // a = 1 或 a,b=1
  if (left.type === 'Identifier') {
    // a = ref('')
    variableName = left.name
    const declarations = declaration.parent.declarations
    if (declarations.length === 1) {
      // const a = 1
      variableComments = sourceCode.getCommentsBefore(declaration.parent)
    } else {
      // let a,b=1
      variableComments = sourceCode.getCommentsBefore(declaration.id)
    }
  }
  if (['ObjectPattern', 'ArrayPattern'].includes(left.type)) {
    forEachPattern([left], (patternItem) => {
      const itemValue = patternItem.value || patternItem
      variableComments = sourceCode.getCommentsBefore(itemValue)
      variableName = itemValue.name
    })
  }
  return [variableName, variableComments]
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
  const variableNode = getVariableNode(context, variableName)
  if (!variableNode) return ''
  let variableComments = []
  if (variableNode.type === 'FunctionDeclaration') {
    variableComments = sourceCode.getCommentsBefore(variableNode)
  }
  if (variableNode.type === 'VariableDeclarator') {
    const [, comments] = getVariableDeclarationNameAndComments(context, variableNode)
    variableComments = comments
  }
  const variableComment = commentNodesToText(variableComments)

  return variableComment
}

/**
 * 获取函数调用的函数名数组和参数数组
 * 支持连续调用，不支持中途多个参数
 * 支持 c(d(a.b,e)) => [[a.b,e],[c,d]]
 * 不支持 c(d(a.b), a)
 * @param {*} callExpression 
 * @param {*} funNames 
 */
function getCallExpressionParamsAndFunNames(context, callExpression, funNames = []) {
  const funName = callExpression.callee.name
  const params = callExpression.arguments
  funNames.push(funName)
  if (params) {
    if (params.length === 1) {
      const param = params[0]
      if (param.type === 'CallExpression') {
        return getCallExpressionParamsAndFunNames(context, param, funNames)
      } else {
        const callParam = param.type === 'MemberExpression' ? getFormatJsCode(context, param) : param.name
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
 * 获取当前节点运行时类型
 * @param {*} node 
 * @param {*} context 
 * @returns ['Array'] 等
 */
function getRuntimeTypeFromNode(context, node) {
  if (node.typeAnnotation) {
    const ret = tsUtils.inferRuntimeType(context, node.typeAnnotation.typeAnnotation)
    return ret
  }
  if (['ObjectExpression', 'ObjectPattern'].includes(node.type)) return ['Object']
  if (['ArrayExpression', 'ArrayPattern'].includes(node.type)) return ['Array']
  if (['FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) return ['Function']
  if (node.type === 'Literal') {
    const value = node.value
    if (Array.isArray(value)) return ['Array']
    if (value === null) return ['null']
    return [casing.pascalCase(typeof node.value)]
  }
  return [undefined]
}

/**
 * 获取函数参数的运行时类型
 * @param {*} params 
 * @returns [['String','Number'],['String']]
 */
function getFunParamsRuntimeType(context, params) {
  return params.map(p => {
    let type = getRuntimeTypeFromNode(context, p)
    if (!type && p.right) {
      type = getRuntimeTypeFromNode(context, p.right)
    }
    return type
  })
}
/**
 * 获取函数第一个 return 节点
 * @param {*} funNode 
 * @returns 
 */
function getFunFirstReturnBodyNode(funNode) {
  const funBody = funNode.body
  if (funBody.type === 'BlockStatement') {
    const funRet = funBody.body.find(f => f.type === 'ReturnStatement')
    return funRet && funRet.argument
  } else {
    return funBody
  }
}
/**
 * 获取变量在当前作用域（文档）的定义节点
 * @param {*} identifierNode 
 * @param {*} context 
 * @returns 
 */
function getVariableNode(context, identifierNode) {
  const variable = findVariable(context.getScope(), identifierNode)
  return variable && variable.defs[0] && variable.defs[0].node
}
/**
 * 判断成员表达式是否由 this 开始的
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
function setSome(set, someFun) {
  for (const s of set) {
    if (someFun(s)) return true
  }
  return false
}

function mergeText(...texts) {
  return texts.filter(t => t).join('\n')
}
function isInnerImport(ImportDeclaration) {
  const importSource = ImportDeclaration.source.value
  return /^[@\.]/.test(importSource)
}
function chooseShim(chooseName) {
  const matchesReg = /:matches\(([^\(\)]+)\)/
  const chooseNames = chooseName.match(matchesReg)
  if (chooseNames && chooseNames[1]) {
    const names = chooseNames[1].split(',')
    const newNames = names.concat(names.map(n => n.replace(/PropertyDefinition/g, 'ClassProperty')))
    return `:matches(${newNames.join(',')})`
  } else {
    return chooseName.replace(/PropertyDefinition/g, 'ClassProperty')
  }
}
module.exports = {
  chooseShim,
  isInnerImport,
  mergeText,
  setSome,
  getVariableDeclarationNameAndComments,
  forEachPattern,
  getVariableComment,
  isThisMember,
  getVariableNode,
  getFunFirstReturnBodyNode,
  getRuntimeTypeFromNode,
  getFunParamsRuntimeType,
  getFormatJsCode,
  getCallExpressionParamsAndFunNames,
  commentNodesToText,
  getPatternNames
}
