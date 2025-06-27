<template>
  <div class="my-info-container">
    <div>
    <a-radio-group v-model:value="size" @change="onChange">
      <a-radio value="default">默认大小</a-radio>
      <a-radio value="middle">中等</a-radio>
      <a-radio value="small">较小</a-radio>
    </a-radio-group>
    <br />
    <br />
    <a-descriptions bordered title="个人信息展示" :size="size" class = "my-info-container">
      <template #extra>
        <a-button type="primary" @click="showModal">修改信息</a-button>
      </template>
      <a-descriptions-item label="用户姓名">{{ userData.name }}</a-descriptions-item>
      <a-descriptions-item label="学生姓名">{{ userData.student.name }}</a-descriptions-item>
      <a-descriptions-item label="考号">{{ userData.student.uid }}</a-descriptions-item>
      <a-descriptions-item label="学校">{{ userData.student.school }}</a-descriptions-item>
      <a-descriptions-item label="班级编号">{{ userData.student.class_id }}</a-descriptions-item>
      <a-descriptions-item label="年级">{{ userData.student.grade }}</a-descriptions-item>
      <a-descriptions-item label="选科情况">{{ userData.student.subject_selection }}</a-descriptions-item>
      <a-descriptions-item label="是否在读">{{userData.student.state==1?'在读':'不在读'}}</a-descriptions-item>
      <a-descriptions-item label="个人邮箱">{{ userData.email }}</a-descriptions-item>
      <a-descriptions-item label="联系方式">{{ userData.phone }}</a-descriptions-item>
      <a-descriptions-item label="个人简介">
        Data disk type: MongoDB
        
       
      </a-descriptions-item>
    </a-descriptions>
    <div>
    <a-modal v-model:open="open" title="Basic Modal" @ok="handleOk">
      
    </a-modal>
  </div>
 
  </div>
  </div>
</template>



<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import type { DescriptionsProps } from 'ant-design-vue';
import { useUserStore } from '@/store';
const size = ref<DescriptionsProps['size']>('default');
const onChange = (e: any) => {
  console.log('size checked', e.target.value);
  size.value = e.target.value;
};

const open = ref<boolean>(false);
const showModal = () => {
  open.value = true;
};

const userStore = useUserStore();
const userData = userStore.userInfo;
</script>

<style scoped>
::v-deep(.ant-descriptions-item-label),
::v-deep(.ant-descriptions-item-content) {
  text-align: center;
}
::v-deep(.ant-descriptions-item-label) {
  font-weight: bold;
}

</style>