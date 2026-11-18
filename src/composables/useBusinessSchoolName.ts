import { ref, watch } from 'vue';
import { getSchoolDetailApi } from '@/servers/api/school';

export function useBusinessSchoolName(getId: () => unknown) {
  const name = ref('');
  watch(() => String(getId() ?? '').trim(), async (id, _, onCleanup) => {
    name.value = '';
    if (!id) return;
    let active = true;
    onCleanup(() => { active = false; });
    try {
      const response = await getSchoolDetailApi({ school_id: id });
      const rows: (API.School | undefined)[] = Array.isArray(response.data) ? response.data : [response.data];
      const row = rows.find((item) => String(item?.school_id ?? '') === id);
      if (active && response.code === 200) name.value = row?.name || '';
    } catch {
      if (active) name.value = '';
    }
  }, { immediate: true });
  return name;
}
