import { ref } from 'vue'
import { getSchoolApi } from '@/servers/api/school'
import { getClassesApi } from '@/servers/api/classes'
import { message } from 'ant-design-vue'

/**
 * 学校/年级/班级级联选择逻辑的可复用 composable
 * 供 Register.vue 和 TeacherRegister.vue 共用
 */
export function useSchoolSelection() {
    const schoolList = ref<any[]>([])
    const gradeList = ref<string[]>([])
    const classList = ref<any[]>([])

    /**
     * 从班级名称中提取年级信息
     * 例如: "淅川一高2302班" -> "2023级", "2401班" -> "2024级"
     */
    const extractGradeFromClassName = (className: string): string | null => {
        const match = className.match(/(\d{2})/)
        if (match) {
            const yearShort = match[1]
            return `20${yearShort}级`
        }
        return null
    }

    /**
     * 根据学校ID获取年级列表
     */
    const fetchGradesBySchool = async (schoolId: string) => {
        gradeList.value = []
        classList.value = []

        if (!schoolId) return

        try {
            const res = await getClassesApi({ school_id: schoolId })
            if (res.code === 200 && res.data && res.data.length > 0) {
                const grades = new Set<string>()
                res.data.forEach((cls: any) => {
                    const grade = extractGradeFromClassName(cls.name)
                    if (grade) {
                        grades.add(grade)
                    }
                })

                if (grades.size === 0) {
                    message.warning('该学校暂无年级信息')
                    return
                }

                // 按字典序排序（从大到小，新年级在前）
                gradeList.value = Array.from(grades).sort((a, b) => b.localeCompare(a))
                console.log('提取的年级列表:', gradeList.value)
            } else {
                message.error(res.message || '获取年级列表失败')
            }
        } catch (error) {
            console.error('获取年级列表错误:', error)
            message.error('获取年级列表失败')
        }
    }

    /**
     * 根据学校ID和年级获取班级列表
     */
    const fetchClassesByGrade = async (schoolId: string, grade: string) => {
        classList.value = []

        if (!grade || !schoolId) return

        try {
            const res = await getClassesApi({ school_id: schoolId })
            if (res.code === 200 && res.data) {
                classList.value = res.data
                    .filter((cls: any) => {
                        const g = extractGradeFromClassName(cls.name)
                        return g === grade
                    })
                    .sort((a: any, b: any) => {
                        return a.name.localeCompare(b.name, 'zh-CN')
                    })

                console.log(`年级 ${grade} 的班级列表:`, classList.value)

                if (classList.value.length === 0) {
                    message.warning(`该年级暂无班级信息`)
                }
            } else {
                message.error(res.message || '获取班级列表失败')
            }
        } catch (error) {
            console.error('获取班级列表错误:', error)
            message.error('获取班级列表失败')
        }
    }

    /**
     * 加载学校列表（用于 onMounted）
     */
    const loadSchoolData = async () => {
        try {
            const res = await getSchoolApi({})
            if (res.code === 200) {
                schoolList.value = res.data
                console.log('学校列表加载成功:', schoolList.value.length, '个学校')
            } else {
                message.error('获取学校列表失败')
            }
        } catch (error) {
            console.error('加载学校数据错误:', error)
            message.error('加载学校数据失败')
        }
    }

    return {
        schoolList,
        gradeList,
        classList,
        extractGradeFromClassName,
        fetchGradesBySchool,
        fetchClassesByGrade,
        loadSchoolData,
    }
}
