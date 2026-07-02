import { z } from "zod";
import { PRODUCT_WEIGHT } from "../config/product";

export const filterProductSchema = z.object({
  keyword: z.string().optional(),
  categoryId: z.uuid().optional(),
  brandId: z.uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  sort: z
    .enum(["relevant", "price_asc", "price_desc", "name_asc", "name_desc", "newest", "oldest"])
    .default("relevant"),
});

export const createProductVariantSchema = z.object({
  weight: z.string().min(1, { error: "Please enter a valid weight!" }),
  unit: z.enum(Object.values(PRODUCT_WEIGHT), { error: "Please enter a valid product weight!" }),
  price: z
    .string()
    .min(1)
    .regex(/^\d+(\.\d{1,2})?$/, { error: "Please enter a valid product price!" }),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, { error: "Please enter the name of product!" }),
  description: z.string().optional(),
  brandId: z.uuid({ error: "Please enter a valid brand uuid!" }),
  categoryId: z.uuid({ error: "Please enter a valid category uuid!" }),
  variants: z
    .array(createProductVariantSchema)
    .min(1, { error: "Please enter atleast one variant of the product!" }),
});

export type FilterProductInput = z.infer<typeof filterProductSchema>;
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
