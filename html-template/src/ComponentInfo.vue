<template>
  <div class="tw-flex tw-flex-col tw-p-2">
    <div class="tw-border-black tw-border tw-text-center tw-mb-2">
      {{ index }}
    </div>
    <div class="tw-flex tw-min-h-0 tw-border-black tw-border">
      <div class="tw-overflow-auto tw-border-black tw-border-r">
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
          <div class="tw-p-2">
            <div>
              <div>组件注释：</div>
              {{ currentTemplate.comment }}
            </div>
            <div class="tw-mt-2">组件名：{{ componentData.name || "无" }}</div>
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
          <div v-if="props.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">Props</h1>
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
              <el-table-column label="注释" min-width="200">
                <template slot-scope="{ row }">
                  <span v-html="getBrFromLineBreak(row.comment)"></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- emit -->
          <div v-if="emits.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">Emits</h1>
            <el-table :data="emits" border>
              <el-table-column
                prop="name"
                label="事件名"
                width="100"
              ></el-table-column>
              <el-table-column width="150">
                <template slot="header">
                  <span>参数类型</span>
                  <el-tooltip placement="top">
                    <div slot="content">
                      <div>1.emit可以有多个参数，所以是多行</div>
                      <div>2.当参数找不到类型时显示 undefined</div>
                      <div>3.当没有参数时显示为空</div>
                    </div>
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </template>
                <template slot-scope="{ row }">
                  <span v-html="getEmitTypeText(row.type)"></span>
                </template>
              </el-table-column>
              <el-table-column label="参数校验函数" prop="paramsVerify">
              </el-table-column>
              <el-table-column label="注释" min-width="200">
                <template slot-scope="{ row }">
                  <span v-html="getBrFromLineBreak(row.comment)"></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- slot -->
          <div v-if="slotTemplates.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">Slots</h1>
            <el-table :data="slotTemplates" border>
              <el-table-column label="插槽名" width="100">
                <template slot-scope="{ row: slot }">
                  <span v-html="getSlotName(slot)"></span>
                </template>
              </el-table-column>
              <el-table-column label="插槽参数">
                <template slot-scope="{ row: slot }">
                  <el-table :data="getSlotAttrs(slot)">
                    <el-table-column label="key" width="100" prop="keyName">
                    </el-table-column>
                    <el-table-column label="value" width="100" prop="valueName">
                    </el-table-column>
                    <el-table-column label="value 注释" min-width="200">
                      <template slot-scope="{ row: param }">
                        <span v-html="getAttrValueComment(param, slot)"></span>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- setup -->
          <div v-if="setups.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">Setup</h1>
            <el-table :data="setups" border>
              <el-table-column label="name" width="100" prop="name">
              </el-table-column>
              <el-table-column label="注释" min-width="200">
                <template slot-scope="{ row: setup }">
                  <span v-html="getBrFromLineBreak(setup.comment)"></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- provide -->
          <div v-if="provides.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">Provide</h1>
            <el-table :data="provides" border>
              <el-table-column width="100">
                <template slot="header">
                  <span>注入名</span>
                  <el-tooltip
                    placement="top"
                    content="当注入名是变量时会被[]包裹"
                  >
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </template>
                <template slot-scope="{ row: provide }">
                  <span v-html="getProvideName(provide)"></span>
                </template>
              </el-table-column>
              <el-table-column prop="value" width="150">
                <template slot="header">
                  <span>注入值</span>
                  <el-tooltip
                    placement="top"
                    content="当注入值是常量时会在备注的注释中说明"
                  >
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="注入及注入值的注释" min-width="200">
                <template slot-scope="{ row: provide }">
                  <span v-html="getProvideValueComment(provide)"></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- inject -->
          <div v-if="injects.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">Inject</h1>
            <el-table :data="injects" border>
              <el-table-column label="接收名" width="100" prop="name">
              </el-table-column>
              <el-table-column width="100" prop="from">
                <template slot="header">
                  <span>来自于</span>
                  <el-tooltip
                    placement="top"
                    content='当来源名是常量时会被""包裹'
                  >
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="默认值" prop="defaultValue">
              </el-table-column>
              <el-table-column label="注释" min-width="200">
                <template slot-scope="{ row }">
                  <span v-html="getBrFromLineBreak(row.comment)"></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- 生命周期 -->
          <div v-if="lifecycleHooks.length" class="tw-mt-2 tw-p-2">
            <h1 class="tw-mb-2">生命周期</h1>
            <el-table :data="lifecycleHooks" border>
              <el-table-column label="name" width="100" prop="name">
              </el-table-column>
              <el-table-column label="注释" min-width="200">
                <template slot-scope="{ row }">
                  <span v-html="getBrFromLineBreak(row.comment)"></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <template v-else>
          <div v-if="isVElement(currentTemplate)">
            <h1 class="tw-mb-2">属性</h1>
            <el-table :data="attributes" border>
              <el-table-column label="key" width="100" prop="keyName">
              </el-table-column>
              <el-table-column label="value" width="100" prop="valueName">
              </el-table-column>
              <el-table-column label="value 注释" min-width="200">
                <template slot-scope="{ row: attr }">
                  <span
                    v-html="getAttrValueComment(attr, currentTemplate)"
                  ></span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-if="isBrace(currentTemplate)">
            <h1 class="tw-mb-2">绑定值</h1>
            <div
              v-html="getAttrValueComment(currentTemplate, currentTemplate)"
            ></div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
import { Tree, Tooltip, Table, TableColumn, Card } from "element-ui";

export default {
  components: {
    [Tree.name]: Tree,
    [Tooltip.name]: Tooltip,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Card.name]: Card,
  },
  props: ["componentData", "index"],
  computed: {
    model() {
      return this.componentData && this.componentData.modelOptionMap;
    },
    templateTree() {
      return this.componentData && this.componentData.template
        ? [this.componentData.template]
        : [];
    },
    // 从组件数据中获取模板数据的树形结构
    // 每个叶子有个唯一_id
    // 每个叶子能够通过parent获取其父节点
    treeData() {
      return this.getTreeDataFromTemplateTree(this.templateTree);
    },
    // 所有slot标签
    slotTemplates() {
      return this.getSlotTemplatesFromTreeData(this.treeData);
    },
    // 是否template中的第一个标签，即vue文件中的第一个<template>
    isFirstTemplate() {
      return this.currentTemplate ? this.currentTemplate._id === "0" : false;
    },
    props() {
      return Object.values(this.propMap);
    },
    propMap() {
      return this.getComponentOptionMap("propMap");
    },
    emits() {
      return Object.values(this.emitMap);
    },
    emitMap() {
      return this.getComponentOptionMap("emitMap");
    },
    setups() {
      return Object.values(this.setupMap);
    },
    setupMap() {
      return this.getComponentOptionMap("setupMap");
    },
    computedMap() {
      return this.getComponentOptionMap("computedMap");
    },
    dataMap() {
      return this.getComponentOptionMap("dataMap");
    },
    methodMap() {
      return this.getComponentOptionMap("methodMap");
    },
    provides() {
      return Object.values(this.getComponentOptionMap("provideMap"));
    },
    injects() {
      return Object.values(this.injectMap);
    },
    injectMap() {
      return this.getComponentOptionMap("injectMap");
    },
    filterMap() {
      return this.getComponentOptionMap("filterMap");
    },
    lifecycleHooks() {
      return Object.values(this.getComponentOptionMap("lifecycleHookMap"));
    },
    attributes() {
      return this.currentTemplate ? this.currentTemplate.attributes : [];
    },
  },
  data() {
    return {
      currentTemplate: null,
    };
  },
  methods: {
    isBrace(template) {
      return template && !["VElement", "VText"].includes(template.type);
    },
    isVElement(template) {
      return template && template.type === "VElement";
    },
    getProvideValueComment(provide) {
      if (provide.valueType !== "Identifier") {
        return `常量：${provide.comment}`;
      }
      const provideComment = provide.comment;
      const identifierComment = this.getIdentifierComment(provide.value);
      return this.getBrFromLineBreak(
        [provideComment, identifierComment].filter((f) => f).join("\n\n")
      );
    },
    getProvideName(provide) {
      const type = provide.nameType;
      if (type === "Identifier") return `[${provide.name}]`;
      return provide.name;
    },
    // 递归获取所有的slot标签
    getSlotTemplatesFromTreeData(treeData) {
      return treeData.reduce((ret, node) => {
        if (node.template === "<slot>") {
          ret.push(node);
        }
        if (node.children) {
          ret = ret.concat(this.getSlotTemplatesFromTreeData(node.children));
        }
        return ret;
      }, []);
    },
    // 从组件数据中获取模板数据的树形结构
    getTreeDataFromTemplateTree(templates, id, parent) {
      return templates.map((template, index) => {
        const _id = id ? `${id}_${index}` : `${index}`;
        let ret = {
          ...template,
          _id,
          parent: parent || undefined,
        };
        ret["children"] = template.children
          ? this.getTreeDataFromTemplateTree(template.children, _id, ret)
          : undefined;
        return ret;
      });
    },
    // 混入extends和mixins获取vue配置项的最终值
    getComponentOptionMap(optionKey) {
      const mixins = [
        ...(this.componentData.mixinSet || []),
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
      return currentOptionMap;
    },
    // 通过变量名获取该变量名在组件数据中的注释
    getIdentifierComment(identifierName) {
      for (const key of [
        "propMap",
        "setupMap",
        "computedMap",
        "dataMap",
        "methodMap",
        "injectMap",
        "filterMap",
      ]) {
        const info = this[key][identifierName];
        if (info) {
          const comments = [`${key}：${info.comment}`];
          if (info.importValue) {
            comments.push(info.importValue.comment);
          }
          return comments.filter((c) => c).join("\n\n");
        }
      }
      return "";
    },
    // 当属性绑定值是变量时，获取属性绑定值得注释
    getAttrValueCommentFromComponent(valueName, currentTemplate, preFrom = []) {
      // 一直向上遍历寻找attr的绑定值是否来自于作用域,直到根template
      if (currentTemplate) {
        const scopeAttr =
          currentTemplate.attributes &&
          currentTemplate.attributes.find(
            (a) => a.scopeNames && a.scopeNames.includes(valueName)
          );
        if (scopeAttr) {
          if (scopeAttr.valueType === "VForExpression") {
            // 如果是v-for
            preFrom.push(
              `${valueName}来源于v-for循环值${scopeAttr.callParams[0]}`
            );
            return this.getAttrValueCommentFromComponent(
              scopeAttr.callParams[0],
              currentTemplate.parent,
              preFrom
            );
          } else {
            // 如果是 v-slot,slot-scope
            preFrom.push(
              `${valueName}来源于作用域插槽${scopeAttr.keyName}=${scopeAttr.valueName}`
            );
            return preFrom.join("\n");
          }
        } else {
          return this.getAttrValueCommentFromComponent(
            valueName,
            currentTemplate.parent,
            preFrom
          );
        }
      } else {
        const comment = this.getIdentifierComment(valueName);
        if (comment) {
          preFrom.push(`${valueName}来源于数据，其注释如下：\n${comment}`);
        } else {
          preFrom.push(`${valueName}未能找到来源于数据的注释`);
        }
      }
      return preFrom.filter((p) => p).join("\n\n");
    },
    // 获取属性绑定值的的注释
    getAttrValueComment(attr, slot) {
      if (["VLiteral", "Literal"].includes(attr.valueType)) {
        return "";
      }
      const callNamesComment = attr.callNames
        ? attr.callNames.map((name) => {
            return this.getAttrValueCommentFromComponent(name, slot);
          })
        : [];
      const callParamsComment = attr.callParams
        ? attr.callParams.map((param) => {
            return this.getAttrValueCommentFromComponent(param, slot);
          })
        : [];
      return this.getBrFromLineBreak(
        [...callNamesComment, ...callParamsComment].join("\n\n")
      );
    },
    // 获取slot标签除name以外的所有属性
    getSlotAttrs(template) {
      const attrs = template.attributes;
      const paramsAttrs = attrs.filter((attr) => attr.keyName !== "name");
      return paramsAttrs;
    },
    // 获取slot标签name属性的值
    getSlotName(template) {
      const attrs = template.attributes;
      const nameAttr = attrs.find((attr) => attr.keyName === "name");
      return nameAttr ? nameAttr.valueName : "default";
    },
    // 把函数\n的文本转为带<br/>的标签文本
    getBrFromLineBreak(str) {
      return str.replace(/\n/g, "<br/>");
    },
    // 获取emit抛出数据的类型，emit可以有多个参数，每个参数又可以有多个类型，所以是多行
    getEmitTypeText(emitType) {
      const ret = emitType
        ? this.getBrFromLineBreak(
            emitType
              .map((types) => {
                return types && types.length
                  ? types.map((t) => `${t}`).join(" | ")
                  : "";
              })
              .join("\n")
          )
        : "";
      return ret;
    },
    // 获取prop的类型，prop可以有多个类型，用 | 分割
    getPropTypeText(propType) {
      return propType ? propType.join(" | ") : "";
    },
    // 树组件选中某个标签
    checkTemplate(template) {
      this.currentTemplate = template;
      const componentMap = this.componentData.componentMap;
      const templateName = template.template.replace(/[<>]/g, "");
      this.$emit(
        "pushComponent",
        componentMap[`"${templateName}"`],
        this.index
      );
      this.$refs.templateTree.setCheckedKeys([template._id]);
    },
  },
  mounted() {
    this.checkTemplate(this.treeData[0]);
  },
};
</script>