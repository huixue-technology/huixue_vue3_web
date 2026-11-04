<template>
  <div class="container">
    <h2>慧学成绩查询</h2>
    <p class="tip">请使用微信扫码登录。首次使用学生请让学校导入名单后扫码绑定，老师可先提交申请。</p>
    <WechatLogin :on-success="completeLogin" />
    <div class="links">
      <router-link to="/user/register">学生注册</router-link>
      <span class="divider">|</span>
      <router-link to="/user/teacher-register">教师账号申请</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from "@/router";
import { useUserStore } from "@/store";
import { getClassesDetailApi } from "@/servers/api/classes";
import WechatLogin from "./WechatLogin.vue";
import type { QrLoginUser } from "@/utils/qrLogin";

const userStore = useUserStore();

const completeLogin = async (user: QrLoginUser, signal?: AbortSignal) => {
  try {
    if (!user.teacher && user.student) {
      // 从res.data中获取对应的班级，然后根据班级获取对应的选科
      const classId = user.student.class_id;

      if (classId) {
        const r = await getClassesDetailApi(
          { class_id: classId },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
            signal,
          }
        );
        // 在res.data中添加subject_selection字段
        if (r.data?.[0])
          user.student.subject_selection = r.data[0].subject_selection;
      }
    }

    if (signal?.aborted) return;
    // 资料准备完成后才保存身份，取消扫码时不留下旧账号。
    userStore.setUserInfo({
      ...user,
      token: user.token,
    });
    // 仍然保留token在localStorage中，方便API请求使用
    localStorage.setItem("token", user.token);
    if (user.teacher !== undefined) {
      await router.push("/teacher_info");
    } else {
      await router.push("/grade");
    }
  } catch (error) {
    if (signal?.aborted) return;
    localStorage.removeItem("token");
    userStore.clearUserInfo();
    throw error;
  }
};
</script>

<style scoped lang="less">
.container {
  width: 92vw;
  max-width: 420px;
  margin: 48px auto;
  padding: 24px;
}

.tip {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 12px;
}

.links {
  margin-top: 16px;
  text-align: center;

  .divider {
    margin: 0 8px;
    color: rgba(0, 0, 0, 0.25);
  }
}
</style>
