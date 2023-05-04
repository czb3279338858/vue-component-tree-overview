/**
 * 将注释节点拼装成注释字符串
 * template和js中通用
 * @param {*} comments 
 * @returns 
 */
export function commentNodesToText(comments) {
  return comments.reduce((p, c) => {
    p = p ? `${p}\n${c.value}` : c.value
    return p
  }, '')
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
export function getPatternNames(expression) {
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

// TODO: 需要检查是否获取 const a = ref(1) 中的 a 的注释
/**
 * 遍历变量定义，
 * callback接收两个参数，1.变量名，2.变量注释
 * @param {*} variableNodes 
 * @param {*} callBack 
 */
export function forEachVariableNodes(variableNodes, callBack) {
  variableNodes.forEach(declaration => {
    const left = declaration.id
    // 当变量的左边是常量时
    // 例如：dataG = ref("") => dataG 的 id.type === 'Identifier'
    if (left.type === 'Identifier') {
      const leftName = left.name
      const leftComments = sourceCode.getCommentsBefore(left)
      const leftComment = commentNodesToText(leftComments)
      callBack(leftName, leftComment)
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
        callBack(itemName, itemComment)
      })
    }
  })
}