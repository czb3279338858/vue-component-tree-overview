import {
  Component,
  Vue,
} from "vue-property-decorator";

@Component({
  props: [
    // propA注释
    "propA",
  ],
})
export default class ClassComponent extends Vue {
  // 生命周期
  mounted() {
    console.log("mounted");
  }
}