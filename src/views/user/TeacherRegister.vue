<template>
  <div class="container">
    <h2>教师注册</h2>
    <p class="tip">
      填写学校下发的邀请码，选择任教班级后开通账号。开通后用微信扫码登录。
    </p>

    <a-form
      :model="formparams"
      name="teacher_register"
      class="register-form"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item v-if="schools.length > 1" label="学校">
        <a-select v-model:value="selectedSchool" :disabled="optionsReady || loading"
          :options="schools.map(({ code, name }) => ({ value: code, label: name }))" />
      </a-form-item>
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
          :disabled="optionsReady || loading"
        >
          <template #prefix>
            <KeyOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item v-if="optionsReady && requiresClassSelection" label="任教班级" name="classIds"
        :rules="[{ required: true, type: 'array', min: 1, message: '请至少选择一个班级' }]">
        <a-select v-model:value="formparams.classIds" mode="multiple" option-filter-prop="label"
          :options="classOptions" placeholder="请选择您任教的班级" />
      </a-form-item>
      <a-alert v-if="optionsReady && !requiresClassSelection" type="info" show-icon
        message="当前没有需要选择的班级，可先开通账号，之后请管理员分配班级。" />

      <a-form-item>
        <a-button v-if="optionsReady" :disabled="loading || opened" @click="optionsReady = false">上一步</a-button>
        <a-button
          type="primary"
          html-type="submit"
          class="login-form-button"
          :loading="loading"
          :disabled="disabled"
        >
          {{ optionsReady ? '开通账号' : '查询可选班级' }}
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
import { computed, onMounted, reactive, ref } from 'vue';
import { KeyOutlined, MobileOutlined } from '@ant-design/icons-vue';
import { getTeacherRegistrationOptions, postTeacherRegisterApi } from '@/servers/api/user';
import { getSelectedSchool, listPlatformSchools, schoolParamForRequest, setSelectedSchool, type PlatformSchool } from '@/utils/school';
import router from '@/router';
import { message } from 'ant-design-vue';

interface FormParams {
  phone: string;
  inviteCode: string;
  classIds: number[];
}

const formparams = reactive<FormParams>({
  phone: '',
  inviteCode: '',
  classIds: [],
});

const loading = ref(false);
const opened = ref(false);
const optionsReady = ref(false);
const requiresClassSelection = ref(false);
const classOptions = ref<{ value: number; label: string }[]>([]);
const schools = ref<PlatformSchool[]>([]);
const selectedSchool = ref('');
const draftKey = ref('');
const school = computed(() => schoolParamForRequest(schools.value, selectedSchool.value) || undefined);

onMounted(async () => {
  schools.value = await listPlatformSchools();
  const saved = getSelectedSchool();
  selectedSchool.value = schools.value.some((item) => item.code === saved) ? saved : schools.value[0].code;
});

const disabled = computed(() => opened.value || !selectedSchool.value || !(formparams.phone && formparams.inviteCode));

const onFinish = async () => {
  loading.value = true;
  try {
    const invite_code = formparams.inviteCode.trim().toUpperCase();
    if (!optionsReady.value) {
      const result = await getTeacherRegistrationOptions(invite_code, school.value);
      if (result.code !== 200) throw new Error(result.msg || '无法查询邀请码');
      const key = JSON.stringify([school.value, invite_code]);
      const available = result.data.classes;
      requiresClassSelection.value = result.data.requires_class_selection;
      if (requiresClassSelection.value && !available.length) {
        throw new Error('该邀请码没有可选班级，请联系管理员');
      }
      classOptions.value = available.map((row) => ({
        value: row.id, label: `${row.grade || ''} ${row.name}（${row.id}）`.trim(),
      }));
      formparams.classIds = draftKey.value === key
        ? formparams.classIds.filter((id) => available.some((row) => row.id === id))
        : [];
      draftKey.value = key;
      optionsReady.value = true;
      return;
    }
    const res = await postTeacherRegisterApi({
      phone: formparams.phone,
      invite_code,
      class_ids: formparams.classIds,
      school: school.value,
    });
    if (res.code !== 200) {
      message.error(res.msg || '开通失败，请核对邀请码');
      return;
    }
    setSelectedSchool(selectedSchool.value);
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
