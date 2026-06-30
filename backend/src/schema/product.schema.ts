import { z } from "zod";

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

export type FilterProductInput = z.infer<typeof filterProductSchema>;
