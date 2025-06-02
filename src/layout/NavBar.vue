<template>
<div class="container">
    <img src="@/assets/logo.svg" width="50" height="50" alt="logo">
  <a-menu @select="handleClick" v-model:selectedKeys="current" mode="horizontal" :items="items" class="menu"  />
</div>

</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { MailOutlined, AppstoreOutlined, SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons-vue';
import { MenuProps } from 'ant-design-vue';
import router from '@/router';
import { useLogout } from '@/composables/useLogout';
import { useUserStore } from '@/store';

const current = ref<string[]>(['grade']);
const userStore = useUserStore();
const { logout } = useLogout();

const items = ref<MenuProps['items']>([
  {
    key: 'grade',
    icon: () => h(MailOutlined),
    label: '成绩',
    title: '成绩',
  },
  {
    key: 'compare',
    icon: () => h(AppstoreOutlined),
    label: '进退步',
    title: '进退步',
  },
  {
    key: 'analysis',
    icon: () => h(SettingOutlined),
    label: '成绩分析',
    title: '成绩分析',
  },
  {    key: 'user',    icon: () => h(UserOutlined),    label: '我的信息',    title: '我的信息',  },
  {
    key: 'logout',
    icon: () => h(LogoutOutlined),
    label: '退出登录',
    title: '退出登录',
  },
]);

const handleClick = (e: any) => {
  console.log('click ', e);
  
  if (e.key === 'logout') {
    // 处理退出登录
    logout();
    return;
  }
  
  // 添加路由
  router.push(e.key);
  // 重置当前选中项
  current.value = [e.key];
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: row;
  white-space: space-between;

}
.menu {
  height: 100%;
  width: 100%;
}
</style>