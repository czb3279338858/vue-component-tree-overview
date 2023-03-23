<!-- 组件备注1 -->
<!-- 组件备注2 --><template>
    <div>
      <span>111</span>
      <!-- 标签备注1 -->
      <!-- 标签备注2 -->
      <HelloWorld v-on="a" v-on:style="a" v-on:c.native="a" @="a" @blur="a" @blur.native="a"/>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src

@Component({
  components: {
    HelloWorld,
  }
})
export default class HomeView extends Vue {
  a={}
  b=2
  c(){
    console.log('c')
  }
  d={}
}
</script>
