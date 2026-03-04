/**
 * Order Service — all database logic for orders.
 * Routes call these functions; no raw SQL in route files.
 */
import { getSql } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/utils";

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
    const sql = getSql();
    const { customer, items, summary, payment_method, customer_id, promo_code_id } = input;
    const resolvedCustomerId = customer_id ?? null;

    // Fetch cost prices before transaction (read-only)
    const variantIds = items.map((i) => i.variantId);
    const variantRows = await sql<{ id: number; cost_price: number }[]>`
      SELECT id, cost_price FROM product_variants WHERE id IN ${sql(variantIds)}
    `;
    const costMap = new Map(variantRows.map((v) => [v.id, v.cost_price ?? 0]));
    const totalCost = items.reduce(
      (sum, item) => sum + (costMap.get(item.variantId) ?? 0) * item.quantity,
      0
    );

    const orderNumber = generateOrderNumber();

    const result = await sql.begin(async (tx) => {
      // 1. Upsert customer profile if logged in
      if (resolvedCustomerId) {
        await tx`
          INSERT INTO customers (id, full_name, phone, address, email, line_user_id)
          VALUES (
            ${resolvedCustomerId}, ${customer.full_name}, ${customer.phone},
            ${customer.address}, ${customer.email ?? null}, ${customer.line_user_id ?? null}
          )
          ON CONFLICT (id) DO UPDATE SET
            full_name    = EXCLUDED.full_name,
            phone        = EXCLUDED.phone,
            address      = EXCLUDED.address,
            email        = COALESCE(EXCLUDED.email, customers.email),
            line_user_id = COALESCE(EXCLUDED.line_user_id, customers.line_user_id)
        `;
      }

      // 2. Insert order
      const [orderRow] = await tx<{ id: bigint }[]>`
        INSERT INTO orders
          (order_number, customer_id, order_origin, payment_method, shipping_address, total_amount, total_cost, status)
        VALUES
          (${orderNumber}, ${resolvedCustomerId}, 'WEB', ${payment_method},
           ${customer.address}, ${summary.total}, ${totalCost}, 'PENDING')
        RETURNING id
      `;
      const orderId = Number(orderRow.id);

      // 3. Insert order_items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        variant_id: item.variantId,
        product_name: item.productName || "Unknown",
        quantity: item.quantity,
        unit_price: item.price,
        unit_cost: costMap.get(item.variantId) ?? 0,
      }));
      if (orderItems.length > 0) {
        await tx`INSERT INTO order_items ${tx(orderItems)}`;
      }

      // 4. Record promo usage
      if (promo_code_id) {
        await tx`
          INSERT INTO promo_code_usages (promo_code_id, order_id, customer_email, customer_phone)
          VALUES (${promo_code_id}, ${orderId}, ${customer.email ?? null}, ${customer.phone})
        `;
        const redemptionEmail = customer.email ?? customer.phone;
        await tx`
          INSERT INTO coupon_redemptions (coupon_id, user_id, email, order_id)
          VALUES (${promo_code_id}, ${resolvedCustomerId}, ${redemptionEmail}, ${orderId})
        `;
      }

      return { orderId };
    });

    return { data: { orderNumber, orderId: result.orderId }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] createOrder error:", msg);
    return { data: null, error: msg };
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

    // Guard: validate order + payment method
    const rows = await sql<{ id: number; payment_method: string | null; slip_url: string | null }[]>`
      SELECT id, payment_method, slip_url FROM orders WHERE order_number = ${orderNumber} LIMIT 1
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

    return { data: { slip_url: slipUrl }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[order-service] uploadSlip error:", msg);
    return { data: null, error: msg };
  }
}

// ─── fetchEmailItems ──────────────────────────────────────────────────────────

export interface EmailItem {
  variantId: number;
  /** Formatted: "Lemon Paya (Photo) by Sensi Seeds" */
  name: string;
  /** Pack size label from unit_label, e.g. "5 Seeds" */
  unitLabel: string;
  qty: number;
  price: number;
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
      breeder_name: string | null;
      unit_label: string | null;
    }[]>`
      SELECT
        pv.id         AS variant_id,
        p.name        AS product_name,
        p.flowering_type,
        b.name        AS breeder_name,
        pv.unit_label
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN breeders b ON b.id = p.breeder_id
      WHERE pv.id IN ${sql(variantIds)}
    `;

    const infoMap = new Map(rows.map((r) => [r.variant_id, r]));

    return checkoutItems.map((item) => {
      const info = infoMap.get(item.variantId);
      if (!info) {
        return {
          variantId: item.variantId,
          name: `Product #${item.variantId}`,
          unitLabel: "",
          qty: item.quantity,
          price: item.price,
        };
      }

      // e.g. "Photo" | "Auto"
      const flowerLabel =
        info.flowering_type === "AUTO" ? "Auto"
        : info.flowering_type === "PHOTO" ? "Photo"
        : null;

      // e.g. "Lemon Paya (Photo) by Sensi Seeds"
      let nameParts = info.product_name;
      if (flowerLabel) nameParts += ` (${flowerLabel})`;
      if (info.breeder_name) nameParts += ` by ${info.breeder_name}`;

      return {
        variantId: item.variantId,
        name: nameParts,
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
      name: `Product #${item.variantId}`,
      unitLabel: "",
      qty: item.quantity,
      price: item.price,
    }));
  }
}
