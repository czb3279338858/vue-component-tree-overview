<template>
  <div class="tw-p-2">
    <div class="tw-flex">
      <el-input v-model="searchUrl"></el-input>
      <el-button @click="checkUrl">查询</el-button>
    </div>
    <div class="tw-mt-2 tw-flex">
      <!-- 路由信息，全部或搜索结果 -->
      <div class="tw-border-black tw-border tw-p-2">
        <div>路由信息</div>
        <el-tree
          :data="routes"
          default-expand-all
          check-strictly
          @current-change="checkRoute"
          highlight-current
        >
          <span slot-scope="{ data }">
            <el-tooltip
              :content="getRouteTooltipContent(data)"
              placement="top-start"
            >
              <span>{{ data.path }}</span>
            </el-tooltip>
          </span>
        </el-tree>
      </div>
      <component-info
        v-for="(componentData, index) in componentList"
        :data="componentData"
        :key="index"
      ></component-info>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import routes from "./routes";
import VueRouter from "vue-router";
const router = new VueRouter({
  routes,
});
import { Tree, Input, Button, Tooltip } from "element-ui";
import ComponentInfo from "./ComponentInfo.vue";
export default Vue.extend({
  components: {
    [Tree.name]: Tree,
    [Input.name]: Input,
    ComponentInfo,
    [Button.name]: Button,
    [Tooltip.name]: Tooltip,
  },
  methods: {
    checkUrl() {
      if (!this.searchUrl) {
        this.routes = routes;
      } else {
        const match = router.match(this.searchUrl);
        this.routes = match.matched;
        console.log(this.routes);
      }
    },
    getRouteTooltipContent(routeData) {
      const newRoute = {
        ...routeData,
        component: undefined,
        children: undefined,
        components: undefined,
      };
      return JSON.stringify(newRoute);
    },
    checkRoute(data) {
      this.componentList = [data.component];
    },
  },
  data() {
    return {
      // /home/options
      searchUrl: "",
      routes,
      componentList: [],
    };
  },
  computed: {},
});
</script>
