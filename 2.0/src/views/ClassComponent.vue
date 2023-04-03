<!-- 测试1 -->
<template>
  <div1 class="1" :class="b" :style="c()" :a="'1'" :b="e.a">
    {{ a }}
    <!-- 测试3 -->
    {{ a.b }}
    {{ b() }}
    {{ "1" }}
    {{ `${d}` }}
    {{ e + f }}
    <!-- 测试2 -->
    <div2 v-if="a"></div2>
    <div3 v-else></div3>
    <dvi4 v-for="(value, key, index) in d" :key="index"></dvi4>
  </div1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
type BCD = number;
type DFE = BCD;
type ABC = string[];
@Component({
  components: {
    HelloWorld,
  },
})
export default class HomeView extends Vue {
  // 注释1
  @VModel({
    default: () => {
      return [];
    },
    // type: [Array, Number],
    // required: true,
  })
  computedPropI?: string;

  @ModelSync(
    // 注释3
    "propH",
    "change",
    {
      default: () => {
        return [];
      },
      // type: [Array, Number],
      required: true,
    }
  )
  readonly syncedPropH!: boolean;

  @Model("changePropG", {
    default: () => {
      return [];
    },
    // type: [Array, Number],
    required: true,
  })
  // 注释propG
  readonly propG!: boolean;

  /** 注释2 */
  @PropSync("propF", {
    default: () => {
      return [];
    },
    // type: [Array, Number],
    required: true,
  })
  syncedPropF!: string;

  // 注释1
  @Prop({
    default: () => {
      return [];
    },
    // type: [Array, Number],
    required: true,
  })
  // 注释propA
  readonly propA?: string;

  @Prop()
  readonly propB!: ABC;

  @Prop()
  propC: DFE;

  // 注释3
  @Prop()
  propD!: string | number;
}
</script>
