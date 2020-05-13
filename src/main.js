import 'element-ui/lib/theme-chalk/index.css';
import Vue from 'vue';
import element from 'element-ui';
import App from './App.vue';

Vue.use(element);

new Vue({
    render: h => h(App)
  }).$mount('#app')