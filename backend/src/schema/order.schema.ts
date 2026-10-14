import z from "zod";
import { formatMinorUnits, priceToMinorUnit } from "../utils/money";
import { MAX_VARIANT_STOCK } from "../config/product";
import { MAX_CART_ITEMS } from "../config/cart";

const orderUuidSchema = z.uuid().transform((value) => value.toLowerCase());

const orderUnitAmountSchema = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/, {
    error: "Please provide a valid item amount!",
  })
  .transform((value) => formatMinorUnits(priceToMinorUnit(value)));

const orderTotalAmountSchema = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d{0,21})(\.\d{1,2})?$/, {
    error: "Please provide a valid order amount!",
  })
  .transform((value) => formatMinorUnits(priceToMinorUnit(value)));

export const createOrderSchema = z
  .object({
    storeId: orderUuidSchema,
    addressId: orderUuidSchema,
    requestId: orderUuidSchema,

    //these are the amounts that the user confirmed
    //the service calculates the actual amount from the database
    totalShippingFee: orderTotalAmountSchema,
    total: orderTotalAmountSchema,

    items: z
      .array(
        z
          .object({
            cartItemId: orderUuidSchema,
            variantId: orderUuidSchema,
            quantity: z.number().min(1).max(MAX_VARIANT_STOCK),
            unitPrice: orderUnitAmountSchema,
            additionalShippingFee: orderUnitAmountSchema,
          })
          .strict(),
      )
      .min(1)
      .max(MAX_CART_ITEMS)
      .refine((items) => new Set(items.map((item) => item.cartItemId)).size === items.length, {
        error: "Please provide items from your cart only once!",
      }),
  })
  .strict();

export const filterOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type FilterOrderInput = z.infer<typeof filterOrdersSchema>;
