import z from "zod";

export const filterProductVariantHistorySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type FilterProductVariantHistoryInput = z.infer<typeof filterProductVariantHistorySchema>;
