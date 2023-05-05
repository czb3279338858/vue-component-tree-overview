const { commentNodesToText } = require("./commont")

/**
     * 当前节点是否只有换行符和空格组成的 VText
     * @param {*} node 
     * @returns 
     */
function isEmptyVText(node) {
  return node.type === 'VText' && /^[\n\s]*$/.test(node.value)
}

/**
     * 格式化文本，去掉换行符和多余空格
     * @param {*} text 
     * @returns 
     */
function formatVText(text) {
  return text.replace(/[\n\s]+/g, ' ')
}

let templateAllComments
/**
     * 获取 template 中的所有注释节点，template 所有注释节点都在 <template> 上
     * @param {*} node 
     * @returns 
     */
function getTemplateAllCommentNodes(node) {
  if (templateAllComments) return templateAllComments
  if (node.comments) return templateAllComments = node.comments
  return getTemplateAllCommentNodes(node.parent)
}

/**
     * 根据当前节点所在行和列以及上一级（父级或兄弟上级）的行和列来查找当前节点前的注释节点 
     * @param {*} node 一个 template 节点，不是 startTag 节点
     * @returns 
     */
function getTemplateCommentNodesBefore(node) {
  const comments = getTemplateAllCommentNodes(node)
  const parent = node.parent
  const parentChildren = parent.children
  const startNode = node.type === 'VElement' ? node.startTag : node
  const { line: nodeStartLine, column: nodeStartColumn } = startNode.loc.start

  const reverseParentChildren = [...parentChildren].reverse()

  let preNode
  // 在子级中查找同级的上一个兄弟元素
  for (const index in reverseParentChildren) {
    const c = reverseParentChildren[index]
    if (preNode === null && !(isEmptyVText(c))) {
      preNode = c
      break;
    }
    if (c === node) preNode = null
  }
  let preNodeEndLine
  let preNodeEndColumn
  // 有同级的上一个兄弟元素
  if (preNode) {
    preNodeEndLine = preNode.loc.end.line
    preNodeEndColumn = preNode.loc.end.column
  } else {
    // template节点
    if (!parent.parent) {
      preNodeEndLine = 1
      preNodeEndColumn = 0
    } else {
      preNodeEndLine = parent.type === 'VElement' ? parent.startTag.loc.end.line : parent.loc.end.line
      preNodeEndColumn = parent.type === 'VElement' ? parent.startTag.loc.end.column : parent.loc.end.column
    }
  }
  let nodeComments = []
  for (const key in comments) {
    const comment = comments[key]
    const { loc: { start: { line: startLine, column: startColumn }, end: { line: endLine, column: endColumn } } } = comment
    if (
      (startLine > preNodeEndLine || (startLine === preNodeEndLine && startColumn >= preNodeEndColumn)) && (endLine < nodeStartLine || (endLine === nodeStartLine && endColumn <= nodeStartColumn))
    ) {
      nodeComments.push(comment)
    }
  }
  return nodeComments
}

/**
     * 获取 template 当前节点前的注释文本，空白的换行节点会被跳过，例如OptionsComponent种VText的上一行
     * @param {*} node 
     * @returns 
     */
function getTemplateCommentBefore(node) {
  const elementComments = getTemplateCommentNodesBefore(node)
  const elementComment = commentNodesToText(elementComments)
  return elementComment
}

module.exports = {
  getTemplateCommentBefore,
  formatVText,
  isEmptyVText,
}