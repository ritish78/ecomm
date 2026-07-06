import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, { error: "Please enter the name of brand!" }),
});

//our updateBrandSchema is same as createBrandSchema because we are
//only allowing to update the name of the brand
export const updateBrandSchema = z.object({
  name: z.string().min(1, { error: "Please enter the name of brand!" }),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
