export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T>;
export function withTimeout<T>(promise: Promise<T>, fallbackValue: T): Promise<T>;
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMsOrFallback: number | T,
  fallbackValue?: T
): Promise<T> {
  const timeoutMs = typeof timeoutMsOrFallback === "number" ? timeoutMsOrFallback : 2000;
  const fallback =
    typeof timeoutMsOrFallback === "number" ? fallbackValue : timeoutMsOrFallback;

  if (fallback === undefined) {
    throw new Error("withTimeout requires a fallback value");
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const FETCH_TIMEOUT_STATUS = 408;

function syntheticTimeoutResponse(timeoutMs: number): Response {
  return new Response(JSON.stringify({ error: "timeout", timeoutMs }), {
    status: FETCH_TIMEOUT_STATUS,
    headers: { "Content-Type": "application/json" },
  });
}

/** Client fetch with timeout — resolves with HTTP 408 on timeout (no throw; dev-overlay safe). */
export async function fetchWithTimeout(
  url: string | URL | Request,
  options: RequestInit = {},
  timeoutMs = 2000
): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetch(url, options),
      new Promise<Response>((resolve) => {
        timer = setTimeout(() => resolve(syntheticTimeoutResponse(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
