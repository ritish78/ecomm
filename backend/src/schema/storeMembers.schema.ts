import { z } from "zod";

export const addMemberSchema = z
  .object({
    email: z.email("Valid email is required to add new member to the store!"),
    roleId: z.string().min(1, { error: "Role id is required!" }),
  })
  .strict();

export type AddMemberInput = z.infer<typeof addMemberSchema>;
