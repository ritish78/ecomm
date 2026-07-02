import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(1, { error: "Store name is required!" }),
  description: z.string().min(1, { error: "Description is required!" }),
  logoUrl: z.string().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
