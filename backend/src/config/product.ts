export const PRODUCT_WEIGHT = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  pc: "pc",
} as const;

export type ProductWeight = (typeof PRODUCT_WEIGHT)[keyof typeof PRODUCT_WEIGHT];

//stock is stored as a postgres integer.
export const MAX_VARIANT_STOCK = 2147483647;

export const STOCK_ADJUSTMENT_REASONS = [
  "replenishment",
  "customer_return",
  "damaged",
  "lost",
  "correction",
] as const;