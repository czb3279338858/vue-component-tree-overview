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
          <span>{{ data.template }}</span>
        </span>
      </el-tree>
    </div>
    <div class="tw-ml-2 tw-min-h-0 tw-overflow-auto">
      <div v-if="isFirstTemplate">
        <div class="tw-border-black tw-border tw-p-2">
          <div>组件name：{{ componentData.name || "无" }}</div>
          <!-- model -->
          <el-card v-if="model" class="tw-mt-2">
            <div slot="header">model</div>
            <div>
              <div>prop：{{ model.prop }}</div>
              <div>event：{{ model.event }}</div>
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
            <el-table-column
              prop="name"
              label="prop"
              width="100"
            ></el-table-column>
            <el-table-column
              prop="defaultValue"
              label="默认值"
            ></el-table-column>
            <el-table-column label="是否必填" width="100">
              <template slot-scope="{ row }">
                <span>{{ row.isRequired }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="150">
              <template slot-scope="{ row }">
                <span>{{ getPropTypeText(row.type) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注释">
              <template slot-scope="{ row }">
                <span v-html="getBrFromLineBreak(row.comment)"></span>
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
            <el-table-column
              prop="name"
              label="事件名"
              width="100"
            ></el-table-column>
            <el-table-column label="参数类型" width="150">
              <template slot-scope="{ row }">
                <span v-html="getEmitTypeText(row.type)"></span>
              </template>
            </el-table-column>
            <el-table-column label="参数校验函数" prop="paramsVerify">
            </el-table-column>
            <el-table-column label="注释">
              <template slot-scope="{ row }">
                <span v-html="getBrFromLineBreak(row.comment)"></span>
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
            <el-table-column label="插槽名" width="100">
              <template slot-scope="{ row: slot }">
                <span v-html="getSlotName(slot)"></span>
              </template>
            </el-table-column>
            <el-table-column label="插槽参数">
              <template slot-scope="{ row: slot }">
                <el-table :data="getSlotParams(slot)">
                  <el-table-column label="key" width="100">
                    <template slot-scope="{ row: param }">
                      <span v-html="getSlotParamKey(param.keyName)"></span>
                    </template>
                  </el-table-column>
                  <el-table-column label="value" width="100">
                    <template slot-scope="{ row: param }">
                      <span v-html="getSlotParamValue(param)"></span>
                    </template>
                  </el-table-column>
                  <el-table-column label="value 注释">
                    <template slot-scope="{ row: param }">
                      <span
                        v-html="getSlotParamValueComment(param, slot)"
                      ></span>
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
    if (node.template === "<slot>") {
      ret.push(node);
    }
    if (node.children) {
      ret = ret.concat(getSlotTemplatesFromTreeData(node.children));
    }
    return ret;
  }, []);
}
function getIdentifierCommentFromMap(componentData, identifierName) {
  for (const key of [
    "propMap",
    "setupMap",
    "computedMap",
    "dataMap",
    "methodMap",
    "injectMap",
    "filterMap",
    "extend",
    "mixinSet",
  ]) {
    if (["extend", "mixinSet"].includes(key)) {
      const map = componentData[key];
      const info = map[identifierName];
      const mixins = Array.isArray(info) ? info : [info];
      for (const cData of mixins) {
        if (!cData) break;
        const comment = getIdentifierCommentFromMap(cData, identifierName);
        if (comment !== undefined) return comment;
      }
    } else {
      const map = componentData[key];
      const info = map[identifierName];
      if (info) {
        const comments = [info.comment];
        if (info.importValue) {
          comments.push(info.importValue.comment);
        }
        return comments.filter((c) => c).join("\n");
      }
    }
  }
  return undefined;
}
function getAttrValueFromComment(
  valueName,
  currentTemplate,
  componentData,
  preFrom = []
) {
  // 一直向上遍历寻找attr的绑定值是否来自于作用域,直到根template
  if (currentTemplate) {
    const scopeAttr =
      currentTemplate.attributes &&
      currentTemplate.attributes.find(
        (a) => a.scopeNames && a.scopeNames.includes(valueName)
      );
    if (scopeAttr) {
      if (scopeAttr.vForName) {
        // 如果是v-for
        preFrom.push(`${valueName}来源于v-for循环值${scopeAttr.vForName}`);
        return getAttrValueFromComment(
          scopeAttr.vForName,
          currentTemplate.parent,
          componentData,
          preFrom
        );
      } else {
        // 如果是 v-slot,slot-scope
        preFrom.push(`${valueName}来源于作用域插槽${scopeAttr.keyName}`);
        return preFrom.join("\n");
      }
    } else {
      return getAttrValueFromComment(
        valueName,
        currentTemplate.parent,
        componentData,
        preFrom
      );
    }
  } else {
    const comment = getIdentifierCommentFromMap(componentData, valueName);
    if (comment) {
      preFrom.push(`${valueName}来源于数据，其注释如下：\n${comment}`);
    } else {
      preFrom.push(`${valueName}未能找到任何注释`);
    }
  }
  return preFrom.filter((p) => p).join("\n");
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
      return this.componentData.modelOptionMap;
    },
    props() {
      return this.getComponentOption("propMap");
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
      return getSlotTemplatesFromTreeData(this.treeData);
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
    getComponentOption(optionKey) {
      const mixins = [
        ...(this.componentData.mixinsSet || []),
        this.componentData.extend,
      ];
      const currentOptionMap = this.componentData[optionKey];
      for (const option of mixins.reverse().filter((m) => m)) {
        const mixinOptionMap = option[optionKey];
        if (mixinOptionMap) {
          for (const key in mixinOptionMap) {
            if (!currentOptionMap[key]) {
              currentOptionMap[key] = mixinOptionMap[key];
            }
          }
        }
      }
      return Object.values(currentOptionMap);
    },
    getSlotParamValueComment(attr, slot) {
      if (["VLiteral", "Literal"].includes(attr.valueType)) {
        return "";
      }
      return this.getBrFromLineBreak(
        getAttrValueFromComment(attr.valueName, slot, this.componentData)
      );
    },
    getSlotParamValue(attr) {
      if (["VLiteral", "Literal"].includes(attr.valueType)) {
        return attr.valueName;
      }
      return `[${attr.valueName}]`;
    },
    getSlotParamKey(key) {
      return key.replace(":", "");
    },
    getSlotParams(template) {
      const attrs = template.attributes;
      const paramsAttrs = attrs.filter((attr) => attr.keyName !== "name");
      return paramsAttrs;
    },
    getSlotName(template) {
      const attrs = template.attributes;
      const nameAttr = attrs.find((attr) => attr.keyName === "name");
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