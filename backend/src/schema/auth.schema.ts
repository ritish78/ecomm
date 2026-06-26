import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email("Valid Email is required!"),
    password: z.string().min(8, { error: "Please enter password of length 8 or more!" }),
  })
  .strict();

export const registerSchema = z
  .object({
    firstName: z.string().min(1, { error: "Fist Name is required!" }),
    lastName: z.string().min(1, { error: "Last Name is required!" }),
    email: z.email("Valid email is required!"),
    password: z.string().min(8, { error: "Please enter password of length 8 or more!" }),
    confirmPassword: z.string().min(8, { error: "Please enter password of length 8 or more!" }),
  })
  .strict();

export const googleAuthSchema = z
  .object({
    code: z.string().min(1),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
