<template>
  <div>
    <el-tree
      :data="template"
      default-expand-all
      show-checkbox
      check-strictly
      accordion
      @check="checkTemplate"
    >
      <span slot-scope="{ data }">
        <span>{{ data.templateValue }}</span>
      </span>
    </el-tree>
  </div>
</template>
<script>
import { Tree, Input, Button, Tooltip } from "element-ui";
export default {
  components: {
    [Tree.name]: Tree,
    [Tooltip.name]: Tooltip,
  },
  props: ["data"],
  computed: {
    template() {
      return this.data.template ? [this.data.template] : [];
    },
  },
  methods: {
    checkTemplate(template) {
      debugger;
    },
  },
  updated() {
    console.log(this.data);
  },
};
</script>