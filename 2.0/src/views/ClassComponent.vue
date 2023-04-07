<!-- 测试1 -->
<template>
  <div>classComponent</div>
</template>

<script lang="ts">
import {
  Component,
  Inject,
  Model,
  ModelSync,
  Prop,
  PropSync,
  Provide,
  VModel,
  Vue,
} from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src

type CDE = ABC;
interface BCD {
  a: number;
}
type ABC = string[];

const symbol = Symbol("injectD");

@Component({
  components: {
    HelloWorld,
  },
})
export default class HomeView extends Vue {
  /** dataA注释 */
  dataA = "1";

  /** computedA注释1 */
  get computedA() {
    return this.dataA;
  }
  /** computedA注释2 */
  set computedA(a: string) {
    this.dataA = a;
  }

  // 方法1
  methodA() {
    console.log("methodA");
  }

  // provideA注释1
  @Provide()
  // provideA注释2
  provideA = "";

  // provideB注释1
  @Provide("provideBName")
  // provideB注释2
  provideB = "";

  // injectA注释
  @Inject()
  // injectA
  readonly injectA!: string;

  @Inject("injectB") readonly injectB!: string;

  @Inject({ from: "injectCFrom", default: "default" })
  readonly injectC!: string;

  // 不支持
  @Inject(symbol) readonly injectD!: string;

  // ——————————————————————————————————————

  // 装饰器器注释
  @VModel({
    default: () => {
      return [];
    },
    type: [Array, Number],
    required: true,
  })
  // 计算属性注释 return this.value
  computedValue?: number;

  // ——————————————————————————————————————

  // 装饰器注释
  @ModelSync(
    // prop 注释
    "propJ",
    // emit 注释
    "change",
    {
      default: () => {
        return [];
      },
      type: [Array, Number],
      required: true,
    }
  )
  // 计算属性注释 return this.propJ
  readonly computedPropJ!: string[];

  // ——————————————————————————————————————

  // 装饰器注释
  @Model("changePropI", {
    default: () => {
      return [];
    },
    type: [Array, Number],
    required: true,
  })
  // prop 注释
  readonly propI!: string[];

  // ——————————————————————————————————————

  /** 装饰器注释 */
  @PropSync("propH", {
    default: 0,
    type: [Array, Number],
    required: true,
  })
  // 计算属性注释 return this.propH
  computedPropH!: string[];

  // ——————————————————————————————————————

  // propG propOption 是个构造函数
  @Prop(Number)
  propG!: number;

  // propF propOption 是个数组时
  @Prop([Number])
  propF!: number;

  // propE ts类型嵌套type,required:true
  @Prop()
  propE!: CDE;

  // propD ts类型常量,required:true
  @Prop()
  propD!: string[];

  // propC ts类型interface,required:false
  @Prop()
  propC?: BCD;

  // propB ts类型type,required:true
  @Prop()
  propB: ABC;

  // 装饰器注释
  @Prop({
    default: () => {
      return [];
    },
    type: [Array, Number],
    required: true,
  })
  // prop 注释
  readonly propA: string[];
}
</script>
