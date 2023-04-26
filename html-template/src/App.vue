<template>
  <div>
    <div>
      <el-input v-model="url"></el-input>
      <el-button @click="checkUrl">查询</el-button>
    </div>
    <el-tree></el-tree>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import routes from "./routes";
import VueRouter from "vue-router";
const router = new VueRouter({
  routes,
});
const route = router.match("/home/options");
console.log(route);
debugger;
import { Tree, Input, Button } from "element-ui";
export default Vue.extend({
  components: {
    [Tree.name]: Tree,
    [Input.name]: Input,
    [Button.name]: Button,
  },
  methods: {
    checkUrl() {
      if (!this.url) return;
      const route = router.match(this.url);
      console.log(route);
    },
  },
  data() {
    return {
      url: "",
    };
  },
  computed: {},
});
</script>
