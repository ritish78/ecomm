import z from "zod";
import { AUSTRALIAN_STATES } from "../config/address";

//we store the optional address as null when the user does not provide it
const optionalAddressText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);

const commonAddressFields = {
  label: optionalAddressText(50),
  recipientName: z.string().trim().min(1).max(100),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, {
      error: "Please provide a phone number with its country code and digits only after +!",
    }),

  addressLineOne: z.string().trim().min(1).max(200),
  addressLineTwo: optionalAddressText(200),
  locality: z.string().trim().min(1).max(100),
  landmark: optionalAddressText(200),
  deliveryInstructions: optionalAddressText(500),
};

const australianAddressSchema = z
  .object({
    ...commonAddressFields,
    countryCode: z.literal("AU"),
    region: z.string().trim().toUpperCase().pipe(z.enum(AUSTRALIAN_STATES)),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{4}$/, {
        error: "Please provide a four digit Australian postcode!",
      }),

    //Australian address does not use Nepal's district columns
    district: z
      .null()
      .optional()
      .transform(() => null),
    wardNumber: z
      .null()
      .optional()
      .transform(() => null),
  })
  .strict();

const nepalAddressSchema = z
  .object({
    ...commonAddressFields,
    countryCode: z.literal("NP"),
    region: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(35),
    wardNumber: z.number().min(1).max(35),
    postalCode: optionalAddressText(10),
  })
  .strict();

export const createAddressSchema = z.discriminatedUnion("countryCode", [
  australianAddressSchema,
  nepalAddressSchema,
]);

//when the user updates their address, we are going to send a PUT request
//so, we need to replace the whole address
export const updateAddressSchema = createAddressSchema;

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
