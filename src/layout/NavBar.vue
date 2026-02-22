<template>
<div class="container">
    <img src="@/assets/logo.svg" width="50" height="50" alt="logo">
  <a-menu @select="handleClick" v-model:selectedKeys="current" mode="horizontal" :items="items" class="menu"  />
</div>

</template>

<script setup lang="ts">
import {h, ref, onMounted, computed} from 'vue'
import { MailOutlined, AppstoreOutlined, SettingOutlined,ThunderboltOutlined, UserOutlined, LogoutOutlined,UsergroupAddOutlined, ToolOutlined, SolutionOutlined, FrownOutlined, ForkOutlined, SecurityScanOutlined, MergeCellsOutlined, MessageOutlined } from '@ant-design/icons-vue';
import { MenuProps } from 'ant-design-vue';
import router from '@/router';
import { useLogout } from '@/composables/useLogout';
import { useUserStore } from '@/store';

const current = ref<string[]>(['grade']);
const userStore = useUserStore();
const { logout } = useLogout();
onMounted(()=>{

})
const items =  computed<MenuProps['items']>(()=>{
  // 在登录/注册页面不初始化用户信息
  const path = window.location.hash.slice(1);
  const isAuthPage = path.startsWith('/user/login') || path.startsWith('/user/register') || path.startsWith('/user/teacher-register');
  
  if (isAuthPage) {
    return [];
  }
  
  const user = userStore.getUserInfo();
  const menuItems: MenuProps['items'] = [];

  if (!user) return menuItems;
    // 获取用户信息
  const u = userStore.getUserInfo();
  console.log(u)
  if(u.role === null || u.role === undefined) {
    router.push('/user/login')
    return
  }
  if (user.role.length !== 10) {
    menuItems.push(
        {
          key: 'teacher_info',
          icon: () => h(UserOutlined),
          label: '老师信息',
          title: '老师信息',
        },
        {
          key: 'class_grade',
          icon: () => h(UsergroupAddOutlined),
          label: '班级成绩',
          title: '班级成绩',
        },
        {
          key: 'class_analysis',
          icon: () => h(AppstoreOutlined),
          label: '班级分析',
          title: '班级分析',
        },
        {
          key: 'class_compare',
          icon: () => h(MergeCellsOutlined),
          label: '班级对比',
          title: '班级对比',
        },
        {
          key: 'student_analysis',
          icon: () => h(SecurityScanOutlined),
          label: '学生分析',
        },
        {
          key: 'student_compare',
          icon: () => h(ThunderboltOutlined),
          label: '学生对比',
        },
        {
          key: 'simulate',
          icon: () => h(FrownOutlined),
          label: '成绩模拟',
          title: '成绩模拟',
        }
        // {
        //   key: 'ai_assistant',
        //   icon: () => h(ToolOutlined),
        //   label: 'AI小助手'
        // }
    );
  } else {
    menuItems.push(
        {
          key: 'user',
          icon: () => h(UserOutlined),
          label: '我的信息',
          title: '我的信息',
        },
        {
          key: 'grade',
          icon: () => h(MailOutlined),
          label: '成绩',
          title: '成绩',
        },
        {
          key: 'compare',
          icon: () => h(AppstoreOutlined),
          label: '历次排名',
          title: '历次排名',
        },
        {
          key: 'student',
          icon: () => h(ThunderboltOutlined),
          label: '学生分析',
          title: '学生分析',
        },
        {
          key: 'challenge',
          icon: () => h(ToolOutlined),
          label: '学生挑战',
          title: '学生挑战',
        },
        {
          key: 'detail',
          icon: () => h(SolutionOutlined),
          label: '名次详情',
          title: '名次详情',
        },
        {
          key: 'simulate',
          icon: () => h(FrownOutlined),
          label: '成绩模拟',
          title: '成绩模拟',
        }
    );
  }

  // 所有用户都可以访问意见反馈
  menuItems.push({
    key: 'feedback',
    icon: () => h(MessageOutlined),
    label: '意见反馈',
    title: '意见反馈',
  });

  menuItems.push({
    key: 'logout',
    icon: () => h(LogoutOutlined),
    label: '退出登录',
    title: '退出登录',
  });
  return menuItems;
})


const handleClick = (e: any) => {
  console.log('click ', e);
  
  if (e.key === 'logout') {
    // 处理退出登录
    logout();
    return;
  }
  
  // 添加路由
  router.replace('/'+e.key);
  // 重置当前选中项
  current.value = [e.key];
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: row;
}
.menu {
  height: 100%;
  width: 100%;
  overflow-x: auto;
}
</style>
