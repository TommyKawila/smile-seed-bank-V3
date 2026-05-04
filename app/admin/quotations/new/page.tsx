"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Plus, Search, Loader2, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateReceiptPDF } from "@/lib/receipt-pdf";
import { quotationPdfFileName } from "@/lib/pdf-filename";
import { fetchPdfSettings } from "@/lib/pdf-settings";
import {
  consumeQuotationHandoff,
  type QuotationHandoffItem,
  type QuotationHandoffPack,
  type QuotationDuplicateLine,
} from "@/lib/quotation-grid-handoff";
import { cn } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

type ProductRow = {
  productId: number;
  masterSku: string;
  name: string;
  imageUrl: string | null;
  category: string;
  breederName: string;
  packs: number[];
  byPack: Record<number, { variantId: number; stock: number; price: number; unitLabel: string }>;
};

type OmniCustomerRow = {
  id?: string | number;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  email?: string | null;
};

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

type DraftItem = {
  productId: number;
  variantId: number;
  productName: string;
  breederName?: string;
  unitLabel: string;
  packSize: number;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  /** Variant stock snapshot; refreshed when adding from grid or when products list reloads */
  stock: number;
};

function pickDefaultPackFromHandoff(item: QuotationHandoffItem): { packSize: number; pack: QuotationHandoffPack } | null {
  const keys =
    item.packs.length > 0
      ? [...item.packs].sort((a, b) => a - b)
      : Object.keys(item.byPack)
          .map((k) => Number(k))
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => a - b);
  const withStock = keys.find((pk) => (item.byPack[String(pk)]?.stock ?? 0) > 0);
  const pk = withStock ?? keys[0];
  if (pk == null) return null;
  const pack = item.byPack[String(pk)];
  if (!pack) return null;
  return { packSize: pk, pack };
}

function handoffItemsToDraft(items: QuotationHandoffItem[]): DraftItem[] {
  const out: DraftItem[] = [];
  for (const it of items) {
    const picked = pickDefaultPackFromHandoff(it);
    if (!picked) continue;
    const { packSize, pack } = picked;
    out.push({
      productId: it.productId,
      variantId: pack.variantId,
      productName: it.name,
      breederName: it.breederName,
      unitLabel: pack.unitLabel,
      packSize,
      price: pack.price,
      quantity: 1,
      discount: 0,
      subtotal: pack.price,
      stock: pack.stock ?? 0,
    });
  }
  return out;
}

function duplicateLinesToDraft(lines: QuotationDuplicateLine[]): DraftItem[] {
  return lines.map((l) => {
    const stock = Math.max(0, l.stock);
    let qty = l.quantity;
    if (stock >= 1) qty = Math.min(qty, stock);
    else qty = 0;
    if (stock >= 1 && qty < 1) qty = 1;
    const price = Number(l.unitPrice) || 0;
    const rawDisc = Number(l.discount) || 0;
    const discount = Math.min(rawDisc, price * qty);
    const subtotal = Math.max(0, price * qty - discount);
    return {
      productId: l.productId,
      variantId: l.variantId,
      productName: l.productName,
      breederName: l.breederName ?? undefined,
      unitLabel: l.unitLabel,
      packSize: l.packSize,
      price,
      quantity: qty,
      discount,
      subtotal,
      stock,
    };
  });
}

export default function QuotationsNewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handoffAppliedRef = useRef(false);
  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [breederId, setBreederId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfSettings, setPdfSettings] = useState<Awaited<ReturnType<typeof fetchPdfSettings>> | null>(null);
  const [savedQuotationId, setSavedQuotationId] = useState<number | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [stockToasts, setStockToasts] = useState<{ id: number; msg: string }[]>([]);
  const [customerToasts, setCustomerToasts] = useState<{ id: number; msg: string }[]>([]);
  const [qtyWarnIdx, setQtyWarnIdx] = useState<number | null>(null);
  const stockToastSeq = useRef(0);
  const customerToastSeq = useRef(0);
  const [debouncedCustomerQ, setDebouncedCustomerQ] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<OmniCustomerRow[]>([]);
  const [customerSearchStatus, setCustomerSearchStatus] = useState<"idle" | "loading" | "done">("idle");
  const [customerNameFocused, setCustomerNameFocused] = useState(false);

  const pushStockToast = useCallback((stock: number) => {
    const id = ++stockToastSeq.current;
    const msg = `ขออภัย สินค้าในสต็อกไม่เพียงพอ (เหลือ ${stock} ชิ้น)`;
    setStockToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setStockToasts((p) => p.filter((t) => t.id !== id)), 3800);
  }, []);

  const pushCustomerToast = useCallback((msg: string) => {
    const id = ++customerToastSeq.current;
    setCustomerToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setCustomerToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCustomerQ(customerName.trim()), 300);
    return () => clearTimeout(t);
  }, [customerName]);

  const customerQNorm = debouncedCustomerQ.replace(/\s/g, "");
  const customerMinLen = /^\d+$/.test(customerQNorm) ? 3 : 2;

  useEffect(() => {
    const q = debouncedCustomerQ.trim();
    const norm = q.replace(/\s/g, "");
    const minLen = /^\d+$/.test(norm) ? 3 : 2;
    if (q.length < minLen) {
      setCustomerSearchResults([]);
      setCustomerSearchStatus("idle");
      return;
    }
    let cancelled = false;
    setCustomerSearchStatus("loading");
    fetch(`/api/admin/customers?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCustomerSearchResults(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCustomerSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setCustomerSearchStatus("done");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCustomerQ]);

  useEffect(() => {
    fetchPdfSettings().then(setPdfSettings);
    fetch("/api/admin/quotations/number", { method: "POST" })
      .then((r) => r.json())
      .then((d) => d.number && setOrderNumber(d.number))
      .catch(() => setOrderNumber("SSB-QT-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-001"));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (handoffAppliedRef.current) return;
    const from = searchParams.get("from");
    if (from !== "grid" && from !== "duplicate") return;
    handoffAppliedRef.current = true;
    const payload = consumeQuotationHandoff();
    router.replace("/admin/quotations/new", { scroll: false });
    if (!payload) return;

    if (payload.v === 2 && payload.source === "duplicate") {
      const c = payload.customer;
      setCustomerName(c.name ?? "");
      setCustomerPhone(c.phone ?? "");
      setCustomerEmail(c.email ?? "");
      setCustomerAddress(c.address ?? "");
      setCustomerNotes(c.note ?? "");
      setSavedQuotationId(null);
      setDraft(duplicateLinesToDraft(payload.lines));
      void fetch("/api/admin/quotations/number", { method: "POST" })
        .then((r) => r.json())
        .then((d) => d.number && setOrderNumber(d.number))
        .catch(() => {});
      const tid = ++stockToastSeq.current;
      setStockToasts((p) => [...p, { id: tid, msg: "คัดลอกแล้ว — ตรวจจำนวนตามสต็อกอีกครั้งหลังโหลดสินค้า" }]);
      setTimeout(() => setStockToasts((p) => p.filter((t) => t.id !== tid)), 4000);
      return;
    }

    if (payload.v === 1 && payload.items?.length) {
      setDraft((prev) => [...prev, ...handoffItemsToDraft(payload.items)]);
    }
  }, [searchParams, router]);

  const fetchBreeders = useCallback(async () => {
    const res = await fetch("/api/admin/breeders");
    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data)) setBreeders(data);
    else if (data.breeders) setBreeders(data.breeders);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json().catch(() => ({}));
    const list = data.categories ?? data ?? [];
    setCategories(Array.isArray(list) ? list.map((c: { id: string | number; name: string }) => ({ id: String(c.id), name: c.name })) : []);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.length >= 2) {
        params.set("search", debouncedSearch);
        params.set("globalSearch", "1");
      } else {
        if (breederId && breederId !== "all") params.set("breederId", breederId);
        if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
        if (debouncedSearch.length > 0) params.set("search", debouncedSearch);
      }
      const res = await fetch(`/api/admin/quotations/products?${params}`);
      const data = await res.json();
      setProducts(data.rows ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [breederId, categoryId, debouncedSearch]);

  useEffect(() => { fetchBreeders(); fetchCategories(); }, [fetchBreeders, fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (products.length === 0) return;
    setDraft((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((d) => {
        const row = products.find((p) => p.productId === d.productId);
        const pack = row?.byPack[d.packSize];
        const stock = pack?.stock ?? d.stock;
        let quantity = d.quantity;
        if (stock >= 1) {
          quantity = Math.min(quantity, stock);
          if (quantity < 1) quantity = 1;
        } else {
          quantity = 0;
        }
        const subtotal = d.price * quantity - (d.discount ?? 0);
        if (stock !== d.stock || quantity !== d.quantity || subtotal !== d.subtotal) {
          changed = true;
          return { ...d, stock, quantity, subtotal };
        }
        return d;
      });
      return changed ? next : prev;
    });
  }, [products]);

  const addToDraft = useCallback(
    (row: ProductRow, packSize: number) => {
      const pack = row.byPack[packSize];
      if (!pack) return;
      const stock = pack.stock ?? 0;
      setDraft((prev) => {
        const existing = prev.find((d) => d.productId === row.productId && d.packSize === packSize);
        if (existing) {
          if (existing.quantity + 1 > stock) {
            pushStockToast(stock);
            return prev;
          }
          return prev.map((d) =>
            d === existing
              ? {
                  ...d,
                  stock,
                  quantity: d.quantity + 1,
                  subtotal: (d.quantity + 1) * d.price - (d.discount ?? 0),
                }
              : d
          );
        }
        if (stock < 1) {
          pushStockToast(stock);
          return prev;
        }
        return [
          ...prev,
          {
            productId: row.productId,
            variantId: pack.variantId,
            productName: row.name,
            breederName: row.breederName,
            unitLabel: pack.unitLabel,
            packSize,
            price: pack.price,
            quantity: 1,
            discount: 0,
            subtotal: pack.price,
            stock,
          },
        ];
      });
    },
    [pushStockToast]
  );

  const updateDraftItem = (idx: number, updates: Partial<DraftItem>) => {
    setDraft((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const next = { ...d, ...updates };
        const cap = Math.max(0, next.stock);
        if (cap >= 1 && next.quantity > cap) next.quantity = cap;
        if (cap >= 1 && next.quantity < 1) next.quantity = 1;
        next.subtotal = next.price * next.quantity - (next.discount ?? 0);
        return next;
      })
    );
  };

  const onDraftQtyChange = (idx: number, raw: string) => {
    let toastCap: number | null = null;
    setDraft((prev) => {
      const item = prev[idx];
      if (!item) return prev;
      const cap = Math.max(0, item.stock);
      let n = Math.floor(Number(raw));
      if (!Number.isFinite(n)) n = cap >= 1 ? 1 : 0;
      if (cap < 1) {
        return prev.map((d, i) =>
          i === idx
            ? { ...d, quantity: 0, subtotal: Math.max(0, d.price * 0 - (d.discount ?? 0)) }
            : d
        );
      }
      if (n < 1) n = 1;
      if (n > cap) {
        toastCap = cap;
        n = cap;
      }
      return prev.map((d, i) => {
        if (i !== idx) return d;
        return { ...d, quantity: n, subtotal: d.price * n - (d.discount ?? 0) };
      });
    });
    if (toastCap !== null) {
      pushStockToast(toastCap);
      setQtyWarnIdx(idx);
      setTimeout(() => setQtyWarnIdx((j) => (j === idx ? null : j)), 1600);
    }
  };

  const removeFromDraft = (idx: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const grandTotal = draft.reduce((s, i) => s + i.subtotal, 0);

  const getValidityDate = () => {
    const d = new Date(orderDate);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };

  const mergeWebProfile = useCallback(async (phoneDigits: string, posAddress?: string | null) => {
    if (phoneDigits.length < 9) return { email: "", extraAddress: "" };
    try {
      const r = await fetch(
        `/api/admin/customers/web-profile?phone=${encodeURIComponent(phoneDigits)}`
      );
      const j = await r.json().catch(() => ({}));
      const email = typeof j.email === "string" ? j.email : "";
      const wa = typeof j.address === "string" ? j.address.trim() : "";
      const extraAddress = wa && !String(posAddress ?? "").trim() ? wa : "";
      return { email, extraAddress };
    } catch {
      return { email: "", extraAddress: "" };
    }
  }, []);

  const applyOmniCustomer = useCallback(
    async (exact: OmniCustomerRow, opts?: { successToast?: boolean }) => {
      const name = String(exact.name ?? "");
      const phone = String(exact.phone ?? "");
      setCustomerName(name);
      setCustomerPhone(phone);
      setCustomerAddress(String(exact.address ?? "").trim());
      setCustomerNotes(exact.notes ? String(exact.notes) : "");
      setCustomerSearchResults([]);
      setCustomerSearchStatus("idle");
      const rowEmail = String(exact.email ?? "").trim();
      setCustomerEmail(rowEmail);
      const d = onlyDigits(phone);
      const { email, extraAddress } = await mergeWebProfile(d, exact.address);
      if (!rowEmail && email) setCustomerEmail(email);
      if (extraAddress)
        setCustomerAddress((prev) => (prev.trim() ? prev : extraAddress));
      if (opts?.successToast) pushCustomerToast(`ดึงข้อมูลลูกค้า '${name}' เรียบร้อยแล้ว`);
    },
    [mergeWebProfile, pushCustomerToast]
  );

  const autofillFromPosCustomer = useCallback(async () => {
    const p = customerPhone.replace(/\s/g, "").trim();
    const d = onlyDigits(p);
    if (d.length !== 10) return;
    try {
      const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(p)}`);
      const list = await res.json().catch(() => []);
      if (!Array.isArray(list) || list.length === 0) return;
      const exact =
        list.find((c: { phone?: string }) => onlyDigits(c.phone ?? "") === d) ?? list[0];
      if (!exact) return;
      await applyOmniCustomer(exact as OmniCustomerRow, { successToast: false });
    } catch {
      /* ignore */
    }
  }, [customerPhone, applyOmniCustomer]);

  const draftToApiItems = () => {
    const lines = draft.filter((d) => d.quantity > 0);
    for (const d of lines) {
      if (d.quantity > d.stock) {
        throw new Error(`จำนวนเกินสต็อก: ${d.productName} (สูงสุด ${d.stock})`);
      }
    }
    return lines.map((d) => ({
      productId: d.productId,
      variantId: d.variantId,
      productName: d.productName,
      unitLabel: d.unitLabel,
      breederName: d.breederName ?? null,
      quantity: d.quantity,
      unitPrice: d.price,
      discount: d.discount,
      lineTotal: d.subtotal,
    }));
  };

  const persistQuotationToDb = async (): Promise<number> => {
    const items = draftToApiItems();
    if (items.length === 0) throw new Error("ไม่มีรายการ");
    if (!customerName.trim()) throw new Error("กรุณากรอกชื่อลูกค้า");
    const validUntil = getValidityDate();
    const customerPayload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || null,
      customerPhone: customerPhone.trim() || null,
      customerAddress: customerAddress.trim() || null,
      customerNote: customerNotes.trim() || null,
    };
    if (savedQuotationId != null) {
      const res = await fetch(`/api/admin/quotations/${savedQuotationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customerPayload,
          totalAmount: grandTotal,
          validUntil,
          items,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      return savedQuotationId;
    }
    const res = await fetch("/api/admin/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quotationNumber: orderNumber,
        ...customerPayload,
        validUntil,
        status: "DRAFT",
        totalAmount: grandTotal,
        items,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
    setSavedQuotationId(data.id);
    return data.id as number;
  };

  const saveQuotationPDF = async () => {
    setError(null);
    setSavingPdf(true);
    try {
      await persistQuotationToDb();
      const items = draft.map((d) => ({
        productName: d.productName,
        breeder: d.breederName,
        unitLabel: d.unitLabel,
        quantity: d.quantity,
        price: d.price,
        discount: d.discount,
        subtotal: d.subtotal,
      }));
      const doc = await generateReceiptPDF({
        docType: "quotation",
        orderNumber,
        orderDate,
        customerName: customerName.trim() || "General Customer",
        customerEmail: customerEmail.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        customerNote: customerNotes.trim() || null,
        items,
        grandTotal,
        logoDataUrl: pdfSettings?.logoDataUrl ?? null,
        validityDate: getValidityDate(),
        companyName: pdfSettings?.companyName,
        companyAddress: pdfSettings?.companyAddress,
        companyEmail: pdfSettings?.companyEmail,
        companyPhone: pdfSettings?.companyPhone,
        companyLineId: pdfSettings?.companyLineId,
        bankName: pdfSettings?.bankName,
        bankAccountName: pdfSettings?.bankAccountName,
        bankAccountNo: pdfSettings?.bankAccountNo,
        socialLinks: pdfSettings?.socialLinks ?? [],
      });
      doc.save(quotationPdfFileName(orderNumber, customerName.trim() || null));
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSavingPdf(false);
    }
  };

  const convertToOrder = async () => {
    setError(null);
    setConverting(true);
    try {
      const validItems = draft.filter(
        (d) => d.quantity > 0 && d.variantId > 0 && d.quantity <= d.stock
      );
      if (validItems.length === 0) {
        setError("ไม่มีรายการที่จะแปลงเป็นออเดอร์");
        return;
      }
      const id = await persistQuotationToDb();
      const res = await fetch(`/api/admin/quotations/${id}/convert`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "แปลงเป็นออเดอร์ไม่สำเร็จ");
      setDraft([]);
      setSavedQuotationId(null);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setCustomerNotes("");
      window.location.href = "/admin/orders";
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {stockToasts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col gap-2">
          {stockToasts.map((t) => (
            <div
              key={t.id}
              className="rounded-xl bg-amber-700 px-4 py-3 text-sm font-medium text-white shadow-lg"
            >
              {t.msg}
            </div>
          ))}
        </div>
      )}
      {customerToasts.length > 0 && (
        <div className="fixed top-4 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col gap-2">
          {customerToasts.map((t) => (
            <div
              key={t.id}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg"
            >
              {t.msg}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Link href="/admin/quotations">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">สร้างใบเสนอราคา</h1>
          <p className="text-sm text-zinc-500">
            เลือกแพ็กและราคาจากรายการ — พิมพ์ค้นหา 2 ตัวอักษรขึ้นไปเพื่อค้นหาทั้งร้าน (ทุก Breeder) หรือใช้ตัวกรองเมื่อไม่ค้นหา
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="ค้นหาชื่อหรือ Master SKU (2+ ตัว = ค้นทั้งร้าน)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={breederId} onValueChange={setBreederId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Breeder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {breeders.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="หมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">สินค้า</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">ไม่พบสินค้า</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((row) => (
                  <div key={row.productId} className="flex gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50/50">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {row.imageUrl ? (
                        <Image
                          src={row.imageUrl}
                          alt=""
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                          unoptimized={shouldOffloadImageOptimization(row.imageUrl)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">—</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.masterSku || row.breederName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {row.packs.map((pk) => {
                          const pack = row.byPack[pk];
                          if (!pack) return null;
                          const inStock = pack.stock > 0;
                          const sizeLabel = pack.unitLabel || `${pk} ${pk === 1 ? "Seed" : "Seeds"}`;
                          const line = `${sizeLabel} ฿${pack.price.toLocaleString("th-TH")} (สต็อก ${pack.stock})`;
                          return (
                            <Button
                              key={pk}
                              size="sm"
                              variant="outline"
                              disabled={pack.stock < 1}
                              className={cn(
                                "h-auto min-h-7 max-w-full flex-wrap justify-start gap-0.5 py-1 text-left text-xs leading-tight",
                                inStock ? "border-slate-200" : "border-amber-200 text-amber-800"
                              )}
                              onClick={() => addToDraft(row, pk)}
                            >
                              <Plus className="h-3 w-3 shrink-0" />
                              <span className="break-words">{line}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">รายการร่าง ({draft.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
              <p className="text-xs font-medium text-slate-500">ข้อมูลลูกค้า / Contact</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">ชื่อลูกค้า <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onFocus={() => setCustomerNameFocused(true)}
                    onBlur={() => setTimeout(() => setCustomerNameFocused(false), 200)}
                    placeholder="ค้นหาชื่อหรือเบอร์ — หรือพิมพ์ใหม่"
                    className="h-8 text-sm"
                    required
                    autoComplete="off"
                  />
                  {customerNameFocused &&
                    debouncedCustomerQ.length >= customerMinLen &&
                    customerSearchStatus !== "idle" && (
                      <ul
                        className="absolute left-0 right-0 top-full z-[200] mt-1 max-h-48 overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
                        role="listbox"
                      >
                        {customerSearchStatus === "loading" && (
                          <li className="flex items-center gap-2 px-3 py-2 text-slate-500">
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            กำลังค้นหา...
                          </li>
                        )}
                        {customerSearchStatus === "done" && customerSearchResults.length === 0 && (
                          <li className="px-3 py-2 text-slate-500">ไม่พบ — พิมพ์ข้อมูลใหม่ได้</li>
                        )}
                        {customerSearchStatus === "done" &&
                          customerSearchResults.map((c) => (
                            <li key={String(c.id ?? `${c.phone}-${c.name}`)}>
                              <button
                                type="button"
                                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-accent"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => void applyOmniCustomer(c, { successToast: true })}
                              >
                                <span className="font-medium text-slate-800">{c.name}</span>
                                <span className="text-xs text-slate-500">{c.phone || "—"}</span>
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">เบอร์โทร</label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={() => void autofillFromPosCustomer()}
                  placeholder="08xxxxxxxx"
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-slate-400">
                  พิมพ์เบอร์ 10 หลักแล้วคลิกออกช่อง — ดึงจาก POS / โปรไฟล์เว็บ (ถ้ามี)
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">อีเมล</label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">ที่อยู่จัดส่ง</label>
                <Textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="ที่อยู่ (ไม่บังคับ)"
                  rows={2}
                  className="min-h-0 resize-y text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">หมายเหตุ</label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="บันทึกภายใน / ส่งลูกค้า"
                  rows={2}
                  className="min-h-0 resize-y text-sm"
                />
              </div>
            </div>
            {draft.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">คลิก + เพื่อเพิ่มรายการ</div>
            ) : (
              <>
                <div className="max-h-[280px] overflow-y-auto space-y-2">
                  {draft.map((item, idx) => (
                    <div key={`${item.productId}-${item.packSize}-${idx}`} className="flex flex-wrap items-center gap-2 rounded border border-slate-100 bg-slate-50/50 p-2 text-sm">
                      <div className="min-w-0 flex-1 basis-[120px]">
                        <p className="truncate font-medium">{item.productName}</p>
                        <p className="text-xs text-slate-500">{item.unitLabel}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">ราคา</span>
                        <Input
                          type="number"
                          min={0}
                          value={item.price}
                          onChange={(e) => updateDraftItem(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                          className="h-7 w-[4.5rem] text-right"
                        />
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <Input
                          type="number"
                          min={item.stock >= 1 ? 1 : 0}
                          max={Math.max(0, item.stock)}
                          value={item.quantity}
                          onChange={(e) => onDraftQtyChange(idx, e.target.value)}
                          className={cn(
                            "h-7 w-14 text-right",
                            qtyWarnIdx === idx && "border-red-500 text-red-600 ring-2 ring-red-200"
                          )}
                        />
                        {item.stock >= 1 && (
                          <span
                            className={cn(
                              "text-[10px] leading-none",
                              item.quantity >= item.stock ? "font-medium text-amber-700" : "text-slate-400"
                            )}
                          >
                            {item.quantity >= item.stock ? "ถึงสต็อกสูงสุด" : `สูงสุด ${item.stock}`}
                          </span>
                        )}
                        {item.stock < 1 && (
                          <span className="text-[10px] text-red-600">สต็อกหมด</span>
                        )}
                      </div>
                      <span className="min-w-[4rem] text-right font-medium text-primary">
                        ฿{item.subtotal.toLocaleString("th-TH")}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => removeFromDraft(idx)}>×</Button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="text-right text-sm">รวมทั้งสิ้น: <span className="font-semibold text-primary text-lg">฿{grandTotal.toLocaleString("th-TH")}</span></p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void saveQuotationPDF()}
                    disabled={draft.length === 0 || !pdfSettings || savingPdf}
                  >
                    {savingPdf || !pdfSettings ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-1.5 h-4 w-4" />
                    )}
                    {!pdfSettings ? "กำลังโหลดโลโก้..." : savingPdf ? "กำลังบันทึก..." : "บันทึกใบเสนอราคา (PDF)"}
                  </Button>
                  <Button
                    onClick={() => void convertToOrder()}
                    disabled={draft.length === 0 || converting || !pdfSettings}
                  >
                    {converting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-1.5 h-4 w-4" />}
                    แปลงเป็นออเดอร์
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
