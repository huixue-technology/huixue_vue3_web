# Pinia 状态管理

本项目使用 Pinia 进行状态管理，主要用于管理用户登录信息及应用状态。

## 目录结构

```
store/
├── index.ts          # 入口文件，导出所有store模块和初始化函数
├── modules/          # 模块目录
│   └── user.ts       # 用户模块，管理用户信息和登录状态
└── README.md         # 说明文档
```

## 使用方法

### 用户状态管理

```typescript
// 在组件中使用
import { useUserStore } from '@/store'

// 在setup中获取store实例
const userStore = useUserStore()

// 获取用户信息
const userInfo = userStore.userInfo

// 判断是否登录
const isLoggedIn = userStore.isLogin

// 设置用户信息（登录时使用）
userStore.setUserInfo({
  id: '1',
  username: 'example',
  token: 'token-value'
})

// 更新用户信息
userStore.updateUserInfo({
})

// 清除用户信息（登出时使用）
userStore.clearUserInfo()
```

### 登出功能

项目提供了一个组合式函数 `useLogout` 用于处理登出逻辑：

```typescript
import { useLogout } from '@/composables/useLogout'

const { logout } = useLogout()

// 调用登出函数
logout()
```

## 自动初始化

应用启动时会自动从 localStorage 中恢复用户状态，无需手动调用初始化函数。