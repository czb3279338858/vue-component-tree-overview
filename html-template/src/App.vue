<template>
  <div class="tw-p-2 tw-h-full tw-flex tw-flex-col">
    <div class="tw-flex">
      <el-input v-model="searchUrl"></el-input>
      <el-button @click="checkUrl">查询</el-button>
    </div>
    <div class="tw-mt-2 tw-flex tw-min-h-0">
      <!-- 路由信息，全部或搜索结果 -->
      <div class="tw-border-black tw-border tw-p-2">
        <div>路由信息</div>
        <div class="tw-overflow-atuo">
          <el-tree
            :data="treeData"
            default-expand-all
            node-key="_id"
            check-strictly
            @check="checkRoute"
            highlight-current
            show-checkbox
            ref="routeTree"
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
      </div>
      <div class="tw-min-w-0 tw-overflow-auto tw-flex">
        <component-info
          v-for="(componentData, index) in componentList"
          :componentData="componentData"
          :key="index"
        ></component-info>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import VueRouter from "vue-router";
const routes = window.routes.default;
const router = new VueRouter({
  routes,
});
import { Tree, Input, Button, Tooltip } from "element-ui";
import ComponentInfo from "./ComponentInfo.vue";
function getTreeDataFromRoutes(routes, fatherPath) {
  return routes.map((route) => {
    const _id = fatherPath ? `${fatherPath}/${route.path}` : route.path;
    return {
      ...route,
      _id,
      children: route.children
        ? getTreeDataFromRoutes(route.children, _id)
        : undefined,
    };
  });
}
export default Vue.extend({
  components: {
    [Tree.name]: Tree,
    [Input.name]: Input,
    ComponentInfo,
    [Button.name]: Button,
    [Tooltip.name]: Tooltip,
  },
  computed: {
    treeData() {
      const ret = getTreeDataFromRoutes(this.routes);
      return ret;
    },
  },
  methods: {
    checkUrl() {
      if (!this.searchUrl) {
        this.routes = routes;
      } else {
        const match = router.match(this.searchUrl);
        this.routes = match.matched;
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
      this.$refs.routeTree.setCheckedKeys([data._id]);
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
});
</script>
<style>
html,
body {
  height: 100%;
}
</style>