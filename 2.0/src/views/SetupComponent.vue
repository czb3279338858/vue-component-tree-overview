<template>
  <div>1</div>
</template>


<script setup lang="ts">
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