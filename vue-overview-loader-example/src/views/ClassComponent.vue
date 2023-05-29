<template>
  <div>class-component</div>
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
} from "vue-property-decorator";
import { mixins } from "vue-class-component";
import ExtendClassComponent from "./ExtendClassComponent.vue";
const symbol = Symbol("injectD");
const provideSymbol = Symbol("provideReactive");
@Component({
  props: [
    // propA注释
    "propA",
  ],
})
const namespace=(name)=>name
const moduleUser = namespace('user')
export default class ClassComponent extends mixins(ExtendClassComponent) {
  @moduleUser.Getter vuexGetter
  // 生命周期
  mounted() {
    console.log("mounted");
  }
  // dataA注释
  dataA = "1";
  // computedA注释 get
  get computedA() {
    return this.dataA;
  }
  // computedA注释 set
  set computedA(a: string) {
    this.dataA = a;
  }
  // methodA 注释
  methodA() {
    console.log("methodA");
  }

  // provideA注释1
  @Provide()
  // data provideA
  // provide:{provideA:this.provideA}
  provideA = "1";

  // provideB注释1
  @Provide("provideBName")
  // data provideB
  // provide:{provideBName:this.provideB}
  provideB = "2";

  // InjectA注释1
  @Inject()
  // inject:{injectA:'injectA'}
  readonly injectA!: string;

  // InjectB注释1
  @Inject({ from: "injectBFrom", default: "injectBDefault" })
  // inject:{injectB:{from:'injectBFrom',default:'injectBDefault'}}
  injectB!: string;

  // InjectC注释1
  @Inject("injectCName")
  // inject:{injectC:'injectCName'}
  injectC!: string;

  // InjectD注释1
  @Inject(symbol)
  // inject:{injectD:symbol}
  injectD!: string;

  // ProvideReactiveA注释
  @ProvideReactive(provideSymbol)
  // data:{provideReactiveA:'provideReactiveA'},provide:{provideName:this.provideReactiveA}
  provideReactiveA = "provideReactiveA";

  // InjectReactiveA注释
  @InjectReactive()
  // inject:{injectReactiveA:'InjectReactiveAFrom'}
  injectReactiveA!: string;

  // InjectReactiveB注释
  @InjectReactive("InjectReactiveBFrom")
  // inject:{injectReactiveB:'InjectReactiveBFrom'}
  injectReactiveB!: string;

  // InjectReactiveC注释
  @InjectReactive({ from: "InjectReactiveCFrom", default: () => "1" })
  // inject:{injectReactiveC:{from:'InjectReactiveCFrom',default:()=>1}}}
  injectReactiveC!: string;

  // emitA注释1
  @Emit()
  // emit('emit-a',10,n,m,o)
  // emit('emit-a',Number,String,[String,Number],undefined)
  emitA(n: string, m: string | number, o) {
    return 10;
  }

  // emitB注释1
  @Emit("emitB")
  // emit('emit-b')
  emitB() {
    console.log("emit2");
  }

  // emitC注释1
  @Emit()
  // emit('emit-c',Number)
  emitC() {
    return 10;
  }

  // emitD注释1
  @Emit()
  // emit('emit-d',e.target.value,e)
  // emit('emit-d',undefined,undefined)
  emitD(e) {
    return e.target.value;
  }

  // VModel注释1
  @VModel({
    default: "default",
    type: String,
    required: true,
  })
  // prop:{value:{default:'default',type:String,isRequired:true}}
  // computed:{computedValue:{get:this.value,set:val=>this.$emit('input',val)}}
  computedValue?: string;

  // PropSync注释1
  @PropSync("propA", {
    default: 0,
    type: Number,
    required: true,
  })
  // props:{propA:{default:0,type:Number,isRequired:true}}
  // computed:{computedPropA:{get:this.propA,set:val=>this.$emit('update:propA',val)}}
  computedPropA?: number;

  // PropA注释1
  @Prop(Number)
  // PropA注释2
  propA!: number;

  // PropB注释1
  @Prop([Number])
  // PropB注释2
  propB!: number;

  // PropC注释1
  @Prop()
  // {isRequired:false,type:Number}
  propC?: number;

  @Prop()
  // {type:Array}
  propD!: number[];

  @Prop()
  // {type:Object}
  propE!: { a: string };

  @Prop({
    default: () => {
      return [];
    },
    type: Array,
    required: true,
  })
  propF: string[];

  // ModelSync注释1
  @ModelSync(
    // props:[propG]
    "propG",
    // emit('change-g',Array)
    "changeG",
    {
      default: () => {
        return [];
      },
      type: Array,
      required: true,
    }
  )
  // computed:{computedPropG:{get:this.propG,set:val=>this.$emit('change-g',val)}
  readonly computedPropG!: string[];

  // Model注释1
  @Model(
    // emit('change-h',Array)
    "changeH",
    {
      default: () => {
        return [];
      },
      type: Array,
      required: true,
    }
  )
  // mode:{prop:'propH',event:'changeH'}
  // props:{propH:{default:()=>[],type:Array,isRequired:true}}
  readonly propH!: string[];
}
</script>