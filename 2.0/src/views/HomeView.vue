<!-- 测试1 -->
<template>
  <div1 :class="aaa.a" :style="a">
    <div2 v-for="val in a" :key="val">333</div2>
    <!-- 测试2 -->
    123
    <div3>
      <span :value="name">
        123
        {{ index }}
        <!--111-->
        {{ val.id }}
        {{ val.id + index }}
        {{ `${val.id}${index}` }}
        {{ doSome(val) }}
      </span>

      <span>
        <!-- 测试 -->
        123 456
      </span>
    </div3>
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
    required: true,
  })
  readonly e!: ABC[];
}
</script>
