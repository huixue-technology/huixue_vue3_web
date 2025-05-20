// @ts-ignore
/* eslint-disable */
import { request } from "umi";

/** 用户绑定身份 POST /api/user/bind_status */
export async function postBindStatus(
  body: API.bindStatus,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/bind_status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前用户信息 POST /api/user/get_current_user */
export async function postGetCurrentUser(options?: { [key: string]: any }) {
  return request<any>("/api/user/get_current_user", {
    method: "POST",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/login */
export async function postLogin(
  body: API.login,
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

/** 用户登出 GET /api/user/out_login */
export async function getOutLogin(options?: { [key: string]: any }) {
  return request<any>("/api/user/out_login", {
    method: "GET",
    ...(options || {}),
  });
}

/** 查询用户(支持过滤条件) GET /api/user/user */
export async function getUser(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/user", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 修改用户 PUT /api/user/user */
export async function putUser(
  body: API.modify,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 用户注册 POST /api/user/user */
export async function postUser(
  body: API.register,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户 DELETE /api/user/user */
export async function deleteUser(
  body: API.del,
  options?: { [key: string]: any }
) {
  return request<any>("/api/user/user", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
