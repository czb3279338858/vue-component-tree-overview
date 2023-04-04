<template>
  <div>setupComponent</div>
</template>


<script setup lang="ts">
import { computed, inject, onMounted, provide, reactive, ref } from "vue";
// 其他可能要考虑的
// ignoredElements 需要忽略组件查找的 Web Components APIs
// keyCodes
// extends
// directive 自定义指令的含义
// import 全局搜索导入注释
// 全局搜索类型，类型的ts具体形态
// model 的定义，script setup 需要用两个 script
// component 组件名\option name
// vue.use 注册的全局东西,不考虑
// mixin 不考虑
// Vue.myGlobalMethod Vue方法、属性，不考虑
// Vue.prototype.$myMethod 实例方法或属性，不考虑
// Vue.observable 让一个对象可响应，不考虑
// 生命周期
// provide/inject
// slot、scopeSlots
// emit
// bus总线 vue.$on vue.$emit 等,不考虑

// ————————————————————————
// 组件注释
import OtherComponent from "./OtherComponent.vue";

// ————————————————————————
// 指令注释
import { directiveA } from "./directiveA";

// ————————————————————————

const emit1 = defineEmits([
  // emitA类型注释
  "emitA",
]);
function emitA(value) {
  // emitA触发注释
  emit1("emitA", value);
}

const emit2 = defineEmits({
  // emitB类型注释
  emitB: String,
});
function emitB(value) {
  // emitB触发注释
  emit2("emitB", value);
}

const { emit: emit3 } = useContext<{ emitC: number }>();
function emitC(value) {
  // emitC触发注释
  emit3("emitC", value);
}

interface Emits {
  // 类型注释
  emitD: string[];
}
const emit4 = defineEmits<Emits>();
function emitD(value) {
  // emitD触发注释
  emit4("emitD", value);
}

// ————————————————————————

// 生命周期注释1
onMounted(() => {
  console.log("onMounted");
});
// 生命周期注释2
onMounted(() => {
  console.log("onMounted");
});

// ————————————————————————

// provideData注释
const provideData = ref("");
// provide注释
provide("provideName", provideData);
// injdectA注释
const injectA = inject("provideName");

// ————————————————————————

// methodA注释
function methoA() {
  console.log("method");
}

// ————————————————————————

// computdA注释
const computedA = computed(() => dataA.value);
// computedB注释
const computedB = defineComputed({
  get: () => dataA.value,
  set: (val) => {
    dataA.value = `${val} - 1`;
  },
});

// ————————————————————————

// dataA注释
const dataA = ref("");
// dataB注释
const dataB = reactive({});
function getDataC() {
  const ret = ref("");
  return ret;
}
// dataC注释
const dataC = getDataC();
const [
  // dataD注释
  dataD,
  // dataE注释
  dataE,
] = [ref(""), ref("")];
let // dataF注释
  dataF,
  // dataG注释
  dataG = ref("");
function getDataHAndI() {
  return {
    dataH: ref(""),
    dataI: "",
  };
}
const {
  // dataH注释
  dataH,
  // dataI注释
  dataI,
} = getDataHAndI();
const {
  // dataJ注释
  dataH: dataJ,
} = getDataHAndI();

// ————————————————————————
interface Props {
  // 类型注释
  propA: boolean | string;
  propB?: string[];
}
defineProps<Props>();

// defineProps({
//   /** propA注释 */
//   propA: {
//     type: Boolean,
//     default: false,
//     required: true,
//   },
//   // propB注释
//   propB: Boolean,
//   // propC注释
//   propC: [Array, Boolean],
// });

// interface Props {
//   // 类型注释
//   propA: boolean | string;
//   propB?: string[];
// }
// withDefaults(defineProps<Props>(), {
//   // 默认值注释
//   propA: false,
//   propB: () => {
//     return ["one", "two"];
//   },
// });
</script>