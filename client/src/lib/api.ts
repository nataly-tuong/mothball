export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

const NETWORK_ERROR = "Can't reach the server. Please try again.";

export async function api<T = null>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body } = options;

  try {
    const res = await fetch(path, {
      method,
      credentials: "include",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: data?.message ?? "Something went wrong. Please try again.",
      };
    }

    return { ok: true, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR };
  }
}
