import z from "zod";
import { MAX_VARIANT_STOCK } from "../config/product";

export const setCartItemSchema = z
  .object({
    storeId: z.uuid(),
    variantId: z.uuid(),
    quantity: z.number().min(1).max(MAX_VARIANT_STOCK),
  })
  .strict();

export type SetCartItemInput = z.infer<typeof setCartItemSchema>;
