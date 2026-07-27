"use client";

import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import {
  GROWER_TOOLS_AI_TOOL_OPTIONS,
  resolveGrowerToolsAiFlags,
} from "@/lib/grower-tools-settings";
import {
  GROWER_TOOLS_BUDGET_DEFAULTS,
  GROWER_TOOLS_BUDGET_KEYS,
  resolveGrowerToolsBudgetConfig,
} from "@/lib/grower-tools-budget-settings";
import { resetGrowerToolsBudgetTripAction } from "@/app/actions/grower-tools-budget";

export default function GrowerToolsSettingsPage() {
  const { toast } = useToast();
  const { settings, isLoading, updateSetting } = useSiteSettings();
  const flags = resolveGrowerToolsAiFlags(settings as Record<string, string>);
  const budget = resolveGrowerToolsBudgetConfig(settings as Record<string, string>);

  const flagByAction = {
    "soil-mixer": flags.soilMixer,
    fertilizer: flags.fertilizer,
    "plant-doctor": flags.plantDoctor,
  } as const;

  const toggleTool = async (settingKey: string, checked: boolean, label: string) => {
    try {
      await updateSetting(settingKey, checked ? "true" : "false");
      toast({
        title: checked ? `เปิด ${label} แล้ว` : `ปิด ${label} แล้ว`,
        description: checked
          ? "ลูกค้ากดวิเคราะห์ได้ตามปกติ"
          : "ปุ่มวิเคราะห์จะถูก disable · VPD ไม่กระทบ",
      });
    } catch (e) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    }
  };

  const saveBudget = async (key: string, value: string) => {
    try {
      await updateSetting(key, value);
      toast({ title: "บันทึกงบแล้ว" });
    } catch (e) {
      toast({ title: "บันทึกไม่สำเร็จ", description: String(e), variant: "destructive" });
    }
  };

  const onResetTrip = async () => {
    const res = await resetGrowerToolsBudgetTripAction();
    if (!res.ok) {
      toast({ title: "รีเซ็ตไม่สำเร็จ", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: "รีเซ็ต budget trip แล้ว",
      description: "เปิด AI ทั้ง 3 ตัวใหม่ — ตรวจงบที่หน้า Usage",
    });
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
          <Sparkles className="h-6 w-6 text-emerald-700" />
          ผู้ช่วย AI ปลูก
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          เปิด/ปิด AI · งบประมาณ API ·{" "}
          <Link href="/admin/grower-tools/usage" className="text-emerald-700 hover:underline">
            ดูสถิติการใช้งาน
          </Link>
        </p>
      </div>

      {budget.trippedAt ? (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              งบ API เกินเพดาน — AI ถูกปิดอัตโนมัติ (
              {new Date(budget.trippedAt).toLocaleString("th-TH")})
            </span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void onResetTrip()}>
            รีเซ็ต + เปิด AI
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">งบประมาณ API (USD)</CardTitle>
              <CardDescription>
                เกินเพดานแล้ว auto ปิด AI ทั้ง 3 ตัว (hard cut)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget-daily">รายวัน (USD)</Label>
                  <Input
                    id="budget-daily"
                    type="number"
                    min={0.1}
                    step={0.5}
                    defaultValue={
                      (settings as Record<string, string>)[GROWER_TOOLS_BUDGET_KEYS.dailyUsd] ??
                      String(GROWER_TOOLS_BUDGET_DEFAULTS.dailyUsd)
                    }
                    onBlur={(e) =>
                      void saveBudget(
                        GROWER_TOOLS_BUDGET_KEYS.dailyUsd,
                        e.target.value || String(GROWER_TOOLS_BUDGET_DEFAULTS.dailyUsd)
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-monthly">รายเดือน (USD)</Label>
                  <Input
                    id="budget-monthly"
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={
                      (settings as Record<string, string>)[GROWER_TOOLS_BUDGET_KEYS.monthlyUsd] ??
                      String(GROWER_TOOLS_BUDGET_DEFAULTS.monthlyUsd)
                    }
                    onBlur={(e) =>
                      void saveBudget(
                        GROWER_TOOLS_BUDGET_KEYS.monthlyUsd,
                        e.target.value || String(GROWER_TOOLS_BUDGET_DEFAULTS.monthlyUsd)
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div>
                  <Label htmlFor="budget-auto" className="text-sm font-medium">
                    Auto ปิด AI เมื่อเกินงบ
                  </Label>
                  <p className="text-xs text-zinc-500">Hard cut — ต้องรีเซ็ตด้วยมือ</p>
                </div>
                <Switch
                  id="budget-auto"
                  checked={budget.autoDisable}
                  onCheckedChange={(v) =>
                    void updateSetting(
                      GROWER_TOOLS_BUDGET_KEYS.autoDisable,
                      v ? "true" : "false"
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">โหมด AI แยกตามเครื่องมือ</CardTitle>
              <CardDescription>
                ปิดเฉพาะโหมดที่ต้องการลดค่า API — โหมดอื่นยังใช้ได้
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {GROWER_TOOLS_AI_TOOL_OPTIONS.map((tool) => {
                const checked = flagByAction[tool.action];
                return (
                  <div
                    key={tool.settingKey}
                    className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <Label htmlFor={tool.settingKey} className="text-sm font-medium text-zinc-900">
                        {tool.labelTh}
                      </Label>
                      <p className="text-xs text-zinc-500">{tool.descTh}</p>
                      <p className="text-[11px] text-zinc-400">
                        {checked ? "เปิดอยู่" : "ปิดอยู่"}
                      </p>
                    </div>
                    <Switch
                      id={tool.settingKey}
                      checked={checked}
                      disabled={isLoading}
                      onCheckedChange={(v) => void toggleTool(tool.settingKey, v, tool.labelTh)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
