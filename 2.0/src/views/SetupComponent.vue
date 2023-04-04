<template>
  <div>setupComponent</div>
</template>


<script setup lang="ts">
import { reactive, ref } from "vue";

// ————————————————————————

// dataA注释
const dataA = ref("");
// dataB注释
const dataB = reactive("");
function getDataC() {
  const ret = ref("");
  return ret;
}
// dataC注释
const dataC = getDataC();

// ————————————————————————

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

interface Props {
  // 类型注释
  propA: boolean | string;
  propB?: string[];
}
withDefaults(defineProps<Props>(), {
  // 默认值注释
  propA: false,
  propB: () => {
    return ["one", "two"];
  },
});
</script>