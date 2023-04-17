<template>
  <!-- div1注释-->
  <div1
    class="1"
    :class="b"
    :style="c(d(a.b))"
    :a="'1'"
    :b="e.a"
    :c="propA | filterA | filterB"
  >
    <!-- VText注释 -->

    VText
    <!-- VExpressionContainer注释 -->
    {{ propA | filterA }}
    {{ a }}
    {{ a.b }}
    {{ b() }}
    <!-- 支持"1" -->
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
    <!-- scopeNames:['value', 'key', 'index'] -->
    <dvi4 v-for="({ item }, key, index) in d" :key="index">{{ item }}</dvi4>
    <dvi13 v-for="(value, key, index) in d" :key="index">{{ value }}</dvi13>
    <!-- valueName:'propA | filterA | filterB' -->
    <div5 :style="propA | filterA | filterB">
      <!-- 使用 -->
      <div7 slot="header">1</div7>
      <div6 slot-scope="scope" slot="footer">{{ scope.item }}</div6>
      <div12 slot-scope="[{ item: item1 }]" slot="footer2">{{ item1 }}</div12>
      <div11 slot-scope="{ item, index: [a, b, { a: c }] }" slot="footer">{{
        `${item}${a}${b}${c}`
      }}</div11>
      <!-- 定义 -->
      <slot name="header"></slot>
      <slot name="footer" :item="item" :index="index"></slot>
    </div5>
    <!-- 2.6之后 -->
    <div8 v-slot:header></div8>
    <div9 v-slot:footer="{ item, index: [a, b] }"></div9>
    <div9 v-slot:footer="[item, { a: item2 }]"></div9>
    <div10 v-slot:header="headerData"></div10>
  </div1>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
const otherProp = ["propC"];
const s = Symbol();
export default defineComponent({
  filters: {
    // filterA注释
    filterA(a) {
      return `a:${a}`;
    },
  },
  // 生命周期
  mounted() {
    console.log("mounted");
  },

  // provide注入 ————————————————————————————————————
  provide: {
    // 注释
    provideA: "provideFromA",
  },
  // provide() {
  //   let b,
  //     s = Symbol();
  //   return {
  //     // 注释1
  //     [s]: "provideFromS",
  //     // 注释2
  //     provideA: "provideFromA",
  //   };
  // },

  // inject捕获 ————————————————————————————————————
  // inject: [
  //   // 注释injectA
  //   "injectA",
  //   "injectB",
  // ],
  inject: {
    // 注释injectA
    injectA: {
      from: "injectAFrom",
      default: () => "injectADefault",
    },
    injectB: s,
  },

  // methods ————————————————————————————————————
  // emits: ["emitA"],
  emits: {
    // emitB注释
    emitB: null,
    // emitA注释
    emitA(emitAValue: string, emitAValue2) {
      return typeof emitAValue === "string" && emitAValue2;
    },
    // emitC注释
    emitC({ emitCValue, emitCValue2 }) {
      return typeof emitCValue === "string" && emitCValue2;
    },
  },
  methods: {
    doSome() {
      this.$emit("emitD");
    },
  },
  // computed ————————————————————————————————————

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