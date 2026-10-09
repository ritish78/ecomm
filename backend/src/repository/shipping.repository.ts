import { eq } from "drizzle-orm";
import { Tx } from "../db";
import { stores } from "../models/store.model";
import { UpdateStoreShippingInput } from "../schema/shipping.schema";

export const findStoreShippingSettings = async (tx: Tx, storeId: string) => {
  const [storeFromDatabase] = await tx
    .select({
      storeId: stores.id,
      isActive: stores.isActive,
      shippingFee: stores.shippingFee,
      freeShippingThreshold: stores.freeShippingThreshold,
    })
    .from(stores)
    .where(eq(stores.id, storeId));

  return storeFromDatabase;
};

export const updateStoreShippingSettings = async (
  tx: Tx,
  storeId: string,
  shippingInfo: UpdateStoreShippingInput,
) => {
  const [updatedStore] = await tx
    .update(stores)
    .set({
      shippingFee: shippingInfo.shippingFee,
      freeShippingThreshold: shippingInfo.freeShippingThreshold,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, storeId))
    .returning({
      storeId: stores.id,
      shippingFee: stores.shippingFee,
      freeShippingThreshold: stores.freeShippingThreshold,
    });

  return updatedStore;
};
