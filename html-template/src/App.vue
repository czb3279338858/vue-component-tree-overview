<template>
  <div class="tw-p-2 tw-h-full tw-flex tw-flex-col">
    <div class="tw-flex">
      <el-input
        v-model="searchUrl"
        class="tw-mr-2"
        placeholder="请输入不含域名的url"
      ></el-input>
      <el-button @click="checkUrl">查询</el-button>
    </div>
    <div class="tw-mt-2 tw-flex tw-min-h-0">
      <!-- 路由信息，全部或搜索结果 -->
      <div
        class="tw-border-black tw-border tw-p-2 tw-min-h-0 tw-flex tw-flex-col"
        :class="extendTreeSty"
      >
        <div class="tw-flex tw-justify-between tw-items-center">
          <span>路由信息</span>
          <el-button type="text" size="small" @click="switchExtendTree">{{
            extendText
          }}</el-button>
        </div>
        <div class="tw-overflow-auto tw-min-h-0 tw-flex-grow">
          <el-tree
            :data="treeData"
            default-expand-all
            node-key="_id"
            check-strictly
            @check="checkRoute"
            highlight-current
            show-checkbox
            ref="routeTree"
            class="tw-el-tree-extend"
          >
            <span slot-scope="{ data }">
              <span>{{ data.path }}</span>
              <!-- <el-tooltip
                :content="getRouteTooltipContent(data)"
                placement="top-start"
              >
              </el-tooltip> -->
            </span>
          </el-tree>
        </div>
      </div>
      <div
        :key="currentId"
        class="tw-min-w-0 tw-overflow-auto tw-flex tw-border-black tw-border tw-border-l-0 tw-flex-grow"
      >
        <component-info
          class="tw-flex-grow"
          v-for="(componentData, index) in componentList"
          :componentData="componentData"
          :index="index"
          :key="index"
          @pushComponent="pushComponent"
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
    extendText() {
      return this.extendTree ? "收起" : "展开";
    },
    extendTreeSty() {
      return this.extendTree ? "" : "tw-w-52";
    },
    treeData() {
      const ret = getTreeDataFromRoutes(this.routes);
      return ret;
    },
  },
  methods: {
    switchExtendTree() {
      this.extendTree = !this.extendTree;
    },
    checkUrl() {
      if (!this.searchUrl) {
        this.routes = routes;
      } else {
        const match = router.match(this.searchUrl);
        this.routes = match.matched;
      }
      this.componentList = [];
      this.$refs.routeTree.setCheckedKeys([]);
      this.currentId = "";
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
    async checkRoute(data) {
      const component = data.component || data.components.default;
      if (typeof component === "function") {
        const componentData = await component();
        this.componentList = [componentData.default];
      } else {
        this.componentList = [component];
      }
      this.$refs.routeTree.setCheckedKeys([data._id]);
      this.currentId = data._id;
    },
    pushComponent(component, index) {
      this.componentList = this.componentList.slice(0, index + 1);
      if (component) {
        this.componentList.push(component);
      }
    },
  },
  data() {
    return {
      // /home/options
      searchUrl: "",
      routes,
      componentList: [],
      currentId: "",
      extendTree: true,
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