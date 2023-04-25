<template>
  <div>
    111
    <router-view></router-view>
  </div>
</template>
<script  setup lang="ts">
// emit1
const emit1 = defineEmits([
  // emitA类型注释
  "emitA",
]);
</script>