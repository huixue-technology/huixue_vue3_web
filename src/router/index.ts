import { createRouter, createWebHashHistory } from "vue-router";
import { loadSchoolConfig, routeAllowed } from "@/utils/school";
import { useUserStore } from "@/store/modules/user";
import { getCurrentUser } from "@/servers/api/user";
import common from "./common";
import modules from "./modules";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...common,
    ...modules,
    {
      path: "/:catchAll(.*)",
      redirect: "/404",
    },
  ],
});

const whiteList = [
  "/user/login",
  "/user/admin-login",
  "/user/register",
  "/user/teacher-register",
  "/404",
];
const teacherOnlyRoutes = ["/teacher_info", "/student_analysis", "/student_compare", "/wrong_question"];
const studentOnlyRoutes = ["/student_wrong_question"];

router.beforeEach(async (to, _from, next) => {
  if (whiteList.includes(to.path)) {
    next();
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    next("/user/login");
    return;
  }

  try {
    const store = useUserStore();
    let user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.token !== token) {
      const response = await getCurrentUser({ headers: { Authorization: `Bearer ${token}` } });
      if (response?.code !== 200 || !response.data || localStorage.getItem("token") !== token) {
        next("/user/login");
        return;
      }
      user = { ...response.data, token };
      store.setUserInfo(user);
      await loadSchoolConfig(token);
    } else if (store.userInfo.token !== token) {
      store.setUserInfo(user);
    }
    const isTeacher = user.role_type === "teacher";

    // 身份选择页：管理员本人，或已保留管理员凭证的代进入会话，才能回到这里。
    if (to.path === "/admin/entry") {
      const hasAdminIdentity =
        user.role_type === "admin" || Boolean(localStorage.getItem("admin_token"));
      if (!hasAdminIdentity) {
        next(isTeacher ? "/class_grade" : "/grade");
        return;
      }
    }

    if (to.path.startsWith("/class_") || teacherOnlyRoutes.includes(to.path)) {
      if (!isTeacher) {
        next("/grade");
        return;
      }
    }

    if (studentOnlyRoutes.includes(to.path) && isTeacher) {
      next("/wrong_question");
      return;
    }

    // 多校：学校未启用的模块路由不可直接进入（个人中心等常驻路由不在闸门内）
    if (!routeAllowed(to.path)) {
      next("/user/my-info");
      return;
    }

    next();
  } catch (_error) {
    next("/user/login");
  }
});

router.afterEach((to) => {
  if (typeof (window as any)._hmt !== "undefined") {
    (window as any)._hmt.push(["_trackPageview", to.fullPath]);
  }
});

export default router;
