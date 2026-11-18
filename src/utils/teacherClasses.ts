import { getClassesApi } from '@/servers/api/classes';
import type { UserInfo } from '@/store/modules/user';

function storageKey(user: UserInfo) {
  return `huixue_teacher_class:${JSON.stringify([user.school_id, user.role, user.id])}`;
}

export function rememberTeacherClass(user: UserInfo, classId?: number | string) {
  if (classId && user.role) localStorage.setItem(storageKey(user), String(classId));
}

export function preferredTeacherClass<T extends { id: number | string }>(user: UserInfo, classes: T[]) {
  const saved = localStorage.getItem(storageKey(user));
  return classes.find((item) => String(item.id) === saved) ?? classes[0];
}

export async function loadTeacherClasses<T extends { id: number | string }>(user: UserInfo): Promise<T[]> {
  const response = await getClassesApi({ school_id: user.school_id || user.teacher?.school_id });
  if (response.code !== 200) throw new Error(response.msg || '获取班级列表失败');
  return Array.isArray(response.data) ? response.data : [];
}
