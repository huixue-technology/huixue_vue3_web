<template>
  <div class="grade-simulation-page">
    <div class="header">
        <button class="back-button" @click="goBack">返回</button>
      <h2>成绩模拟</h2>
    </div>
    <div class="filter">
      <div class="filter-section">
        <div class="filter-item">
            <label>学期:</label>
            <a-select v-model:value="selectedSemester" class="input-select" :options="examOptions"></a-select>
          </div>
          <div class="filter-item">
            <label>考试:</label>
            <a-select v-if="examOptions" class="input-select" :options="examOptions[selectedSemester].list" v-model:value="selectedExam"></a-select>
          </div>
        </div>
      <div>
        <p class="description red-text">
          说明：点击铅笔符号修改分数，点击复位按钮将所有科目改为原成绩
        </p>
        <button @click="inquiry" class="query-button">查询</button>
      </div>
    </div>
    
    <div v-if="showTable" class="score-table-section">
      <div class="table-title">5.22周考</div>
      <table class="score-table">
        <thead>
          <tr>
            <th>科目</th>
            <th>成绩</th>
            <th>班次</th>
            <th>段次</th>
            <th>班级最高分</th>
            <th>特控线</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in originalScores.filter(item => item.show)" :key="index">
            <td>{{ item.subject }}</td>
            <td>{{ item.score }}</td>
            <td>{{ item.classRank }}</td>
            <td>{{ item.gradeRank }}</td>
            <td>{{ item.classHighest }}</td>
            <td>{{ item.firstLine }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Second Table for Simulation -->
      <div class="table-title">5.22周考模拟</div>
      <table class="score-table">
        <thead>
          <tr>
            <th>科目</th>
            <th>成绩</th>
            <th>班次</th>
            <th>段次</th>
            <th>班级最高分</th>
            <th>特控线</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in simulatedScores.filter(item => item.show)"  :key="index" >
            <td>{{ item.subject }} <span v-if="item.subject !== '总分'" class="edit-icon" @click="startEdit(index)">✏️</span></td>
            <td>
              <template v-if="editingIndex === index">
                <input 
                  type="number" 
                  v-model.number="editingScore" 
                  @blur="finishEdit(index)"
                  @keyup.enter="finishEdit(index)"
                  class="score-input"
                />
              </template>
              <template v-else>
                {{ item.score }}
              </template>
            </td>
            <td>{{ item.classRank }}</td>
            <td>{{ item.gradeRank }}</td>
            <td>{{ item.classHighest }}</td>
            <td>{{ item.firstLine }}</td>
          </tr>
        </tbody>
      </table>
      <a-space>
        <a-button @click="submit" type="primary">模拟</a-button>
        <a-button @click="resetScores" type="primary" danger >复位</a-button>
      </a-space>
      
    </div>
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <a-spin size="large" />
        <p style="margin-top: 16px; color: white;">正在模拟成绩，请稍等...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPassLine, postSimulateGrade } from '@/servers/api/analysis';
import { Button as AButton, message, Spin } from 'ant-design-vue';
import { getExamApi } from '@/servers/api/exam';
import { getGradeApi } from '@/servers/api/grade';
import { getTotalScore, getTotalClassRank, getTotalSchoolRank, getSubjectScore, getSubjectClassRank, getSubjectSchoolRank } from '@/utils/subjects';
import { useUserStore } from '@/store/modules/user';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

interface ScoreItem {
  subject: string;
  score: number;
  label:string;
  show: boolean;
  classRank: number;
  gradeRank: number;
  classHighest?: number;
  firstLine?: number;
}
const loading = ref(false)
const userStore = useUserStore();
const userInfo = ref()
const router = useRouter();
const pass_line = ref();
//锁定学生班级
const student = localStorage.getItem('user');
const studentClassId = JSON.parse(student?? '{}').student.class_id;
//锁定学生学号
const studentId = JSON.parse(student?? '{}').student.uid;

const selectedSemester = ref<number>(0);

const selectedExam = ref<string>('');//选中的考试
const examOptions = ref<{value:number,label:string,list:{value:string,label:string}[]}[]>();//考试下拉框

const showTable = ref<boolean>(false);
const editingIndex = ref<number>(-1);
const editingScore = ref<number>(0);

// 原始成绩数据
const originalScores = ref<ScoreItem[]>([]);


// 模拟成绩数据（深拷贝原始数据）
const simulatedScores = ref<ScoreItem[]>(JSON.parse(JSON.stringify(originalScores.value)));
onMounted(async () => {
  await fetchExamOption();
  userInfo.value = userStore.userInfo;
  await inquiry();
})
// 开始编辑成绩
const startEdit = (index: number): void => {
  if (simulatedScores.value[index].subject === '总分') return;
  editingIndex.value = index;
  editingScore.value = simulatedScores.value[index].score;
};


// 完成编辑成绩
const finishEdit = (index: number): void => {
  if (editingIndex.value === -1) return;
  
  // 更新成绩
  simulatedScores.value[index].score = editingScore.value;
  
  // 计算新的班次和段次（这里使用简单的线性关系模拟）
  const score = editingScore.value;
  const classHighest = simulatedScores.value[index].classHighest;
  const firstLine = simulatedScores.value[index].firstLine;
  
  // 计算新的班次（假设是线性关系）
  if(classHighest && firstLine) {
    simulatedScores.value[index].classRank = Math.round(
      (classHighest - score) / (classHighest - firstLine) * 100
    );
    
    // 计算新的段次（假设是线性关系）
    simulatedScores.value[index].gradeRank = Math.round(
      (classHighest - score) / (classHighest - firstLine) * 500
    );
  }
  
  // 更新总分
  updateTotalScore();
  
  editingIndex.value = -1;
};

// 更新总分
const updateTotalScore = (): void => {
  const totalScore = simulatedScores.value
    .filter((item: ScoreItem) => item.subject !== '总分')
    .reduce((sum: number, item: ScoreItem) => sum + item.score, 0);
  
  simulatedScores.value[0].score = totalScore;
  
  // 更新总分的班次和段次
  const classHighest = simulatedScores.value[0].classHighest;
  const firstLine = simulatedScores.value[0].firstLine;
  
  if(classHighest && firstLine) {
    simulatedScores.value[0].classRank = Math.round(
    (classHighest - totalScore) / (classHighest - firstLine) * 100
  );
  
  simulatedScores.value[0].gradeRank = Math.round(
    (classHighest - totalScore) / (classHighest - firstLine) * 500
  );
  }
  
};

// 复位功能
const resetScores = (): void => {
  simulatedScores.value = JSON.parse(JSON.stringify(originalScores.value));
};


const goBack = (): void => {
  router.push('/analysis');
};

//定义考试下拉框的选项
const fetchExamOption = async () => {
  const res = await getExamApi({});
  console.log(res);
  examOptions.value = []
  const terms:{[key:string]:{label:string,value:string}[]} = {}

  for(let item of res.data) {
    terms[item.year] = []
  }
  let i = 0
  for(let item in terms) {
    examOptions.value.push({
      label: item,
      value: i,
      list: []
    })
    i++
  }
  for(let item of res.data) {
    for(let i in examOptions.value) {
      if(examOptions.value[i].label === item.year) {
        examOptions.value[i].list.push({
          label: item.name,
          value: item.id
        })
      }
    }
  }
  console.log(examOptions.value);
  if(res.data.length > 0){
    selectedExam.value = res.data[0].id;
  }
}
//定义查询功能score: 429.0, classRank: 72, gradeRank: 428, classHighest: 593, firstLine: 500 },
const inquiry = async() => {
    originalScores.value = []
    await getGradeApi({student_id:studentId,exam_id:Number(selectedExam.value),class_id:studentClassId}).then((res:{code:number,data:any}) => {
      originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'总分',label:'总分',score:getTotalScore(res.data[0]),classRank:getTotalClassRank(res.data[0]),gradeRank:getTotalSchoolRank(res.data[0]) })
      originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'语文',label:'语文',score:getSubjectScore(res.data[0],'语文'),classRank:getSubjectClassRank(res.data[0],'语文'),gradeRank:getSubjectSchoolRank(res.data[0],'语文') })
      originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'数学',label:'数学',score:getSubjectScore(res.data[0],'数学'),classRank:getSubjectClassRank(res.data[0],'数学'),gradeRank:getSubjectSchoolRank(res.data[0],'数学') })
      originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'英语',label:'英语',score:getSubjectScore(res.data[0],'英语'),classRank:getSubjectClassRank(res.data[0],'英语'),gradeRank:getSubjectSchoolRank(res.data[0],'英语') })
      const selected_subject = userInfo.value.student.subject_selection
      if(selected_subject.indexOf('物') === -1) {
        originalScores.value.push({classHighest:res.data[0].topScore,show:false,subject:'物理',label:'物理',score:getSubjectScore(res.data[0],'物理'),classRank:getSubjectClassRank(res.data[0],'物理'),gradeRank:getSubjectSchoolRank(res.data[0],'物理') })
      }else {
        originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'物理',label:'物理',score:getSubjectScore(res.data[0],'物理'),classRank:getSubjectClassRank(res.data[0],'物理'),gradeRank:getSubjectSchoolRank(res.data[0],'物理') })
      }

      if(selected_subject.indexOf('化') === -1) {
        originalScores.value.push({classHighest:res.data[0].topScore,show:false,subject:'化学',label:'化学',score:getSubjectScore(res.data[0],'化学'),classRank:getSubjectClassRank(res.data[0],'化学'),gradeRank:getSubjectSchoolRank(res.data[0],'化学') })
      }else{
        originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'化学',label:'化学',score:getSubjectScore(res.data[0],'化学'),classRank:getSubjectClassRank(res.data[0],'化学'),gradeRank:getSubjectSchoolRank(res.data[0],'化学') })
      }

      if(selected_subject.indexOf('生') === -1) {
        originalScores.value.push({classHighest:res.data[0].topScore,show:false,subject:'生物',label:'生物',score:getSubjectScore(res.data[0],'生物'),classRank:getSubjectClassRank(res.data[0],'生物'),gradeRank:getSubjectSchoolRank(res.data[0],'生物') })
      }else{
        originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'生物',label:'生物',score:getSubjectScore(res.data[0],'生物'),classRank:getSubjectClassRank(res.data[0],'生物'),gradeRank:getSubjectSchoolRank(res.data[0],'生物') })
      }


      if(selected_subject.indexOf('政') === -1) {
        originalScores.value.push({classHighest:res.data[0].topScore,show:false,subject:'政治',label:'政治',score:getSubjectScore(res.data[0],'政治'),classRank:getSubjectClassRank(res.data[0],'政治'),gradeRank:getSubjectSchoolRank(res.data[0],'政治') })
      }else{
        originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'政治',label:'政治',score:getSubjectScore(res.data[0],'政治'),classRank:getSubjectClassRank(res.data[0],'政治'),gradeRank:getSubjectSchoolRank(res.data[0],'政治') })
      }

      if(selected_subject.indexOf('史') === -1) {
        originalScores.value.push({classHighest:res.data[0].topScore,show:false,subject:'历史',label:'历史',score:getSubjectScore(res.data[0],'历史'),classRank:getSubjectClassRank(res.data[0],'历史'),gradeRank:getSubjectSchoolRank(res.data[0],'历史') })
      }else{
        originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'历史',label:'历史',score:getSubjectScore(res.data[0],'历史'),classRank:getSubjectClassRank(res.data[0],'历史'),gradeRank:getSubjectSchoolRank(res.data[0],'历史') })
      }

      if(selected_subject.indexOf('地') === -1) {
        originalScores.value.push({classHighest:res.data[0].topScore,show:false,subject:'地理',label:'地理',score:getSubjectScore(res.data[0],'地理'),classRank:getSubjectClassRank(res.data[0],'地理'),gradeRank:getSubjectSchoolRank(res.data[0],'地理') })
      }else{
        originalScores.value.push({classHighest:res.data[0].topScore,show:true,subject:'地理',label:'地理',score:getSubjectScore(res.data[0],'地理'),classRank:getSubjectClassRank(res.data[0],'地理'),gradeRank:getSubjectSchoolRank(res.data[0],'地理') })
      }
      showTable.value = true;
    })
    
    getPassLine({exam_id:Number(selectedExam.value), size: 100}).then(async (res) => {
      // 行式数据按 line_group_id 分组聚合
      const grouped = new Map<number, Record<string, number>>();
      (res.data || []).forEach((row: any) => {
        const gid = row?.line_group_id;
        if (gid == null) return;
        if (!grouped.has(gid)) grouped.set(gid, {});
        if (row.subject != null && row.score != null) {
          grouped.get(gid)![row.subject] = row.score;
        }
      });
      const groups = Array.from(grouped.values());

      if(groups.length > 1) {
        if(userInfo.value.student.subject_selection.indexOf('物') !== -1) {
          // 按 line_name 分组匹配含"物"的组，需保留每组对应的 line_name
          const named = new Map<number, { name: string; dict: Record<string, number> }>();
          (res.data || []).forEach((row: any) => {
            const gid = row?.line_group_id;
            if (gid == null) return;
            if (!named.has(gid)) named.set(gid, { name: row.line_name || '', dict: {} });
            if (row.subject != null && row.score != null) {
              named.get(gid)!.dict[row.subject] = row.score;
            }
          });
          for (const [gid, val] of named) {
            if (val.name.indexOf('物') !== -1) {
              pass_line.value = val.dict;
              break;
            }
          }
        } else if(userInfo.value.student.subject_selection.indexOf('史') !== -1){
          const named = new Map<number, { name: string; dict: Record<string, number> }>();
          (res.data || []).forEach((row: any) => {
            const gid = row?.line_group_id;
            if (gid == null) return;
            if (!named.has(gid)) named.set(gid, { name: row.line_name || '', dict: {} });
            if (row.subject != null && row.score != null) {
              named.get(gid)!.dict[row.subject] = row.score;
            }
          });
          for (const [gid, val] of named) {
            if (val.name.indexOf('史') !== -1) {
              pass_line.value = val.dict;
              break;
            }
          }
        }
      }
      // 未匹配到时取第一个组
      if (!pass_line.value || Object.keys(pass_line.value).length === 0) {
        pass_line.value = groups[0] || {};
      }
      for(let item in originalScores.value) {
        originalScores.value[item].firstLine = pass_line.value[originalScores.value[item].label]
      }

      resetScores();
      await submit();
      for(let item in simulatedScores.value) {
        originalScores.value[item].classHighest = simulatedScores.value[item].classHighest
      }
    })
};
// 提交
const submit = async () => {
  loading.value = true;
  try {
    const res = await postSimulateGrade({
      exam_id: Number(selectedExam.value),
      class_id: studentClassId,
      school_id: userInfo.value.student.school,
      语文: simulatedScores.value[1].score,
      /** 英语 */
      英语: simulatedScores.value[3].score,
      /** 物理 */
      物理: simulatedScores.value[4].score,
      /** 数学 */
      数学: simulatedScores.value[2].score,
      /** 生物 */
      生物: simulatedScores.value[6].score,
      /** 历史 */
      历史: simulatedScores.value[8].score,
      /** 地理 */
      地理: simulatedScores.value[9].score,
      /** 政治 */
      政治: simulatedScores.value[7].score,
      /** 化学 */
      化学: simulatedScores.value[5].score,
      /** 总分 */
      总分: simulatedScores.value[0].score,
    });
    // 更新数据
    for(let item in simulatedScores.value) {
      if(simulatedScores.value[item].show) {
        simulatedScores.value[item].classRank = res.data[simulatedScores.value[item].label].class_rank;
        simulatedScores.value[item].gradeRank = res.data[simulatedScores.value[item].label].school_rank;
        simulatedScores.value[item].classHighest = res.data[simulatedScores.value[item].label].top_score;
      }
      
    }
    message.success('模拟考试成绩获取成功');
  } catch (error) {
    message.error('模拟考试成绩获取失败'+error);
  }finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
}
.grade-simulation-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
  overflow-x: auto;

}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  background-color: #ccc;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 20px;
}

.back-button:hover {
  background-color: #ccc;
}

h2 {
  color: #333;
  margin: 0;
  flex-grow: 1;
  text-align: center;
}
.filter {
  min-width: 300px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: auto;
  
}
.filter-section {
  display: flex;
  gap: 10px;
  width: 100%;
  flex-wrap:wrap;
}

.filter-item {
  display: flex;
  flex: auto;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  font-weight: bold;
  color: #555;
  width: 60px; /* Adjust as needed */
  text-align: right;
}

.description {
  grid-column: 1 / -1; /* Span across all columns */
  font-size: 0.9em;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
}

.red-text {
  color: red;
}

.input-select {
  flex-grow: 1;
  padding: 8px;

  text-align: center; /* 居中处理 */
}

.query-button {
  grid-column: 1 / -1; /* Span across all columns */
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.query-button:hover {
  background-color: #0056b3;
}

.score-table-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow-x: auto;
  width: 100%;
}

.table-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.score-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.score-table th, .score-table td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
}

.score-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
  text-align: center; /* 确保表头居中 */
}

.edit-icon {
  cursor: pointer;
  margin-left: 5px;
  font-size: 0.9em;
  color: #007bff;
  user-select: none;
}

.edit-icon:hover {
  color: #0056b3;
}

.score-input {
  width: 60px;
  padding: 4px;
  border: 1px solid #007bff;
  border-radius: 4px;
  text-align: center;
}

.reset-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.reset-button:hover {
  background-color: #c82333;
}
</style> 
