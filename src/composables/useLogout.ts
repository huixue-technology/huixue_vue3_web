import { useUserStore } from '@/store'
import { postUserLogout } from '@/servers/api/user'
import router from '@/router'

/**
 * 退出登录的组合式函数
 */
export function useLogout() {
  const userStore = useUserStore()

  const clearAdminIdentity = () => {
    // 管理员凭证与代进入身份都要一并清掉，否则下次会直接回到切换页
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  /**
   * 执行退出登录
   */
  const logout = async () => {
    try {
      // 调用登出API
      await postUserLogout()
      // 清除用户状态
      userStore.clearUserInfo()
      clearAdminIdentity()
      // 跳转到登录页
      router.push('/user/login')
    } catch (error) {
      console.error('登出失败:', error)
      // 即使API调用失败，也清除本地状态
      userStore.clearUserInfo()
      clearAdminIdentity()
      router.push('/user/login')
    }
  }

  return {
    logout
  }
}