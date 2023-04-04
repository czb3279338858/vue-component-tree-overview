<template>
  <!-- div1注释，不支持:a="'1'"  -->
  <div1 class="1" :class="b" :style="c()" :a="'1'" :b="e.a">
    <!-- VText注释 -->
    VText
    <!-- VExpressionContainer注释 -->
    {{ propA | filterA }}
    {{ a }}
    {{ a.b }}
    {{ b() }}
    <!-- 不支持"1" -->
    {{ "1" }}
    <!-- 不支持`${d}` -->
    {{ `${d}` }}
    <!-- 不支持e + f -->
    {{ e + f }}
    {{
      // 不支持这个注释
      a
    }}
    <div2 v-if="a"></div2>
    <div3 v-else></div3>
    <dvi4 v-for="(value, key, index) in d" :key="index"></dvi4>
    <div5 :style="propA | filterA | filterB">
      <div6 slot-scope="scope">{{ scope.row }}</div6>
      <div7 slot="slotName">1</div7>
      <slot name="name"></slot>
    </div5>
  </div1>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
const otherProp = ["propC"];

export default defineComponent({
  // filters: {
  //   filterA(a) {
  //     return `a:${a}`;
  //   },
  // },
  // computed: {
  //   // computedA注释
  //   computedA: {
  //     // computedA注释1
  //     get() {
  //       return this.dataA;
  //     },
  //     // computedA注释2
  //     set() {
  //       this.dataA = "1";
  //     },
  //   },
  //   // computedB注释
  //   computedB() {
  //     return this.dataA;
  //   },
  // },
  // data() {
  //   return {
  //     // dataA注释2
  //     dataA,
  //     // dataB注释2
  //     dataB: dataB(),
  //     // dataC注释2
  //     dataC,
  //     // dataD注释2
  //     dataD: "1",
  //   };
  // },

  // ————————————————————————————————————

  // props: {
  //   // 注释propA
  //   propA: {
  //     default: "a",
  //     type: String as PropType<string>,
  //     required: true,
  //   },
  //   // 注释propB
  //   propB: Number,
  //   // 注释propC
  //   propC: [Number, String],
  // },

  props: [
    // 不支持解构
    ...otherProp,
    // 注释propA
    "propA",
    // 注释propB
    "propB",
  ],
});
</script>