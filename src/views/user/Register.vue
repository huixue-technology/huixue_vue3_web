<template>
  <div class="container">
    <h2>学生无需注册</h2>
    <p class="tip">
      学校导入学生名单后，学生在微信里扫描网页上的登录码即可绑定学号并登录，不需要在这里注册账号。
    </p>
    <p class="tip">如果扫码提示"未找到对应学生"，请联系学校确认名单是否已导入。</p>
    <router-link to="/user/login">返回登录</router-link>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="less">
.container {
  width: 92vw;
  max-width: 520px;
  margin: 48px auto;
  padding: 24px;
}

.tip {
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.8;
}
</style>
