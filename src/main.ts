import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css';
import { initStore } from './store';


// 引入echarts
import Echarts from 'vue-echarts'
import * as echarts from 'echarts'
import { createPinia } from 'pinia'
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

// 初始化store
initStore()

// 全局挂载echarts
app.config.globalProperties.$echarts = echarts
app.use(Antd).use(router).mount('#app')
