import { createRouter, createWebHashHistory } from "vue-router";
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

const whiteList = ["/user/login", "/user/register", "/user/teacher-register", "/404"];
const teacherOnlyRoutes = ["/teacher_info", "/student_analysis", "/student_compare", "/wrong_question"];
const studentOnlyRoutes = ["/student_wrong_question"];

router.beforeEach((to, _from, next) => {
  if (whiteList.includes(to.path)) {
    next();
    return;
  }

  const userStr = localStorage.getItem("user");
  if (!userStr) {
    next("/user/login");
    return;
  }

  try {
    const user = JSON.parse(userStr);
    const isTeacher = user.teacher !== undefined;

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
