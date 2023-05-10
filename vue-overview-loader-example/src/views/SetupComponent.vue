<template>
  <div>
    setup-component
    <class-component2></class-component2>
  </div>
</template>
<script setup lang='ts'>
import {
  computed,
  inject,
  onMounted,
  provide,
  reactive,
  ref,
  defineEmits,
  defineProps,
  withDefaults,
} from "vue";
import { default as ClassComponent2 } from "./ClassComponent.vue";
import ClassComponent from "./ClassComponent.vue";
const emit1 = defineEmits([
  // emitA注释
  "emitA",
]);
emit1("emitA", "emitAValue");
const emit2 = defineEmits({
  // emitB注释
  // type === emitB(value){return typeof value==='string'}
  emitB(value: string | number, value2: string) {
    return typeof value === "string" && value2;
  },
  emitC: (value: string | number, value2 = "1") => {
    return typeof value === "string" && value2;
  },
});
const emit3 = defineEmits<{
  // emit('emit-d',String | Number , Number)
  (e: "emitD", value1: string | number, value2: number): void;
}>();

// 生命周期注释1
onMounted(() => {
  console.log("onMounted1");
});
// 生命周期注释2
onMounted(() => {
  console.log("onMounted2");
});
// dataA注释
const dataA = ref("");
// provide注释,provide:{provideName:dataA}
// 参数1可是字符串或symbol
provide("provideName", dataA);

// injectA注释
const injectA = inject("provideName", "injectADefault");
const [
  // injectB注释
  injectB,
] = [inject("provideName", "injectBDefault")];

// getDataB注释
function getDataB() {
  return [1];
}
const [
  // dataB注释
  dataB,
] = getDataB();

// getDataC注释
function getDataC() {
  return { data: 1 };
}
const {
  // dataC注释
  data: dataC,
} = getDataC();

// 计算属性A注释
const computedA = computed(() => dataA.value);
// 计算属性B注释
const computedB = computed({
  // 计算属性B的get注释
  get: () => dataA.value,
  // 计算属性B的set注释
  set: (val) => {
    dataA.value = val;
  },
});
// dataD注释
const dataD = reactive({});
let dataE,
  // dataF注释
  dataF = ref("");
interface DefinePropsType {
  // propA注释
  propA: string;
}
defineProps<DefinePropsType>();

defineProps({
  // propB注释
  propB: {
    type: Boolean,
    default: false,
    required: true,
  },
  // propC注释
  propC: Boolean,
  // propD注释
  propD: [String, Number],
});
withDefaults(
  defineProps<{
    // propE注释1
    propE: string;
  }>(),
  {
    // 默认值注释
    propE: "",
  }
);
</script>