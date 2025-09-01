<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from "@/store";
import { putUserDetailApi } from "@/servers/api/user";
import { teacher_info } from "@/views/teacher/types";
import { message, Modal, type DescriptionsProps } from "ant-design-vue";
import {useLogout} from "@/composables/useLogout";

const user = useUserStore();
const show = ref<teacher_info>({
  bindState: false,
  email: '暂无',
  username: '暂无',
  role: '未绑定',
  school_id: '暂无',
  phone: '暂无',
  subject: '暂无',
  name: '暂无'
});

const open = ref<boolean>(false);
const {logout} = useLogout();

onMounted(async () => {
  const teacher_info = user.getUserInfo();
  if (teacher_info.bind_state) {
    show.value = {
      bindState: teacher_info.bind_state,
      email: teacher_info.email || '暂无',
      role: teacher_info.role || '未绑定',
      username: teacher_info.name || '暂无',
      school_id: teacher_info.teacher.school_id || '暂无',
      phone: teacher_info.phone || '暂无' ,
      subject: teacher_info.teacher.subject || '暂无',
      name: teacher_info.teacher.name
    };
  }else{
    show.value.bindState = teacher_info.bind_state;
    show.value.email = teacher_info.email || '暂无';
    show.value.username = teacher_info.name || '暂无';
    show.value.phone = teacher_info.phone || '暂无'
  }
});

const showModifyModal = () => {
  open.value = true;
};

const handleOk = async () => {
  const info = user.getUserInfo();
  const res = await putUserDetailApi({ user_id: String(info.id) }, {
    email: show.value.email,
    phone: show.value.phone,
    name: show.value.username,
    role: show.value.role,
    bind_state: true
  });

  if (res.code === 200) {
    message.success('绑定成功');
    open.value = false;
    await logout()
  } else {
    message.error(res.data || '绑定失败');
  }
};
const unbind = async () => {
  const info = user.getUserInfo();
  // 添加确认弹窗
  Modal.confirm({
    title: '确认解除绑定',
    content: '您确定要解除教师绑定吗？解除绑定后将无法查看相关教学信息。',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      const res = await putUserDetailApi({ user_id: String(info.id) }, {
        email: show.value.email,
        phone: show.value.phone,
        name: show.value.username,
        role: '',
        bind_state: false
      });

      if (res.code === 200) {
        message.success('解除绑定成功')
        await logout()
      } else {
        message.error(res.data || '解除绑定失败');
      }
    },
  });
};
</script>

<template>
  <div class="teacher-info-container">
    <h3 style="margin-top: 50px;">教师信息展示</h3>
    <a-descriptions bordered size="middle" style="min-width: 350px">
      <template #extra>

        <a-space style="margin-right: 30px">
          <a-button type="dashed" @click="unbind" style="color: #c82333">解除绑定</a-button>
          <a-button type="primary" @click="showModifyModal">绑定信息</a-button>
        </a-space>

      </template>
      <a-descriptions-item label="教师姓名">{{ show.name }}</a-descriptions-item>
      <a-descriptions-item label="学校">{{ show.school_id }}</a-descriptions-item>
      <a-descriptions-item label="任教学科">{{ show.subject }}</a-descriptions-item>
      <a-descriptions-item label="用户账号">{{ show.email }}</a-descriptions-item>
      <a-descriptions-item label="联系方式">{{ show.phone }}</a-descriptions-item>
      <a-descriptions-item label="工号">{{ show.role }}</a-descriptions-item>
      <a-descriptions-item label="绑定状态">{{ show.bindState ? '已绑定' : '未绑定' }}</a-descriptions-item>
    </a-descriptions>

    <!-- 修改信息弹窗 -->
    <a-modal v-model:open="open" title="修改信息" @ok="handleOk">
      <a-form>
        <a-form-item label="用户名">
          <a-input v-model:value="show.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="工号">
          <a-input v-model:value="show.role" placeholder="请输入绑定id" />
        </a-form-item>
        <a-form-item label="联系方式">
          <a-input v-model:value="show.phone" placeholder="请输入联系方式" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
::v-deep(.ant-descriptions-item-label),
::v-deep(.ant-descriptions-item-content) {
  text-align: center;
}

::v-deep(.ant-descriptions-item-label) {
  font-weight: bold;
}
.teacher-info-container {
  position:relative;
  overflow-x: auto;
}
</style>