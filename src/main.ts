import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css';


// 引入echarts
import Echarts from 'vue-echarts'
import * as echarts from 'echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers' // 导入渲染器
import { LineChart } from 'echarts/charts'          // 按需导入图表类型
import { GridComponent } from 'echarts/components'  // 导入布局组件

// 初始化 ECharts 核心模块
use([CanvasRenderer, LineChart, GridComponent])

const app = createApp(App)

app.component('e-charts', Echarts)

// 全局挂载echarts
app.config.globalProperties.$echarts = echarts
app.use(Antd).use(router).mount('#app')
