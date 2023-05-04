/**
 * 把 vue 提取的数据转为元数据，便于转换成 code
 * @param {*} vueMeta 
 * @returns 
 */
export function getVueMetaFromMiddleData(vueMeta) {
  return Object.keys(vueMeta).reduce((p, key) => {
    // vueMeta数据中包含importSet，是因为它是用来从rule传递到loader中的，在其他地方已经单独处理了获取代码对象时舍弃
    if (key === 'importSet') return p
    const value = vueMeta[key]
    if (key === 'templateMap') {
      const first = value.entries().next().value
      p['template'] = first && first[1]
    } else {
      if (value instanceof Map) {
        p[key] = Object.fromEntries(value)
      } else if (value instanceof Set) {
        p[key] = [...value]
      } else {
        p[key] = value
      }
    }
    return p
  }, {})
}

/**
 * 把 vue 元数据转为 code，
 * 'componentMap', 'mixinSet', 'extend'会保留引用，而不是把引用转为字符串
 * @param {*} vueMeta 
 * @param {*} noHandle 
 * @returns 
 */
export function getCodeFromVueMeta(vueMeta, noHandle) {
  if (typeof vueMeta === 'object' && vueMeta !== null) {
    if (Array.isArray(vueMeta)) return `[${vueMeta.map(item => getCodeFromVueMeta(item, noHandle)).join(',')}]`
    else return `{${Object.entries(vueMeta).map(
      ([key, value]) => {
        const ret = `"${key}"` + ":" + getCodeFromVueMeta(value, noHandle || ['componentMap', 'mixinSet', 'extend'].includes(key))
        return ret
      }
    ).join(',')}}`
  }
  return noHandle ? vueMeta : JSON.stringify(vueMeta)
}