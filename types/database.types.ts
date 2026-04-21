export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: Json | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: number
          published_at: string | null
          related_products: number[] | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: Json | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: number
          published_at?: string | null
          related_products?: number[] | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: number
          published_at?: string | null
          related_products?: number[] | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          category: string | null
          content: string | null
          content_en: string | null
          created_at: string | null
          excerpt: string | null
          excerpt_en: string | null
          id: number
          image_url: string | null
          is_published: boolean | null
          slug: string
          title: string | null
          title_en: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          content_en?: string | null
          created_at?: string | null
          excerpt?: string | null
          excerpt_en?: string | null
          id?: never
          image_url?: string | null
          is_published?: boolean | null
          slug: string
          title?: string | null
          title_en?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          content_en?: string | null
          created_at?: string | null
          excerpt?: string | null
          excerpt_en?: string | null
          id?: never
          image_url?: string | null
          is_published?: boolean | null
          slug?: string
          title?: string | null
          title_en?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      breeders: {
        Row: {
          allowed_packages: Json | null
          created_at: string | null
          description: string | null
          description_en: string | null
          focus_en: string | null
          focus_th: string | null
          highlight_focus_en: string | null
          highlight_focus_th: string | null
          highlight_origin_en: string | null
          highlight_origin_th: string | null
          highlight_reputation_en: string | null
          highlight_reputation_th: string | null
          highlight_specialty_en: string | null
          highlight_specialty_th: string | null
          id: number
          is_active: boolean | null
          logo_url: string | null
          name: string
          origin_en: string | null
          origin_th: string | null
          reputation_en: string | null
          reputation_th: string | null
          specialty_en: string | null
          specialty_th: string | null
          summary_en: string | null
          summary_th: string | null
        }
        Insert: {
          allowed_packages?: Json | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          focus_en?: string | null
          focus_th?: string | null
          highlight_focus_en?: string | null
          highlight_focus_th?: string | null
          highlight_origin_en?: string | null
          highlight_origin_th?: string | null
          highlight_reputation_en?: string | null
          highlight_reputation_th?: string | null
          highlight_specialty_en?: string | null
          highlight_specialty_th?: string | null
          id?: never
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          origin_en?: string | null
          origin_th?: string | null
          reputation_en?: string | null
          reputation_th?: string | null
          specialty_en?: string | null
          specialty_th?: string | null
          summary_en?: string | null
          summary_th?: string | null
        }
        Update: {
          allowed_packages?: Json | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          focus_en?: string | null
          focus_th?: string | null
          highlight_focus_en?: string | null
          highlight_focus_th?: string | null
          highlight_origin_en?: string | null
          highlight_origin_th?: string | null
          highlight_reputation_en?: string | null
          highlight_reputation_th?: string | null
          highlight_specialty_en?: string | null
          highlight_specialty_th?: string | null
          id?: never
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          origin_en?: string | null
          origin_th?: string | null
          reputation_en?: string | null
          reputation_th?: string | null
          specialty_en?: string | null
          specialty_th?: string | null
          summary_en?: string | null
          summary_th?: string | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: number | null
          created_at: string | null
          email: string
          id: number
          order_id: number | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: number | null
          created_at?: string | null
          email: string
          id?: number
          order_id?: number | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: number | null
          created_at?: string | null
          email?: string
          id?: number
          order_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      Customer: {
        Row: {
          address: string | null
          created_at: string
          id: number
          is_active: boolean
          line_id: string | null
          name: string
          notes: string | null
          phone: string
          points: number
          preference: string | null
          tier: Database["public"]["Enums"]["CustomerTier"]
          total_spend: number
          updated_at: string
          wholesale_discount_percent: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          line_id?: string | null
          name: string
          notes?: string | null
          phone: string
          points?: number
          preference?: string | null
          tier?: Database["public"]["Enums"]["CustomerTier"]
          total_spend?: number
          updated_at?: string
          wholesale_discount_percent?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          line_id?: string | null
          name?: string
          notes?: string | null
          phone?: string
          points?: number
          preference?: string | null
          tier?: Database["public"]["Enums"]["CustomerTier"]
          total_spend?: number
          updated_at?: string
          wholesale_discount_percent?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_wholesale: boolean | null
          line_user_id: string | null
          phone: string | null
          role: string | null
          wholesale_discount_percent: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_wholesale?: boolean | null
          line_user_id?: string | null
          phone?: string | null
          role?: string | null
          wholesale_discount_percent?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_wholesale?: boolean | null
          line_user_id?: string | null
          phone?: string | null
          role?: string | null
          wholesale_discount_percent?: number | null
        }
        Relationships: []
      }
      discount_tiers: {
        Row: {
          discount_percentage: number
          id: number
          is_active: boolean | null
          min_amount: number
        }
        Insert: {
          discount_percentage: number
          id?: never
          is_active?: boolean | null
          min_amount: number
        }
        Update: {
          discount_percentage?: number
          id?: never
          is_active?: boolean | null
          min_amount?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: number
          order_id: number | null
          product_id: number | null
          product_name: string
          quantity: number
          subtotal: number | null
          total_price: number | null
          unit_cost: number | null
          unit_label: string | null
          unit_price: number
          variant_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          order_id?: number | null
          product_id?: number | null
          product_name: string
          quantity?: number
          subtotal?: number | null
          total_price?: number | null
          unit_cost?: number | null
          unit_label?: string | null
          unit_price: number
          variant_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          order_id?: number | null
          product_id?: number | null
          product_name?: string
          quantity?: number
          subtotal?: number | null
          total_price?: number | null
          unit_cost?: number | null
          unit_label?: string | null
          unit_price?: number
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_note: string | null
          customer_phone: string | null
          customer_profile_id: number | null
          discount_amount: number
          id: number
          order_number: string
          order_origin: string | null
          payment_method: string | null
          points_discount_amount: number
          points_redeemed: number
          promotion_discount_amount: number
          promotion_rule_id: number | null
          reject_note: string | null
          shipping_address: string | null
          shipping_fee: number
          shipping_provider: string | null
          slip_url: string | null
          source_quotation_number: string | null
          status: string | null
          total_amount: number
          total_cost: number | null
          tracking_number: string | null
          void_reason: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          customer_profile_id?: number | null
          discount_amount?: number
          id?: never
          order_number: string
          order_origin?: string | null
          payment_method?: string | null
          points_discount_amount?: number
          points_redeemed?: number
          promotion_discount_amount?: number
          promotion_rule_id?: number | null
          reject_note?: string | null
          shipping_address?: string | null
          shipping_fee?: number
          shipping_provider?: string | null
          slip_url?: string | null
          source_quotation_number?: string | null
          status?: string | null
          total_amount: number
          total_cost?: number | null
          tracking_number?: string | null
          void_reason?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          customer_profile_id?: number | null
          discount_amount?: number
          id?: never
          order_number?: string
          order_origin?: string | null
          payment_method?: string | null
          points_discount_amount?: number
          points_redeemed?: number
          promotion_discount_amount?: number
          promotion_rule_id?: number | null
          reject_note?: string | null
          shipping_address?: string | null
          shipping_fee?: number
          shipping_provider?: string | null
          slip_url?: string | null
          source_quotation_number?: string | null
          status?: string | null
          total_amount?: number
          total_cost?: number | null
          tracking_number?: string | null
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          bank_accounts: Json | null
          crypto_wallets: Json | null
          id: number
          line_id: string | null
          messenger_url: string | null
          prompt_pay: Json | null
          updated_at: string | null
        }
        Insert: {
          bank_accounts?: Json | null
          crypto_wallets?: Json | null
          id?: number
          line_id?: string | null
          messenger_url?: string | null
          prompt_pay?: Json | null
          updated_at?: string | null
        }
        Update: {
          bank_accounts?: Json | null
          crypto_wallets?: Json | null
          id?: number
          line_id?: string | null
          messenger_url?: string | null
          prompt_pay?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          id: number
          name: string
          sort_order: number | null
        }
        Insert: {
          id?: number
          name: string
          sort_order?: number | null
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: number
          product_id: number
          variant_id: number | null
          url: string
          is_main: boolean
          sort_order: number
          created_at: string | null
        }
        Insert: {
          id?: never
          product_id: number
          variant_id?: number | null
          url: string
          is_main?: boolean
          sort_order?: number
          created_at?: string | null
        }
        Update: {
          id?: never
          product_id?: number
          variant_id?: number | null
          url?: string
          is_main?: boolean
          sort_order?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          cost_price: number | null
          created_at: string | null
          id: number
          is_active: boolean | null
          low_stock_threshold: number | null
          price: number
          product_id: number | null
          sku: string | null
          stock: number | null
          unit_label: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          low_stock_threshold?: number | null
          price: number
          product_id?: number | null
          sku?: string | null
          stock?: number | null
          unit_label: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          low_stock_threshold?: number | null
          price?: number
          product_id?: number | null
          sku?: string | null
          stock?: number | null
          unit_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          breeder_id: number | null
          category: string | null
          category_id: number | null
          cbd_percent: string | null
          created_at: string | null
          description_en: string | null
          description_th: string | null
          effects: Json | null
          featured_priority: number | null
          featured_tagline: string | null
          flavors: Json | null
          flowering_type: string | null
          genetic_ratio: string | null
          genetics: string | null
          growing_difficulty: string | null
          id: number
          image_url: string | null
          image_url_2: string | null
          image_url_3: string | null
          image_url_4: string | null
          image_url_5: string | null
          image_urls: Json | null
          indica_ratio: number | null
          is_active: boolean | null
          is_featured: boolean | null
          lineage: string | null
          master_sku: string | null
          medical_benefits: Json | null
          name: string
          slug: string | null
          price: number | null
          sativa_ratio: number | null
          seed_type: string | null
          seo_meta: Json | null
          sex_type: string | null
          stock: number | null
          strain_dominance: string | null
          terpenes: Json | null
          thc_percent: number | null
          video_url: string | null
          yield_info: string | null
        }
        Insert: {
          breeder_id?: number | null
          category?: string | null
          category_id?: number | null
          cbd_percent?: string | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          effects?: Json | null
          featured_priority?: number | null
          featured_tagline?: string | null
          flavors?: Json | null
          flowering_type?: string | null
          genetic_ratio?: string | null
          genetics?: string | null
          growing_difficulty?: string | null
          id?: never
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          image_url_4?: string | null
          image_url_5?: string | null
          image_urls?: Json | null
          indica_ratio?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lineage?: string | null
          master_sku?: string | null
          medical_benefits?: Json | null
          name: string
          slug?: string | null
          price?: number | null
          sativa_ratio?: number | null
          seed_type?: string | null
          seo_meta?: Json | null
          sex_type?: string | null
          stock?: number | null
          strain_dominance?: string | null
          terpenes?: Json | null
          thc_percent?: number | null
          video_url?: string | null
          yield_info?: string | null
        }
        Update: {
          breeder_id?: number | null
          category?: string | null
          category_id?: number | null
          cbd_percent?: string | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          effects?: Json | null
          featured_priority?: number | null
          featured_tagline?: string | null
          flavors?: Json | null
          flowering_type?: string | null
          genetic_ratio?: string | null
          genetics?: string | null
          growing_difficulty?: string | null
          id?: never
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          image_url_4?: string | null
          image_url_5?: string | null
          image_urls?: Json | null
          indica_ratio?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lineage?: string | null
          master_sku?: string | null
          medical_benefits?: Json | null
          name?: string
          slug?: string | null
          price?: number | null
          sativa_ratio?: number | null
          seed_type?: string | null
          seo_meta?: Json | null
          sex_type?: string | null
          stock?: number | null
          strain_dominance?: string | null
          terpenes?: Json | null
          thc_percent?: number | null
          video_url?: string | null
          yield_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_breeder_id_fkey"
            columns: ["breeder_id"]
            isOneToOne: false
            referencedRelation: "breeders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products_backup_20260330: {
        Row: {
          breeder_id: number | null
          category: string | null
          category_id: number | null
          cbd_percent: string | null
          created_at: string | null
          description_en: string | null
          description_th: string | null
          effects: Json | null
          flavors: Json | null
          flowering_type: string | null
          genetic_ratio: string | null
          genetics: string | null
          growing_difficulty: string | null
          id: number | null
          image_url: string | null
          image_url_2: string | null
          image_url_3: string | null
          image_url_4: string | null
          image_url_5: string | null
          image_urls: Json | null
          indica_ratio: number | null
          is_active: boolean | null
          lineage: string | null
          master_sku: string | null
          medical_benefits: Json | null
          name: string | null
          price: number | null
          sativa_ratio: number | null
          seed_type: string | null
          seo_meta: Json | null
          sex_type: string | null
          stock: number | null
          strain_dominance: string | null
          terpenes: Json | null
          thc_percent: number | null
          video_url: string | null
          yield_info: string | null
        }
        Insert: {
          breeder_id?: number | null
          category?: string | null
          category_id?: number | null
          cbd_percent?: string | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          effects?: Json | null
          flavors?: Json | null
          flowering_type?: string | null
          genetic_ratio?: string | null
          genetics?: string | null
          growing_difficulty?: string | null
          id?: number | null
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          image_url_4?: string | null
          image_url_5?: string | null
          image_urls?: Json | null
          indica_ratio?: number | null
          is_active?: boolean | null
          lineage?: string | null
          master_sku?: string | null
          medical_benefits?: Json | null
          name?: string | null
          price?: number | null
          sativa_ratio?: number | null
          seed_type?: string | null
          seo_meta?: Json | null
          sex_type?: string | null
          stock?: number | null
          strain_dominance?: string | null
          terpenes?: Json | null
          thc_percent?: number | null
          video_url?: string | null
          yield_info?: string | null
        }
        Update: {
          breeder_id?: number | null
          category?: string | null
          category_id?: number | null
          cbd_percent?: string | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          effects?: Json | null
          flavors?: Json | null
          flowering_type?: string | null
          genetic_ratio?: string | null
          genetics?: string | null
          growing_difficulty?: string | null
          id?: number | null
          image_url?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          image_url_4?: string | null
          image_url_5?: string | null
          image_urls?: Json | null
          indica_ratio?: number | null
          is_active?: boolean | null
          lineage?: string | null
          master_sku?: string | null
          medical_benefits?: Json | null
          name?: string | null
          price?: number | null
          sativa_ratio?: number | null
          seed_type?: string | null
          seo_meta?: Json | null
          sex_type?: string | null
          stock?: number | null
          strain_dominance?: string | null
          terpenes?: Json | null
          thc_percent?: number | null
          video_url?: string | null
          yield_info?: string | null
        }
        Relationships: []
      }
      promo_code_usages: {
        Row: {
          customer_email: string | null
          customer_phone: string | null
          id: number
          order_id: number | null
          promo_code_id: number | null
          used_at: string | null
        }
        Insert: {
          customer_email?: string | null
          customer_phone?: string | null
          id?: never
          order_id?: number | null
          promo_code_id?: number | null
          used_at?: string | null
        }
        Update: {
          customer_email?: string | null
          customer_phone?: string | null
          id?: never
          order_id?: number | null
          promo_code_id?: number | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          badge_lottie_url: string | null
          badge_url: string | null
          code: string
          discount_type: string | null
          discount_value: number | null
          expiry_date: string | null
          first_order_only: boolean | null
          id: number
          is_active: boolean | null
          min_spend: number | null
          requires_auth: boolean | null
          total_usage_limit: number | null
          usage_limit_per_user: number | null
        }
        Insert: {
          badge_lottie_url?: string | null
          badge_url?: string | null
          code: string
          discount_type?: string | null
          discount_value?: number | null
          expiry_date?: string | null
          first_order_only?: boolean | null
          id?: never
          is_active?: boolean | null
          min_spend?: number | null
          requires_auth?: boolean | null
          total_usage_limit?: number | null
          usage_limit_per_user?: number | null
        }
        Update: {
          badge_lottie_url?: string | null
          badge_url?: string | null
          code?: string
          discount_type?: string | null
          discount_value?: number | null
          expiry_date?: string | null
          first_order_only?: boolean | null
          id?: never
          is_active?: boolean | null
          min_spend?: number | null
          requires_auth?: boolean | null
          total_usage_limit?: number | null
          usage_limit_per_user?: number | null
        }
        Relationships: []
      }
      promotion_rules: {
        Row: {
          conditions: Json | null
          description: string | null
          discount_value: number | null
          end_date: string
          id: number
          is_active: boolean
          name: string
          start_date: string
          type: Database["public"]["Enums"]["PromotionRuleType"]
        }
        Insert: {
          conditions?: Json | null
          description?: string | null
          discount_value?: number | null
          end_date: string
          id?: number
          is_active?: boolean
          name: string
          start_date: string
          type: Database["public"]["Enums"]["PromotionRuleType"]
        }
        Update: {
          conditions?: Json | null
          description?: string | null
          discount_value?: number | null
          end_date?: string
          id?: number
          is_active?: boolean
          name?: string
          start_date?: string
          type?: Database["public"]["Enums"]["PromotionRuleType"]
        }
        Relationships: []
      }
      promotions: {
        Row: {
          condition_type: string | null
          condition_value: string | null
          id: number
          is_active: boolean | null
          name: string
          reward_quantity: number | null
          reward_variant_id: number | null
        }
        Insert: {
          condition_type?: string | null
          condition_value?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          reward_quantity?: number | null
          reward_variant_id?: number | null
        }
        Update: {
          condition_type?: string | null
          condition_value?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          reward_quantity?: number | null
          reward_variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_reward_variant_id_fkey"
            columns: ["reward_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_daily_seq: {
        Row: {
          date: string
          seq: number
        }
        Insert: {
          date: string
          seq?: number
        }
        Update: {
          date?: string
          seq?: number
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          breeder_name: string | null
          discount: number
          id: number
          line_total: number
          product_id: number
          product_name: string
          quantity: number
          quotation_id: number
          unit_label: string | null
          unit_price: number
          variant_id: number
        }
        Insert: {
          breeder_name?: string | null
          discount?: number
          id?: number
          line_total: number
          product_id: number
          product_name: string
          quantity: number
          quotation_id: number
          unit_label?: string | null
          unit_price: number
          variant_id: number
        }
        Update: {
          breeder_name?: string | null
          discount?: number
          id?: number
          line_total?: number
          product_id?: number
          product_name?: string
          quantity?: number
          quotation_id?: number
          unit_label?: string | null
          unit_price?: number
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          converted_order_id: number | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_note: string | null
          customer_phone: string | null
          discount_amount: number
          id: number
          quotation_number: string
          shipping_cost: number
          status: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          converted_order_id?: number | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: number
          quotation_number: string
          shipping_cost?: number
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          converted_order_id?: number | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: number
          quotation_number?: string
          shipping_cost?: number
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      shipping_rules: {
        Row: {
          base_fee: number | null
          category_name: string
          free_shipping_threshold: number | null
          id: number
          is_active: boolean | null
        }
        Insert: {
          base_fee?: number | null
          category_name: string
          free_shipping_threshold?: number | null
          id?: never
          is_active?: boolean | null
        }
        Update: {
          base_fee?: number | null
          category_name?: string
          free_shipping_threshold?: number | null
          id?: never
          is_active?: boolean | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      stock_snapshots: {
        Row: {
          created_at: string
          id: number
          quantity: number
          snapshot_date: string
          total_value: number | null
          variant_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          quantity: number
          snapshot_date: string
          total_value?: number | null
          variant_id: number
        }
        Update: {
          created_at?: string
          id?: number
          quantity?: number
          snapshot_date?: string
          total_value?: number | null
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_snapshots_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string | null
          contact_email: string | null
          id: number
          logo_url: string | null
          store_name: string | null
          support_phone: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          id?: number
          logo_url?: string | null
          store_name?: string | null
          support_phone?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          id?: number
          logo_url?: string | null
          store_name?: string | null
          support_phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unused_coupons: {
        Args: { target_user_id: string }
        Returns: {
          code: string
          description: string
          discount_value: number
          min_order_amount: number
        }[]
      }
      has_used_welcome_coupon: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      CustomerTier: "Retail" | "Wholesale" | "VIP"
      PromotionRuleType: "DISCOUNT" | "BUY_X_GET_Y" | "FREEBIES" | "BUNDLE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      CustomerTier: ["Retail", "Wholesale", "VIP"],
      PromotionRuleType: ["DISCOUNT", "BUY_X_GET_Y", "FREEBIES", "BUNDLE"],
    },
  },
} as const
