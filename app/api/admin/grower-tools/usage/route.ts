import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-utils";
import { getGrowerToolsUsageOverview } from "@/services/grower-tools-usage-service";
import { checkGrowerToolsBudget } from "@/services/grower-tools-budget-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const preset = req.nextUrl.searchParams.get("range") ?? "30";
    const [overview, budget] = await Promise.all([
      getGrowerToolsUsageOverview(preset),
      checkGrowerToolsBudget(),
    ]);
    return NextResponse.json({
      ...overview,
      budget: {
        dailyUsd: budget.config.dailyUsd,
        monthlyUsd: budget.config.monthlyUsd,
        autoDisable: budget.config.autoDisable,
        trippedAt: budget.config.trippedAt,
        dailySpend: budget.dailySpend,
        monthlySpend: budget.monthlySpend,
      },
    });
  } catch (err) {
    console.error("[admin/grower-tools/usage]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load usage statistics",
      },
      { status: 500 }
    );
  }
}
