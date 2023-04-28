<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
@Component({
  props: [
    // extend 中 propA注释
    "propA",
    // extend 中 extendPropA注释
    "extendPropA",
  ],
})
export default class ExtendClassComponent extends Vue {}
</script>  