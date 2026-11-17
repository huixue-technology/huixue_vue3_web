// 多校模式：学校目录、学校模块配置与路由/菜单的模块闸门。
// 单校部署下 /api/platform/schools 返回 [{code:"default"}]，请求不附加 school。

export interface PlatformSchool {
  code: string;
  name: string;
}

export interface SchoolConfig {
  code?: string;
  name?: string;
  modules: string[];
}

export const SELECTED_SCHOOL_KEY = "huixue_school";
export const SCHOOL_MODULES_KEY = "huixue_school_modules";
export const DEFAULT_SCHOOL: PlatformSchool = { code: "default", name: "默认学校" };

// 路由/菜单 key → 学校模块 id；未列出的视为常驻（个人中心、反馈等）
const MENU_MODULE_MAP: Record<string, string> = {
  grade: "grade",
  class_grade: "grade",
  class_analysis: "grade",
  class_compare: "grade",
  student: "analysis",
  student_analysis: "analysis",
  student_compare: "analysis",
  compare: "analysis",
  simulate: "simulate",
  wrong_question: "wrong_question",
  student_wrong_question: "wrong_question",
  paper_view: "paper_view",
  student_paper_view: "paper_view",
  gaokao_question_bank: "gaokao_question_bank",
  feedback: "feedback",
};

export function getSelectedSchool(): string {
  return localStorage.getItem(SELECTED_SCHOOL_KEY) || "";
}

export function setSelectedSchool(code: string): void {
  if (code) localStorage.setItem(SELECTED_SCHOOL_KEY, code);
  else localStorage.removeItem(SELECTED_SCHOOL_KEY);
}

export function getSchoolModules(): string[] | null {
  const raw = localStorage.getItem(SCHOOL_MODULES_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map((item) => String(item)) : null;
  } catch {
    return null;
  }
}

function setSchoolModules(modules: string[] | undefined): void {
  if (!modules) {
    localStorage.removeItem(SCHOOL_MODULES_KEY);
    return;
  }
  localStorage.setItem(SCHOOL_MODULES_KEY, JSON.stringify(modules));
}

/** 菜单项 key 是否被学校模块允许（含 "*" 或未配置时全放行）。 */
export function menuAllowed(key: string): boolean {
  const moduleId = MENU_MODULE_MAP[key];
  if (!moduleId) return true;
  const modules = getSchoolModules();
  if (!modules || modules.includes("*")) return true;
  return modules.includes(moduleId);
}

/** 路由路径是否被学校模块允许。 */
export function routeAllowed(path: string): boolean {
  const key = path.replace(/^\//, "").split("/")[0];
  return menuAllowed(key);
}

export async function listPlatformSchools(): Promise<PlatformSchool[]> {
  try {
    const response = await fetch("/api/platform/schools", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    const list = Array.isArray(payload?.data) ? payload.data : [];
    const schools = list
      .map((item: any) => ({ code: String(item?.code || ""), name: String(item?.name || "") }))
      .filter((item: PlatformSchool) => item.code && item.name);
    return schools.length ? schools : [DEFAULT_SCHOOL];
  } catch {
    return [DEFAULT_SCHOOL];
  }
}

/** 拉取当前学校的模块配置并落到 localStorage；失败时不清旧值。 */
export async function loadSchoolConfig(token?: string): Promise<SchoolConfig | undefined> {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await fetch("/api/school/config", {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (payload?.code === 200 && payload.data) {
      const modules = Array.isArray(payload.data.modules) ? payload.data.modules : [];
      setSchoolModules(modules);
      return { code: payload.data.code, name: payload.data.name, modules };
    }
  } catch {
    // 配置接口失败时不做收口（全放行），避免把用户挡在门外
  }
  return undefined;
}

/** 单校部署不带 school；多校且非 default 才附带。 */
export function schoolParamForRequest(schools: PlatformSchool[], selected: string): string {
  if (!selected || selected === DEFAULT_SCHOOL.code) return "";
  if (schools.length <= 1 && schools[0]?.code === DEFAULT_SCHOOL.code) return "";
  return selected;
}
