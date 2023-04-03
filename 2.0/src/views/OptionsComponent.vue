<template>
  <div>{{ propA }}</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
const otherProp = ["propC"];
// dataA注释1
const dataA = 1;
// dataB注释1
function dataB() {
  console.log("dataB");
}
// dataC注释1
function dataC() {
  console.log("dataC");
}
export default defineComponent({
  computed: {
    // computedA注释
    computedA: {
      // computedA注释1
      get() {
        return this.dataA;
      },
      // computedA注释2
      set() {
        this.dataA = "1";
      },
    },
    // computedB注释
    computedB() {
      return this.dataA;
    },
  },
  data() {
    return {
      // dataA注释2
      dataA,
      // dataB注释2
      dataB: dataB(),
      // dataC注释2
      dataC,
      // dataD注释2
      dataD: "1",
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
    // 不支持解构
    ...otherProp,
    // 注释1
    "propA",
    // 注释2
    "propB",
  ],
});
</script>