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
// 测试3
interface ABC {
  a: string;
}
@Component({
  components: {
    HelloWorld,
  },
})
export default class HomeView extends Vue {
  @Prop({
    default: () => {
      return [];
    },
    type: [Array, Number],
    required: true,
  })
  readonly propD!: string;

  @Prop([String, Boolean]) readonly propC: string | boolean | undefined;
  @Prop() age!: ABC;

  @Prop(Number) readonly propA: number | undefined;

  @Prop({
    default: "default value",
    type: Number,
    required: true,
  })
  readonly propB!: string;
}
</script>
