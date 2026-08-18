"use client";

import { useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { parseBulkLeadPaste } from "@/lib/b2b-quote-paste";
import { pasteTextHasWrongBreeder, type B2BQuoteChannel } from "@/lib/b2b-quote-channel";
import type { B2BQuoteDraft } from "@/types/b2b-quote";

type Props = {
  onApply: (draft: B2BQuoteDraft) => void;
  channel?: B2BQuoteChannel | null;
};

export function B2BQuotePastePanel({ onApply, channel = null }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  function apply() {
    setError(null);
    setWarnings([]);
    if (channel && pasteTextHasWrongBreeder(text, channel)) {
      setError(
        channel === "gf"
          ? "GF channel: paste มี Seeds Genetics — ใช้ข้อความ SGF Seeds เท่านั้น"
          : "SG channel: paste มี SGF Seeds — ใช้ข้อความ Seeds Genetics เท่านั้น"
      );
      return;
    }
    const result = parseBulkLeadPaste(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApply(result.draft);
    setWarnings(result.warnings);
    setText("");
  }

  return (
    <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-800">
          วางข้อความจากคำสั่งลิงก์
        </CardTitle>
        <p className="text-xs leading-relaxed text-slate-600">
          Copy จาก /admin/bulk-seeds แล้ววางที่นี่ — ระบบใส่ลูกค้า + รายการ + ราคาให้
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder={"SSB-BL-2026-001\nContact: …\nEmail: …\n---\nSGF Seeds · … · 50 · €3.10/seed · ฿6,000\n---"}
          rows={6}
          className="font-mono text-xs"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {warnings.length > 0 ? (
          <ul className="text-xs text-amber-800">
            {warnings.map((w) => (
              <li key={w}>· {w}</li>
            ))}
          </ul>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={!text.trim()}
          onClick={apply}
        >
          <ClipboardPaste className="mr-2 h-4 w-4" />
          นำไปใส่ใบเสนอราคา
        </Button>
      </CardContent>
    </Card>
  );
}
