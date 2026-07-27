import "server-only";

import { prisma } from "@/lib/prisma";
import { estimateOpenAiCostUsd } from "@/lib/openai-pricing";
import type { GrowerToolAiAction } from "@/lib/grower-tools-settings";

export type GrowerToolUsageStatus =
  | "ok"
  | "error"
  | "rate_limited"
  | "budget_blocked"
  | "ai_disabled";

export type GrowerToolUsageLogInput = {
  action: GrowerToolAiAction | string;
  model?: string;
  status: GrowerToolUsageStatus;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  ipHash: string;
};

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Fire-and-forget — never throw to caller. */
export function logGrowerToolUsage(input: GrowerToolUsageLogInput): void {
  const logs = prisma.grower_tool_usage_logs;
  if (!logs) return;

  const promptTokens = input.promptTokens ?? 0;
  const completionTokens = input.completionTokens ?? 0;
  const model = input.model ?? "";
  const cost =
    input.status === "ok" && model
      ? estimateOpenAiCostUsd(model, promptTokens, completionTokens)
      : 0;

  void logs
    .create({
      data: {
        action: input.action,
        model,
        status: input.status,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        estimated_cost_usd: cost,
        latency_ms: input.latencyMs ?? 0,
        ip_hash: input.ipHash,
      },
    })
    .catch(() => {
      /* non-critical */
    });
}

export async function getSpendSince(since: Date): Promise<number> {
  const logs = prisma.grower_tool_usage_logs;
  if (!logs) return 0;
  try {
    const agg = await logs.aggregate({
    where: {
      created_at: { gte: since },
      status: "ok",
    },
    _sum: { estimated_cost_usd: true },
    });
    return Number(agg._sum.estimated_cost_usd ?? 0);
  } catch {
    return 0;
  }
}

export async function getDailySpend(): Promise<number> {
  return getSpendSince(startOfDay());
}

export async function getMonthlySpend(): Promise<number> {
  return getSpendSince(startOfMonth());
}

export type GrowerToolsUsageOverview = {
  range: { start: string; end: string; preset: string };
  totals: {
    calls: number;
    okCalls: number;
    errors: number;
    rateLimited: number;
    budgetBlocked: number;
    tokens: number;
    estimatedUsd: number;
  };
  byAction: { action: string; calls: number; tokens: number; usd: number }[];
  byDay: { date: string; calls: number; usd: number }[];
  recent: {
    id: string;
    action: string;
    model: string;
    status: string;
    tokens: number;
    usd: number;
    latencyMs: number;
    createdAt: string;
  }[];
};

function rangeBounds(preset: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (preset === "7") start.setDate(start.getDate() - 6);
  else if (preset === "month") start.setDate(1);
  else start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function emptyOverview(preset: string): GrowerToolsUsageOverview {
  const p = preset === "7" || preset === "month" ? preset : "30";
  const { start, end } = rangeBounds(p);
  return {
    range: { start: start.toISOString(), end: end.toISOString(), preset: p },
    totals: {
      calls: 0,
      okCalls: 0,
      errors: 0,
      rateLimited: 0,
      budgetBlocked: 0,
      tokens: 0,
      estimatedUsd: 0,
    },
    byAction: [],
    byDay: [],
    recent: [],
  };
}

export async function getGrowerToolsUsageOverview(
  preset: string
): Promise<GrowerToolsUsageOverview> {
  const p = preset === "7" || preset === "month" ? preset : "30";
  const { start, end } = rangeBounds(p);
  const logs = prisma.grower_tool_usage_logs;
  if (!logs) return emptyOverview(p);

  let rows: Awaited<ReturnType<typeof logs.findMany>>;
  try {
    rows = await logs.findMany({
      where: { created_at: { gte: start, lte: end } },
      orderBy: { created_at: "desc" },
      take: 5000,
    });
  } catch (err) {
    console.error("[grower-tools-usage] findMany failed:", err);
    return emptyOverview(p);
  }

  const totals = {
    calls: rows.length,
    okCalls: 0,
    errors: 0,
    rateLimited: 0,
    budgetBlocked: 0,
    tokens: 0,
    estimatedUsd: 0,
  };
  const actionMap = new Map<string, { calls: number; tokens: number; usd: number }>();
  const dayMap = new Map<string, { calls: number; usd: number }>();

  for (const row of rows) {
    const usd = Number(row.estimated_cost_usd);
    totals.tokens += row.total_tokens;
    totals.estimatedUsd += usd;
    if (row.status === "ok") totals.okCalls += 1;
    else if (row.status === "error") totals.errors += 1;
    else if (row.status === "rate_limited") totals.rateLimited += 1;
    else if (row.status === "budget_blocked") totals.budgetBlocked += 1;

    const a = actionMap.get(row.action) ?? { calls: 0, tokens: 0, usd: 0 };
    a.calls += 1;
    a.tokens += row.total_tokens;
    a.usd += usd;
    actionMap.set(row.action, a);

    const day = row.created_at.toISOString().slice(0, 10);
    const d = dayMap.get(day) ?? { calls: 0, usd: 0 };
    d.calls += 1;
    d.usd += usd;
    dayMap.set(day, d);
  }

  totals.estimatedUsd = Math.round(totals.estimatedUsd * 1_000_000) / 1_000_000;

  const byAction = [...actionMap.entries()]
    .map(([action, v]) => ({ action, ...v }))
    .sort((a, b) => b.calls - a.calls);

  const byDay = [...dayMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recent = rows.slice(0, 25).map((row) => ({
    id: String(row.id),
    action: row.action,
    model: row.model,
    status: row.status,
    tokens: row.total_tokens,
    usd: Number(row.estimated_cost_usd),
    latencyMs: row.latency_ms,
    createdAt: row.created_at.toISOString(),
  }));

  return {
    range: { start: start.toISOString(), end: end.toISOString(), preset: p },
    totals,
    byAction,
    byDay,
    recent,
  };
}
