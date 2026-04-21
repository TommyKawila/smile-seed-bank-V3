import type { Json } from "@/types/database.types";
import type {
  ProductVariantRow,
  ProductWithBreeder as ProductWithBreederQuery,
  ProductWithBreederAndVariants,
} from "@/lib/supabase/types";

// TypeScript interfaces mapped exactly from 3_DB_SCHEMA_RLS.md

export type { Json };

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "AWAITING_VERIFICATION";
export type OrderOrigin = "WEB" | "MANUAL";
/** DB: lowercase international standard */
export type FloweringType = "autoflower" | "photoperiod" | "photo_ff" | "photo_3n";
/** DB: lowercase — distinct from seed pack FEMINIZED/REGULAR column when both exist */
export type ProductSexType = "feminized" | "regular";
export type SeedType = "FEMINIZED" | "REGULAR";
export type DiscountType = "PERCENTAGE" | "FIXED";

// ─── Tables ──────────────────────────────────────────────────────────────────

export interface StoreSettings {
  id: number;
  store_name: string | null;
  logo_url: string | null;
  contact_email: string | null;
  support_phone: string | null;
  address: string | null;
}

export interface Breeder {
  id: number;
  name: string;
  logo_url: string | null;
  description: string | null;
  description_en: string | null;
  summary_th: string | null;
  summary_en: string | null;
  highlight_origin_th: string | null;
  highlight_origin_en: string | null;
  highlight_specialty_th: string | null;
  highlight_specialty_en: string | null;
  highlight_reputation_th: string | null;
  highlight_reputation_en: string | null;
  highlight_focus_th: string | null;
  highlight_focus_en: string | null;
  is_active: boolean;
}

export interface Product {
  id: number;
  breeder_id: number | null;
  name: string;
  slug?: string | null;
  master_sku?: string | null;
  category: string | null;
  description_th: string | null;
  description_en: string | null;
  price: number | null; // Denormalized starting price (DB column)
  stock: number | null; // Denormalized total stock (DB column)
  is_active: boolean;
  /** Homepage featured carousel */
  is_featured?: boolean | null;
  featured_priority?: number | null;
  featured_tagline?: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  image_url_5: string | null;
  image_urls: Json | null;    // JSONB array of all image URLs (primary storage)
  video_url: string | null;
  // AI Extracted Specs
  thc_percent: number | null;
  cbd_percent: string | null;
  genetics: string | null;
  indica_ratio: number | null;
  sativa_ratio: number | null;
  /** Integer 0–100; pair with indica_percent (sum 100). */
  sativa_percent?: number | null;
  indica_percent?: number | null;
  strain_dominance: string | null;  // Mostly Indica | Mostly Sativa | Hybrid 50/50
  flowering_type: FloweringType | null;
  seed_type: SeedType | null;
  yield_info: string | null;
  growing_difficulty: string | null;
  effects: Json | null;
  flavors: Json | null;
  medical_benefits: Json | null;
  // Extended Specs (Phase 7+)
  genetic_ratio: string | null;   // e.g. "Sativa 70% / Indica 30%"
  sex_type: ProductSexType | string | null;
  lineage: string | null;         // e.g. "OG Kush x White Widow"
  terpenes: Json | null;          // Array of terpene names
  /** SEO bundle from AI importer: meta_title_th, meta_description_th, meta_title_en, meta_description_en */
  seo_meta: Json | null;
}

/** Aligns with `product_variants` Row in `types/database.types.ts` (+ optional app fields). */
export interface ProductVariant {
  id: number;
  product_id: number | null;
  unit_label: string;
  cost_price: number | null;
  price: number;
  stock: number | null;
  is_active: boolean | null;
  sku?: string | null;
  low_stock_threshold?: number | null;
  created_at?: string | null;
  pack_size?: string | null;
}

export interface DiscountTier {
  id: number;
  min_amount: number;
  discount_percentage: number;
  is_active: boolean;
}

export interface TieredDiscountRule {
  id: number;
  min_spend: number;
  discount_percent: number;
  sort_order: number;
}

export interface ShippingRule {
  id: number;
  category_name: string;
  base_fee: number;
  free_shipping_threshold: number;
}

export interface Promotion {
  id: number;
  name: string;
  condition_type: string;   // e.g. 'MIN_SPEND', 'TIME_RANGE', 'PAYMENT_METHOD'
  condition_value: string;
  reward_variant_id: number | null;
  reward_quantity: number;
  is_active: boolean;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_spend: number | null;
  is_active: boolean;
  usage_limit_per_user?: number | null;
  expiry_date?: string | null;
  requires_auth?: boolean | null;
  first_order_only?: boolean | null;
  /** Public image URL for storefront floating badge */
  badge_url?: string | null;
  badge_lottie_url?: string | null;
}

export interface PromoCodeUsage {
  id: number;
  promo_code_id: number;
  order_id: number | null;
  customer_email: string | null;
  customer_phone: string | null;
}

export interface CouponRedemption {
  id: number;
  coupon_id: number;
  user_id: string | null;
  email: string;
  order_id: number | null;
  created_at: string;
}

export interface Customer {
  id: string;               // uuid — mirrors auth.users.id
  full_name: string | null;
  email: string | null;
  role?: string | null;
  phone: string | null;
  address: string | null;
  line_user_id: string | null;
  is_wholesale: boolean;
  wholesale_discount_percent: number | null;
  has_seen_welcome: boolean; // first-login welcome modal
}

export interface Order {
  id: number;
  order_number: string;
  source_quotation_number?: string | null;
  customer_id: string | null;
  order_origin: OrderOrigin;
  payment_method: string | null;
  shipping_address: string | null;  // Snapshot ที่อยู่จัดส่ง ณ วันที่สั่ง
  total_amount: number;
  shipping_fee?: number;
  discount_amount?: number;
  total_cost: number;       // COGS snapshot at time of sale
  status: OrderStatus;
  tracking_number: string | null;
  slip_url: string | null;  // Payment slip for TRANSFER method
  reject_note: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;       // Price snapshot at time of sale
  unit_cost: number;        // Cost snapshot at time of sale
}

/** Single-row table: payment methods stored as JSON (see admin payment settings). */
export interface PaymentSettingsRow {
  id: number;
  bank_accounts: Json | null;
  prompt_pay: Json | null;
  crypto_wallets: Json | null;
  line_id: string | null;
  messenger_url: string | null;
  updated_at: string | null;
}

export interface Blog {
  id: number;
  slug: string;
  title: string | null;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string | null;
  content_en: string | null;
  image_url: string | null;
  category: string | null;
  view_count: number;
  is_published: boolean;
  created_at: string;
}

// ─── Joined / Derived Types (aligned with Supabase generated schema) ───────────

/** Row from `products` + embedded `breeders(id, name, logo_url)` */
export type ProductWithBreeder = ProductWithBreederQuery;

/** Full product + breeder embed + all variant rows (see useProducts / product-service selects) */
export type ProductFull = Omit<ProductWithBreederAndVariants, "product_variants" | "product_images"> & {
  product_variants: ProductVariantRow[];
  product_images?: import("@/lib/supabase/types").ProductImageRow[] | null;
};

/** List rows when API includes optional `product_variants` (e.g. POS product search). */
export type ProductWithBreederMaybeVariants = ProductWithBreeder & {
  product_variants?: ProductVariantRow[];
};

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product_variants: ProductVariant & { products: Pick<Product, "id" | "name" | "image_url"> } })[];
  customers: Pick<Customer, "id" | "full_name" | "email" | "phone" | "address"> | null;
}

// ─── Cart Types (Client-Side) ─────────────────────────────────────────────────

export interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  productImage: string | null;
  unitLabel: string;
  price: number;
  quantity: number;
  /** Variant available stock (from `product_variants.stock`) at add-to-cart time */
  stock_quantity?: number;
  isFreeGift?: boolean;
  masterSku?: string | null; // For tiered discount aggregation by strain
  breeder_id?: number | null; // For promotion rules (BUY_X_GET_Y)
  /** From `breeders.logo_url` when item was added */
  breederLogoUrl?: string | null;
  /** From `breeders.name` when item was added (order share / receipts) */
  breederName?: string | null;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  discountPercent: number;
  tierDiscount: number;
  promoDiscount: number;
  shipping: number;
  total: number;
  appliedTier: DiscountTier | null;
  upsellMessage: string | null;
  /** When a promo code is entered, true only if coupon beats auto tier (exclusive best deal). */
  usePromoForOrder: boolean;
  /** Promo applied in UI but auto tier gives equal or better total — coupon not applied at checkout. */
  promoSupersededByTier?: boolean;
}

// ─── Database (Supabase CLI — single source of truth for clients) ────────────

export type { Database } from "@/types/database.types";
export type { ProductRow, ProductVariantRow } from "@/lib/supabase/types";
