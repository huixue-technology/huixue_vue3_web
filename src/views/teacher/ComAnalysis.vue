<script setup lang="ts">
import {onMounted, ref} from "vue";
import {class_info} from "@/views/teacher/types";
import {getClassesApi} from "@/servers/api/classes";
import {message} from "ant-design-vue";

const classInfo = ref<class_info>();
const teacherId = ref<number>(0);
onMounted(async ()=>{
  try {
    // 获取班级信息
    const classRes = await getClassesApi({ header: teacherId.value });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classInfo.value = {
        header: classRes.data[0].header,
        class_id: classRes.data[0].id,
        name: classRes.data[0].name,
        subject_selection: classRes.data[0].subject_selection,
        school_id: classRes.data[0].school_id
      };
    } else {
      message.error(classRes.msg || '未查询到班级信息');
    }
  } catch (err) {
    message.error('初始化失败');
  }
})
</script>

<template>
  <div class="container">
    <div class="header">
      <h2>{{classInfo?.name}}班级成绩综合分析</h2>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
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
}
</style>