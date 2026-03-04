// TypeScript interfaces mapped exactly from 3_DB_SCHEMA_RLS.md

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "AWAITING_VERIFICATION";
export type OrderOrigin = "WEB" | "MANUAL";
export type FloweringType = "AUTO" | "PHOTO";
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
  master_sku?: string | null;
  category: string | null;
  description_th: string | null;
  description_en: string | null;
  price: number;           // Starting price (calculated from cheapest variant)
  stock: number;           // Total stock (sum of all variants)
  is_active: boolean;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  image_url_5: string | null;
  image_urls: Json | null;    // JSONB array of all image URLs (primary storage)
  video_url: string | null;
  // AI Extracted Specs
  thc_percent: number | null;
  cbd_percent: number | null;
  genetics: string | null;
  indica_ratio: number | null;
  sativa_ratio: number | null;
  flowering_type: FloweringType | null;
  seed_type: SeedType | null;
  yield_info: string | null;
  growing_difficulty: string | null;
  effects: Json | null;
  flavors: Json | null;
  medical_benefits: Json | null;
  // Extended Specs (Phase 7+)
  genetic_ratio: string | null;   // e.g. "Sativa 70% / Indica 30%"
  sex_type: string | null;        // Regular / Feminized / Autoflower
  lineage: string | null;         // e.g. "OG Kush x White Widow"
  terpenes: Json | null;          // Array of terpene names
}

export interface ProductVariant {
  id: number;
  product_id: number;
  unit_label: string;       // e.g. "1 Seed", "5 Seeds", "10 Seeds"
  cost_price: number;       // COGS per unit
  price: number;            // Retail price (sale_price)
  stock: number;            // stock_quantity
  is_active: boolean;
  sku?: string | null;      // unique code (optional until migration)
  pack_size?: string | null; // e.g. "5" for 5 Seeds (optional)
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
  phone: string | null;
  address: string | null;
  line_user_id: string | null;
  is_wholesale: boolean;
  wholesale_discount_percent: number | null;
  has_seen_welcome: boolean; // first-login welcome modal
}

export interface Order {
  id: number;
  order_number: string;     // 6-digit
  customer_id: string | null;
  order_origin: OrderOrigin;
  payment_method: string | null;
  shipping_address: string | null;  // Snapshot ที่อยู่จัดส่ง ณ วันที่สั่ง
  total_amount: number;
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

// ─── Joined / Derived Types ───────────────────────────────────────────────────

export interface ProductWithBreeder extends Product {
  breeders: Pick<Breeder, "id" | "name" | "logo_url"> | null;
}

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
}

export interface ProductFull extends Product {
  breeders: Pick<Breeder, "id" | "name" | "logo_url"> | null;
  product_variants: ProductVariant[];
}

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
  isFreeGift?: boolean;
  masterSku?: string | null; // For tiered discount aggregation by strain
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
}

// ─── Database Generic Type (for Supabase client) ─────────────────────────────

// Matches the exact shape @supabase/postgrest-js v2 GenericTable expects
type TableDef<R, I, U> = {
  Row: R;
  Insert: I;
  Update: U;
  Relationships: never[];
};

export interface Database {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      store_settings: TableDef<StoreSettings, Partial<StoreSettings>, Partial<StoreSettings>>;
      breeders: TableDef<Breeder, Omit<Breeder, "id">, Partial<Omit<Breeder, "id">>>;
      products: TableDef<Product, Omit<Product, "id">, Partial<Omit<Product, "id">>>;
      product_variants: TableDef<ProductVariant, Omit<ProductVariant, "id">, Partial<Omit<ProductVariant, "id">>>;
      discount_tiers: TableDef<DiscountTier, Omit<DiscountTier, "id">, Partial<Omit<DiscountTier, "id">>>;
      tiered_discount_rules: TableDef<TieredDiscountRule, Omit<TieredDiscountRule, "id">, Partial<Omit<TieredDiscountRule, "id">>>;
      shipping_rules: TableDef<ShippingRule, Omit<ShippingRule, "id">, Partial<Omit<ShippingRule, "id">>>;
      promotions: TableDef<Promotion, Omit<Promotion, "id">, Partial<Omit<Promotion, "id">>>;
      promo_codes: TableDef<PromoCode, Omit<PromoCode, "id">, Partial<Omit<PromoCode, "id">>>;
      promo_code_usages: TableDef<PromoCodeUsage, Omit<PromoCodeUsage, "id">, Partial<Omit<PromoCodeUsage, "id">>>;
      coupon_redemptions: TableDef<CouponRedemption, Omit<CouponRedemption, "id">, Partial<Omit<CouponRedemption, "id">>>;
      customers: TableDef<Customer, Omit<Customer, "id">, Partial<Omit<Customer, "id">>>;
      orders: TableDef<Order, Omit<Order, "id" | "created_at">, Partial<Omit<Order, "id">>>;
      order_items: TableDef<OrderItem, Omit<OrderItem, "id">, Partial<Omit<OrderItem, "id">>>;
      blogs: TableDef<Blog, Omit<Blog, "id" | "created_at">, Partial<Omit<Blog, "id" | "created_at">>>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
