"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CopyShareLinkButton({ path }: { path: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "คัดลอกลิงก์แล้ว", description: url });
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
      {copied ? (
        <Check className="mr-1.5 h-4 w-4" />
      ) : (
        <Link2 className="mr-1.5 h-4 w-4" />
      )}
      Copy share link
    </Button>
  );
}
