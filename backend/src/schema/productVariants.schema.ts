import { z } from "zod";
import { MAX_VARIANT_STOCK, PRODUCT_WEIGHT, STOCK_ADJUSTMENT_REASONS } from "../config/product";

const variantEditReasonSchema = z.string().trim().min(1, { error: "Please provide a reason for this edit!" });
const variantEditNoteSchema = z.string().trim().min(1, { error: "Please provide a note for this edit!" });

//weight and price are numeric (10, 2) in our database
//we accept 8 digits before the decimal and 2 digits after it
const decimalValueSchema = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/, {
    error: "Please provide a valid decimal value with at most 2 decimal places!",
  });

const variantWeightSchema = decimalValueSchema.refine((weight) => Number(weight) > 0, {
  error: "The weight must be more than 0",
});

const variantSkuSchema = z.string().trim().min(1, { error: "Please provide a valid SKU!" });

export const addProductVariantSchema = z
  .object({
    weight: variantWeightSchema,
    unit: z.enum(Object.values(PRODUCT_WEIGHT)),
    price: decimalValueSchema,
    stock: z.number().int().min(0).default(0),
    sku: variantSkuSchema.optional(),
  })
  .strict();

export const updateProductVariantSchema = z
  .object({
    weight: variantWeightSchema.optional(),
    unit: z.enum(Object.values(PRODUCT_WEIGHT)).optional(),
    sku: variantSkuSchema.optional(),
    isAvailable: z.boolean().optional(),

    //we are going to accept only true as the product
    //is going to be discontinued
    discontinue: z.literal(true).optional(),

    //these explain the edit and are saved in history.
    //they are not columns that we update on the variant itself.
    reason: variantEditReasonSchema.optional(),
    note: variantEditNoteSchema.optional(),
  })
  .strict()
  .refine(
    (variantInfo) =>
      variantInfo.weight !== undefined ||
      variantInfo.unit !== undefined ||
      variantInfo.sku !== undefined ||
      variantInfo.isAvailable !== undefined ||
      variantInfo.discontinue !== undefined,
    {
      error: "Please provide atleast one variant field to update!",
    },
  );

export const updateProductVariantPriceSchema = z
  .object({
    price: decimalValueSchema,
    reason: variantEditReasonSchema.optional(),
    note: variantEditNoteSchema.optional(),
  })
  .strict();

export const createProductVariantStockAdjustmentSchema = z
  .object({
    //the client (user behind the scenes) creates this for adjustment
    //and reuses the same id if that request needs to be retried.
    requestId: z.uuid(),

    quantityChange: z
      .number()
      .int()
      .min(-MAX_VARIANT_STOCK)
      .max(MAX_VARIANT_STOCK)
      .refine((quantityChange) => quantityChange !== 0, { error: "The quantity change can not be 0" }),

    reason: z.enum(STOCK_ADJUSTMENT_REASONS),
    note: z.string().trim().min(1, { error: "Please provide a note for this stock adjustment!" }).optional(),
  })
  .strict()
  .superRefine((adjustInfo, ctx) => {
    const stockMustIncrease =
      adjustInfo.reason === "replenishment" || adjustInfo.reason === "customer_return";

    const stockMustDecrease = adjustInfo.reason === "damaged" || adjustInfo.reason === "lost";

    if (stockMustIncrease && adjustInfo.quantityChange <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityChange"],
        message: `The quantity change must be more than 0 for the reason ${adjustInfo.reason}!`,
      });
    }

    if (stockMustDecrease && adjustInfo.quantityChange >= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityChange"],
        message: `The quantity change must be less than 0 for the reason ${adjustInfo.reason}!`,
      });
    }

    if (adjustInfo.reason === "correction" && !adjustInfo.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: `A note is required for the reason ${adjustInfo.reason}!`,
      });
    }
  });

export type AddProductVariantInput = z.infer<typeof addProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
export type UpdateProductVariantPriceInput = z.infer<typeof updateProductVariantPriceSchema>;
export type CreateProductVariantStockAdjustmentInput = z.infer<
  typeof createProductVariantStockAdjustmentSchema
>;
export type VariantEditReasonInput = z.infer<typeof variantEditReasonSchema>;
export type VariantEditNoteInput = z.infer<typeof variantEditNoteSchema>;