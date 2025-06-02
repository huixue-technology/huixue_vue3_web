import { useUserStore } from '@/store'
import { postUserLogout } from '@/servers/api/user'
import router from '@/router'

/**
 * 退出登录的组合式函数
 */
export function useLogout() {
  const userStore = useUserStore()

  /**
   * 执行退出登录
   */
  const logout = async () => {
    try {
      // 调用登出API
      await postUserLogout()
      // 清除用户状态
      userStore.clearUserInfo()
      // 跳转到登录页
      router.push('/user/login')
    } catch (error) {
      console.error('登出失败:', error)
      // 即使API调用失败，也清除本地状态
      userStore.clearUserInfo()
      router.push('/user/login')
    }
  }

  return {
    logout
  }
}