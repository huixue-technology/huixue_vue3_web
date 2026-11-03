<template>
  <div class="container">
    <h2>慧学成绩查询</h2>
    <a-tabs v-model:activeKey="loginType" centered>
      <a-tab-pane key="account" tab="账号密码登录">
        <a-form
          :model="formparams"
          name="normal_login"
          class="login-form"
          @finish="onFinish"
          @finishFailed="onFinishFailed"
        >
          <a-form-item
            label="用户名"
            name="email"
            :rules="[{ required: true, message: '请输入用户名!' }]"
          >
            <a-input v-model:value="formparams.email">
              <template #prefix>
                <UserOutlined class="site-form-item-icon" />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            label="密码"
            name="password"
            :rules="[
              { required: true, message: 'Please input your password!' },
            ]"
          >
            <a-input-password v-model:value="formparams.password">
              <template #prefix>
                <LockOutlined class="site-form-item-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item>
            <a-button
              :disabled="disabled"
              type="primary"
              html-type="submit"
              class="login-form-button"
            >
              登录
            </a-button>
            或者
            <router-link to="/user/register">学生注册</router-link>
            |
            <router-link to="/user/teacher-register">教师注册</router-link>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      <a-tab-pane key="wechat" tab="微信扫码登录">
        <WechatLogin
          v-if="loginType === 'wechat'"
          :on-success="completeLogin"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import { message } from "ant-design-vue";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { postUserLogin } from "@/servers/api/user";
import router from "@/router";
import { useUserStore } from "@/store";
import { getClassesDetailApi } from "@/servers/api/classes";
import WechatLogin from "./WechatLogin.vue";
import type { QrLoginUser } from "@/utils/qrLogin";
const loginType = ref("account");
// 表单参数
interface FormParams {
  email: string;
  password: string;
}

const disabled = computed(() => {
  return !(formparams.email && formparams.password);
});

const formparams = reactive<FormParams>({
  email: "",
  password: "",
});

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

const onFinish = async (values: API.Login) => {
  try {
    const res = await postUserLogin(values);
    await completeLogin(res.data);
  } catch (error: any) {
    console.error("登录失败:", error);
    const status = error?.response?.status;
    if (status === 401) {
      message.error("账号或密码错误，请重试");
    } else if (status === 400) {
      message.error("登录信息有误，请检查输入");
    } else if (status >= 500) {
      message.error("服务器繁忙，请稍后再试");
    } else {
      message.error("登录失败，请检查网络或联系管理员");
    }
  }
};

const onFinishFailed = () => {
  message.warning("请填写账号和密码");
};
</script>

<style scoped lang="less">
#components-form-demo-normal-login .login-form {
  max-width: 300px;
}
#components-form-demo-normal-login .login-form-forgot {
  float: right;
}
#components-form-demo-normal-login .login-form-button {
  width: 100%;
}

.container {
  width: 92vw;
  max-width: 420px;
  margin: 48px auto;
  padding: 24px;
}
</style>
