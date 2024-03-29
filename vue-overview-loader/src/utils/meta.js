class PropInfo {
  constructor(name, defaultValue, type, required, comment) {
    this.name = name
    this.defaultValue = defaultValue
    this.type = type
    this.isRequired = required
    this.comment = comment
  }
}
/**
 * keyName：attr左边 => :class
 * valueName：attr右边 => getAttrB1(getAttrB2(dataA))
 * valueType：attr右边的类型,VLiteral \Literal \Identifier \CallExpression \MemberExpression \VFilterSequenceExpression \VForExpression \VSlotScopeExpression \undefined
 * scopeNames：v-for,v-slot,slot-scope有作用域
 * params：绑定值中的变量和函数名
 *  函数调用或filter => [getAttrB1,getAttrB2，dataA]
 *  vForName的循环值 => [dataA]
 */
class Attribute {
  constructor(keyName, valueName, valueType, scopeNames, params) {
    this.keyName = keyName
    this.valueName = valueName
    this.valueType = valueType
    this.scopeNames = scopeNames
    this.params = params
  }
}
/**
 * template => <div>，"文本"，{{ data }}
 * type VElement\VText\{{}}内表达式的类型（Literal、Identifier、CallExpression
 * attributes:{@link Attribute}[]
 * value 只有 {{}} 绑定 才有 {{ data }} => data
 * params {{}} 绑定的变量和函数名 => [data]
 */
class TemplateInfo {
  constructor(template, type, attributes, comment, children, params) {
    this.template = template
    this.valueType = type
    this.attributes = attributes
    this.comment = comment
    this.children = children
    this.params = params
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
  constructor(name, comment, importValue) {
    this.name = name
    this.comment = comment
    this.importValue = importValue
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
 *   value:'provideSymbolFrom', 支持'a.b',支持常量，但是和变量没有区别
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
 *   from:'injectSymbol', 当是字符串时'"injectFrom"'
 *   fromType:'Identifier' | 'Literal'
 *   defaultValue:undefined | '()=>['1']'
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

class OtherInfo {
  constructor(name, comment) {
    this.name = name
    this.comment = comment
  }
}

module.exports = {
  OtherInfo,
  Attribute,
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