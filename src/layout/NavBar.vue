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
  ReadOutlined,
  MessageOutlined,
  SecurityScanOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import router from "@/router";
import { useLogout } from "@/composables/useLogout";
import { menuAllowed } from "@/utils/school";
import { useUserStore } from "@/store";

const current = ref<string[]>([window.location.hash.slice(1).replace(/^\//, "") || "grade"]);
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
  // 检查是否有有效的用户身份（student / teacher / 管理员）
  if (!user || (!user.student && !user.teacher && user.role_type !== "admin")) {
    router.push("/user/login");
    return [];
  }

  const menuItems: MenuProps["items"] = [];
  const isTeacher = user.role_type === "teacher" || user.teacher !== undefined;

  if (isTeacher) {
    menuItems.push(
      { key: "class_grade", icon: () => h(UsergroupAddOutlined), label: "班级成绩", title: "班级成绩" },
      { key: "class_analysis", icon: () => h(AppstoreOutlined), label: "班级分析", title: "班级分析" },
      { key: "class_compare", icon: () => h(MergeCellsOutlined), label: "班级对比", title: "班级对比" },
      { key: "student_analysis", icon: () => h(SecurityScanOutlined), label: "学生分析", title: "学生分析" },
      { key: "student_compare", icon: () => h(ThunderboltOutlined), label: "学生对比", title: "学生对比" },
      { key: "simulate", icon: () => h(FrownOutlined), label: "成绩模拟", title: "成绩模拟" },
      { key: "wrong_question", icon: () => h(AppstoreOutlined), label: "错题模块", title: "错题模块" },
      { key: "paper_view", icon: () => h(ForkOutlined), label: "试卷查看", title: "试卷查看" },
      { key: "gaokao_question_bank", icon: () => h(ReadOutlined), label: "高考试题", title: "高考试题" }
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
      { key: "student_paper_view", icon: () => h(ForkOutlined), label: "试卷查看", title: "试卷查看" },
      { key: "gaokao_question_bank", icon: () => h(ReadOutlined), label: "高考试题", title: "高考试题" }
    );
  }

  // 管理员（含以学生/老师身份进入的会话）可随时回到身份选择页
  if (localStorage.getItem("admin_token")) {
    menuItems.push({
      key: "admin_switch",
      icon: () => h(SwapOutlined),
      label: "切换身份",
      title: "切换身份",
    });
  }

  menuItems.push(
    { key: "feedback", icon: () => h(MessageOutlined), label: "意见反馈", title: "意见反馈" },
    {
      // 教师看教师信息页，学生看通用个人中心；学生访问 /teacher_info 会被路由守卫弹回首页。
      key: isTeacher ? "teacher_info" : "user/my-info",
      icon: () => h(UserOutlined),
      label: "个人中心",
      title: "个人中心",
    },
    { key: "logout", icon: () => h(LogoutOutlined), label: "退出登录", title: "退出登录" }
  );
  // 多校：学校未启用的模块不出现在菜单里（含 "*" 或未配置时全放行）
  return menuItems.filter((item) => !item?.key || menuAllowed(String(item.key)));
});

const handleClick = (event: any) => {
  if (event.key === "logout") {
    logout();
    return;
  }
  if (event.key === "admin_switch") {
    const adminToken = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");
    if (!adminToken || !adminUser) {
      message.error("管理员身份已失效，请重新登录");
      router.replace("/user/admin-login");
      return;
    }
    localStorage.setItem("token", adminToken);
    try {
      userStore.setUserInfo(JSON.parse(adminUser));
    } catch (_error) {
      router.replace("/user/admin-login");
      return;
    }
    router.replace("/admin/entry");
    current.value = ["admin_switch"];
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
