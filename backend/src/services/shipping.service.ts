import db from "../db";
import { findCartByUserId, getCartItemsWithDetails } from "../repository/cart.repository";
import { findStoreShippingSettings, updateStoreShippingSettings } from "../repository/shipping.repository";
import { UpdateStoreShippingInput } from "../schema/shipping.schema";
import { calculateShippingFee } from "../utils/calculateShipping";
import { ConflictError, NotFoundError, ServerError } from "../utils/error";
import { formatMinorUnits, priceToMinorUnit } from "../utils/money";
import { withStoreAuthorizationTransaction } from "./storeAuthorization.service";

export const getStoreShippingService = async (storeId: string) => {
  const storeFromDatabase = await findStoreShippingSettings(storeId);

  //public shipping settings are only returned for active stores
  if (!storeFromDatabase || !storeFromDatabase.isActive) {
    throw new NotFoundError("Store to get shipping info of not found!");
  }

  return {
    storeId: storeFromDatabase.storeId,
    shippingFee: storeFromDatabase.shippingFee,
    freeShippingThreshold: storeFromDatabase.freeShippingThreshold,
  };
  //   return withStoreAuthorizationTransaction(currentUserId, storeId, "store:edit", async (tx) => {
  //     const storeFromDatabase = await findStoreShippingSettings(storeId, tx);

  //     if (!storeFromDatabase) {
  //       throw new NotFoundError("Store to get shipping info of not found!");
  //     }

  //     return storeFromDatabase;
  //   });
};;;

export const updateStoreShippingSettingService = async (
  storeId: string,
  shippingInfo: UpdateStoreShippingInput,
  currentUserId: string,
) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "store:edit", async (tx) => {
    const updatedStore = await updateStoreShippingSettings(tx, storeId, shippingInfo);

    if (!updatedStore) {
      throw new ServerError("Could not update the shipping settings of the store!");
    }

    return updatedStore;
  });
};

export const getStoreShippingQuoteService = async (storeId: string, currentUserId: string) => {
  return db.transaction(
    async (tx) => {
      const storeFromDatabase = await findStoreShippingSettings(storeId, tx);

      if (!storeFromDatabase) {
        throw new NotFoundError("Store not found!");
      }

      if (!storeFromDatabase.isActive) {
        throw new ConflictError("The store is not accepting orders right now!");
      }

      if (storeFromDatabase.shippingFee === null) {
        throw new ConflictError("Currently this store has not configured its shipping fee!");
      }

      const cartFromDatabase = await findCartByUserId(currentUserId, tx);

      if (!cartFromDatabase) {
        throw new ConflictError("Your cart is empty!");
      }

      const cartItemsFromDatabase = await getCartItemsWithDetails(cartFromDatabase.id, tx);

      const storeCartItems = cartItemsFromDatabase.filter(
        (item) => item.storeId === storeFromDatabase.storeId,
      );

      if (storeCartItems.length === 0) {
        throw new ConflictError("Your cart does not contain products from this store!");
      }

      const items = storeCartItems.map((item) => {
        if (
          !item.product ||
          !item.product.isActive ||
          !item.variant ||
          !item.variant.isAvailable ||
          !item.storeProductId
        ) {
          throw new ConflictError("Some cart items are not available!");
        }

        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.variant.stock) {
          throw new ConflictError("Please update your cart quantities before you continue!");
        }

        const unitPrice = priceToMinorUnit(item.variant.price);

        const additionalShippingFee = priceToMinorUnit(item.variant.additionalShippingFee);

        return {
          cartItemId: item.id,
          productId: item.product.id,
          variantId: item.variant.id,
          productName: item.product.name,
          quantity: item.quantity,

          unitPrice: formatMinorUnits(unitPrice),

          //this is the extra fee for one unit of this variant
          additionalShippingFee: formatMinorUnits(additionalShippingFee),

          lineTotal: formatMinorUnits(unitPrice * BigInt(item.quantity)),

          additionalShippingTotal: formatMinorUnits(additionalShippingFee * BigInt(item.quantity)),
        };
      });

      const shipping = calculateShippingFee(
        {
          shippingFee: storeFromDatabase.shippingFee,
          freeShippingThreshold: storeFromDatabase.freeShippingThreshold,
        },
        items,
      );

      return {
        storeId: storeFromDatabase.storeId,
        freeShippingThreshold: storeFromDatabase.freeShippingThreshold,
        items,
        ...shipping,
      };
    },
    { isolationLevel: "repeatable read" },
  );
};
