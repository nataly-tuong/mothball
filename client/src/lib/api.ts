export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

const NETWORK_ERROR = "Can't reach the server. Please try again.";
const WAKE_TIMEOUT_MS = 90_000;
const WAKE_DELAYS_MS = [1500, 2500, 4000, 5000];

let waking = false;
const wakeListeners = new Set<() => void>();

function setWaking(value: boolean) {
  if (waking === value) return;
  waking = value;
  for (const listener of wakeListeners) listener();
}

export function isWaking() {
  return waking;
}

export function subscribeWaking(listener: () => void) {
  wakeListeners.add(listener);
  return () => {
    wakeListeners.delete(listener);
  };
}

function isWakeResponse(res: Response, method: string) {
  const type = res.headers.get("content-type") ?? "";
  if (res.status === 503 && type.includes("text/html")) return true;
  return (
    method === "GET" &&
    (res.status === 502 || res.status === 504) &&
    !type.includes("application/json")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const started = Date.now();
  let attempt = 0;

  try {
    for (;;) {
      const res = await fetch(input, { credentials: "include", ...init });

      if (!isWakeResponse(res, method)) return res;
      if (Date.now() - started > WAKE_TIMEOUT_MS) return res;

      setWaking(true);
      await sleep(WAKE_DELAYS_MS[Math.min(attempt, WAKE_DELAYS_MS.length - 1)]);
      attempt++;
    }
  } finally {
    if (attempt > 0) setWaking(false);
  }
}

export async function api<T = null>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body } = options;

  try {
    const res = await apiFetch(path, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message:
          data?.message ??
          (res.status >= 500
            ? "The server is having trouble. Please try again in a minute."
            : "Something went wrong. Please try again."),
      };
    }

    return { ok: true, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR };
  }
}
