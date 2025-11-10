<template>
  <div class="teacher-info-container">
    <div class="header">
      <h2>教师信息</h2>
      <p>查看和管理您的教师账户信息</p>
    </div>

    <div class="info-card">
      <a-card title="" class="teacher-card">
        <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" size="middle">
          <template #extra>
            <a-space>
              <a-button v-if="show.bindState" type="dashed" @click="unbind" class="unbind-button">解除绑定</a-button>
              <a-button type="primary" @click="showModifyModal" class="bind-button">绑定信息</a-button>
            </a-space>
          </template>
          <a-descriptions-item label="教师姓名">{{ show.name }}</a-descriptions-item>
          <a-descriptions-item label="学校">{{ show.school_id }}</a-descriptions-item>
          <a-descriptions-item label="任教学科">{{ show.subject }}</a-descriptions-item>
          <a-descriptions-item label="用户账号">{{ show.email }}</a-descriptions-item>
          <a-descriptions-item label="联系方式">{{ show.phone }}</a-descriptions-item>
          <a-descriptions-item label="工号">{{ show.role }}</a-descriptions-item>
          <a-descriptions-item label="绑定状态">
            <span :class="show.bindState ? 'status-bound' : 'status-unbound'">
              {{ show.bindState ? '已绑定' : '未绑定' }}
            </span>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>
    </div>

    <!-- 修改信息弹窗 -->
    <a-modal v-model:open="open" title="修改信息" @ok="handleOk" :confirm-loading="loading">
      <a-form layout="vertical">
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

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from "@/store";
import { putUserDetailApi } from "@/servers/api/user";
import { teacher_info } from "@/views/teacher/types";
import { message, Modal, type DescriptionsProps } from "ant-design-vue";
import {useLogout} from "@/composables/useLogout";
import { Card, Button, Form, Input } from "ant-design-vue";

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
const loading = ref<boolean>(false);
const {logout} = useLogout();

onMounted(async () => {
  const teacher_info = user.getUserInfo();
  console.log(teacher_info['teacher'])
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
  loading.value = true;
  try {
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
  } catch (error) {
    message.error('绑定过程中出现错误');
  } finally {
    loading.value = false;
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
      try {
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
      } catch (error) {
        message.error('解除绑定过程中出现错误');
      }
    },
  });
};
</script>

<style scoped lang="less">
.teacher-info-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  
  .header {
    background: linear-gradient(120deg, #4b6cb7, #1890ff);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    color: white;
    
    h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
  }
  
  .info-card {
    .teacher-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      
      :deep(.ant-card-head) {
        background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
        border-bottom: 1px solid #e8e8e8;
        padding: 0 16px;
        
        .ant-card-head-title {
          font-weight: 600;
          color: #333;
        }
      }
    }
  }
  
  :deep(.ant-descriptions-item-label) {
    font-weight: 600;
    color: #595959;
    background-color: #fafafa;
    text-align: center;
  }
  
  :deep(.ant-descriptions-item-content) {
    text-align: center;
  }
  
  .status-bound {
    color: #52c41a;
    font-weight: 600;
  }
  
  .status-unbound {
    color: #ff4d4f;
    font-weight: 600;
  }
  
  .unbind-button {
    color: #ff4d4f;
    border-color: #ff4d4f;
  }
  
  .bind-button {
    background: #1890ff;
    border-color: #1890ff;
  }
  
  :deep(.ant-modal-content) {
    border-radius: 8px;
  }
  
  :deep(.ant-modal-header) {
    background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
    border-bottom: 1px solid #e8e8e8;
    border-radius: 8px 8px 0 0;
  }
  
  :deep(.ant-modal-title) {
    font-weight: 600;
    color: #333;
  }
}

@media (max-width: 768px) {
  .teacher-info-container {
    padding: 12px;
    
    .header {
      padding: 15px;
      
      h2 {
        font-size: 20px;
      }
      
      p {
        font-size: 14px;
      }
    }
    
    :deep(.ant-descriptions-item-label),
    :deep(.ant-descriptions-item-content) {
      padding: 8px 12px;
      font-size: 14px;
    }
  }
}
</style>