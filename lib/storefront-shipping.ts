/** Primary category for `shipping_rules.category_name` — must match `hooks/useCart` cart summary. */
export const STOREFRONT_SHIPPING_CATEGORY = "Seeds" as const;

/** Admin save → open storefront tabs refetch `shipping_rules` via `BroadcastChannel`. */
export const SHIPPING_RULES_BROADCAST_CHANNEL = "ssb-shipping-rules";
