const isProd = process.env.NODE_ENV === "production";

export type LogContext = Record<string, unknown>;

export type LogErrorDetails = {
  /** Original thrown value or Error */
  cause?: unknown;
  /** Extra fields for debugging / future sinks (e.g. Sentry) */
  context?: LogContext;
};

function ts(): string {
  return new Date().toISOString();
}

function bracket(parts: string[]): string {
  return parts.map((p) => `[${p}]`).join(" ");
}

function serializeError(cause: unknown): { message: string; stack?: string } {
  if (cause instanceof Error) {
    return { message: cause.message, stack: cause.stack };
  }
  if (typeof cause === "string") return { message: cause };
  try {
    return { message: JSON.stringify(cause) };
  } catch {
    return { message: String(cause) };
  }
}

function writeLines(
  method: "log" | "info" | "warn" | "debug",
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  extra?: LogContext
): void {
  const head = `${bracket([ts(), "SmileSeed", level])} ${message}`;
  const fn = console[method];
  if (extra && Object.keys(extra).length > 0) {
    fn.call(console, head);
    fn.call(
      console,
      isProd ? JSON.stringify(extra) : JSON.stringify(extra, null, 2)
    );
  } else {
    fn.call(console, head);
  }
}

export const logger = {
  info(message: string, context?: LogContext): void {
    writeLines("info", "INFO", message, context);
  },

  warn(message: string, context?: LogContext): void {
    writeLines("warn", "WARN", message, context);
  },

  /**
   * Logs a clear message plus optional cause stack and structured context.
   * Safe to call from server routes; return a generic message to clients separately if needed.
   */
  error(message: string, details?: LogErrorDetails): void {
    const { cause, context } = details ?? {};
    const { message: causeMsg, stack } = cause !== undefined ? serializeError(cause) : { message: "" };

    const payload: LogContext = {
      ...(context ?? {}),
      ...(cause !== undefined ? { causeMessage: causeMsg } : {}),
      ...(stack ? { stack } : {}),
    };

    const head = `${bracket([ts(), "SmileSeed", "ERROR"])} ${message}`;
    console.error(head);
    if (Object.keys(payload).length > 0) {
      console.error(
        isProd ? JSON.stringify(payload) : JSON.stringify(payload, null, 2)
      );
    }
  },

  debug(message: string, context?: LogContext): void {
    if (isProd) return;
    writeLines("debug", "DEBUG", message, context);
  },
};
