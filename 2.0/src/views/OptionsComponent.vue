<template>
  <div>{{ propA }}</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
export default defineComponent({
  data() {
    return {
      // data注释1
      dataA: null,
    };
  },
  // props: {
  //   // 注释1
  //   propA: {
  //     default: "a",
  //     type: String as PropType<string>,
  //     required: true,
  //   },
  //   // 注释2
  //   propB: Number,
  // },

  props: [
    // 注释1
    "propA",
    // 注释2
    "propB",
  ],
});
</script>