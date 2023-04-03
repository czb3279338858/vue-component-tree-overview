<template>
  <div>1</div>
</template>


<script setup lang="ts">
// dataA注释1
const dataA = ref("");
// dataB注释1
const dataB = reactive("");

defineProps({
  /** 注释1 */
  propA: {
    type: Boolean,
    default: false,
    required: true,
  },
  propB: Boolean,
});

// interface Props {
//   /** 注释1 */
//   propC: boolean | string;
//   propD?: string[];
// }
// withDefaults(defineProps<Props>(), {
//   propC: false,
//   propD: () => {
//     return ["one", "two"];
//   },
// });
</script>