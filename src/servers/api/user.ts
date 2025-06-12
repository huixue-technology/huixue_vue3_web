// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取用户列表，支持分页和条件过滤 GET /api/user/ */
export async function getUserApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 用户注册 POST /api/user/ */
export async function postUserApi(
  body: API.User,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定用户详情 GET /api/user/${param0} */
export async function getUserDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserDetailApiParams,
  options?: { [key: string]: any }
) {
  const { user_id: param0, ...queryParams } = params;
  return request<any>(`/api/user/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定用户信息 PUT /api/user/${param0} */
export async function putUserDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putUserDetailApiParams,
  body: API.User,
  options?: { [key: string]: any }
) {
  const { user_id: param0, ...queryParams } = params;
  return request<any>(`/api/user/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除指定用户 DELETE /api/user/${param0} */
export async function deleteUserDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteUserDetailApiParams,
  options?: { [key: string]: any }
) {
  const { user_id: param0, ...queryParams } = params;
  return request<any>(`/api/user/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新用户绑定状态 PUT /api/user/bind_status */
export async function putUserBindStatus(
  body: API.BindStatus,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/bind_status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前用户信息 GET /api/user/current */
export async function getCurrentUser(options?: { [key: string]: any }) {
  return request<any>("/api/user/current", {
    method: "GET",
    ...(options || {}),
  });
}

/** 用户登录 POST /api/user/login */
export async function postUserLogin(
  body: API.Login,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 用户登出 POST /api/user/logout */
export async function postUserLogout(options?: { [key: string]: any }) {
  return request<any>("/api/user/logout", {
    method: "POST",
    ...(options || {}),
  });
}
