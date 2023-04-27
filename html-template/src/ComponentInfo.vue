<template>
  <div class="tw-flex tw-border-black tw-border tw-p-2">
    <div class="tw-overflow-auto tw-border-black tw-border">
      <el-tree
        :data="treeData"
        node-key="_id"
        default-expand-all
        show-checkbox
        check-strictly
        accordion
        @check="checkTemplate"
        ref="templateTree"
        class="tw-p-2"
      >
        <span slot-scope="{ data }">
          <span>{{ data.templateValue }}</span>
        </span>
      </el-tree>
    </div>
    <div class="tw-ml-2 tw-min-h-0 tw-overflow-auto">
      <div v-if="isFirstTemplate">
        <div class="tw-border-black tw-border tw-p-2">
          <div>name：{{ componentData.componentName || "无" }}</div>
          <!-- model -->
          <el-card v-if="model" class="tw-mt-2">
            <div slot="header">model</div>
            <div>
              <div>prop:{{ model.prop }}</div>
              <div>event:{{ model.event }}</div>
            </div>
          </el-card>
        </div>
        <!-- prop -->
        <div
          v-if="props.length"
          class="tw-border-black tw-border tw-mt-2 tw-p-2"
        >
          <h1 class="tw-mb-2">props</h1>
          <el-table :data="props" border>
            <el-table-column prop="propName" label="prop"></el-table-column>
            <el-table-column
              prop="propDefault"
              label="默认值"
            ></el-table-column>
            <el-table-column
              prop="propRequired"
              label="是否必填"
            ></el-table-column>
            <el-table-column label="类型">
              <template slot-scope="{ row }">
                <span>{{ getPropTypeText(row.propType) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注释" width="300">
              <template slot-scope="{ row }">
                <span v-html="getBrFromLineBreak(row.propComment)"></span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- emit -->
        <div
          v-if="emits.length"
          class="tw-border-black tw-border tw-mt-2 tw-p-2"
        >
          <h1 class="tw-mb-2">emits</h1>
          <el-table :data="emits" border>
            <el-table-column prop="emitName" label="事件名"></el-table-column>
            <el-table-column label="参数类型">
              <template slot-scope="{ row }">
                <span v-html="getEmitTypeText(row.emitType)"></span>
              </template>
            </el-table-column>
            <el-table-column label="注释">
              <template slot-scope="{ row }">
                <span v-html="getBrFromLineBreak(row.emitComment)"></span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- slot -->
        <div
          v-if="slotTemplates.length"
          class="tw-border-black tw-border tw-mt-2 tw-p-2"
        >
          <h1 class="tw-mb-2">Slots</h1>
          <el-table :data="slotTemplates" border>
            <el-table-column label="插槽名">
              <template slot-scope="{ row: slot }">
                <span v-html="getSlotName(slot)"></span>
              </template>
            </el-table-column>
            <el-table-column label="插槽参数">
              <template slot-scope="{ row: slot }">
                <el-table :data="getSlotAttrs(slot)">
                  <el-table-column label="key">
                    <template slot-scope="{ row: attr }">
                      <span v-html="getSlotAttrKey(attr.name)"></span>
                    </template>
                  </el-table-column>
                  <el-table-column label="value">
                    <template slot-scope="{ row: attr }">
                      <span v-html="getSlotAttrValue(attr, slot)"></span>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div v-else></div>
    </div>
  </div>
</template>
<script>
import { Tree, Tooltip, Table, TableColumn, Card } from "element-ui";
function getTreeDataFromTemplateTree(templates, id, parent) {
  return templates.map((template, index) => {
    const _id = id ? `${id}_${index}` : `${index}`;
    let ret = {
      ...template,
      _id,
      parent: parent || undefined,
    };
    ret["children"] = template.children
      ? getTreeDataFromTemplateTree(template.children, _id, ret)
      : undefined;
    return ret;
  });
}
function getSlotTemplatesFromTreeData(treeData) {
  return treeData.reduce((ret, node) => {
    if (node.templateValue === "<slot>") {
      ret.push(node);
    }
    if (node.children) {
      ret = ret.concat(getSlotTemplatesFromTreeData(node.children));
    }
    return ret;
  }, []);
}
function getAttrValueFrom(attrValue, slot) {
  const parent = slot.parent;
  if (parent) {
    if (parent.attributes) {
      const scopeAttr = parent.attributes.find(
        (attr) => attr.scopeNames && attr.scopeNames.includes(attrValue)
      );
      if (scopeAttr) {
        if (scopeAttr.valueType === "Identifier") {
          return getAttrValueFrom(scopeAttr.valueName, parent);
        }
        return scopeAttr.valueName;
      }
    } else {
      return getAttrValueFrom(attrValue, parent);
    }
  }
  return attrValue;
}
export default {
  components: {
    [Tree.name]: Tree,
    [Tooltip.name]: Tooltip,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Card.name]: Card,
  },
  props: ["componentData"],
  computed: {
    model() {
      return this.componentData.modelOption;
    },
    props() {
      return this.componentData.propMap
        ? Object.values(this.componentData.propMap)
        : [];
    },
    emits() {
      return this.componentData.emitMap
        ? Object.values(this.componentData.emitMap)
        : [];
    },
    templateTree() {
      return this.componentData.template ? [this.componentData.template] : [];
    },
    treeData() {
      return getTreeDataFromTemplateTree(this.templateTree);
    },
    slotTemplates() {
      const ret = getSlotTemplatesFromTreeData(this.treeData);
      console.log(ret);
      return ret;
    },
    isFirstTemplate() {
      return this.currentTemplate ? this.currentTemplate._id === "0" : false;
    },
  },
  data() {
    return {
      currentTemplate: null,
    };
  },
  methods: {
    getSlotAttrValue(attr, slot) {
      if (attr.valueType === "Identifier") {
        return getAttrValueFrom(attr.valueName, slot);
      }
      return attr.valueName;
    },
    getSlotAttrKey(key) {
      return key.replace(":", "");
    },
    getSlotAttrs(template) {
      const attrs = template.attributes;
      const paramsAttrs = attrs.filter((attr) => attr.name !== "name");
      return paramsAttrs;
    },
    getSlotName(template) {
      const attrs = template.attributes;
      const nameAttr = attrs.find((attr) => attr.name === "name");
      return nameAttr ? nameAttr.valueName : "default";
    },
    getBrFromLineBreak(str) {
      return str.replace(/\n/g, "<br/>");
    },
    getEmitTypeText(emitType) {
      const ret = emitType
        ? this.getBrFromLineBreak(
            emitType
              .map((types) => {
                return types && types.length ? types.join(" | ") : "undefined";
              })
              .join("\n")
          )
        : "";
      return ret;
    },
    getPropTypeText(propType) {
      return propType ? propType.join(" | ") : "undefined";
    },
    checkTemplate(template) {
      this.currentTemplate = template;
      this.$refs.templateTree.setCheckedKeys([template._id]);
    },
    checkFirstTemplate() {
      this.checkTemplate(this.treeData[0]);
    },
  },
  mounted() {
    this.checkFirstTemplate();
  },
};
</script>