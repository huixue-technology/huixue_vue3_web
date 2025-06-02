import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserInfo {
  id?: string | number
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  token?: string
  [key: string]: any
}

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref<UserInfo>({})
  // 登录状态
  const isLogin = ref<boolean>(false)

  // 初始化用户信息，从localStorage获取
  function initUserInfo() {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
      isLogin.value = true
    }
  }

  // 设置用户信息
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    isLogin.value = true
    // 同时保存到localStorage
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  // 更新用户信息
  function updateUserInfo(info: Partial<UserInfo>) {
    userInfo.value = { ...userInfo.value, ...info }
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  // 清除用户信息
  function clearUserInfo() {
    userInfo.value = {}
    isLogin.value = false
    localStorage.removeItem('userInfo')
  }

  return {
    userInfo,
    isLogin,
    initUserInfo,
    setUserInfo,
    updateUserInfo,
    clearUserInfo
  }
})