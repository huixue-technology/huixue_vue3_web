import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css';
import { initStore } from './store';
import { createPinia } from 'pinia'


// 引入echarts
import Echarts from 'vue-echarts'
import * as echarts from 'echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers' // 导入渲染器
import { LineChart, BarChart, RadarChart } from 'echarts/charts'          // 按需导入图表类型
import { GridComponent, TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'  // 导入布局组件

// 初始化 ECharts 核心模块
use([CanvasRenderer, LineChart, BarChart, RadarChart, GridComponent, TitleComponent, TooltipComponent, LegendComponent])
const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.component('e-charts', Echarts)

// 检查当前路由是否为登录或注册页面
const isAuthPage = () => {
  const path = window.location.hash.slice(1); // 获取hash路由路径
  return path.startsWith('/user/login') || path.startsWith('/user/register') || path.startsWith('/user/teacher-register');
};

// 只有在非登录/注册页面才初始化store
if (!isAuthPage()) {
  initStore();
}

// 全局挂载echarts
app.config.globalProperties.$echarts = echarts
app.use(Antd).use(router)
app.provide('router', router); // Explicitly provide the router instance
app.config.globalProperties.$router = router; // Expose router on global properties
app.mount('#app')
