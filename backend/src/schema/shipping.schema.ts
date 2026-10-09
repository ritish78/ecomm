import z from "zod";
import { formatMinorUnits, priceToMinorUnit } from "../utils/money";

const shippingAmountSchema = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/, {
    error: "Please provide a valid shipping amount!",
  })
  .transform((value) => formatMinorUnits(priceToMinorUnit(value)));

export const updateStoreShippingSchema = z
  .object({
    shippingFee: shippingAmountSchema,
    freeShippingThreshold: shippingAmountSchema
      .refine((value) => priceToMinorUnit(value) > 0n, {
        error: "The free shipping threshold must be greater than 0",
      })
      .nullable(),
  })
  .strict();

export const updateProductVariantShippingFeeSchema = z
  .object({
    additionalShippingFee: shippingAmountSchema,
    reason: z.string().trim().min(1).max(100).optional(),
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type UpdateStoreShippingInput = z.infer<typeof updateStoreShippingSchema>;
export type UpdateProductVariantShippingFeeInput = z.infer<typeof updateProductVariantShippingFeeSchema>;
