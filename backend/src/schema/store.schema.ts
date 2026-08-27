import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(1, { error: "Store name is required!" }),
  description: z.string().min(1, { error: "Description is required!" }),
  logoUrl: z.string().optional(),
});

/**
 * In the schema below for updateStoreSchema, we are making all the fields optional
 * but if the user does not provide any field to update, it will still pass this validation.
 * Need to implement another validation in controller to see if the user has provided
 * with altleast one of these fields to update and if not then we throw an error.
 */
export const updateStoreSchema = z.object({
  name: z.string().min(1, { error: "Store name is required!" }).optional(),
  description: z.string().min(1, { error: "Description is required!" }).optional(),
  logoUrl: z.string().optional(),
  isActive: z.boolean().optional(), //we can also make the store to be active/inactive by a switch
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
