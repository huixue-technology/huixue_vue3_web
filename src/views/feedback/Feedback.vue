<template>
  <div class="feedback-container">
    <a-card class="feedback-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <MessageOutlined class="title-icon" />
          <span>意见反馈</span>
        </div>
      </template>

      <a-tabs v-model:activeKey="activeTab" :animated="true">
        <!-- 提交反馈标签页 -->
        <a-tab-pane key="submit" tab="提交反馈">
          <a-form
            :model="formData"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 16 }"
            @finish="handleSubmit"
          >
            <a-form-item
              label="反馈类型"
              name="feedback_type"
              :rules="[{ required: true, message: '请选择反馈类型' }]"
            >
              <a-select
                v-model:value="formData.feedback_type"
                placeholder="请选择反馈类型"
                size="large"
              >
                <a-select-option value="bug">问题反馈</a-select-option>
                <a-select-option value="feature">功能建议</a-select-option>
                <a-select-option value="improvement">优化建议</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              label="反馈标题"
              name="title"
              :rules="[
                { required: true, message: '请输入反馈标题' },
                { min: 5, max: 100, message: '标题长度应在5-100个字符之间' }
              ]"
            >
              <a-input
                v-model:value="formData.title"
                placeholder="请简要描述您的问题或建议"
                size="large"
              />
            </a-form-item>

            <a-form-item
              label="详细描述"
              name="content"
              :rules="[
                { required: true, message: '请输入详细描述' },
                { min: 10, message: '描述至少需要10个字符' }
              ]"
            >
              <a-textarea
                v-model:value="formData.content"
                placeholder="请详细描述您遇到的问题或您的建议，以便我们更好地了解和处理"
                :rows="6"
                size="large"
                :maxlength="1000"
                show-count
              />
            </a-form-item>

            <a-form-item
              label="联系方式（可选）"
              name="contact_method"
            >
              <a-radio-group v-model:value="formData.contact_method" size="large">
                <a-radio value="email">邮箱</a-radio>
                <a-radio value="phone">手机</a-radio>
                <a-radio value="wechat">微信</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item
              :label="contactLabel"
              name="contact_value"
              :rules="[
                { validator: validateContact }
              ]"
            >
              <a-input
                v-model:value="formData.contact_value"
                :placeholder="`请输入您的${contactLabel}`"
                size="large"
              />
            </a-form-item>

            <a-form-item
              label="优先级"
              name="priority"
              :rules="[{ required: true, message: '请选择优先级' }]"
            >
              <a-select
                v-model:value="formData.priority"
                placeholder="请选择优先级"
                size="large"
              >
                <a-select-option value="low">低</a-select-option>
                <a-select-option value="normal">普通</a-select-option>
                <a-select-option value="high">高</a-select-option>
                <a-select-option value="urgent">紧急</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
              <a-space>
                <a-button type="primary" html-type="submit" :loading="submitting" size="large">
                  <template #icon><SendOutlined /></template>
                  提交反馈
                </a-button>
                <a-button @click="handleReset" size="large">重置</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 当前反馈标签页 -->
        <a-tab-pane key="history" tab="当前反馈">
          <a-spin :spinning="loading">
            <div v-if="feedbackList.length === 0" class="empty-state">
              <a-empty description="暂无反馈记录" />
            </div>
            <div v-else>
              <a-list
                :data-source="feedbackList"
                :pagination="pagination"
                item-layout="vertical"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <template #extra>
                      <a-tag :color="getStatusColor(item.status)">
                        {{ getStatusText(item.status) }}
                      </a-tag>
                    </template>
                    <a-list-item-meta>
                      <template #title>
                        <a-space>
                          <a-tag :color="getTypeColor(item.feedback_type)">
                            {{ getTypeText(item.feedback_type) }}
                          </a-tag>
                          <span class="feedback-title">{{ item.title }}</span>
                        </a-space>
                      </template>
                      <template #description>
                        <div class="feedback-meta">
                          <span><CalendarOutlined /> {{ item.created_at }}</span>
                          <span><TagOutlined /> 优先级: {{ getPriorityText(item.priority) }}</span>
                        </div>
                      </template>
                    </a-list-item-meta>
                    <div class="feedback-content">{{ item.content }}</div>
                    <div v-if="item.admin_reply" class="admin-reply">
                      <a-alert type="success" show-icon>
                        <template #message>
                          <strong>管理员回复：</strong>
                        </template>
                        <template #description>
                          {{ item.admin_reply }}
                        </template>
                      </a-alert>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </div>
          </a-spin>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  MessageOutlined,
  SendOutlined,
  CalendarOutlined,
  TagOutlined
} from '@ant-design/icons-vue';
import { submitFeedback, getMyFeedbacks } from '@/servers/api/feedback';
import { useUserStore } from '@/store';

// 定义反馈项类型
interface FeedbackItem {
  id: number;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  feedback_type: string;
  title: string;
  content: string;
  contact_method: string;
  contact_value: string;
  priority: string;
  status: string;
  admin_reply?: string;
  created_at: string;
  updated_at?: string;
}

const userStore = useUserStore();
const activeTab = ref('submit');
const submitting = ref(false);
const loading = ref(false);
const feedbackList = ref<FeedbackItem[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    loadMyFeedbacks();
  }
});

const formData = reactive<API.FeedbackSubmit>({
  feedback_type: 'bug',
  title: '',
  content: '',
  contact_method: 'email',
  contact_value: '',
  priority: 'normal'
});

// 联系方式标签
const contactLabel = computed(() => {
  const labels = {
    email: '邮箱',
    phone: '手机号',
    wechat: '微信号'
  };
  return labels[formData.contact_method] || '联系方式';
});

// 验证联系方式
const validateContact = (_rule: any, value: string) => {
  // 如果没有输入联系方式，则不进行验证
  if (!value) {
    return Promise.resolve();
  }

  if (formData.contact_method === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject('请输入有效的邮箱地址');
    }
  } else if (formData.contact_method === 'phone') {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      return Promise.reject('请输入有效的手机号');
    }
  }

  return Promise.resolve();
};

// 提交反馈
const handleSubmit = async () => {
  submitting.value = true;
  try {
    const user = userStore.getUserInfo();
    const params: FeedbackSubmitParams = {
      ...formData,
      role: user.role,
      user_email: user.email,
      user_name: user.student?.name || user.teacher?.name || '匿名用户'
    };

    await submitFeedback(params);
    message.success('反馈提交成功，感谢您的宝贵意见！');
    handleReset();
    activeTab.value = 'history';
    loadMyFeedbacks();
  } catch (error) {
    message.error('提交失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const handleReset = () => {
  formData.feedback_type = 'bug';
  formData.title = '';
  formData.content = '';
  formData.contact_method = 'email';
  formData.contact_value = '';
  formData.priority = 'normal';
};

// 加载我的反馈
const loadMyFeedbacks = async () => {
  loading.value = true;
  try {
    const res = await getMyFeedbacks({
      page: pagination.current,
      page_size: pagination.pageSize
    });
    feedbackList.value = res.data || [];
    pagination.total = res.total || 0;
  } catch (error) {
    message.error('加载反馈列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    resolved: 'green',
    closed: 'default'
  };
  return colors[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  };
  return texts[status] || status;
};

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    bug: 'red',
    feature: 'blue',
    improvement: 'green',
    other: 'default'
  };
  return colors[type] || 'default';
};

// 获取类型文本
const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    bug: '问题反馈',
    feature: '功能建议',
    improvement: '优化建议',
    other: '其他'
  };
  return texts[type] || type;
};

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
  };
  return texts[priority] || priority;
};

onMounted(() => {
  loadMyFeedbacks();
});
</script>

<style scoped lang="less">
.feedback-container {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
}

.feedback-card {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .card-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #1890ff;

    .title-icon {
      margin-right: 8px;
      font-size: 20px;
    }
  }
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.feedback-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.feedback-meta {
  display: flex;
  gap: 16px;
  color: #8c8c8c;
  font-size: 13px;
  margin-top: 4px;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.feedback-content {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 4px;
  color: #595959;
  line-height: 1.6;
  white-space: pre-wrap;
}

.admin-reply {
  margin-top: 16px;
}

:deep(.ant-list-item) {
  padding: 20px 16px;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    background: #fafafa;
  }
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}
</style>
