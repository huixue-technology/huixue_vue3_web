# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**慧学 (huixue_vue3_web)** 是一个基于 Vue 3 的教育成绩管理系统，服务于学生和教师，提供成绩追踪、对比分析、挑战系统和成绩预测等功能。

## 技术栈

- **框架**: Vue 3.4.21 + TypeScript
- **UI 组件库**: Ant Design Vue 4.2.6
- **状态管理**: Pinia 3.0.2
- **路由**: Vue Router 4.3.0 (Hash 模式)
- **图表**: ECharts 5.6.0 + vue-echarts 7.0.3
- **HTTP 客户端**: umi-request 1.4.0
- **构建工具**: Vue CLI 5.0.0
- **API 生成**: @umijs/openapi 1.13.0

## 常用命令

```bash
# 开发环境
yarn serve          # 启动开发服务器 (localhost:8080)

# 生产构建
yarn build          # 生产环境构建

# 代码检查
yarn lint           # ESLint + TypeScript 检查

# API 生成
yarn openapi        # 从 OpenAPI 规范生成 TypeScript 类型和服务
```

## 核心架构

### 1. 角色权限控制

系统根据用户身份长度区分角色：
- **学生** (`role.length === 10`): 可查看个人成绩、与同学对比、发起挑战
- **教师**: 完整的班级管理、成绩分析、对比工具权限

路由守卫在 [src/router/index.ts](src/router/index.ts) 中实现：
- 白名单路由：登录、注册页面无需认证
- 根据 `localStorage` 中的用户信息判断权限
- 未认证用户重定向到登录页

### 2. 路由结构

```
/                          # 根路径重定向
├── user/                   # 用户认证
│   ├── login              # 学生登录
│   ├── register           # 学生注册
│   └── teacher-register   # 教师注册
├── grade                  # 学生成绩看板
├── compare               # 历史成绩对比
├── challenge             # 学生挑战功能
├── detail                # 排名详情
├── simulate              # 成绩模拟
├── teacher_info          # 教师信息
├── class_grade           # 班级成绩概览
├── class_analysis        # 班级分析
├── class_compare        # 班级对比
├── student_analysis      # 单个学生分析
└── student_compare       # 学生对比
```

### 3. 目录结构

```
src/
├── assets/              # 静态资源（图片等）
├── components/          # 可复用 Vue 组件
├── composables/         # Composition API 工具函数
│   └── useLogout.ts     # 登出功能
├── layout/              # 布局组件
│   └── NavBar.vue       # 导航栏（基于角色动态生成菜单）
├── locales/             # 国际化文件（支持 8 种语言）
│   ├── en-US/           # 英语
│   ├── zh-CN/           # 简体中文
│   ├── zh-TW/           # 繁体中文
│   ├── ja-JP/           # 日语
│   ├── fa-IR/           # 波斯语
│   ├── pt-BR/           # 葡萄牙语（巴西）
│   ├── id-ID/           # 印尼语
│   └── bn-BD/           # 孟加拉语
├── router/              # 路由配置
│   ├── index.ts         # 主路由文件（含守卫）
│   ├── modules/         # 功能模块路由
│   │   ├── user.ts      # 认证路由
│   │   ├── grade.ts     # 学生成绩路由
│   │   └── teacher.ts   # 教师管理路由
│   └── common.ts        # 通用路由
├── servers/             # API 服务层
│   └── api/             # 自动生成的 API 服务
│       ├── user.ts      # 用户认证 API
│       ├── grade.ts     # 成绩管理 API
│       ├── student.ts   # 学生数据 API
│       ├── analysis.ts  # 分析 API
│       ├── classes.ts   # 班级管理
│       ├── exam.ts      # 考试数据
│       ├── average.ts   # 平均分 API
│       ├── school.ts    # 学校数据
│       ├── teacher.ts   # 教师数据
│       ├── upload.ts    # 文件上传
│       └── index.ts      # API 导出
├── store/               # Pinia 状态管理
│   ├── index.ts         # Store 初始化
│   ├── modules/         # Store 模块
│   │   └── user.ts      # 用户状态管理
│   └── README.md        # Store 文档
├── utils/               # 工具函数
│   ├── request.ts       # HTTP 请求配置
│   ├── types.ts         # TypeScript 类型定义
│   └── inflection.ts    # 科目名称映射工具
├── views/               # 页面组件
│   ├── user/            # 认证页面
│   ├── grade/           # 学生成绩页面
│   │   └── components/   # 成绩页面子组件
│   ├── compare/         # 对比页面
│   ├── challenge/       # 挑战功能页面
│   ├── detail/          # 详情分析页面
│   ├── teacher/         # 教师管理页面
│   │   └── components/  # 教师页面子组件
│   ├── gradeanalysis/   # 分析看板页面
│   ├── student/         # 学生功能页面
│   └── simulate/        # 模拟功能
├── App.vue              # 根组件
└── main.ts              # 应用入口
```

### 4. 状态管理 (Pinia)

用户状态管理在 [src/store/modules/user.ts](src/store/modules/user.ts)：

```typescript
// 主要状态
userInfo: User      // 用户信息
isLogin: boolean   // 登录状态

// 主要方法
initUserInfo()      // 从 localStorage 初始化
getUserInfo()       // 获取当前用户数据
setUserInfo()       // 设置用户数据（登录）
updateUserInfo()    // 部分更新
clearUserInfo()     // 登出清理
```

数据持久化到 `localStorage`，应用启动时自动初始化。

### 5. API 架构

#### HTTP 配置 ([src/utils/request.ts](src/utils/request.ts))
- **Base URL**: `https://monitor.xipinkj.cn/api`
- **超时时间**: 10 秒
- **请求拦截器**: 自动添加 Bearer token
- **响应拦截器**: 处理 401 未授权跳转

#### API 生成
- **数据源**: OpenAPI/Swagger 规范
- **地址**: `http://127.0.0.1:5000/swagger.json`
- **输出**: 自动生成类型安全的 TypeScript API 服务

#### 开发代理 ([vue.config.js:14-22](vue.config.js#L14-L22))
```javascript
proxy: {
  '/api': {
    target: 'http://111.228.38.111:5000',
    changeOrigin: true,
    pathRewrite: { '^': '' }  // 去掉前缀 `/api`
  }
}
```

### 6. 路径别名

使用 `@` 作为 src 目录的别名 ([vue.config.js:7-11](vue.config.js#L7-L11))：
```typescript
import Something from '@/components/...'
```

### 7. 数据流架构

```
用户操作 → 组件 → Store/API 服务 → HTTP 客户端 → API 请求
   ↓                                              ↓
UI 更新 ← 响应数据 ← 拦截器处理 ← 后端响应
```

### 8. 核心功能

#### 学生功能
- **成绩看板** ([views/grade/Grade.vue](src/views/grade/Grade.vue)): 考试选择、成绩概览、排名分析、高考倒计时、雷达图
- **历史对比** ([views/compare/Compare.vue](src/views/compare/Compare.vue)): 分数/排名切换、科目趋势图、及格线对比
- **同学挑战** ([views/challenge/StudentChallengePage.vue](src/views/challenge/StudentChallengePage.vue)): 选择对手、成绩对比、优劣势科目标识

#### 教师功能
- **班级成绩** ([views/teacher/components/](src/views/teacher/components/)): 班级成绩概览
- **班级分析** ([views/gradeanalysis/](src/views/gradeanalysis/)): 多维度班级分析
- **学生分析** ([views/teacher/components/StudentAnalysisPages.vue](src/views/teacher/components/StudentAnalysisPages.vue)): 单个学生趋势分析

### 9. 布局组件

#### NavBar.vue ([src/layout/NavBar.vue](src/layout/NavBar.vue))
- 基于角色动态生成菜单
- 显示用户信息
- 登出功能
- 当前路由高亮

#### App.vue ([src/App.vue](src/App.vue))
- 条件渲染 NavBar（认证页面隐藏）
- 路由视图容器
- 固定布局

### 10. 编码规范

- **Composition API**: 使用 `<script setup>` 语法
- **TypeScript**: 全程强类型
- **文件命名**: 组件用 PascalCase，工具用 camelCase
- **路由模式**: Hash 模式 (`createWebHashHistory`)

### 11. 图表配置

- 使用 vue-echarts 包装 ECharts
- 响应式图表布局
- 支持多科目数据对比
- 及格线、趋势线等辅助线

### 12. 国际化 (i18n)

支持 8 种语言，每种语言包含：
- Pages（页面翻译）
- Components（组件翻译）
- Settings（设置翻译）
- Menu items（菜单项）
- Global headers（全局标题）
