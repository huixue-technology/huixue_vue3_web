<template>
  <div class="container">
    <img src="@/assets/logo.svg" width="50" height="50" alt="logo" />
    <a-menu
      v-model:selectedKeys="current"
      class="menu"
      mode="horizontal"
      :items="items"
      @select="handleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from "vue";
import type { MenuProps } from "ant-design-vue";
import {
  AppstoreOutlined,
  FrownOutlined,
  ForkOutlined,
  LogoutOutlined,
  MailOutlined,
  MergeCellsOutlined,
  MessageOutlined,
  SecurityScanOutlined,
  ThunderboltOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import router from "@/router";
import { useLogout } from "@/composables/useLogout";
import { useUserStore } from "@/store";

const current = ref<string[]>(["grade"]);
const userStore = useUserStore();
const { logout } = useLogout();

const items = computed<MenuProps["items"]>(() => {
  const path = window.location.hash.slice(1);
  const isAuthPage =
    path.startsWith("/user/login") ||
    path.startsWith("/user/register") ||
    path.startsWith("/user/teacher-register");
  if (isAuthPage) return [];

  const user = userStore.getUserInfo();
  // 检查是否有有效的用户身份（student 或 teacher 字段）
  if (!user || (!user.student && !user.teacher)) {
    router.push("/user/login");
    return [];
  }

  const menuItems: MenuProps["items"] = [];
  const isTeacher = user.role_type === "teacher" || user.teacher !== undefined;

  if (isTeacher) {
    menuItems.push(
      { key: "teacher_info", icon: () => h(UserOutlined), label: "老师信息", title: "老师信息" },
      { key: "class_grade", icon: () => h(UsergroupAddOutlined), label: "班级成绩", title: "班级成绩" },
      { key: "class_analysis", icon: () => h(AppstoreOutlined), label: "班级分析", title: "班级分析" },
      { key: "class_compare", icon: () => h(MergeCellsOutlined), label: "班级对比", title: "班级对比" },
      { key: "student_analysis", icon: () => h(SecurityScanOutlined), label: "学生分析", title: "学生分析" },
      { key: "student_compare", icon: () => h(ThunderboltOutlined), label: "学生对比", title: "学生对比" },
      { key: "simulate", icon: () => h(FrownOutlined), label: "成绩模拟", title: "成绩模拟" },
      { key: "wrong_question", icon: () => h(AppstoreOutlined), label: "错题模块", title: "错题模块" },
      { key: "paper_view", icon: () => h(ForkOutlined), label: "试卷查看", title: "试卷查看" }
    );
  } else {
    menuItems.push(
      { key: "grade", icon: () => h(MailOutlined), label: "我的成绩", title: "我的成绩" },
      { key: "student", icon: () => h(SecurityScanOutlined), label: "学生分析", title: "学生分析" },
      { key: "compare", icon: () => h(ThunderboltOutlined), label: "学生对比", title: "学生对比" },
      { key: "simulate", icon: () => h(FrownOutlined), label: "成绩模拟", title: "成绩模拟" },
      {
        key: "student_wrong_question",
        icon: () => h(AppstoreOutlined),
        label: "错题模块",
        title: "错题模块",
      },
      { key: "student_paper_view", icon: () => h(ForkOutlined), label: "试卷查看", title: "试卷查看" }
    );
  }

  menuItems.push(
    { key: "feedback", icon: () => h(MessageOutlined), label: "意见反馈", title: "意见反馈" },
    { key: "logout", icon: () => h(LogoutOutlined), label: "退出登录", title: "退出登录" }
  );
  return menuItems;
});

const handleClick = (event: any) => {
  if (event.key === "logout") {
    logout();
    return;
  }
  router.replace("/" + event.key);
  current.value = [event.key];
};
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: row;
}

.menu {
  width: 100%;
  height: 100%;
  overflow-x: auto;
}
</style>
