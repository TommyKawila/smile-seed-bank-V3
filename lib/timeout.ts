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

export async function fetchWithTimeout(
  url: string | URL | Request,
  options: RequestInit = {},
  timeoutMs = 2000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}
