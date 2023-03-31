<template>
  <div>1</div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      // data注释1
      dataA: null,
    };
  },
  //   props: {
  //     // 注释1
  //     propA: {
  //       default: "a",
  //       type: String,
  //       required: true,
  //     },
  //     // 注释2
  //     propB: Number,
  //   },
  props: [
    // 注释1
    "propA",
    // 注释2
    "propB",
  ],
});
</script>