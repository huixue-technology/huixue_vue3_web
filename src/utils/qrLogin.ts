export interface QrLoginUser {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
  teacher?: Record<string, unknown>;
  student?: {
    class_id?: string;
    subject_selection?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface QrCode {
  ticket: string;
  browser_secret: string;
  qr_image: string;
  expires_at: number;
}

interface Handlers {
  onReady: (code: { qr_image: string; expires_at: number }) => void;
  onSuccess: (user: QrLoginUser, signal: AbortSignal) => Promise<void>;
  onError: (message: string) => void;
}

// 浏览器 secret 只保存在本次扫码闭包内，不进入二维码、URL 或本地存储。
export function startQrLogin(
  client: "admin" | "portal",
  handlers: Handlers
): () => void {
  const controller = new AbortController();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    stopped = true;
    controller.abort();
    if (timer !== undefined) clearTimeout(timer);
  };

  const post = async <T>(
    path: string,
    data: Record<string, unknown>
  ): Promise<T> => {
    const response = await fetch("/api/auth" + path, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (
      !response.ok ||
      body?.code !== 200 ||
      !body.data ||
      typeof body.data !== "object"
    ) {
      throw new Error(
        body?.msg || "微信登录暂不可用，请稍后重试或使用账号密码登录"
      );
    }
    return body.data as T;
  };

  const fail = (error: unknown) => {
    if (stopped) return;
    stop();
    handlers.onError(
      error instanceof Error ? error.message : "微信登录暂不可用"
    );
  };

  const run = async () => {
    try {
      const code = await post<QrCode>("/qr", { client });
      if (stopped) return;
      if (
        !/^[A-Za-z0-9_-]{22,32}$/.test(code.ticket) ||
        typeof code.browser_secret !== "string" ||
        !code.browser_secret ||
        !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(
          code.qr_image
        ) ||
        !Number.isFinite(code.expires_at) ||
        code.expires_at * 1000 <= Date.now()
      ) {
        throw new Error("登录码无效，请刷新二维码");
      }
      handlers.onReady({
        qr_image: code.qr_image,
        expires_at: code.expires_at,
      });
      const poll = async () => {
        try {
          if (stopped) return;
          if (Date.now() >= code.expires_at * 1000)
            throw new Error("登录码已过期，请刷新二维码");
          const data = { browser_secret: code.browser_secret };
          const status = await post<{ status: string }>(
            `/qr/${code.ticket}/status`,
            data
          );
          if (stopped) return;
          if (status.status === "confirmed") {
            const user = await post<QrLoginUser>(
              `/qr/${code.ticket}/consume`,
              data
            );
            if (stopped) return;
            if (typeof user.token !== "string" || !user.token)
              throw new Error("登录结果异常，请重新扫码");
            await handlers.onSuccess(user, controller.signal);
            stop();
          } else if (status.status === "pending") {
            timer = setTimeout(poll, 2000);
          } else {
            throw new Error("登录请求已失效，请刷新二维码");
          }
        } catch (error) {
          fail(error);
        }
      };
      timer = setTimeout(poll, 2000);
    } catch (error) {
      fail(error);
    }
  };
  void run();
  return stop;
}
