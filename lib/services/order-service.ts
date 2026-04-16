/**
 * Order Service — all database logic for orders.
 * Routes call these functions; no raw SQL in route files.
 */
import { getSql } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLineUserIdByEmailForCheckout } from "@/lib/line-customer-line-resolve";
import { Prisma } from "@prisma/client";
import {
  assertSufficientStockForCheckoutLines,
  deductVariantStockForOrderItems,
  InsufficientStockError,
  type CheckoutStockLine,
} from "@/lib/order-inventory";
import { sendAdminNotification } from "@/lib/admin-notification";
import { generateOrderNumber } from "@/lib/order-utils";
import {
  linkOrderToCustomerAfterClaim,
  type ClaimAssociateResult,
} from "@/lib/claim-customer-associate";
import {
  carrierLabelFromCode,
  carrierTrackingUrl,
} from "@/lib/shipping-carriers";
import { randomUUID } from "crypto";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface CheckoutCustomer {
  full_name: string;
  phone: string;
  address: string;
  email: string | null;
  line_user_id: string | null;
}

export interface CheckoutItem {
  variantId: number;
  quantity: number;
  price: number;
  productName: string;
  isFreeGift?: boolean;
}

export interface CheckoutSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface CreateOrderInput {
  customer: CheckoutCustomer;
  items: CheckoutItem[];
  summary: CheckoutSummary;
  payment_method: string;
  customer_id: string | null;
  promo_code_id: number | null;
  order_note?: string | null;
}

export interface CreateOrderResult {
  orderNumber: string;
  orderId: number;
}

export interface OrderPublicView {
  order_number: string;
  payment_method: string | null;
  status: string;
  total_amount: number;
  slip_url: string | null;
}

export interface OrderSuccessItemRow {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderSuccessView {
  order_number: string;
  /** YYYY-MM-DD (Bangkok calendar day from DB `created_at`) */
  order_date: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  payment_method: string | null;
  slip_url: string | null;
  tracking_number: string | null;
  shipping_provider: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_fee: number;
  discount_amount: number;
  promotion_discount_amount: number;
  points_discount_amount: number;
  items: OrderSuccessItemRow[];
  /** True when `orders.line_user_id` is set (e.g. auto-linked from customer profile). */
  line_linked: boolean;
}

export type OrderSuccessViewError =
  | "not_found"
  | "login_required"
  | "forbidden"
  | "server";

export type ServiceResult<T> = { data: T | null; error: string | null };

// ─── createOrder ─────────────────────────────────────────────────────────────

/**
 * Creates an order with items in a single transaction.
 * Also records promo usage if promo_code_id is provided.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<ServiceResult<CreateOrderResult>> {
  try {
    const { customer, items, summary, payment_method, customer_id, promo_code_id, order_note } =
      input;
    const noteTrimmed = order_note?.trim() ?? "";
    const resolvedCustomerId = customer_id ?? null;

    const variantIds = [...new Set(items.map((i) => i.variantId))];
    const variantRows = await prisma.product_variants.findMany({
      where: { id: { in: variantIds.map((id) => BigInt(id)) } },
      select: { id: true, cost_price: true },
    });
    if (variantRows.length !== variantIds.length) {
      return { data: null, error: "One or more products are no longer available" };
    }

    const costMap = new Map(
      variantRows.map((v) => [Number(v.id), v.cost_price != null ? Number(v.cost_price) : 0])
    );
    const totalCost = items.reduce(
      (sum, item) => sum + (costMap.get(item.variantId) ?? 0) * item.quantity,
      0
    );

    const stockLines: CheckoutStockLine[] = items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      productName: i.productName || "Unknown",
    }));

    const guestEmailLineUserId =
      !resolvedCustomerId && customer.email?.trim()
        ? await getLineUserIdByEmailForCheckout(customer.email)
        : null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const orderNumber = generateOrderNumber();
      try {
        const result = await prisma.$transaction(async (tx) => {
          await assertSufficientStockForCheckoutLines(tx, stockLines);
          await deductVariantStockForOrderItems(
            tx,
            stockLines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
          );

          let orderLineUserId: string | null = null;
          if (resolvedCustomerId) {
            const existing = await tx.customers.findUnique({
              where: { id: resolvedCustomerId },
              select: { line_user_id: true },
            });
            const fromInput = customer.line_user_id?.trim() || null;
            const fromProfile = existing?.line_user_id?.trim() || null;
            orderLineUserId = fromInput || fromProfile;

            await tx.customers.upsert({
              where: { id: resolvedCustomerId },
              create: {
                id: resolvedCustomerId,
                full_name: customer.full_name,
                phone: customer.phone ?? null,
                address: customer.address,
                email: customer.email ?? undefined,
                line_user_id: orderLineUserId ?? undefined,
              },
              update: {
                full_name: customer.full_name,
                phone: customer.phone ?? undefined,
                address: customer.address,
                ...(customer.email != null ? { email: customer.email } : {}),
                ...(customer.line_user_id != null && customer.line_user_id !== ""
                  ? { line_user_id: customer.line_user_id.trim() }
                  : {}),
              },
            });
          } else if (guestEmailLineUserId) {
            orderLineUserId = guestEmailLineUserId;
          }

          const order = await tx.orders.create({
            data: {
              order_number: orderNumber,
              customer_id: resolvedCustomerId,
              order_origin: "WEB",
              payment_method: payment_method,
              shipping_address: customer.address,
              customer_name: customer.full_name,
              customer_phone: customer.phone ?? null,
              shipping_fee: new Prisma.Decimal(summary.shipping),
              discount_amount: new Prisma.Decimal(summary.discount),
              total_amount: new Prisma.Decimal(summary.total),
              total_cost: new Prisma.Decimal(totalCost),
              status: "PENDING",
              ...(noteTrimmed ? { customer_note: noteTrimmed } : {}),
              ...(orderLineUserId ? { line_user_id: orderLineUserId } : {}),
            },
          });

          await tx.order_items.createMany({
            data: items.map((item) => ({
              order_id: order.id,
              variant_id: BigInt(item.variantId),
              product_name: item.productName || "Unknown",
              quantity: item.quantity,
              unit_price: new Prisma.Decimal(item.price),
              unit_cost: new Prisma.Decimal(costMap.get(item.variantId) ?? 0),
            })),
          });

          if (promo_code_id) {
            const campaign = await tx.promotion_campaigns.findUnique({
              where: { promo_code_id: BigInt(promo_code_id) },
            });
            if (campaign) {
              const now = new Date();
              if (
                !campaign.is_active ||
                now < campaign.start_at ||
                now > campaign.end_at
              ) {
                throw new Error("CAMPAIGN_INACTIVE");
              }
              if (campaign.total_limit > 0 && campaign.usage_count >= campaign.total_limit) {
                throw new Error("CAMPAIGN_EXHAUSTED");
              }
            }

            await tx.promo_code_usages.create({
              data: {
                promo_code_id: BigInt(promo_code_id),
                order_id: order.id,
                customer_email: customer.email,
                customer_phone: customer.phone,
              },
            });
            const redemptionEmail = customer.email ?? customer.phone;
            if (!redemptionEmail?.trim()) {
              throw new Error("Email or phone required when using a promo code");
            }
            await tx.coupon_redemptions.create({
              data: {
                coupon_id: BigInt(promo_code_id),
                user_id: resolvedCustomerId,
                email: redemptionEmail,
                order_id: order.id,
              },
            });

            if (campaign) {
              await tx.promotion_campaigns.update({
                where: { id: campaign.id },
                data: { usage_count: { increment: 1 } },
              });
            }
          }

          return { orderId: Number(order.id) };
        });

        const totalFmt = summary.total.toLocaleString("th-TH", {
          maximumFractionDigits: 0,
        });
        void sendAdminNotification(
          [
            `🆕 New Order #${orderNumber}`,
            `Customer: ${customer.full_name}`,
            `Total: ฿${totalFmt}`,
            `Status: PENDING`,
          ].join("\n")
        );

        return { data: { orderNumber, orderId: result.orderId }, error: null };
      } catch (err) {
        if (err instanceof InsufficientStockError) {
          console.warn("[order-service] createOrder:", err.message);
          return { data: null, error: "INSUFFICIENT_STOCK" };
        }
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          const meta = err.meta as { target?: string | string[] } | undefined;
          const t = meta?.target;
          const orderNoCollision =
            t === "order_number" || (Array.isArray(t) && t.includes("order_number"));
          if (orderNoCollision && attempt < 4) {
            continue;
          }
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[order-service] createOrder error:", msg);
        return { data: null, error: msg };
      }
    }

    return { data: null, error: "Could not allocate unique order number" };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      console.warn("[order-service] createOrder:", err.message);
      return { data: null, error: "INSUFFICIENT_STOCK" };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] createOrder error:", msg);
    return { data: null, error: msg };
  }
}

// ─── getOrderForSuccessView ───────────────────────────────────────────────────

/**
 * Order success page payload. If order has `customer_id`, only the same logged-in user may view it;
 * guest orders (`customer_id` null) are readable by anyone with the order number.
 */
export async function getOrderForSuccessView(
  orderNumber: string,
  requesterUserId: string | null,
  options?: { skipCustomerAuth?: boolean }
): Promise<{ data: OrderSuccessView | null; error: OrderSuccessViewError | null }> {
  try {
    const sql = getSql();
    const rows = await sql<
      {
        id: number;
        customer_id: string | null;
        order_number: string;
        created_at: Date | null;
        status: string | null;
        total_amount: string;
        shipping_address: string | null;
        payment_method: string | null;
        slip_url: string | null;
        tracking_number: string | null;
        shipping_provider: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        shipping_fee: string;
        discount_amount: string;
        promotion_discount_amount: string;
        points_discount_amount: string;
        line_user_id: string | null;
      }[]
    >`
      SELECT id, customer_id, order_number, created_at, status, total_amount::text AS total_amount,
             shipping_address, payment_method, slip_url,
             tracking_number, shipping_provider,
             customer_name, customer_phone,
             shipping_fee::text AS shipping_fee,
             discount_amount::text AS discount_amount,
             promotion_discount_amount::text AS promotion_discount_amount,
             points_discount_amount::text AS points_discount_amount,
             line_user_id
      FROM orders
      WHERE order_number = ${orderNumber}
      LIMIT 1
    `;
    const order = rows[0];
    if (!order) return { data: null, error: "not_found" };

    if (!options?.skipCustomerAuth && order.customer_id != null) {
      if (!requesterUserId) return { data: null, error: "login_required" };
      if (order.customer_id !== requesterUserId) return { data: null, error: "forbidden" };
    }

    const itemRows = await sql<{ product_name: string; quantity: number; unit_price: string }[]>`
      SELECT product_name, quantity, unit_price::text AS unit_price
      FROM order_items
      WHERE order_id = ${order.id}
      ORDER BY id ASC
    `;

    const items: OrderSuccessItemRow[] = itemRows.map((r) => {
      const unit = Number(r.unit_price);
      const qty = r.quantity;
      return {
        product_name: r.product_name,
        quantity: qty,
        unit_price: unit,
        line_total: unit * qty,
      };
    });

    const orderDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(order.created_at ? new Date(order.created_at) : new Date());

    return {
      data: {
        order_number: order.order_number,
        order_date: orderDate,
        status: order.status ?? "UNKNOWN",
        total_amount: Number(order.total_amount),
        shipping_address: order.shipping_address,
        payment_method: order.payment_method,
        slip_url: order.slip_url,
        tracking_number: order.tracking_number,
        shipping_provider: order.shipping_provider,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        shipping_fee: Number(order.shipping_fee ?? 0),
        discount_amount: Number(order.discount_amount ?? 0),
        promotion_discount_amount: Number(order.promotion_discount_amount ?? 0),
        points_discount_amount: Number(order.points_discount_amount ?? 0),
        items,
        line_linked: Boolean(order.line_user_id?.trim()),
      },
      error: null,
    };
  } catch (err) {
    console.error("[order-service] getOrderForSuccessView error:", err);
    return { data: null, error: "server" };
  }
}

// ─── getOrderByNumber ─────────────────────────────────────────────────────────

export async function getOrderByNumber(
  orderNumber: string
): Promise<ServiceResult<OrderPublicView>> {
  try {
    const sql = getSql();
    const rows = await sql<OrderPublicView[]>`
      SELECT order_number, payment_method, status, total_amount, slip_url
      FROM orders
      WHERE order_number = ${orderNumber}
      LIMIT 1
    `;
    const order = rows[0];
    if (!order) return { data: null, error: "Order not found" };
    return { data: order, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] getOrderByNumber error:", msg);
    return { data: null, error: msg };
  }
}

// ─── uploadSlip ───────────────────────────────────────────────────────────────

const SLIP_BUCKET = "payment-slips";
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadSlipInput {
  orderNumber: string;
  file: File;
}

export interface UploadSlipResult {
  slip_url: string;
}

export async function uploadSlip(
  input: UploadSlipInput
): Promise<ServiceResult<UploadSlipResult>> {
  try {
    const { orderNumber, file } = input;
    const sql = getSql();

    // Guard: validate order + payment method (+ fields for admin notification)
    const rows = await sql<
      {
        id: number;
        payment_method: string | null;
        slip_url: string | null;
        total_amount: string;
        customer_name: string | null;
        cust_full: string | null;
      }[]
    >`
      SELECT o.id, o.payment_method, o.slip_url, o.total_amount::text AS total_amount,
             o.customer_name, c.full_name AS cust_full
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.order_number = ${orderNumber}
      LIMIT 1
    `;
    const order = rows[0];
    if (!order) return { data: null, error: "Order not found" };
    if (order.slip_url) return { data: null, error: "Slip already uploaded" };
    if (order.payment_method !== "TRANSFER") {
      return { data: null, error: "This order does not require slip upload" };
    }

    // Guard: file type + size
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!ALLOWED_EXT.includes(ext)) {
      return { data: null, error: "Allowed file types: jpg, png, webp, pdf" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { data: null, error: "File too large (max 5MB)" };
    }

    // Upload to Supabase Storage via service role
    const path = `${orderNumber}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || (ext === "pdf" ? "application/pdf" : "image/jpeg");

    const supabase = await createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(SLIP_BUCKET)
      .upload(path, buffer, { cacheControl: "3600", upsert: true, contentType });

    if (uploadError) {
      console.error("[order-service] storage upload error:", uploadError.message);
      return { data: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from(SLIP_BUCKET).getPublicUrl(path);
    const slipUrl = data.publicUrl;

    // Update order status
    await sql`
      UPDATE orders SET slip_url = ${slipUrl}, status = 'AWAITING_VERIFICATION'
      WHERE id = ${order.id}
    `;

    const displayName =
      order.customer_name?.trim() || order.cust_full?.trim() || "—";
    const totalFmt = Number(order.total_amount).toLocaleString("th-TH", {
      maximumFractionDigits: 0,
    });
    void sendAdminNotification(
      [
        `💰 Slip Uploaded for #${orderNumber}`,
        `Customer: ${displayName}`,
        `Total: ฿${totalFmt}`,
        `Please verify in the Admin Dashboard.`,
      ].join("\n")
    );

    return { data: { slip_url: slipUrl }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] uploadSlip error:", msg);
    return { data: null, error: msg };
  }
}

// ─── Manual order claim (PENDING_INFO → AWAITING_VERIFICATION) ────────────────

export interface OrderClaimPreview {
  order_number: string;
  total_amount: number;
  status: string;
}

export async function getOrderClaimPreview(
  token: string
): Promise<ServiceResult<OrderClaimPreview>> {
  const t = token?.trim();
  if (!t) return { data: null, error: "Invalid link" };
  try {
    const order = await prisma.orders.findFirst({
      where: { claim_token: t },
      select: { order_number: true, status: true, total_amount: true },
    });
    if (!order) return { data: null, error: "Order not found" };
    return {
      data: {
        order_number: order.order_number,
        total_amount: Number(order.total_amount),
        status: order.status ?? "",
      },
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] getOrderClaimPreview error:", msg);
    return { data: null, error: msg };
  }
}

export interface PublicOrderTrackView {
  order_number: string;
  status: string;
  tracking_number: string | null;
  shipping_provider: string | null;
  carrier_label: string;
  tracking_url: string | null;
}

export async function getPublicOrderTrackByToken(
  token: string
): Promise<ServiceResult<PublicOrderTrackView>> {
  const t = token?.trim();
  if (!t) return { data: null, error: "Invalid link" };
  try {
    const order = await prisma.orders.findFirst({
      where: { claim_token: t },
      select: {
        order_number: true,
        status: true,
        tracking_number: true,
        shipping_provider: true,
      },
    });
    if (!order) return { data: null, error: "Order not found" };
    const tr = order.tracking_number?.trim() || null;
    const sp = order.shipping_provider?.trim() || null;
    const tracking_url =
      tr && sp ? carrierTrackingUrl(tr, sp) : null;
    return {
      data: {
        order_number: order.order_number,
        status: order.status ?? "",
        tracking_number: tr,
        shipping_provider: sp,
        carrier_label: carrierLabelFromCode(sp),
        tracking_url,
      },
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

export interface SubmitOrderClaimInput {
  token: string;
  shipping_name: string;
  shipping_address: string;
  shipping_phone: string;
  /** Optional — for payment/shipping notification emails */
  shipping_email?: string;
  file: File;
}

export interface ClaimSubmitResult extends UploadSlipResult {
  claim: ClaimAssociateResult;
}

export async function submitOrderClaim(
  input: SubmitOrderClaimInput
): Promise<ServiceResult<ClaimSubmitResult>> {
  try {
    const token = input.token?.trim();
    const shipping_name = input.shipping_name?.trim() ?? "";
    const shipping_address = input.shipping_address?.trim() ?? "";
    const shipping_phone = input.shipping_phone?.trim() ?? "";
    const shipping_email = input.shipping_email?.trim() ?? "";
    const { file } = input;

    if (!token) return { data: null, error: "Invalid link" };
    if (!shipping_name || !shipping_address || !shipping_phone) {
      return { data: null, error: "Name, address, and phone are required" };
    }
    if (shipping_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping_email)) {
      return { data: null, error: "Invalid email address" };
    }

    const order = await prisma.orders.findFirst({
      where: { claim_token: token },
      select: {
        id: true,
        order_number: true,
        status: true,
        slip_url: true,
        total_amount: true,
      },
    });
    if (!order) return { data: null, error: "Order not found" };
    if (order.status !== "PENDING_INFO") {
      return { data: null, error: "Order already processed" };
    }
    if (order.slip_url) return { data: null, error: "Slip already uploaded" };

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!ALLOWED_EXT.includes(ext)) {
      return { data: null, error: "Allowed file types: jpg, png, webp, pdf" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { data: null, error: "File too large (max 5MB)" };
    }

    const path = `claim-${order.order_number}-${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || (ext === "pdf" ? "application/pdf" : "image/jpeg");

    const supabase = await createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(SLIP_BUCKET)
      .upload(path, buffer, { cacheControl: "3600", upsert: true, contentType });

    if (uploadError) {
      console.error("[order-service] claim storage upload error:", uploadError.message);
      return { data: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from(SLIP_BUCKET).getPublicUrl(path);
    const slipUrl = data.publicUrl;

    await prisma.orders.update({
      where: { id: order.id },
      data: {
        shipping_name,
        shipping_address,
        shipping_phone,
        shipping_email: shipping_email || null,
        customer_name: shipping_name,
        customer_phone: shipping_phone,
        slip_url: slipUrl,
        status: "AWAITING_VERIFICATION",
      },
    });

    const displayName = shipping_name;
    const totalFmt = Number(order.total_amount).toLocaleString("th-TH", {
      maximumFractionDigits: 0,
    });
    void sendAdminNotification(
      [
        `💰 Claim submitted #${order.order_number}`,
        `Customer: ${displayName}`,
        `Total: ฿${totalFmt}`,
        `Please verify in the Admin Dashboard.`,
      ].join("\n")
    );

    let claim: ClaimAssociateResult = {
      linked: false,
      isExisting: false,
      displayName: shipping_name,
      showSetPasswordHint: false,
    };
    try {
      claim = await linkOrderToCustomerAfterClaim({
        orderId: order.id,
        fullName: shipping_name,
        address: shipping_address,
        phone: shipping_phone,
        email: shipping_email || null,
      });
    } catch (assocErr) {
      console.error("[order-service] submitOrderClaim associate:", assocErr);
    }

    return { data: { slip_url: slipUrl, claim }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] submitOrderClaim error:", msg);
    return { data: null, error: msg };
  }
}

// ─── fetchEmailItems ──────────────────────────────────────────────────────────

export interface EmailItem {
  variantId: number;
  /** Plain product title (no breeder suffix). */
  productName: string;
  breederName: string | null;
  genetics: string | null;
  /** Short label e.g. "Auto · Fem" */
  typeLabel: string;
  /** Pack size label from unit_label, e.g. "5 Seeds" */
  unitLabel: string;
  qty: number;
  price: number;
}

function emailTypeLabel(
  flowering: string | null,
  seedType: string | null,
  sexType: string | null
): string {
  const parts: string[] = [];
  const ft = (flowering ?? "").toLowerCase();
  if (ft.includes("auto")) parts.push("Auto");
  else if (ft === "photo_ff") parts.push("Photo FF");
  else if (ft === "photo_3n") parts.push("Photo 3N");
  else if (ft.includes("photo")) parts.push("Photo");
  const sex = (sexType ?? "").toLowerCase();
  const st = (seedType ?? "").toLowerCase();
  if (st.includes("fem") || sex.includes("fem")) parts.push("Fem");
  else if (st.includes("reg") || sex.includes("reg")) parts.push("Reg");
  return parts.length ? parts.join(" · ") : "—";
}

/**
 * Enriches checkout items for the email template.
 * Joins product_variants → products → breeders to build human-readable labels.
 * Falls back gracefully if any join is missing.
 */
export async function fetchEmailItems(
  checkoutItems: { variantId: number; quantity: number; price: number }[]
): Promise<EmailItem[]> {
  if (checkoutItems.length === 0) return [];

  try {
    const sql = getSql();
    const variantIds = checkoutItems.map((i) => i.variantId);

    const rows = await sql<{
      variant_id: number;
      product_name: string;
      flowering_type: string | null;
      seed_type: string | null;
      sex_type: string | null;
      genetics: string | null;
      strain_dominance: string | null;
      breeder_name: string | null;
      unit_label: string | null;
    }[]>`
      SELECT
        pv.id         AS variant_id,
        p.name        AS product_name,
        p.flowering_type,
        p.seed_type,
        p.sex_type,
        p.genetics,
        p.strain_dominance,
        b.name        AS breeder_name,
        pv.unit_label
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN breeders b ON b.id = p.breeder_id
      WHERE pv.id IN ${sql(variantIds)}
    `;

    const infoMap = new Map(
      rows.map((r) => [Number(r.variant_id), r] as const)
    );

    return checkoutItems.map((item) => {
      const info = infoMap.get(Number(item.variantId));
      if (!info) {
        return {
          variantId: item.variantId,
          productName: `Product #${item.variantId}`,
          breederName: null,
          genetics: null,
          typeLabel: "—",
          unitLabel: "",
          qty: item.quantity,
          price: item.price,
        };
      }

      const genetics =
        info.genetics?.trim() || info.strain_dominance?.trim() || null;
      const typeLabel = emailTypeLabel(
        info.flowering_type,
        info.seed_type,
        info.sex_type
      );

      return {
        variantId: item.variantId,
        productName: info.product_name,
        breederName: info.breeder_name,
        genetics,
        typeLabel,
        unitLabel: info.unit_label ?? "",
        qty: item.quantity,
        price: item.price,
      };
    });
  } catch (err) {
    console.error("[order-service] fetchEmailItems error:", err);
    // Fallback: return items without enrichment rather than crashing
    return checkoutItems.map((item) => ({
      variantId: item.variantId,
      productName: `Product #${item.variantId}`,
      breederName: null,
      genetics: null,
      typeLabel: "—",
      unitLabel: "",
      qty: item.quantity,
      price: item.price,
    }));
  }
}
