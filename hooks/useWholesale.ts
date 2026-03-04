"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  applyWholesalePrice,
  applyWholesaleToCart,
  type WholesaleContext,
} from "@/lib/wholesale-utils";
import type { Customer } from "@/types/supabase";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const WholesaleUpdateSchema = z.object({
  customerId: z.string().uuid("Customer ID ไม่ถูกต้อง"),
  isWholesale: z.boolean(),
  discountPercent: z
    .number()
    .min(0, "ส่วนลดต้องไม่ต่ำกว่า 0%")
    .max(99, "ส่วนลดต้องไม่เกิน 99%"),
});

export type WholesaleUpdateInput = z.infer<typeof WholesaleUpdateSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseWholesaleReturn {
  context: WholesaleContext | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // Admin: update a customer's wholesale status
  updateWholesaleStatus: (input: WholesaleUpdateInput) => Promise<{ error: string | null }>;
  validationError: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWholesale(customerId?: string | null): UseWholesaleReturn {
  const [context, setContext] = useState<WholesaleContext | null>(null);
  const [isLoading, setIsLoading] = useState(!!customerId);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!customerId) {
      // ถ้าไม่มี customerId = ลูกค้าทั่วไป, ไม่มีส่วนลด Wholesale
      setContext({ isWholesale: false, discountPercent: 0, multiplier: 1 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: sbError } = await supabase
        .from("customers")
        .select("is_wholesale, wholesale_discount_percent")
        .eq("id", customerId)
        .single();

      if (sbError) throw new Error(sbError.message);

      const customer = data as Pick<
        Customer,
        "is_wholesale" | "wholesale_discount_percent"
      >;

      const discountPercent = customer.is_wholesale
        ? (customer.wholesale_discount_percent ?? 0)
        : 0;

      setContext({
        isWholesale: customer.is_wholesale,
        discountPercent,
        multiplier: 1 - discountPercent / 100,
      });
    } catch (err) {
      setError(String(err));
      setContext({ isWholesale: false, discountPercent: 0, multiplier: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // ── Admin: update wholesale status via API route ───────────────────────────
  const updateWholesaleStatus = useCallback(
    async (input: WholesaleUpdateInput): Promise<{ error: string | null }> => {
      setValidationError(null);

      // Zod validation ก่อน call API ทุกครั้ง
      const parsed = WholesaleUpdateSchema.safeParse(input);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        setValidationError(msg);
        return { error: msg };
      }

      try {
        const res = await fetch("/api/admin/customers/wholesale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { error: body.error ?? "อัปเดตสถานะ Wholesale ไม่สำเร็จ" };
        }

        // If updating the currently viewed customer, re-fetch
        if (parsed.data.customerId === customerId) await fetchContext();
        return { error: null };
      } catch (err) {
        return { error: String(err) };
      }
    },
    [customerId, fetchContext]
  );

  return {
    context,
    isLoading,
    error,
    refetch: fetchContext,
    updateWholesaleStatus,
    validationError,
  };
}

// ─── Re-export pure helpers ───────────────────────────────────────────────────
export { applyWholesalePrice, applyWholesaleToCart };
export type { WholesaleContext };
