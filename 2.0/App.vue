<template>
  <div id="app">123</div>
</template>
<script>
import { defineComponent } from "@vue/composition-api";
import VueRouter from "vue-router";
export default defineComponent({
  setup() {
    const router = new VueRouter({
      mode: "history",
      base: process.env.BASE_URL,
      routes: routes.default,
    });
    debugger;
    return {};
  },
});
</script>
