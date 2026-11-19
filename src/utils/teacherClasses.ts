import { getVisibleClassesApi } from '@/servers/api/classes';
import type { UserInfo } from '@/store/modules/user';

function storageKey(user: UserInfo) {
  return `huixue_teacher_class:${JSON.stringify([user.school_id, user.role, user.id])}`;
}

export function rememberTeacherClass(user: UserInfo, classId?: number | string) {
  if (classId && user.role) localStorage.setItem(storageKey(user), String(classId));
}

type TeacherClass = { id: number | string; is_bound?: boolean };

export function preferredTeacherClass<T extends TeacherClass>(user: UserInfo, classes: T[]) {
  const saved = localStorage.getItem(storageKey(user));
  const bound = classes.filter((item) => item.is_bound);
  const choices = bound.length ? bound : classes;
  return choices.find((item) => String(item.id) === saved) ?? choices[0];
}

export async function loadTeacherClasses<T extends TeacherClass>(): Promise<(T & TeacherClass)[]> {
  const response = await getVisibleClassesApi();
  if (response.code !== 200) throw new Error(response.msg || '获取班级列表失败');
  return Array.isArray(response.data) ? response.data : [];
}
