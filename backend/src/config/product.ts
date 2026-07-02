export const PRODUCT_WEIGHT = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  pc: "pc",
} as const;

export type ProductWeight = (typeof PRODUCT_WEIGHT)[keyof typeof PRODUCT_WEIGHT];
