"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import {
  GROWER_TOOLS_AI_TOOL_OPTIONS,
  resolveGrowerToolsAiFlags,
} from "@/lib/grower-tools-settings";

export default function GrowerToolsSettingsPage() {
  const { toast } = useToast();
  const { settings, isLoading, updateSetting } = useSiteSettings();
  const flags = resolveGrowerToolsAiFlags(settings);

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

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
          <Sparkles className="h-6 w-6 text-emerald-700" />
          ผู้ช่วย AI ปลูก
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          เปิด/ปิดการเรียก OpenAI แยกตามเครื่องมือ · คำนวณ VPD ไม่ได้รับผลกระทบ
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
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
                    <Label
                      htmlFor={tool.settingKey}
                      className="text-sm font-medium text-zinc-900"
                    >
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
      )}
    </div>
  );
}
