<template>
<div class="container">
    <img src="@/assets/logo.svg" width="50" height="50" alt="logo">
  <a-menu @select="handleClick" v-model:selectedKeys="current" mode="horizontal" :items="items" class="menu"  />
</div>

</template>

<script setup lang="ts">
import {h, ref, onMounted, computed} from 'vue'
import { MailOutlined, AppstoreOutlined, SettingOutlined, UserOutlined, LogoutOutlined,UsergroupAddOutlined } from '@ant-design/icons-vue';
import { MenuProps } from 'ant-design-vue';
import router from '@/router';
import { useLogout } from '@/composables/useLogout';
import { useUserStore } from '@/store';

const current = ref<string[]>(['grade']);
const userStore = useUserStore();
const { logout } = useLogout();

const items =  computed<MenuProps['items']>(()=>{
  const user = userStore.getUserInfo();
  const menuItems: MenuProps['items'] = [];

  if (!user) return menuItems;

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
          icon: () => h(AppstoreOutlined),
          label: '班级对比',
          title: '班级对比',
        }
    );
  } else {
    menuItems.push(
        {
          key: 'user',
          icon: () => h(UserOutlined),
          label: '学生信息',
          title: '学生信息',
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
          key: 'analysis',
          icon: () => h(SettingOutlined),
          label: '成绩分析',
          title: '成绩分析',
        }
    );
  }
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
}
</style>