// store/index.ts
import { useUserStore } from './modules/user'

// 导出所有store模块
export {
  useUserStore
}

// 初始化函数，用于在应用启动时初始化所有store
export function initStore() {
  const userStore = useUserStore()
  // 初始化用户信息
  userStore.initUserInfo()
  
  // 这里可以添加其他store的初始化逻辑
}