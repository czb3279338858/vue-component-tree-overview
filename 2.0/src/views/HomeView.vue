<!-- 组件备注1 -->
<!-- 组件备注2 -->
<template>
  <div class="home">
    <!-- 标签备注1 -->
    <!-- 标签备注2 -->
    <img alt="Vue logo" src="../assets/logo.png" :attr-some="dataAttr">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src

@Component({
  components: {
    HelloWorld,
  },
  data:{
    dataAttr:1
  }
})
export default class HomeView extends Vue {}
</script>
