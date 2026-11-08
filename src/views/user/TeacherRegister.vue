<template>
  <div class="container">
    <h2>教师注册</h2>
    <p class="tip">
      填写学校下发的邀请码即可开通账号，不需要审核。开通后用微信扫码登录，无需设置密码。
    </p>

    <a-form
      :model="formparams"
      name="teacher_register"
      class="register-form"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item
        label="手机号"
        name="phone"
        :rules="[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ]"
      >
        <a-input v-model:value="formparams.phone" placeholder="接收通知的手机号">
          <template #prefix>
            <MobileOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        label="邀请码"
        name="inviteCode"
        :rules="[{ required: true, message: '请输入邀请码' }]"
      >
        <a-input
          v-model:value="formparams.inviteCode"
          placeholder="例如 ABCD234567"
          :maxlength="32"
        >
          <template #prefix>
            <KeyOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          class="login-form-button"
          :loading="loading"
          :disabled="disabled"
        >
          开通账号
        </a-button>
      </a-form-item>
    </a-form>

    <a-alert
      v-if="opened"
      type="success"
      show-icon
      message="账号已开通"
      description="请返回登录页，用微信扫码登录；第一次扫码会直接进入后台。"
    />

    <div class="links">
      <router-link to="/user/login">返回登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { KeyOutlined, MobileOutlined } from '@ant-design/icons-vue';
import { postTeacherRegisterApi } from '@/servers/api/user';
import router from '@/router';
import { message } from 'ant-design-vue';

interface FormParams {
  phone: string;
  inviteCode: string;
}

const formparams = reactive<FormParams>({
  phone: '',
  inviteCode: '',
});

const loading = ref(false);
const opened = ref(false);

const disabled = computed(() => !(formparams.phone && formparams.inviteCode));

const onFinish = async () => {
  loading.value = true;
  try {
    const res = await postTeacherRegisterApi({
      phone: formparams.phone,
      invite_code: formparams.inviteCode.trim().toUpperCase(),
    });
    if (res.code !== 200) {
      message.error(res.msg || '开通失败，请核对邀请码');
      return;
    }
    opened.value = true;
    message.success('账号已开通，请用微信扫码登录');
    setTimeout(() => router.push('/user/login'), 2000);
  } catch (error: any) {
    message.error(error?.message || '开通失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const onFinishFailed = () => {
  message.error('请填写手机号和邀请码');
};
</script>

<style scoped lang="less">
.container {
  max-width: 520px;
  width: 92vw;
  margin: 32px auto;
  padding: 24px;
}

.tip {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 16px;
  line-height: 1.8;
}

.register-form {
  max-width: 320px;
}

.login-form-button {
  width: 100%;
}

.site-form-item-icon {
  color: rgba(0, 0, 0, 0.25);
}

.links {
  margin-top: 16px;
  font-size: 13px;
}
</style>
