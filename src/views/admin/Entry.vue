<template>
  <div class="entry-container">
    <a-card class="entry-card" :bordered="false">
      <template #title>选择要进入的身份</template>
      <p class="tip">
        选择学生可进入学生端，选择班级可查看本校班级成绩。
      </p>

      <a-radio-group v-model:value="target" button-style="solid" class="target-switch">
        <a-radio-button value="teacher">老师端</a-radio-button>
        <a-radio-button value="student">学生端</a-radio-button>
      </a-radio-group>

      <a-form layout="vertical" class="entry-form">
        <a-form-item label="学校">
          <a-select
            v-model:value="schoolId"
            show-search
            option-filter-prop="label"
            placeholder="请选择学校"
            :loading="loadingSchools"
            :options="schoolOptions"
            @change="handleSchoolChange"
          />
        </a-form-item>
        <a-form-item label="班级">
          <a-select
            v-model:value="classId"
            show-search
            option-filter-prop="label"
            :placeholder="schoolId ? '请选择班级' : '请先选择学校'"
            :disabled="!schoolId"
            :loading="loadingClasses"
            :options="classOptions"
            @change="handleClassChange"
          />
        </a-form-item>
        <a-form-item v-if="target === 'student'" label="学生">
          <a-select
            v-model:value="studentUid"
            show-search
            option-filter-prop="label"
            :placeholder="classId ? '请选择学生' : '请先选择班级'"
            :disabled="!classId"
            :loading="loadingStudents"
            :options="studentOptions"
          />
        </a-form-item>
      </a-form>

      <a-button type="primary" block :loading="entering" :disabled="!canEnter" @click="enter">
        进入
      </a-button>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import router from '@/router';
import { useUserStore } from '@/store';
import { getSchoolApi } from '@/servers/api/school';
import { getClassesApi } from '@/servers/api/classes';
import { getStudentApi } from '@/servers/api/student';
import { postAdminImpersonate } from '@/servers/api/adminAuth';
import { loadSchoolConfig } from '@/utils/school';
import { rememberTeacherClass } from '@/utils/teacherClasses';

const userStore = useUserStore();

const target = ref<'teacher' | 'student'>('teacher');
const schoolId = ref<string | undefined>();
const classId = ref<number | undefined>();
const studentUid = ref<string | undefined>();

const schoolOptions = ref<{ label: string; value: string }[]>([]);
const classOptions = ref<{ label: string; value: number }[]>([]);
const studentOptions = ref<{ label: string; value: string }[]>([]);

const loadingSchools = ref(false);
const loadingClasses = ref(false);
const loadingStudents = ref(false);
const entering = ref(false);

const canEnter = computed(() =>
  target.value === 'student' ? Boolean(studentUid.value) : Boolean(classId.value)
);

// 进入选择页时始终以管理员身份为准：上次以学生/老师身份进入会覆盖 token。
const restoreAdminIdentity = () => {
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) return false;
  if (localStorage.getItem('token') !== adminToken) {
    localStorage.setItem('token', adminToken);
    const adminUser = localStorage.getItem('admin_user');
    if (adminUser) {
      try {
        userStore.setUserInfo(JSON.parse(adminUser));
      } catch (_error) {
        return false;
      }
    }
  }
  return true;
};

const fetchSchools = async () => {
  loadingSchools.value = true;
  try {
    const res = await getSchoolApi({ page: 1, size: 1000 } as any);
    const list = Array.isArray(res?.data) ? res.data : [];
    schoolOptions.value = list.map((item: any) => ({
      label: item.name || item.school_id,
      value: String(item.school_id),
    }));
  } catch (error) {
    message.error('获取学校列表失败');
  } finally {
    loadingSchools.value = false;
  }
};

const fetchClasses = async (school: string) => {
  loadingClasses.value = true;
  try {
    const res = await getClassesApi({ school_id: school, size: 1000 } as any);
    const list = Array.isArray(res?.data) ? res.data : [];
    classOptions.value = list.map((item: any) => ({
      label: item.name || String(item.id),
      value: Number(item.id),
    }));
  } catch (error) {
    message.error('获取班级列表失败');
  } finally {
    loadingClasses.value = false;
  }
};

const fetchStudents = async (classIdValue: number) => {
  loadingStudents.value = true;
  try {
    const res = await getStudentApi({ class_id: classIdValue, size: 200 } as any);
    const list = Array.isArray(res?.data) ? res.data : [];
    studentOptions.value = list.map((item: any) => ({
      label: `${item.name}（${String(item.uid || '').slice(-4)}）`,
      value: String(item.uid),
    }));
  } catch (error) {
    message.error('获取学生列表失败');
  } finally {
    loadingStudents.value = false;
  }
};

const handleSchoolChange = async (value: string) => {
  classId.value = undefined;
  studentUid.value = undefined;
  classOptions.value = [];
  studentOptions.value = [];
  await fetchClasses(value);
};

const handleClassChange = async (value: number) => {
  studentUid.value = undefined;
  studentOptions.value = [];
  if (target.value === 'student') {
    await fetchStudents(value);
  }
};

const enter = async () => {
  entering.value = true;
  try {
    const res = await postAdminImpersonate({
      target: target.value,
      class_id: classId.value,
      student_uid: target.value === 'student' ? studentUid.value : undefined,
    });
    if (res?.code !== 200 || !res?.data?.token) {
      message.error(res?.msg || '进入失败');
      return;
    }
    const user = { ...res.data, token: res.data.token };
    localStorage.setItem('token', user.token);
    userStore.setUserInfo(user);
    if (target.value === 'teacher') rememberTeacherClass(user, classId.value);
    // 多校：被代进入的会话同样按学校模块收口
    await loadSchoolConfig(user.token);
    await router.replace(target.value === 'student' ? '/grade' : '/class_grade');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '进入失败，请稍后重试');
  } finally {
    entering.value = false;
  }
};

onMounted(async () => {
  if (!restoreAdminIdentity()) {
    message.error('请先用管理员账号登录');
    await router.replace('/user/admin-login');
    return;
  }
  await fetchSchools();
});
</script>

<style scoped lang="less">
.entry-container {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.entry-card {
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

  .tip {
    color: rgba(0, 0, 0, 0.45);
    margin-bottom: 16px;
  }

  .target-switch {
    margin-bottom: 20px;
  }
}
</style>
