// mixinA export 注释
export const mixinA = {
  props: [
    // mixinA中mixinAPropA
    'mixinAPropA',
    // mixinA中mixinPropA
    'mixinPropA',
    // mixinA中extendPropA
    'extendPropA',
    // mixinA中propA
    'propA'
  ]
}

// export default 注释
export default {
  props: [
    // mixinB中mixinPropA
    'mixinPropA',
    // mixinB中extendPropA
    'extendPropA',
    // mixinB中propA
    'propA'
  ]
}

