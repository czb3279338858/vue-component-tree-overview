defineTemplateBodyVisitor 用于定义一个访问者对象，用于遍历.vue文件中的 template、script部分的AST
defineDocumentVisitor 用于定义一个访问者对象，用于遍历.vue文件中的 template 部分的AST

wrapCoreRule 包装 eslit 规则，在 template 中使用
isDef 它用于检查Vue.js中的is属性是否有定义
flatten 用于将嵌套的数组展平为一维数组
prevSibling 用于获取给定节点的前一个兄弟节点，忽略空白文本节点和注释节点。
isEmptyValueDirective 一个内部函数，用于判断一个指令是否有空值`<input v-model="message">`
isEmptyExpressionValueDirective 用于检查Vue.js指令是否有空表达式值的工具函数`<div v-if="message.length > 0">`
getAttribute 用于获取一个元素上的指定属性的值
hasAttribute：检查一个元素是否有某个属性
getDirectives 用于获取一个元素上的所有指令的信息
getDirective 用于获取一个元素上的指定名称的指令的信息
hasDirective：检查一个元素是否有某个指令
getRegisteredComponents 获取一个Vue实例中注册的所有组件的名称。它接受一个Vue实例作为参数，并返回一个包含组件名称的数组
prevElementHasIf 用于检查一个元素的前一个兄弟元素是否有v-if指令
iterateChildElementsChains 用于遍历一个元素的所有子元素链
isStringLiteral 用于检查一个节点是否是一个字符串字面量
isCustomComponent：检查一个元素是否是自定义组件
isHtmlElementNode 用于检查一个AST节点是否是一个HTML元素节点
isSvgElementNode：检查一个节点是否是SVG元素节点
isMathMLElementNode(node)：检查一个节点是否是MathML元素节点
isHtmlWellKnownElementName 用于检查一个字符串是否是一个HTML中的已知元素名称
isSvgWellKnownElementName
isHtmlVoidElementName 用于检查一个字符串是否是一个HTML中的空元素名称，空元素是指没有内容的HTML元素
isBuiltInComponentName 用于检查一个字符串是否是一个Vue.js内置的组件名称
isBuiltInDirectiveName 用于检查一个字符串是否是一个内部指令名称
getStaticPropertyName 从一个 AST 节点中获取一个静态属性的名称，如果存在的话。
getStringLiteralValue 从一个AST节点中获取一个字符串字面量的值，如果存在的话

getComponentPropsFromOptions\getComponentProps 用于从Vue组件的选项对象中提取组件的props
getComponentEmitsFromOptions\getComponentEmits 可以从组件选项中获取组件的emits属性
getComputedProperties 可以从组件实例中获取计算属性的名称和值，用于检查计算属性的命名和缓存等问题。
getGetterBodyFromComputedFunction 可以从计算属性的函数中获取getter的函数体，用于检查getter的返回值和依赖等问题。

isVueFile：检查一个文件是否是.vue文件
isScriptSetup
getScriptSetupElement Gets the element of `<script setup>`
executeOnVue 接收一个context对象和一个回调函数作为参数，然后遍历Vue组件的AST节点，找到type为’ObjectExpression’的节点，然后调用回调函数2

defineVueVisitor 定义一个访问器对象，用于访问.vue文件中的各个部分，如template、script等
    - `onVueObjectEnter` ... Event when Vue Object is found.
    - `onVueObjectExit` ... Event when Vue Object visit ends.
    - `onSetupFunctionEnter` ... Event when setup function found.
    - `onRenderFunctionEnter` ... Event when render function found.
defineScriptSetupVisitor 定义一个访问器对象，用于访问.vue文件中的`<script setup>`部分。

hasWithDefaults 可以判断一个组件的props是否有默认值。
getWithDefaultsPropExpressions 可以从组件的props中获取有默认值的prop得表达式。
getWithDefaultsProps 从组件的props中获取有默认值的props节点。
getVueObjectType 可以从一个节点中获取Vue对象的类型。
    - ‘mark’：表示该节点是一个标记，用于标识Vue对象的开始和结束
    - ‘export’：表示该节点是一个export语句，用于导出Vue对象
    - ‘definition’：表示该节点是一个定义，用于定义Vue对象
    - ‘instance’：表示该节点是一个实例，用于创建Vue对象
    - ‘composition’：表示该节点是一个组合式API，用于使用Vue对象的功能
    - ‘unknown’：表示该节点是一个未知类型，无法识别为Vue对象
getVueComponentDefinitionType 从一个节点中获取Vue组件的定义类型。
    - ‘mark’：表示该节点是一个标记，用于标识Vue组件的开始和结束
    - ‘export’：表示该节点是一个export语句，用于导出Vue组件
    - ‘object’：表示该节点是一个对象表达式，用于定义Vue组件的选项
    - ‘class’：表示该节点是一个类表达式，用于定义Vue组件的类
    - ‘unknown’：表示该节点是一个未知类型，无法识别为Vue组件
isSFCObject 判断一个节点是否是一个单文件组件（SFC）的对象。

compositingVisitors 可以组合多个访问器对象，用于访问不同的节点类型。

executeOnVueInstance 可以在一个Vue实例上执行一个回调函数。
executeOnVueComponent 可以在一个Vue组件上执行一个回调函数。
executeOnCallVueComponent 在一个调用Vue组件的节点上执行一个回调函数。`new Vue({ ... })`

iterateProperties 遍历一个对象表达式中的所有属性，并执行一个回调函数。
iterateArrayExpression 用于遍历数组表达式的工具函数
iterateObjectExpression 用于遍历对象表达式的属性，并对每个属性执行回调函数
iterateFunctionExpression 用于遍历函数表达式的参数，并对每个参数执行回调函数
iterateArrowFunctionExpression 用于遍历箭头函数表达式的参数，并对每个参数执行回调函数
executeOnFunctionsWithoutReturn 用于在没有return语句的函数中执行回调函数

isSingleLine 用于判断一个节点是否在一行内
hasInvalidEOF 用于检查模板中是否有无效的EOF（文件结束符）
getMemberChaining 获取MemberExpression的链式节点
editDistance 用于计算两个字符串之间的编辑距离（Levenshtein distance）的函数。编辑距离是指将一个字符串转换为另一个字符串所需的最少单字符编辑操作（插入、删除或替换）的数量。

inRange 用于判断一个位置是否在一个范围内的函数

isProperty 用于判断一个节点是否是一个属性（Property）的函数
isAssignmentProperty 用于判断一个属性（Property）节点是否是一个赋值属性（AssignmentProperty）的函数。赋值属性是一个表示对象解构赋值中的键值对的节点，比如{a: b} = c中的a: b

isVElement(node)：检查一个节点是否是Vue组件节点

findProperty 帮助你在对象表达式中查找特定的属性。
findAssignmentProperty 可以帮助你在赋值表达式中查找特定的属性
isPropertyChain 判断一个节点是否是一个属性链，比如a.b.c1

skipTSAsExpression 如果给定的节点是一个 TSAsExpression 节点，就返回它的 expression 属性的值。否则，就直接返回它本身。TSAsExpression 节点是 TypeScript 的一种语法节点，表示一个表达式后面跟着一个类型断言1
skipDefaultParamValue 如果给定的节点是一个 AssignmentPattern 节点，就返回它的 left 属性的值。否则，就直接返回它本身。AssignmentPattern 节点是一种语法节点，表示一个带有默认值的参数
skipChainExpression 这句话的意思是，如果给定的节点是一个 ChainExpression 节点，就返回它的 expression 属性的值。否则，就直接返回它本身。ChainExpression 节点是一种语法节点，表示一个可选链式表达式`const foo = obj?.bar?.baz;`

withinTypeNode


getComponentComments(node)：获取一个组件节点上的所有注释1
getComponentName：获取一个组件的名称
getDirectiveModifiers(node)：获取一个节点上的所有指令修饰符，比如[‘prevent’, ‘stop’]等1。
getDirectiveName：获取一个指令的名称
getDirectiveNames(node)：获取一个节点上的所有指令名称，比如[‘if’, ‘for’]等1。
getElementType(node)：获取一个节点的元素类型，比如’html’, ‘svg’, ‘mathml’, 'custom’或’unknown’1。


hasVBind：检查一个元素是否有v - bind指令
hasVOn：检查一个元素是否有v - on指令

isCustomElementNode(node)：检查一个节点是否是自定义元素节点1。



isHtmlSelfClosingElementName：检查一个元素名称是否是HTML自闭合元素名称


isTextNode：检查一个节点是否是文本节点
isVBindDirective(node)：检查一个节点是否是v - bind指令1。
isVDirectiveKey(node)：检查一个节点是否是指令键，比如v -if、v - for等1。

isVExpressionContainer(node)：检查一个节点是否是表达式容器，比如{ {… } } 1。
isVFilterSequenceExpression(node)：检查一个节点是否是过滤器序列表达式，比如{ {… | … } } 1。
isVForDirective(node)：检查一个节点是否是v - for指令1。
isVIdentifier(node)：检查一个节点是否是标识符，比如v - for中的item或index1。
isVModelDirective(node)：检查一个节点是否是v - model指令1。
isVOnDirective(node)：检查一个节点是否是v - on指令1。
isVSlotDirective(node)：检查一个节点是否是v - slot指令1。
isVText(node)：检查一个节点是否是文本节点，比如{ {… } } 之外的内容1。


