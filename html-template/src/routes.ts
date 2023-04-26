const routes = [{ "path": "/home", "name": "home", "component": { "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "div", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "111", "templateType": "VText", "templateComment": "" }, { "templateValue": "router-view", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [] }] }] }, "slotSet": [], "propMap": {}, "setupMap": {}, "lifecycleHookMap": {}, "filterMap": {}, "emitMap": { "emitA": { "emitName": "emitA", "emitComment": " emitA类型注释" } }, "dataMap": {}, "computedMap": {}, "methodMap": {}, "provideMap": {}, "injectMap": {}, "modelOption": { "prop": "value", "event": "input" }, "componentMap": {}, "mixinSet": [] }, "children": [{ "path": "options", "component": { "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "my-component", "templateType": "VElement", "attributes": [{ "name": "class", "valueName": "1", "valueType": "VLiteral" }, { "name": ":class", "valueName": "b", "valueType": "Identifier" }, { "name": ":style", "valueName": "a.b", "valueType": "CallExpression", "callNames": ["c", "d"] }, { "name": ":a", "valueName": "'1'", "valueType": "Literal" }, { "name": ":b", "valueName": "e.a", "valueType": "MemberExpression" }, { "name": ":c", "valueName": "propA", "valueType": "VFilterSequenceExpression", "callNames": ["filterB", "filterA"] }], "templateComment": " div1注释", "children": [{ "templateValue": "VText", "templateType": "VText", "templateComment": " VText注释 " }, { "templateName": "propA", "templateCallNames": ["filterA"], "templateType": "VFilterSequenceExpression", "templateComment": " VExpressionContainer注释 " }, { "templateName": "a", "templateType": "Identifier", "templateComment": "" }, { "templateName": "a.b", "templateType": "MemberExpression", "templateComment": "" }, { "templateCallNames": ["b"], "templateType": "CallExpression", "templateComment": "" }, { "templateName": "\"1\"", "templateType": "Literal", "templateComment": " 支持\"1\" " }, { "templateType": "TemplateLiteral", "templateComment": " 不支持`${d}` " }, { "templateType": "BinaryExpression", "templateComment": " 不支持e + f " }, { "templateName": "a", "templateType": "Identifier", "templateComment": "" }, { "templateValue": "div2", "templateType": "VElement", "attributes": [{ "name": "v-if", "valueName": "a", "valueType": "Identifier" }], "templateComment": "", "children": [] }, { "templateValue": "div3", "templateType": "VElement", "attributes": [{ "name": "v-else" }], "templateComment": "", "children": [] }, { "templateValue": "dvi4", "templateType": "VElement", "attributes": [{ "name": "v-for", "valueName": "d", "valueType": "VForExpression", "scopeNames": ["item", "key", "index"] }, { "name": ":key", "valueName": "index", "valueType": "Identifier" }], "templateComment": " scopeNames:['value', 'key', 'index'] ", "children": [{ "templateName": "item", "templateType": "Identifier", "templateComment": "" }] }, { "templateValue": "dvi13", "templateType": "VElement", "attributes": [{ "name": "v-for", "valueName": "d", "valueType": "VForExpression", "scopeNames": ["value", "key", "index"] }, { "name": ":key", "valueName": "index", "valueType": "Identifier" }], "templateComment": "", "children": [{ "templateName": "value", "templateType": "Identifier", "templateComment": "" }] }, { "templateValue": "div5", "templateType": "VElement", "attributes": [{ "name": ":style", "valueName": "propA", "valueType": "VFilterSequenceExpression", "callNames": ["filterB", "filterA"] }], "templateComment": " valueName:'propA | filterA | filterB' ", "children": [{ "templateValue": "div7", "templateType": "VElement", "attributes": [{ "name": "slot", "valueName": "header", "valueType": "VLiteral" }], "templateComment": " 使用 ", "children": [{ "templateValue": "1", "templateType": "VText", "templateComment": "" }] }, { "templateValue": "div6", "templateType": "VElement", "attributes": [{ "name": "slot-scope", "valueName": "slot-scope", "valueType": "VSlotScopeExpression", "scopeNames": ["scope"] }, { "name": "slot", "valueName": "footer", "valueType": "VLiteral" }], "templateComment": "", "children": [{ "templateName": "scope.item", "templateType": "MemberExpression", "templateComment": "" }] }, { "templateValue": "div12", "templateType": "VElement", "attributes": [{ "name": "slot-scope", "valueName": "slot-scope", "valueType": "VSlotScopeExpression", "scopeNames": ["item1"] }, { "name": "slot", "valueName": "footer2", "valueType": "VLiteral" }], "templateComment": "", "children": [{ "templateName": "item1", "templateType": "Identifier", "templateComment": "" }] }, { "templateValue": "div11", "templateType": "VElement", "attributes": [{ "name": "slot-scope", "valueName": "slot-scope", "valueType": "VSlotScopeExpression", "scopeNames": ["item", "a", "b", "c"] }, { "name": "slot", "valueName": "footer", "valueType": "VLiteral" }], "templateComment": "", "children": [{ "templateType": "TemplateLiteral", "templateComment": "" }] }, { "templateValue": "slot", "templateType": "VElement", "attributes": [{ "name": "name", "valueName": "header", "valueType": "VLiteral" }], "templateComment": " 定义 ", "children": [] }, { "templateValue": "slot", "templateType": "VElement", "attributes": [{ "name": "name", "valueName": "footer", "valueType": "VLiteral" }, { "name": ":item", "valueName": "item", "valueType": "Identifier" }, { "name": ":index", "valueName": "index", "valueType": "Identifier" }], "templateComment": "", "children": [] }] }, { "templateValue": "div8", "templateType": "VElement", "attributes": [{ "name": "v-slot:header" }], "templateComment": " 2.6之后 ", "children": [] }, { "templateValue": "div9", "templateType": "VElement", "attributes": [{ "name": "v-slot:footer", "valueName": "slot", "valueType": "VSlotScopeExpression", "scopeNames": ["item", "a", "b"] }], "templateComment": "", "children": [] }, { "templateValue": "div9", "templateType": "VElement", "attributes": [{ "name": "v-slot:footer", "valueName": "slot", "valueType": "VSlotScopeExpression", "scopeNames": ["item", "item2"] }], "templateComment": "", "children": [] }, { "templateValue": "div10", "templateType": "VElement", "attributes": [{ "name": "v-slot:header", "valueName": "slot", "valueType": "VSlotScopeExpression", "scopeNames": ["headerData"] }], "templateComment": "", "children": [] }] }] }, "slotSet": [{ "templateValue": "slot", "templateType": "VElement", "attributes": [{ "name": "name", "valueName": "header", "valueType": "VLiteral" }], "templateComment": " 定义 ", "children": [] }, { "templateValue": "slot", "templateType": "VElement", "attributes": [{ "name": "name", "valueName": "footer", "valueType": "VLiteral" }, { "name": ":item", "valueName": "item", "valueType": "Identifier" }, { "name": ":index", "valueName": "index", "valueType": "Identifier" }], "templateComment": "", "children": [] }], "propMap": { "propA": { "propName": "propA", "propComment": " 注释propA" }, "propB": { "propName": "propB", "propComment": " 注释propB" } }, "setupMap": { "setupA": { "setupName": "setupA", "setupComment": " setupA注释2\n setupA注释" } }, "lifecycleHookMap": { "mounted": { "lifecycleHookName": "mounted", "lifecycleHookComment": " 生命周期" } }, "filterMap": { "filterA": { "filterName": "filterA", "filterComment": " filterA注释" } }, "emitMap": { "emitA": { "emitName": "emitA", "emitType": [["null"], "emitAValue2", "Array", "Object", "Function", "this.injectA", "a", "a[0]", "Array"], "emitComment": " 测试emitA\n\n emitA注释" }, "emitB": { "emitName": "emitB", "emitType": ["\"1\"", "\"2\""], "emitComment": " 测试emitB\n\n emitB注释" }, "emitC": { "emitName": "emitC", "emitType": ["Object"], "emitComment": " 测试emitC\n\n emitC注释" } }, "dataMap": { "dataA": { "dataName": "dataA", "dataComment": " dataA注释2" }, "dataB": { "dataName": "dataB", "dataComment": " dataB注释2" }, "dataD": { "dataName": "dataD", "dataComment": " dataD注释2" } }, "computedMap": { "computedA": { "computedName": "computedA", "computedComment": "all: computedA注释\n\nget: computedA注释1\n\nset: computedA注释2" }, "computedB": { "computedName": "computedB", "computedComment": "all: computedB注释" } }, "methodMap": { "doSome": { "methodName": "doSome", "methodComment": " 测试methods" } }, "provideMap": { "provideA": { "provideName": "provideA", "provideFromKey": "\"provideFromA\"", "provideComment": " 注释" } }, "injectMap": { "injectA": { "injectName": "injectA", "injectFrom": "\"injectAFrom\"", "injectDefault": "() => \"injectADefault\"", "injectComment": " 注释injectA" }, "injectB": { "injectName": "injectB", "injectFrom": "[s]", "injectComment": "" } }, "modelOption": { "prop": "value", "event": "input" }, "componentName": "my-define-Component", "componentMap": { "my-component-name": { "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": " 测试1 ", "children": [{ "templateValue": "div", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "classComponent", "templateType": "VText", "templateComment": "" }] }] }, "slotSet": [], "propMap": { "value": { "propName": "value", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器器注释\n 计算属性注释 return this.value" }, "propJ": { "propName": "propJ", "propDefault": "() => {\n        return [];\n      }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "propI": { "propName": "propI", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释" }, "propH": { "propName": "propH", "propDefault": "0", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" }, "propG": { "propName": "propG", "propType": ["Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n propG propOption 是个构造函数" }, "propF": { "propName": "propF", "propType": ["Number"], "propRequired": true, "propComment": " propF propOption 是个数组时" }, "propE": { "propName": "propE", "propType": ["Array"], "propRequired": true, "propComment": " propE ts类型嵌套type,required:true" }, "propD": { "propName": "propD", "propType": ["Array"], "propRequired": true, "propComment": " propD ts类型常量,required:true" }, "propC": { "propName": "propC", "propType": ["Object"], "propRequired": false, "propComment": " propC ts类型interface,required:false" }, "propB": { "propName": "propB", "propType": ["Array"], "propRequired": true, "propComment": " propB ts类型type,required:true" }, "propA": { "propName": "propA", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " 装饰器注释\n prop 注释" } }, "setupMap": {}, "lifecycleHookMap": { "mounted": { "lifecycleHookName": "mounted", "lifecycleHookComment": " 生命周期" } }, "filterMap": {}, "emitMap": { "emit1": { "emitName": "emit1", "emitType": [["Number"], ["Number"], ["String", "Number"], []], "emitComment": " ——————————————————————————————————————\n emitA注释1\n emitA注释2" }, "emit2": { "emitName": "emit2", "emitType": [], "emitComment": "" }, "emit3": { "emitName": "emit3", "emitType": [["10"]], "emitComment": " emit('emit3',10)" }, "emit-four": { "emitName": "emit-four", "emitType": [[], []], "emitComment": " emit('emit-four',e.target.value,e)" }, "input": { "emitName": "input", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n 装饰器器注释\n 计算属性注释 return this.value" }, "change": { "emitName": "change", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "update:propH": { "emitName": "\"update:propH\"", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" } }, "dataMap": { "dataA": { "dataName": "dataA", "dataComment": "* dataA注释 " }, "provideA": { "dataName": "provideA", "dataComment": " provideA注释2" }, "provideB": { "dataName": "provideB", "dataComment": " provideB注释2" }, "ProvideReactiveA": { "dataName": "ProvideReactiveA", "dataComment": "" } }, "computedMap": { "computedA": { "computedName": "computedA", "computedComment": "get:* computedA注释1 \n\nset:* computedA注释2 " }, "computedPropJ": { "computedName": "computedPropJ", "computedComment": "all: ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "computedPropH": { "computedName": "computedPropH", "computedComment": "all: ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" } }, "methodMap": { "methodA": { "methodName": "methodA", "methodComment": " 方法1" } }, "provideMap": { "provideA": { "provideName": "provideA", "provideFromKey": "provideA", "provideComment": " provideA注释1\n provideA注释2" }, "provideBName": { "provideName": "provideBName", "provideFromKey": "provideB", "provideComment": " provideB注释1\n provideB注释2" }, "ProvideReactiveA": { "provideName": "ProvideReactiveA", "provideFromKey": "ProvideReactiveA", "provideComment": " ProvideReactiveA注释" } }, "injectMap": { "injectA": { "injectName": "injectA", "injectFrom": "injectA", "injectComment": " injectA注释\n injectA" }, "injectB": { "injectName": "injectB", "injectFrom": "\"injectB\"", "injectComment": "" }, "injectC": { "injectName": "injectC", "injectFrom": "\"injectCFrom\"", "injectDefault": "\"default\"", "injectComment": "" }, "injectD": { "injectName": "injectD", "injectFrom": "[symbol]", "injectComment": " 支持 injectFrom = [symbol]" }, "InjectReactiveA": { "injectName": "InjectReactiveA", "injectFrom": "InjectReactiveA", "injectComment": " InjectReactiveA注释" }, "InjectReactiveB": { "injectName": "InjectReactiveB", "injectFrom": "\"InjectReactiveBFrom\"", "injectComment": " InjectReactiveB注释" }, "InjectReactiveC": { "injectName": "InjectReactiveC", "injectFrom": "\"InjectReactiveCFrom\"", "injectDefault": "() => \"1\"", "injectComment": " InjectReactiveC注释" } }, "modelOption": { "prop": "propI", "event": "changePropI" }, "componentMap": {}, "mixinSet": [] }, "my-component2": { "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "div", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "setupComponent", "templateType": "VText", "templateComment": "" }] }] }, "slotSet": [], "propMap": { "propA": { "propName": "propA", "propType": ["Boolean", "String"], "propRequired": true, "propComment": " 类型注释" }, "propB": { "propName": "propB", "propType": ["Array"], "propRequired": false, "propComment": "" } }, "setupMap": { "emitA": { "setupName": "emitA", "setupComment": "" }, "provideData": { "setupName": "provideData", "setupComment": "" }, "injectA": { "setupName": "injectA", "setupComment": "" }, "getInjectBAndC": { "setupName": "getInjectBAndC", "setupComment": "" }, "injectB": { "setupName": "injectB", "setupComment": " injectB注释" }, "injectC": { "setupName": "injectC", "setupComment": " injectC注释" }, "injectD": { "setupName": "injectD", "setupComment": " injectD注释" }, "injectE": { "setupName": "injectE", "setupComment": " injectE注释" }, "injectH": { "setupName": "injectH", "setupComment": " injectH注释" }, "injectF": { "setupName": "injectF", "setupComment": " injectF注释" }, "methodA": { "setupName": "methodA", "setupComment": " ————————————————————————\n methodA注释" }, "methodB": { "setupName": "methodB", "setupComment": "" }, "computedA": { "setupName": "computedA", "setupComment": "" }, "computedB": { "setupName": "computedB", "setupComment": "" }, "dataA": { "setupName": "dataA", "setupComment": "" }, "dataB": { "setupName": "dataB", "setupComment": "" }, "getDataC": { "setupName": "getDataC", "setupComment": "" }, "dataC": { "setupName": "dataC", "setupComment": "" }, "dataG": { "setupName": "dataG", "setupComment": " dataG注释" }, "dataD": { "setupName": "dataD", "setupComment": " dataD注释" }, "dataE": { "setupName": "dataE", "setupComment": " dataE注释" }, "getDataM": { "setupName": "getDataM", "setupComment": "" }, "dataM": { "setupName": "dataM", "setupComment": " dataM注释" }, "getDataHAndI": { "setupName": "getDataHAndI", "setupComment": " data ObjectPattern——————————" }, "dataH": { "setupName": "dataH", "setupComment": " dataH注释" }, "dataI": { "setupName": "dataI", "setupComment": " dataI注释" }, "dataJ": { "setupName": "dataJ", "setupComment": "" }, "dataO": { "setupName": "dataO", "setupComment": " dataO注释" }, "dataK": { "setupName": "dataK", "setupComment": "" }, "dataL": { "setupName": "dataL", "setupComment": " dataL注释" }, "dataN": { "setupName": "dataN", "setupComment": "" } }, "lifecycleHookMap": { "onMounted": { "lifecycleHookName": "onMounted", "lifecycleHookComment": " 生命周期————————————————————————\n 生命周期注释1\n\n 生命周期注释2" } }, "filterMap": {}, "emitMap": { "emitA": { "emitName": "emitA", "emitComment": " emitA类型注释" }, "emitB": { "emitName": "emitB", "emitType": ["emitB(payload) {\n    return typeof payload === \"string\";\n  }"], "emitComment": " emitB类型注释" }, "emitC": { "emitName": "emitC", "emitType": [["String", "Number", "(value) => typeof value === \"number\""]], "emitComment": " emitC注释，校验满足数组的其中一个就行" }, "emitD": { "emitName": "emitD", "emitType": [["Array", "Number"], ["Number"]], "emitComment": " 类型注释" } }, "dataMap": {}, "computedMap": {}, "methodMap": {}, "provideMap": {}, "injectMap": {}, "modelOption": { "prop": "value", "event": "input" }, "componentMap": {}, "mixinSet": [] } }, "extend": { "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": " 测试1 ", "children": [{ "templateValue": "div", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "classComponent", "templateType": "VText", "templateComment": "" }] }] }, "slotSet": [], "propMap": { "value": { "propName": "value", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器器注释\n 计算属性注释 return this.value" }, "propJ": { "propName": "propJ", "propDefault": "() => {\n        return [];\n      }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "propI": { "propName": "propI", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释" }, "propH": { "propName": "propH", "propDefault": "0", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" }, "propG": { "propName": "propG", "propType": ["Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n propG propOption 是个构造函数" }, "propF": { "propName": "propF", "propType": ["Number"], "propRequired": true, "propComment": " propF propOption 是个数组时" }, "propE": { "propName": "propE", "propType": ["Array"], "propRequired": true, "propComment": " propE ts类型嵌套type,required:true" }, "propD": { "propName": "propD", "propType": ["Array"], "propRequired": true, "propComment": " propD ts类型常量,required:true" }, "propC": { "propName": "propC", "propType": ["Object"], "propRequired": false, "propComment": " propC ts类型interface,required:false" }, "propB": { "propName": "propB", "propType": ["Array"], "propRequired": true, "propComment": " propB ts类型type,required:true" }, "propA": { "propName": "propA", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " 装饰器注释\n prop 注释" } }, "setupMap": {}, "lifecycleHookMap": { "mounted": { "lifecycleHookName": "mounted", "lifecycleHookComment": " 生命周期" } }, "filterMap": {}, "emitMap": { "emit1": { "emitName": "emit1", "emitType": [["Number"], ["Number"], ["String", "Number"], []], "emitComment": " ——————————————————————————————————————\n emitA注释1\n emitA注释2" }, "emit2": { "emitName": "emit2", "emitType": [], "emitComment": "" }, "emit3": { "emitName": "emit3", "emitType": [["10"]], "emitComment": " emit('emit3',10)" }, "emit-four": { "emitName": "emit-four", "emitType": [[], []], "emitComment": " emit('emit-four',e.target.value,e)" }, "input": { "emitName": "input", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n 装饰器器注释\n 计算属性注释 return this.value" }, "change": { "emitName": "change", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "update:propH": { "emitName": "\"update:propH\"", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" } }, "dataMap": { "dataA": { "dataName": "dataA", "dataComment": "* dataA注释 " }, "provideA": { "dataName": "provideA", "dataComment": " provideA注释2" }, "provideB": { "dataName": "provideB", "dataComment": " provideB注释2" }, "ProvideReactiveA": { "dataName": "ProvideReactiveA", "dataComment": "" } }, "computedMap": { "computedA": { "computedName": "computedA", "computedComment": "get:* computedA注释1 \n\nset:* computedA注释2 " }, "computedPropJ": { "computedName": "computedPropJ", "computedComment": "all: ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "computedPropH": { "computedName": "computedPropH", "computedComment": "all: ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" } }, "methodMap": { "methodA": { "methodName": "methodA", "methodComment": " 方法1" } }, "provideMap": { "provideA": { "provideName": "provideA", "provideFromKey": "provideA", "provideComment": " provideA注释1\n provideA注释2" }, "provideBName": { "provideName": "provideBName", "provideFromKey": "provideB", "provideComment": " provideB注释1\n provideB注释2" }, "ProvideReactiveA": { "provideName": "ProvideReactiveA", "provideFromKey": "ProvideReactiveA", "provideComment": " ProvideReactiveA注释" } }, "injectMap": { "injectA": { "injectName": "injectA", "injectFrom": "injectA", "injectComment": " injectA注释\n injectA" }, "injectB": { "injectName": "injectB", "injectFrom": "\"injectB\"", "injectComment": "" }, "injectC": { "injectName": "injectC", "injectFrom": "\"injectCFrom\"", "injectDefault": "\"default\"", "injectComment": "" }, "injectD": { "injectName": "injectD", "injectFrom": "[symbol]", "injectComment": " 支持 injectFrom = [symbol]" }, "InjectReactiveA": { "injectName": "InjectReactiveA", "injectFrom": "InjectReactiveA", "injectComment": " InjectReactiveA注释" }, "InjectReactiveB": { "injectName": "InjectReactiveB", "injectFrom": "\"InjectReactiveBFrom\"", "injectComment": " InjectReactiveB注释" }, "InjectReactiveC": { "injectName": "InjectReactiveC", "injectFrom": "\"InjectReactiveCFrom\"", "injectDefault": "() => \"1\"", "injectComment": " InjectReactiveC注释" } }, "modelOption": { "prop": "propI", "event": "changePropI" }, "componentMap": {}, "mixinSet": [] }, "mixinSet": [{ "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": " 测试1 ", "children": [{ "templateValue": "div", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "classComponent", "templateType": "VText", "templateComment": "" }] }] }, "slotSet": [], "propMap": { "value": { "propName": "value", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器器注释\n 计算属性注释 return this.value" }, "propJ": { "propName": "propJ", "propDefault": "() => {\n        return [];\n      }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "propI": { "propName": "propI", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释" }, "propH": { "propName": "propH", "propDefault": "0", "propType": ["Array", "Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" }, "propG": { "propName": "propG", "propType": ["Number"], "propRequired": true, "propComment": " ——————————————————————————————————————\n propG propOption 是个构造函数" }, "propF": { "propName": "propF", "propType": ["Number"], "propRequired": true, "propComment": " propF propOption 是个数组时" }, "propE": { "propName": "propE", "propType": ["Array"], "propRequired": true, "propComment": " propE ts类型嵌套type,required:true" }, "propD": { "propName": "propD", "propType": ["Array"], "propRequired": true, "propComment": " propD ts类型常量,required:true" }, "propC": { "propName": "propC", "propType": ["Object"], "propRequired": false, "propComment": " propC ts类型interface,required:false" }, "propB": { "propName": "propB", "propType": ["Array"], "propRequired": true, "propComment": " propB ts类型type,required:true" }, "propA": { "propName": "propA", "propDefault": "() => {\n      return [];\n    }", "propType": ["Array", "Number"], "propRequired": true, "propComment": " 装饰器注释\n prop 注释" } }, "setupMap": {}, "lifecycleHookMap": { "mounted": { "lifecycleHookName": "mounted", "lifecycleHookComment": " 生命周期" } }, "filterMap": {}, "emitMap": { "emit1": { "emitName": "emit1", "emitType": [["Number"], ["Number"], ["String", "Number"], []], "emitComment": " ——————————————————————————————————————\n emitA注释1\n emitA注释2" }, "emit2": { "emitName": "emit2", "emitType": [], "emitComment": "" }, "emit3": { "emitName": "emit3", "emitType": [["10"]], "emitComment": " emit('emit3',10)" }, "emit-four": { "emitName": "emit-four", "emitType": [[], []], "emitComment": " emit('emit-four',e.target.value,e)" }, "input": { "emitName": "input", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n 装饰器器注释\n 计算属性注释 return this.value" }, "change": { "emitName": "change", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "update:propH": { "emitName": "\"update:propH\"", "emitType": [["Array", "Number"]], "emitComment": " ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" } }, "dataMap": { "dataA": { "dataName": "dataA", "dataComment": "* dataA注释 " }, "provideA": { "dataName": "provideA", "dataComment": " provideA注释2" }, "provideB": { "dataName": "provideB", "dataComment": " provideB注释2" }, "ProvideReactiveA": { "dataName": "ProvideReactiveA", "dataComment": "" } }, "computedMap": { "computedA": { "computedName": "computedA", "computedComment": "get:* computedA注释1 \n\nset:* computedA注释2 " }, "computedPropJ": { "computedName": "computedPropJ", "computedComment": "all: ——————————————————————————————————————\n 装饰器注释\n prop 注释\n 计算属性注释 return this.propJ" }, "computedPropH": { "computedName": "computedPropH", "computedComment": "all: ——————————————————————————————————————\n* 装饰器注释 \n 计算属性注释 return this.propH" } }, "methodMap": { "methodA": { "methodName": "methodA", "methodComment": " 方法1" } }, "provideMap": { "provideA": { "provideName": "provideA", "provideFromKey": "provideA", "provideComment": " provideA注释1\n provideA注释2" }, "provideBName": { "provideName": "provideBName", "provideFromKey": "provideB", "provideComment": " provideB注释1\n provideB注释2" }, "ProvideReactiveA": { "provideName": "ProvideReactiveA", "provideFromKey": "ProvideReactiveA", "provideComment": " ProvideReactiveA注释" } }, "injectMap": { "injectA": { "injectName": "injectA", "injectFrom": "injectA", "injectComment": " injectA注释\n injectA" }, "injectB": { "injectName": "injectB", "injectFrom": "\"injectB\"", "injectComment": "" }, "injectC": { "injectName": "injectC", "injectFrom": "\"injectCFrom\"", "injectDefault": "\"default\"", "injectComment": "" }, "injectD": { "injectName": "injectD", "injectFrom": "[symbol]", "injectComment": " 支持 injectFrom = [symbol]" }, "InjectReactiveA": { "injectName": "InjectReactiveA", "injectFrom": "InjectReactiveA", "injectComment": " InjectReactiveA注释" }, "InjectReactiveB": { "injectName": "InjectReactiveB", "injectFrom": "\"InjectReactiveBFrom\"", "injectComment": " InjectReactiveB注释" }, "InjectReactiveC": { "injectName": "InjectReactiveC", "injectFrom": "\"InjectReactiveCFrom\"", "injectDefault": "() => \"1\"", "injectComment": " InjectReactiveC注释" } }, "modelOption": { "prop": "propI", "event": "changePropI" }, "componentMap": {}, "mixinSet": [] }, { "template": { "templateValue": "template", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "div", "templateType": "VElement", "attributes": [], "templateComment": "", "children": [{ "templateValue": "setupComponent", "templateType": "VText", "templateComment": "" }] }] }, "slotSet": [], "propMap": { "propA": { "propName": "propA", "propType": ["Boolean", "String"], "propRequired": true, "propComment": " 类型注释" }, "propB": { "propName": "propB", "propType": ["Array"], "propRequired": false, "propComment": "" } }, "setupMap": { "emitA": { "setupName": "emitA", "setupComment": "" }, "provideData": { "setupName": "provideData", "setupComment": "" }, "injectA": { "setupName": "injectA", "setupComment": "" }, "getInjectBAndC": { "setupName": "getInjectBAndC", "setupComment": "" }, "injectB": { "setupName": "injectB", "setupComment": " injectB注释" }, "injectC": { "setupName": "injectC", "setupComment": " injectC注释" }, "injectD": { "setupName": "injectD", "setupComment": " injectD注释" }, "injectE": { "setupName": "injectE", "setupComment": " injectE注释" }, "injectH": { "setupName": "injectH", "setupComment": " injectH注释" }, "injectF": { "setupName": "injectF", "setupComment": " injectF注释" }, "methodA": { "setupName": "methodA", "setupComment": " ————————————————————————\n methodA注释" }, "methodB": { "setupName": "methodB", "setupComment": "" }, "computedA": { "setupName": "computedA", "setupComment": "" }, "computedB": { "setupName": "computedB", "setupComment": "" }, "dataA": { "setupName": "dataA", "setupComment": "" }, "dataB": { "setupName": "dataB", "setupComment": "" }, "getDataC": { "setupName": "getDataC", "setupComment": "" }, "dataC": { "setupName": "dataC", "setupComment": "" }, "dataG": { "setupName": "dataG", "setupComment": " dataG注释" }, "dataD": { "setupName": "dataD", "setupComment": " dataD注释" }, "dataE": { "setupName": "dataE", "setupComment": " dataE注释" }, "getDataM": { "setupName": "getDataM", "setupComment": "" }, "dataM": { "setupName": "dataM", "setupComment": " dataM注释" }, "getDataHAndI": { "setupName": "getDataHAndI", "setupComment": " data ObjectPattern——————————" }, "dataH": { "setupName": "dataH", "setupComment": " dataH注释" }, "dataI": { "setupName": "dataI", "setupComment": " dataI注释" }, "dataJ": { "setupName": "dataJ", "setupComment": "" }, "dataO": { "setupName": "dataO", "setupComment": " dataO注释" }, "dataK": { "setupName": "dataK", "setupComment": "" }, "dataL": { "setupName": "dataL", "setupComment": " dataL注释" }, "dataN": { "setupName": "dataN", "setupComment": "" } }, "lifecycleHookMap": { "onMounted": { "lifecycleHookName": "onMounted", "lifecycleHookComment": " 生命周期————————————————————————\n 生命周期注释1\n\n 生命周期注释2" } }, "filterMap": {}, "emitMap": { "emitA": { "emitName": "emitA", "emitComment": " emitA类型注释" }, "emitB": { "emitName": "emitB", "emitType": ["emitB(payload) {\n    return typeof payload === \"string\";\n  }"], "emitComment": " emitB类型注释" }, "emitC": { "emitName": "emitC", "emitType": [["String", "Number", "(value) => typeof value === \"number\""]], "emitComment": " emitC注释，校验满足数组的其中一个就行" }, "emitD": { "emitName": "emitD", "emitType": [["Array", "Number"], ["Number"]], "emitComment": " 类型注释" } }, "dataMap": {}, "computedMap": {}, "methodMap": {}, "provideMap": {}, "injectMap": {}, "modelOption": { "prop": "value", "event": "input" }, "componentMap": {}, "mixinSet": [] }] } }] }]
export default routes