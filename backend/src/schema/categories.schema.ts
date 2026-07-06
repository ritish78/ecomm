import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, { error: "Please enter the name of category!" }),
});

//our updateCategorySchema is same as createCategorySchema because we are
//only allowing to update the name of the category
export const updateCategorySchema = z.object({
  name: z.string().min(1, { error: "Please enter the name of category!" }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
