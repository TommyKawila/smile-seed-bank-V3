"use client";

import type { GfClaimOption } from "@/lib/gf-seed-claim-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CLAIM_INPUT_CLASS =
  "bg-white text-slate-900 border-slate-200 placeholder:text-slate-400";

export function ClaimField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", error && "rounded-lg ring-1 ring-red-300 p-2 -m-2")}>
      <Label className="text-sm text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

export function ClaimTextInput({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      placeholder={placeholder}
      className={CLAIM_INPUT_CLASS}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ClaimTextarea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      className={cn(CLAIM_INPUT_CLASS, "resize-y")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ClaimCheckboxGroup({
  options,
  values,
  onChange,
  t,
  otherValue,
  onOtherChange,
}: {
  options: GfClaimOption[];
  values: string[];
  onChange: (next: string[]) => void;
  t: (th: string, en: string) => string;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) {
  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  };
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.id} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
            checked={values.includes(opt.id)}
            onChange={() => toggle(opt.id)}
          />
          <span>{t(opt.th, opt.en)}</span>
        </label>
      ))}
      {values.includes("other") && onOtherChange ? (
        <Input
          className={cn("ml-6", CLAIM_INPUT_CLASS)}
          value={otherValue ?? ""}
          placeholder={t("ระบุอื่น ๆ", "Specify other")}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

export function ClaimRadioGroup({
  name,
  options,
  value,
  onChange,
  t,
  otherValue,
  onOtherChange,
}: {
  name: string;
  options: GfClaimOption[];
  value: string;
  onChange: (v: string) => void;
  t: (th: string, en: string) => string;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.id} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name={name}
            className="mt-0.5 h-4 w-4 border-slate-300 text-emerald-600"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
          />
          <span>{t(opt.th, opt.en)}</span>
        </label>
      ))}
      {value === "other" && onOtherChange ? (
        <Input
          className={cn("ml-6", CLAIM_INPUT_CLASS)}
          value={otherValue ?? ""}
          placeholder={t("ระบุอื่น ๆ", "Specify other")}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

export function ClaimConfirmCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
