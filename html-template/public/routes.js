/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var routes;
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/router/routes.ts":
/*!******************************!*\
  !*** ./src/router/routes.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _views_ClassComponent_vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../views/ClassComponent.vue */ \"./src/views/ClassComponent.vue\");\n/* harmony import */ var _views_OptionComponent_vue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../views/OptionComponent.vue */ \"./src/views/OptionComponent.vue\");\n\n\nconst routes = [{\n  path: '/options-component',\n  component: _views_OptionComponent_vue__WEBPACK_IMPORTED_MODULE_1__[\"default\"],\n  children: [{\n    path: 'class-component',\n    name: 'ClassComponent',\n    component: _views_ClassComponent_vue__WEBPACK_IMPORTED_MODULE_0__[\"default\"]\n  }]\n}, {\n  path: '/setup-component',\n  component: () => Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ../views/SetupComponent.vue */ \"./src/views/SetupComponent.vue\"))\n}];\n/* harmony default export */ __webpack_exports__[\"default\"] = (routes);\n\n//# sourceURL=webpack://2.0/./src/router/routes.ts?");

/***/ }),

/***/ "./src/views/deconstruction.ts":
/*!*************************************!*\
  !*** ./src/views/deconstruction.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _filter_e__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./filter-e */ \"./src/views/filter-e.ts\");\n\n/* harmony default export */ __webpack_exports__[\"default\"] = ({ comment:\"\" });\n\n//# sourceURL=webpack://2.0/./src/views/deconstruction.ts?");

/***/ }),

/***/ "./src/views/extendOption.ts":
/*!***********************************!*\
  !*** ./src/views/extendOption.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _SetupComponent_vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SetupComponent.vue */ \"./src/views/SetupComponent.vue\");\n\n/* harmony default export */ __webpack_exports__[\"default\"] = ({'name':undefined,'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':undefined,'propMap':{'extendPropA':{'name':\"extendPropA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" extend中extendPropA\"},'propA':{'name':\"propA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" extend中propA\"}},'emitMap':{},'setupMap':{},'injectMap':{},'provideMap':{},'lifecycleHookMap':{},'computedMap':{},'dataMap':{},'methodMap':{},'filterMap':{},'extend':undefined,'mixinSet':[],'componentMap':{'setup-component':_SetupComponent_vue__WEBPACK_IMPORTED_MODULE_0__[\"default\"]},'resource':undefined});\n\n//# sourceURL=webpack://2.0/./src/views/extendOption.ts?");

/***/ }),

/***/ "./src/views/filter-e.ts":
/*!*******************************!*\
  !*** ./src/views/filter-e.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   filterE: function() { return /* binding */ filterE; }\n/* harmony export */ });\nconst filterE = { comment:\"\" }\n\n//# sourceURL=webpack://2.0/./src/views/filter-e.ts?");

/***/ }),

/***/ "./src/views/filter.ts":
/*!*****************************!*\
  !*** ./src/views/filter.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   filterB: function() { return /* binding */ filterB; },\n/* harmony export */   filterC: function() { return /* binding */ filterC; },\n/* harmony export */   filterD: function() { return /* binding */ filterD; },\n/* harmony export */   filterE: function() { return /* reexport safe */ _filter_e__WEBPACK_IMPORTED_MODULE_0__.filterE; },\n/* harmony export */   filterF: function() { return /* binding */ filterF; },\n/* harmony export */   filterG: function() { return /* binding */ filterG; }\n/* harmony export */ });\n/* harmony import */ var _filter_e__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./filter-e */ \"./src/views/filter-e.ts\");\n/* harmony default export */ __webpack_exports__[\"default\"] = ({ comment:\" export default 注释\\n filterB 定义注释\"});\nconst filterC = { comment:\" filter export 注释\\nfilterC注释\" }\nconst filterG = { comment:\" filter export 注释\\n filterG注释\" }\nconst filterB = { comment:\" export {'filterB'}\\n filterB 定义注释\" }\nconst filterF = { comment:\"\" }\nconst filterD = { comment:\" export {filterB as filterD}\\n filterB 定义注释\" }\n\n\n//# sourceURL=webpack://2.0/./src/views/filter.ts?");

/***/ }),

/***/ "./src/views/mixinOption.ts":
/*!**********************************!*\
  !*** ./src/views/mixinOption.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   mixinA: function() { return /* binding */ mixinA; }\n/* harmony export */ });\nconst mixinA = {'name':undefined,'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':undefined,'propMap':{'mixinAPropA':{'name':\"mixinAPropA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinA中mixinAPropA\"},'mixinPropA':{'name':\"mixinPropA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinA中mixinPropA\"},'extendPropA':{'name':\"extendPropA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinA中extendPropA\"},'propA':{'name':\"propA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinA中propA\"}},'emitMap':{},'setupMap':{},'injectMap':{},'provideMap':{},'lifecycleHookMap':{},'computedMap':{},'dataMap':{},'methodMap':{},'filterMap':{},'extend':undefined,'mixinSet':[],'componentMap':{},'resource':undefined}\n/* harmony default export */ __webpack_exports__[\"default\"] = ({'name':undefined,'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':undefined,'propMap':{'mixinPropA':{'name':\"mixinPropA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinB中mixinPropA\"},'extendPropA':{'name':\"extendPropA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinB中extendPropA\"},'propA':{'name':\"propA\",'defaultValue':undefined,'type':undefined,'isRequired':undefined,'comment':\" mixinB中propA\"}},'emitMap':{},'setupMap':{},'injectMap':{},'provideMap':{},'lifecycleHookMap':{},'computedMap':{},'dataMap':{},'methodMap':{},'filterMap':{},'extend':undefined,'mixinSet':[],'componentMap':{},'resource':undefined});\n\n//# sourceURL=webpack://2.0/./src/views/mixinOption.ts?");

/***/ }),

/***/ "./src/views/ClassComponent.vue":
/*!**************************************!*\
  !*** ./src/views/ClassComponent.vue ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _ExtendClassComponent_vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ExtendClassComponent.vue */ \"./src/views/ExtendClassComponent.vue\");\n\n/* harmony default export */ __webpack_exports__[\"default\"] = ({'name':undefined,'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':{'template':\"<template>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"<div>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"\\\"class-component\\\"\",'type':\"VText\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},'propMap':{},'emitMap':{'\"emit-a\"':{'name':\"emit-a\",'type':[[\"Number\"],[\"String\"],[\"String\",\"Number\"],[undefined]],'comment':\" emitA注释1\\n emit('emit-a',10,n,m,o)\\n emit('emit-a',Number,String,[String,Number],undefined)\",'paramsVerify':undefined},'\"emit-b\"':{'name':\"emit-b\",'type':[],'comment':\" emitB注释1\\n emit('emit-b')\",'paramsVerify':undefined},'\"emit-c\"':{'name':\"emit-c\",'type':[[\"Number\"]],'comment':\" emitC注释1\\n emit('emit-c',Number)\",'paramsVerify':undefined},'\"emit-d\"':{'name':\"emit-d\",'type':[[undefined],[undefined]],'comment':\" emitD注释1\\n emit('emit-d',e.target.value,e)\\n emit('emit-d',undefined,undefined)\",'paramsVerify':undefined}},'setupMap':{},'injectMap':{'injectA':{'name':\"injectA\",'from':\"injectA\",'fromType':\"Literal\",'defaultValue':undefined,'comment':\" InjectA注释1\\n inject:{injectA:'injectA'}\"},'injectB':{'name':\"injectB\",'from':\"\\\"injectBFrom\\\"\",'fromType':\"Literal\",'defaultValue':\"\\\"injectBDefault\\\"\",'comment':\" InjectB注释1\\n inject:{injectB:{from:'injectBFrom',default:'injectBDefault'}}\"},'injectC':{'name':\"injectC\",'from':\"\\\"injectCName\\\"\",'fromType':\"Literal\",'defaultValue':undefined,'comment':\" InjectC注释1\\n inject:{injectC:'injectCName'}\"},'injectD':{'name':\"injectD\",'from':\"symbol\",'fromType':\"Identifier\",'defaultValue':undefined,'comment':\" InjectD注释1\\n inject:{injectD:symbol}\"},'injectReactiveA':{'name':\"injectReactiveA\",'from':\"injectReactiveA\",'fromType':\"Literal\",'defaultValue':undefined,'comment':\" InjectReactiveA注释\\n inject:{injectReactiveA:'InjectReactiveAFrom'}\"},'injectReactiveB':{'name':\"injectReactiveB\",'from':\"\\\"InjectReactiveBFrom\\\"\",'fromType':\"Literal\",'defaultValue':undefined,'comment':\" InjectReactiveB注释\\n inject:{injectReactiveB:'InjectReactiveBFrom'}\"},'injectReactiveC':{'name':\"injectReactiveC\",'from':\"\\\"InjectReactiveCFrom\\\"\",'fromType':\"Literal\",'defaultValue':\"() => \\\"1\\\"\",'comment':\" InjectReactiveC注释\\n inject:{injectReactiveC:{from:'InjectReactiveCFrom',default:()=>1}}}\"}},'provideMap':{'provideA':{'name':\"provideA\",'nameType':\"Literal\",'value':\"provideA\",'valueType':\"Identifier\",'comment':\" provideA注释1\"},'provideBName':{'name':\"provideBName\",'nameType':\"Literal\",'value':\"provideB\",'valueType':\"Identifier\",'comment':\" provideB注释1\"},'provideSymbol':{'name':\"provideSymbol\",'nameType':\"Identifier\",'value':\"provideReactiveA\",'valueType':\"Identifier\",'comment':\" ProvideReactiveA注释\"}},'lifecycleHookMap':{'mounted':{'name':\"mounted\",'comment':\" 生命周期\"}},'computedMap':{'computedA':{'name':\"computedA\",'comment':\"get: computedA注释 get\",'computedComment':\"set: computedA注释 set\"}},'dataMap':{'provideA':{'name':\"provideA\",'comment':\" data provideA\\n provide:{provideA:this.provideA}\"},'provideB':{'name':\"provideB\",'comment':\" data provideB\\n provide:{provideBName:this.provideB}\"},'provideReactiveA':{'name':\"provideReactiveA\",'comment':\" data:{provideReactiveA:'provideReactiveA'},provide:{provideName:this.provideReactiveA}\"}},'methodMap':{'methodA':{'name':\"methodA\",'comment':\" methodA 注释\"}},'filterMap':{},'extend':undefined,'mixinSet':[_ExtendClassComponent_vue__WEBPACK_IMPORTED_MODULE_0__[\"default\"]],'componentMap':{},'resource':\"E:\\\\vue-component-tree-overview\\\\vue-overview-loader-example\\\\src\\\\views\\\\ClassComponent.vue\"});\n\n//# sourceURL=webpack://2.0/./src/views/ClassComponent.vue?");

/***/ }),

/***/ "./src/views/ExtendClassComponent.vue":
/*!********************************************!*\
  !*** ./src/views/ExtendClassComponent.vue ***!
  \********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = ({'name':undefined,'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':undefined,'propMap':{},'emitMap':{},'setupMap':{},'injectMap':{},'provideMap':{},'lifecycleHookMap':{},'computedMap':{},'dataMap':{},'methodMap':{},'filterMap':{},'extend':undefined,'mixinSet':[],'componentMap':{},'resource':\"E:\\\\vue-component-tree-overview\\\\vue-overview-loader-example\\\\src\\\\views\\\\ExtendClassComponent.vue\"});\n\n//# sourceURL=webpack://2.0/./src/views/ExtendClassComponent.vue?");

/***/ }),

/***/ "./src/views/OptionComponent.vue":
/*!***************************************!*\
  !*** ./src/views/OptionComponent.vue ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./filter */ \"./src/views/filter.ts\");\n/* harmony import */ var _extendOption__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./extendOption */ \"./src/views/extendOption.ts\");\n/* harmony import */ var _mixinOption__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./mixinOption */ \"./src/views/mixinOption.ts\");\n/* harmony import */ var _ClassComponent_vue__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ClassComponent.vue */ \"./src/views/ClassComponent.vue\");\n/* harmony import */ var _deconstruction__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./deconstruction */ \"./src/views/deconstruction.ts\");\n\n\n\n\n\n/* harmony default export */ __webpack_exports__[\"default\"] = ({'name':\"option-component-name\",'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':{'template':\"<template>\",'type':\"VElement\",'attributes':[],'comment':\" 组件注释 \",'children':[{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"class\",'valueName':\"tw-p-2\",'valueType':\"VLiteral\",'scopeNames':undefined,'callNames':undefined,'callParams':undefined},{'keyName':\":class\",'valueName':\"dataA\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"dataA\"]},{'keyName':\":attr-a\",'valueName':\"getAttrB1(getAttrB2(dataA))\",'valueType':\"CallExpression\",'scopeNames':undefined,'callNames':[\"getAttrB1\",\"getAttrB2\"],'callParams':[\"dataA\"]},{'keyName':\":attr-c\",'valueName':\"dataB.a\",'valueType':\"MemberExpression\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"dataB.a\"]},{'keyName':\":attr-d\",'valueName':\"myClass | filterA | filterB\",'valueType':\"VFilterSequenceExpression\",'scopeNames':undefined,'callNames':[\"filterB\",\"filterA\"],'callParams':[\"myClass\"]}],'comment':\" 标签注释1 \\n 标签注释2 \",'children':[{'template':\"{{ dataA | filterA }}\",'type':\"VFilterSequenceExpression\",'attributes':undefined,'comment':\" 绑定值注释 \",'children':undefined,'callNames':[\"filterA\"],'callParams':[\"dataA\"]},{'template':\"{{ dataA }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"dataA\"]},{'template':\"{{ dataB.a }}\",'type':\"MemberExpression\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"dataB.a\"]},{'template':\"{{ getAttrB1(getAttrB2(dataA, dataB)) }}\",'type':\"CallExpression\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':[\"getAttrB1\",\"getAttrB2\"],'callParams':[\"dataA\",\"dataB\"]},{'template':\"\\\" 我是字符串 \\\"\",'type':\"VText\",'attributes':undefined,'comment':\" 常量注释 \",'children':undefined,'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"v-if\",'valueName':\"dataA\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"dataA\"]}],'comment':\"\",'children':[{'template':\"\\\"v-if\\\"\",'type':\"VText\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"v-else-if\",'valueName':\"dataB.a\",'valueType':\"MemberExpression\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"dataB.a\"]}],'comment':\"\",'children':[{'template':\"\\\"v-else-if\\\"\",'type':\"VText\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"v-else\",'valueName':undefined,'valueType':undefined,'scopeNames':undefined,'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[{'template':\"\\\"v-else\\\"\",'type':\"VText\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"v-for\",'valueName':\"(dataB, key, index) in dataA\",'valueType':\"VForExpression\",'scopeNames':[\"dataB\",\"key\",\"index\"],'callNames':undefined,'callParams':[\"dataA\"]},{'keyName':\":key\",'valueName':\"index\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"index\"]}],'comment':\"\",'children':[{'template':\"{{ dataB }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"dataB\"]}],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"v-for\",'valueName':\"({ a }, key, index) in dataA\",'valueType':\"VForExpression\",'scopeNames':[\"a\",\"key\",\"index\"],'callNames':undefined,'callParams':[\"dataA\"]},{'keyName':\":key\",'valueName':\"index\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"index\"]}],'comment':\"\",'children':[{'template':\"{{ a }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"a\"]}],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"v-for\",'valueName':\"([a], key, index) in dataA\",'valueType':\"VForExpression\",'scopeNames':[\"a\",\"key\",\"index\"],'callNames':undefined,'callParams':[\"dataA\"]},{'keyName':\":key\",'valueName':\"index\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"index\"]}],'comment':\"\",'children':[{'template':\"{{ a }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"a\"]}],'callNames':undefined,'callParams':undefined},{'template':\"<slot>\",'type':\"VElement\",'attributes':[{'keyName':\"name\",'valueName':\"slotA\",'valueType':\"VLiteral\",'scopeNames':undefined,'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[],'callNames':undefined,'callParams':undefined},{'template':\"<slot>\",'type':\"VElement\",'attributes':[{'keyName':\"name\",'valueName':\"slotB\",'valueType':\"VLiteral\",'scopeNames':undefined,'callNames':undefined,'callParams':undefined},{'keyName':\":slotValueA\",'valueName':\"dataA\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"dataA\"]},{'keyName':\":slotValueB\",'valueName':\"dataB\",'valueType':\"Identifier\",'scopeNames':undefined,'callNames':undefined,'callParams':[\"dataB\"]}],'comment':\"\",'children':[],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"slot\",'valueName':\"slotA\",'valueType':\"VLiteral\",'scopeNames':undefined,'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"slot\",'valueName':\"slotB\",'valueType':\"VLiteral\",'scopeNames':undefined,'callNames':undefined,'callParams':undefined},{'keyName':\"slot-scope\",'valueName':\"scope\",'valueType':\"VSlotScopeExpression\",'scopeNames':[\"scope\"],'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[{'template':\"{{ scope }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"scope\"]}],'callNames':undefined,'callParams':undefined},{'template':\"<div>\",'type':\"VElement\",'attributes':[{'keyName':\"slot\",'valueName':\"slotC\",'valueType':\"VLiteral\",'scopeNames':undefined,'callNames':undefined,'callParams':undefined},{'keyName':\"slot-scope\",'valueName':\"{ slotValueA }\",'valueType':\"VSlotScopeExpression\",'scopeNames':[\"slotValueA\"],'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[{'template':\"{{ slotValueA }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"slotValueA\"]}],'callNames':undefined,'callParams':undefined},{'template':\"<template>\",'type':\"VElement\",'attributes':[{'keyName':\"v-slot:slotD\",'valueName':undefined,'valueType':undefined,'scopeNames':undefined,'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[{'template':\"<div>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"\\\"slotD\\\"\",'type':\"VText\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},{'template':\"<template>\",'type':\"VElement\",'attributes':[{'keyName':\"v-slot:slotE\",'valueName':\"scope\",'valueType':\"VSlotScopeExpression\",'scopeNames':[\"scope\"],'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[{'template':\"<div>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"{{ scope }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"scope\"]}],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},{'template':\"<template>\",'type':\"VElement\",'attributes':[{'keyName':\"v-slot:slotF\",'valueName':\"{ slotValueA }\",'valueType':\"VSlotScopeExpression\",'scopeNames':[\"slotValueA\"],'callNames':undefined,'callParams':undefined}],'comment':\"\",'children':[{'template':\"<div>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"{{ slotValueA }}\",'type':\"Identifier\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':[\"slotValueA\"]}],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},{'template':\"<class-component>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[],'callNames':undefined,'callParams':undefined},{'template':\"<router-view>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},'propMap':{'propA':{'name':\"propA\",'defaultValue':\"() => []\",'type':[\"Array\"],'isRequired':true,'comment':\" propA 注释\"},'propB':{'name':\"propB\",'defaultValue':undefined,'type':[\"Number\"],'isRequired':undefined,'comment':\" propB 注释\"},'propC':{'name':\"propC\",'defaultValue':undefined,'type':[\"Number\",\"String\"],'isRequired':undefined,'comment':\" propC 注释\"}},'emitMap':{'emitB':{'name':\"emitB\",'type':[[\"String\",\"Number\"],[\"Number\"]],'comment':\" emitB注释2\\n emitB注释1\",'paramsVerify':\"emitB(emitValueA: string | number, emitValueB) { return typeof emitValueA === \\\"string\\\" && emitValueB; }\"},'emitC':{'name':\"emitC\",'type':[[\"Object\"]],'comment':\" emitC注释2\\n emitC注释1\",'paramsVerify':\"emitC({ emitValueA, emitValueB }) { return typeof emitValueA === \\\"string\\\" && emitValueB; }\"},'emitA':{'name':\"emitA\",'type':undefined,'comment':\" emitA注释\",'paramsVerify':undefined}},'setupMap':{'setupA':{'name':\"setupA\",'comment':\" setupA注释2\\n setupA注释1\"}},'injectMap':{'injectA':{'name':\"injectA\",'from':\"\\\"injectAFrom\\\"\",'fromType':\"Literal\",'defaultValue':\"() => [\\\"injectADefault\\\"]\",'comment':\" injectA注释\"},'injectB':{'name':\"injectB\",'from':\"injectSymbol\",'fromType':\"Identifier\",'defaultValue':undefined,'comment':\" injectB注释\"}},'provideMap':{'s':{'name':\"s\",'nameType':\"Identifier\",'value':\"provideSymbolFrom.a\",'valueType':\"Identifier\",'comment':\" provideSymbol注释\"},'provideA':{'name':\"provideA\",'nameType':\"Literal\",'value':\"provideSymbolFrom\",'valueType':\"Identifier\",'comment':\" provideA注释，来源于 provide\"},'provideB':{'name':\"provideB\",'nameType':\"Literal\",'value':\"provideB\",'valueType':\"Literal\",'comment':\"\"}},'lifecycleHookMap':{'mounted':{'name':\"mounted\",'comment':\" 生命周期注释\"}},'computedMap':{'computedA':{'name':\"computedA\",'comment':\"all: computedA 注释\",'computedComment':\"get: computedA getter 注释\\nset: computedA setter 注释\"},'computedB':{'name':\"computedB\",'comment':\"all: computedB 注释\"}},'dataMap':{'dataA':{'name':\"dataA\",'comment':\" dataA 注释\"},'dataA.a':{'name':\"dataA.a\",'comment':\" dataA 注释\\n data是对象递归的注释\"},'dataB':{'name':\"dataB\",'comment':\" dataB 注释\"},'dataB.a':{'name':\"dataB.a\",'comment':\" dataB 注释\\n 初始化函数中的注释\"},'provideSymbolFrom':{'name':\"provideSymbolFrom\",'comment':\" provideSymbolFrom，来源于 data\"},'provideSymbolFrom.a':{'name':\"provideSymbolFrom.a\",'comment':\" provideSymbolFrom，来源于 data\"},'provideAFrom':{'name':\"provideAFrom\",'comment':\" provideA注释，来源于 data\"}},'methodMap':{'methodA':{'name':\"methodA\",'comment':\" methodA注释\"},'getAttrB1':{'name':\"getAttrB1\",'comment':\" getAttrB1 注释\"},'getAttrB2':{'name':\"getAttrB2\",'comment':\" getAttrB2 注释\"}},'filterMap':{'filterA':{'name':\"filterA\",'comment':\" filterA注释\",'importValue':undefined},'filterB':{'name':\"filterB\",'comment':\" filterB注释，来源于组件\\n filterB注释，来源于定义\",'importValue':undefined},'filterC':{'name':\"filterC\",'comment':\" filterC注释，来源于组件\",'importValue':_filter__WEBPACK_IMPORTED_MODULE_0__.filterC},'filterD':{'name':\"filterD\",'comment':\" filterD注释，来源于组件\",'importValue':_filter__WEBPACK_IMPORTED_MODULE_0__.filterD},'filterDefault':{'name':\"filterDefault\",'comment':\"\",'importValue':_filter__WEBPACK_IMPORTED_MODULE_0__[\"default\"]},'filterF':{'name':\"filterF\",'comment':\"\",'importValue':_filter__WEBPACK_IMPORTED_MODULE_0__.filterF},'filterE':{'name':\"filterE\",'comment':\"\",'importValue':_filter__WEBPACK_IMPORTED_MODULE_0__.filterE},'filterF2':{'name':\"filterF2\",'comment':\"\",'importValue':_filter__WEBPACK_IMPORTED_MODULE_0__.filterF}},'extend':_extendOption__WEBPACK_IMPORTED_MODULE_1__[\"default\"],'mixinSet':[_mixinOption__WEBPACK_IMPORTED_MODULE_2__.mixinA,_mixinOption__WEBPACK_IMPORTED_MODULE_2__[\"default\"]],'componentMap':{'class-component':_ClassComponent_vue__WEBPACK_IMPORTED_MODULE_3__[\"default\"]},'resource':\"E:\\\\vue-component-tree-overview\\\\vue-overview-loader-example\\\\src\\\\views\\\\OptionComponent.vue\"});\n\n//# sourceURL=webpack://2.0/./src/views/OptionComponent.vue?");

/***/ }),

/***/ "./src/views/SetupComponent.vue":
/*!**************************************!*\
  !*** ./src/views/SetupComponent.vue ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _ClassComponent_vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ClassComponent.vue */ \"./src/views/ClassComponent.vue\");\n\n\n/* harmony default export */ __webpack_exports__[\"default\"] = ({'name':undefined,'modelOptionMap':{'prop':\"value\",'event':\"input\"},'template':{'template':\"<template>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"<div>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[{'template':\"\\\" setup-component \\\"\",'type':\"VText\",'attributes':undefined,'comment':\"\",'children':undefined,'callNames':undefined,'callParams':undefined},{'template':\"<class-component2>\",'type':\"VElement\",'attributes':[],'comment':\"\",'children':[],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined}],'callNames':undefined,'callParams':undefined},'propMap':{},'emitMap':{'emitA':{'name':\"emitA\",'type':undefined,'comment':\" emitA注释\",'paramsVerify':undefined},'emitB':{'name':\"emitB\",'type':[[\"String\",\"Number\"],[\"String\"]],'comment':\" emitB注释\\n type === emitB(value){return typeof value==='string'}\",'paramsVerify':\"emitB(value: string | number, value2: string) { return typeof value === \\\"string\\\" && value2; }\"},'emitC':{'name':\"emitC\",'type':[[\"String\",\"Number\"],[undefined]],'comment':\"\",'paramsVerify':\"(value: string | number, value2 = \\\"1\\\") => { return typeof value === \\\"string\\\" && value2; }\"},'emitD':{'name':\"emitD\",'type':[[\"String\",\"Number\"],[\"Number\"]],'comment':\" emit('emit-d',String | Number , Number)\",'paramsVerify':undefined}},'setupMap':{'dataA':{'name':\"dataA\",'comment':\" dataA注释\"},'injectA':{'name':\"injectA\",'comment':\" injectA注释\"},'injectB':{'name':\"injectB\",'comment':\" injectB注释\"},'getDataB':{'name':\"getDataB\",'comment':\" getDataB注释\"},'dataB':{'name':\"dataB\",'comment':\" dataB注释\"},'getDataC':{'name':\"getDataC\",'comment':\" getDataC注释\"},'dataC':{'name':\"dataC\",'comment':\"\"},'computedA':{'name':\"computedA\",'comment':\" 计算属性A注释\"},'computedB':{'name':\"computedB\",'comment':\" 计算属性B注释\"},'dataD':{'name':\"dataD\",'comment':\" dataD注释\"},'dataE':{'name':\"dataE\",'comment':\"\"},'dataF':{'name':\"dataF\",'comment':\" dataF注释\"}},'injectMap':{},'provideMap':{'provideName':{'name':\"provideName\",'nameType':\"Literal\",'value':\"dataA\",'valueType':\"Identifier\",'comment':\" provide注释,provide:{provideName:dataA}\\n 参数1可是字符串或symbol\"}},'lifecycleHookMap':{'onMounted':{'name':\"onMounted\",'comment':\" 生命周期注释1\\n 生命周期注释2\"}},'computedMap':{},'dataMap':{},'methodMap':{},'filterMap':{},'extend':undefined,'mixinSet':[],'componentMap':{'class-component2':_ClassComponent_vue__WEBPACK_IMPORTED_MODULE_0__[\"default\"]},'resource':\"E:\\\\vue-component-tree-overview\\\\vue-overview-loader-example\\\\src\\\\views\\\\SetupComponent.vue\"});\n\n//# sourceURL=webpack://2.0/./src/views/SetupComponent.vue?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/router/routes.ts");
/******/ 	routes = __webpack_exports__;
/******/ 	
/******/ })()
;