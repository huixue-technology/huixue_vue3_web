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
      <a-descriptions-item label="学生姓名">{{ userData?.student?.name }}</a-descriptions-item>
      <a-descriptions-item label="考号">{{ userData?.student?.uid }}</a-descriptions-item>
      <a-descriptions-item label="学校">{{ userData?.student?.school }}</a-descriptions-item>
      <a-descriptions-item label="班级编号">{{ userData?.student?.class_id }}</a-descriptions-item>
      <a-descriptions-item label="年级">{{ userData?.student?.grade }}</a-descriptions-item>
      <a-descriptions-item label="选科情况">{{ userData?.student?.subject_selection }}</a-descriptions-item>
      <a-descriptions-item label="是否在读">{{userData?.student?.state==1?'在读':'不在读'}}</a-descriptions-item>
      <a-descriptions-item label="个人邮箱">{{ userData.email }}</a-descriptions-item>
      <a-descriptions-item label="联系方式">{{ userData.phone }}</a-descriptions-item>
      <a-descriptions-item label="个人简介">
        Data disk type: MongoDB
        
       
      </a-descriptions-item>
    </a-descriptions>
    <div>
    <a-modal v-model:open="open" title="修改信息" @ok="handleOk">
      <a-form >
        <a-form-item label="个人邮箱">
          <a-input v-model:value="email" placeholder="请输入个人邮箱" />
        </a-form-item>
        <a-form-item  label="联系方式">
          <a-input v-model:value="phone" placeholder="请输入联系方式" />
        </a-form-item>
      </a-form>

    </a-modal>
  </div>
 
  </div>
  </div>
</template>



<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message, type DescriptionsProps,type Form, type FormItem, type Input } from 'ant-design-vue';
import { useUserStore } from '@/store';
// 导入putUserDetailApi
import { putUserDetailApi } from '@/servers/api/user';
import { useLogout } from '@/composables/useLogout';
const size = ref<DescriptionsProps['size']>('default');
const onChange = (e: any) => {
  console.log('size checked', e.target.value);
  size.value = e.target.value;
};

const open = ref<boolean>(false);
const email = ref('');
const phone = ref('');


const userStore = useUserStore();
const userData = userStore.userInfo;
const showModal = () => {
  open.value = true;
  email.value = userData.email??'';
  phone.value = userData.phone??'';
};
const handleOk = () =>{
  // 构造包含user_id的params对象和用户信息对象
  const params = { user_id: String(userData.id) };
  const userInfo = {
    phone: phone.value,
    email: email.value,
    name: userData.name,
    password: userData.password
  };
  const { logout } = useLogout();
  
  // 调用putUserDetailApi并传递正确的参数
  putUserDetailApi(params, userInfo).then((res: any)=>{
    console.log(res);
    // 刷新用户信息
    message.success('修改成功,请重新登录');
    logout();
    return;
    
  });
  
  open.value = false;
}
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