import { z } from "zod";
import { PRODUCT_WEIGHT } from "../config/product";

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
  })
  .strict()
  .refine((variantInfo) => Object.values(variantInfo).some((value) => value !== undefined), {
    error: "Please provide atleast one field to update!",
  });

export type AddProductVariantInput = z.infer<typeof addProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
