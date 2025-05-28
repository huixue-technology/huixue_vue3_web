<template>
<div class="container">
    <img src="@/assets/logo.svg" width="50" height="50" alt="logo">
  <a-menu @select="handleClick" v-model:selectedKeys="current" mode="horizontal" :items="items" class="menu"  />
</div>

</template>

<script setup lang="ts">
import { h,ref } from 'vue'
import { MailOutlined, AppstoreOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons-vue';
import { MenuProps } from 'ant-design-vue';
import router from '@/router';

const current = ref<string[]>(['grade']);

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
  {
    key: 'user',
    icon: () => h(UserOutlined),
    label: '我的信息',
    title: '我的信息',
  },
]);

const handleClick = (e: any) => {
  console.log('click ', e);
  // 添加路由
  router.push(e.key)
  // 重置当前选中项
  current.value = [e.key]

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