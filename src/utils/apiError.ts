type ApiError = { data?: unknown; msg?: string; message?: string; errors?: Record<string, unknown> };

export function apiErrorMessage(value: ApiError | null | undefined, fallback = "请求失败"): string {
  if (typeof value?.data === "string" && value.data.trim()) return value.data;
  if (value?.errors) {
    const details = Object.values(value.errors).join("；");
    if (details) return details;
  }
  return value?.msg || value?.message || fallback;
}
