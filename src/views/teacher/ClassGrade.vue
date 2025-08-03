<script setup lang="ts">


import {onMounted,ref} from "vue";
import {getClassesApi} from "@/servers/api/classes";
import {useUserStore} from "@/store";
import {class_info} from "@/views/teacher/types"
import {message} from "ant-design-vue";
import {getClassExam} from "@/servers/api/grade";

const user = useUserStore()
const class_info = ref<class_info>()
const class_exam_list = ref<[]>()
onMounted(async ()=>{
  const teacher_id = user.getUserInfo().role
  const res = await getClassesApi({'header':teacher_id})
  if(res.code === 200) {
    class_info.value = {
      header: res.data[0].header,
      class_id: res.data[0].id,
      name: res.data[0].name,
      school_id: res.data[0].school_id
    }
  }else{
    message.error(res.data)
  }
  console.log(class_info.value)
  if(class_info.value?.class_id){
    const r = await getClassExam({'class_id':class_info.value.class_id})
    if(r.code === 200) {
      class_exam_list.value = r.data
    }else{
      message.error(r.data)
    }
  }
  console.log(class_exam_list.value)

})
</script>

<template>
班级成绩
</template>

<style scoped>

</style>