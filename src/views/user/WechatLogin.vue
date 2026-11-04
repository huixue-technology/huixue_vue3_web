<template>
  <div class="wechat-login">
    <a-alert v-if="error" type="warning" show-icon :message="error" />
    <img
      v-else-if="image"
      :src="image"
      width="240"
      height="240"
      alt="微信扫码登录教师／学生网站"
    />
    <a-spin v-else tip="正在获取登录码"><div class="placeholder" /></a-spin>
    <p>使用微信扫一扫，在小程序中确认登录。</p>
    <p>无需输入账号密码，首次登录在小程序中绑定学生和班级。</p>
    <a-button @click="refresh">刷新二维码</a-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { startQrLogin, QrLoginUser } from "@/utils/qrLogin";

const props = defineProps<{
  onSuccess: (user: QrLoginUser, signal: AbortSignal) => Promise<void>;
}>();
const image = ref("");
const error = ref("");
let stop: (() => void) | undefined;
const refresh = () => {
  stop?.();
  image.value = "";
  error.value = "";
  stop = startQrLogin("portal", {
    onReady: (code) => {
      image.value = code.qr_image;
    },
    onSuccess: props.onSuccess,
    onError: (detail) => {
      image.value = "";
      error.value = detail;
    },
  });
};
onMounted(refresh);
onBeforeUnmount(() => stop?.());
</script>

<style scoped>
.wechat-login {
  padding: 16px 0;
  text-align: center;
}
.placeholder {
  height: 240px;
}
</style>
