class PropInfo {
  constructor(name, defaultValue, type, required, comment) {
    this.name = name
    this.defaultValue = defaultValue
    this.type = type
    this.required = required
    this.comment = comment
  }
}
/**
 * template => <div>，"文本"，{{ data }}
 * type VElement\VText\{{}}内表达式的类型（Literal、Identifier、CallExpression
 * attributes:{keyName,valueName,valueType,scopeNames,callNames,callParams,vForName}[]
 * value 只有 {{}} 绑定 才有 {{ data }} => data
 * callNames 只有 {{}} 绑定 函数调用时 才有
 * callParams只有 {{}} 绑定函数调用时才有
 */
class TemplateInfo {
  constructor(template, type, attributes, comment, children, value, callNames, callParams) {
    this.template = template
    this.callNames = callNames
    this.type = type
    this.attributes = attributes
    this.comment = comment
    this.children = children
    this.value = value
    this.callParams = callParams
  }
}

class SetupInfo {
  constructor(name, comment) {
    this.name = name
    this.comment = comment
  }
}
/**
 * name在setup中带on，在options、class中不带
 */
class LifecycleHookInfo {
  constructor(name, comment) {
    this.name = name
    this.comment = comment
  }
}
class FilterInfo {
  constructor(name, comment, value) {
    this.name = name
    this.comment = comment
    this.value = value
  }
}
/**
 * paramsVerify 是 emits 配置中完整的校验函数
 */
class EmitInfo {
  constructor(name, type, comment, paramsVerify) {
    this.name = name
    this.type = type
    this.comment = comment
    this.paramsVerify = paramsVerify
  }
}
/**
 * data:{a:{b:1}} => 
 * dataMap {
 *   a:{name:'a',comment:'xxx'},
 *   a.b:{name:'a.b',comment:'xxx'}
 * }
 */
class DataInfo {
  constructor(name, comment) {
    this.name = name
    this.comment = comment
  }
}

class ComputedInfo {
  constructor(name, comment) {
    this.name = name
    this.comment = comment
  }
}

class MethodInfo {
  constructor(name, comment) {
    this.name = name
    this.comment = comment
  }
}

/**
 * return { [s]: this.provideSymbolFrom } => 
 * {
 *   name:"s",
 *   nameType:'Identifier'
 *   value:'provideSymbolFrom',
 *   valueType:'Identifier',
 *   comment:'xxx'
 * }
 * type只有Literal和Identifier
 */
class ProvideInfo {
  constructor(name, nameType, value, valueType, comment) {
    this.name = name
    this.nameType = nameType
    this.value = value
    this.valueType = valueType
    this.comment = comment
  }
}

/**
 * {
 *   name:"injectB",
 *   from:'injectSymbol',
 *   fromType:'Identifier' | 'Literal'
 *   defaultValue:undefined,
 *   comment:'xxx'
 * }
 */
class InjectInfo {
  constructor(name, from, fromType, defaultValue, comment) {
    this.name = name
    this.from = from
    this.fromType = fromType
    this.defaultValue = defaultValue
    this.comment = comment
  }
}

module.exports = {
  PropInfo,
  TemplateInfo,
  SetupInfo,
  LifecycleHookInfo,
  FilterInfo,
  EmitInfo,
  DataInfo,
  ComputedInfo,
  MethodInfo,
  ProvideInfo,
  InjectInfo
}