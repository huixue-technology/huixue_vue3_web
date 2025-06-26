import router from '@/router'
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
    const storedUserInfo = localStorage.getItem('user')
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
      isLogin.value = true
    }else {
      router.push('/user/login')
    }
  }

  // 获取用户信息
  function getUserInfo() {
    if (!isLogin.value) {
      initUserInfo()
    }
    return userInfo.value
  }

  // 设置用户信息
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    isLogin.value = true
    // 同时保存到localStorage
    localStorage.setItem('user', JSON.stringify(info))
  }

  // 更新用户信息
  function updateUserInfo(info: Partial<UserInfo>) {
    userInfo.value = { ...userInfo.value, ...info }
    localStorage.setItem('user', JSON.stringify(userInfo.value))
  }

  // 清除用户信息
  function clearUserInfo() {
    userInfo.value = {}
    isLogin.value = false
    localStorage.removeItem('user')
  }

  return {
    userInfo,
    isLogin,
    initUserInfo,
    getUserInfo,
    setUserInfo,
    updateUserInfo,
    clearUserInfo
  }
})