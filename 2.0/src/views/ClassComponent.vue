<!-- 测试1 -->
<template>
  <div>classComponent</div>
</template>

<script lang="ts">
import {
  Component,
  Emit,
  Inject,
  InjectReactive,
  Model,
  ModelSync,
  Prop,
  PropSync,
  Provide,
  ProvideReactive,
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

  // 支持 injectFrom = [symbol]
  @Inject(symbol) readonly injectD!: string;

  // ProvideReactiveA注释
  @ProvideReactive() ProvideReactiveA = "ProvideReactiveA";

  // InjectReactiveA注释
  @InjectReactive() InjectReactiveA!: string;
  // InjectReactiveB注释
  @InjectReactive("InjectReactiveBFrom") InjectReactiveB!: string;
  // InjectReactiveC注释
  @InjectReactive({ from: "InjectReactiveCFrom", default: () => "1" })
  InjectReactiveC!: string;

  // ——————————————————————————————————————

  // emitA注释1
  @Emit()
  // emitA注释2
  emit1(n: number, m: string | number, o) {
    return n as number;
  }

  @Emit("emit2")
  emit2() {
    console.log("emit2");
  }

  @Emit()
  // emit('emit3',10)
  emit3() {
    return 10;
  }

  @Emit()
  // emit('emit-four',e.target.value,e)
  emitFour(e) {
    return e.target.value;
  }

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
