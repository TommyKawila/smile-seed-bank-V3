import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { rateLimitIp } from "@/lib/rate-limit-ip";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

type LimitDef = { prefix: string; limit: number; windowSec: number };

const GROWER_LIMITS = {
  burst: { prefix: "gt:burst", limit: 12, windowSec: 60 },
  daily: { prefix: "gt:daily", limit: 40, windowSec: 86_400 },
  visionDaily: { prefix: "gt:vision", limit: 8, windowSec: 86_400 },
} as const;

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

function getLimiter(def: LimitDef): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const key = `${def.prefix}:${def.limit}:${def.windowSec}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(def.limit, `${def.windowSec} s`),
      prefix: def.prefix,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

async function checkUpstash(
  def: LimitDef,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(def);
  if (!limiter) {
    const mem = rateLimitIp(
      `${def.prefix}:${identifier}`,
      def.limit,
      def.windowSec * 1000
    );
    return mem.ok ? { ok: true } : { ok: false, retryAfterSec: mem.retryAfterSec };
  }
  const res = await limiter.limit(identifier);
  if (res.success) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
  return { ok: false, retryAfterSec };
}

/** Burst + daily IP limits for grower-tools API. */
export async function rateLimitGrowerTools(
  ipHash: string,
  action: string
): Promise<RateLimitResult> {
  const burst = await checkUpstash(GROWER_LIMITS.burst, ipHash);
  if (!burst.ok) return burst;

  const daily = await checkUpstash(GROWER_LIMITS.daily, ipHash);
  if (!daily.ok) return daily;

  if (action === "plant-doctor") {
    const vision = await checkUpstash(GROWER_LIMITS.visionDaily, ipHash);
    if (!vision.ok) return vision;
  }

  return { ok: true };
}
