<!-- 组件注释 -->
<template>
  <!-- 标签注释1 -->
  <!-- 标签注释2 -->
  <div
    class="tw-p-2"
    :class="dataA"
    :attr-a="getAttrB1(getAttrB2(dataA, dataB))"
    :attr-c="dataB.a"
    :attr-d="myClass | filterA | filterB"
  >
    <!-- 绑定值注释 -->
    {{ dataA | filterA }}
    {{ dataA }}
    {{ dataB.a }}
    {{ getAttrB1(getAttrB2(dataA, dataB)) }}
    <!-- 常量注释 -->
    我是字符串
    <div v-if="dataA">v-if</div>
    <div v-else-if="dataB.a">v-else-if</div>
    <div v-else>v-else</div>
    <div v-for="(dataB, key, index) in dataA" :key="index">
      {{ dataB }}
    </div>
    <div v-for="({ a }, key, index) in dataA" :key="index">
      {{ a }}
    </div>
    <div v-for="([a], key, index) in dataA" :key="index">
      {{ a }}
    </div>

    <slot name="slotA"></slot>
    <slot name="slotB" :slotValueA="dataA" :slotValueB="dataB"></slot>

    <div slot="slotA"></div>
    <div slot="slotB" slot-scope="scope">{{ scope }}</div>
    <div slot="slotC" slot-scope="{ slotValueA }">{{ slotValueA }}</div>
    <template v-slot:slotD>
      <div>slotD</div>
    </template>
    <template v-slot:slotE="scope">
      <div>{{ scope }}</div>
    </template>
    <template v-slot:slotF="{ slotValueA }">
      <div>{{ slotValueA }}</div>
    </template>
    <ClassComponent></ClassComponent>
    <router-view></router-view>
  </div>
</template>
<script lang='ts'>
import filterDefault, {
  filterB,
  filterC,
  filterD,
  filterE,
  filterF,
  filterF as filterF2,
} from "./filter";
import extendOption from "./extendOption.js";
import mixinB, { mixinA } from "./mixinOption";
import ClassComponent from "./ClassComponent.vue";
import { defineComponent, PropType, ref } from "vue";
const injectSymbol = Symbol();
export default defineComponent({
  name: "option-component-name",
  extends: extendOption,
  mixins: [mixinA, mixinB],
  components: {
    ClassComponent,
  },
  filters: {
    // filterA注释
    filterA(v) {
      return v;
    },
    // filterB注释，来源于组件
    filterB,
    // filterC注释，来源于组件
    filterC,
    // filterD注释，来源于组件
    filterD,
    filterDefault,
    filterF,
    filterE,
    filterF2,
  },
  // 生命周期注释
  mounted() {
    console.log("mounted");
  },
  provide: {
    // provideA注释
    provideA: "provideAFrom",
  },
  // provide() {
  //   let s = Symbol();
  //   return {
  //     // provideSymbol注释
  //     [s]: "provideSymbolFrom",
  //     // provideA注释，来源于 provide
  //     provideA: "provideAFrom",
  //   };
  // },
  inject: [
    // injectA注释
    "injectA",
  ],
  // inject: {
  //   // injectA注释
  //   injectA: {
  //     from: "injectAFrom",
  //     default: () => "injectADefault",
  //   },
  //   // injectB注释
  //   injectB: injectSymbol,
  // },
  // emits: [
  //   // emitA注释
  //   "emitA",
  // ],
  emits: {
    // emitA注释
    emitA: null,
    // emitB注释1
    emitB(emitValueA: string | number, emitValueB) {
      return typeof emitValueA === "string" && emitValueB;
    },
    // emitC注释1
    emitC({ emitValueA, emitValueB }) {
      return typeof emitValueA === "string" && emitValueB;
    },
  },
  methods: {
    // methodA注释
    methodA() {
      // emitB注释2
      this.$emit("emitB", "emitValueA", 1);
    },
    // getAttrB1 注释
    getAttrB1(arg1) {
      return arg1;
    },
    // getAttrB2 注释
    getAttrB2(arg1, arg2) {
      return arg1 + arg2;
    },
  },
  setup(props, context) {
    // emitC注释2
    context.emit("emitC", { emitValueA: "emitValueA", emitValueB: 1 });
    const [
      [
        // setupA注释1
        setupA,
      ],
    ] = [[ref(1)]];
    return {
      // setupA注释2
      setupA,
    };
  },
  computed: {
    // computedA 注释
    computedA: {
      // computedA getter 注释
      get() {
        return this.dataA;
      },
      // computedA setter 注释
      set() {
        this.dataA = "1";
      },
    },
    // computedB 注释
    computedB() {
      return this.dataA;
    },
  },
  data() {
    function getDataB() {
      return {
        // 初始化函数中的注释
        a: "",
      };
    }
    return {
      // dataA 注释
      dataA: {
        // data是对象递归的注释
        a: "",
      },
      // dataB 注释
      dataB: getDataB(),
      // provideSymbolFrom，来源于 data
      provideSymbolFrom: "",
      // provideA注释，来源于 data
      provideAFrom: "",
    };
  },
  props: {
    // propA 注释
    propA: {
      default: "propADefault",
      type: String as PropType<string>,
      required: true,
    },
    // propB 注释
    propB: Number,
    // propC 注释
    propC: [Number, String],
  },
  // props: [
  //   // propA 注释
  //   "propA",
  // ],
});
</script>