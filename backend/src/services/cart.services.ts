import { MAX_CART_ITEMS } from "../config/cart";
import db from "../db";
import {
  createCartIfMissingAndLock,
  deleteAllCartItems,
  deleteCartItemById,
  findCartByUserId,
  findCartForUpdate,
  findCartListing,
  getCartItems,
  getCartItemsWithDetails,
  setCartItem,
  updateCartTimestamp,
} from "../repository/cart.repository";
import { SetCartItemInput } from "../schema/cart.schema";
import { ConflictError, NotFoundError, ServerError } from "../utils/error";
import { formatMinorUnits, priceToMinorUnit } from "../utils/money";

type CartItemDetails = Awaited<ReturnType<typeof getCartItemsWithDetails>>[number];

//these codes allows the frontend to explain the reason
//as to why the item can not be purchased
const getCartItemIssues = (item: CartItemDetails, requestedVariantQuantity: number): string[] => {
  const issues: string[] = [];

  if (!item.store) {
    issues.push("store_missing");
  } else if (!item.store.isActive) {
    issues.push("store_inactive");
  }

  if (!item.variant) {
    issues.push("variant_missing");
  } else {
    if (!item.product) {
      issues.push("product_missing");
    } else if (!item.product.isActive) {
      issues.push("product_inactive");
    }

    if (!item.variant.isAvailable) {
      issues.push("variant_unavailable");
    }

    if (item.variant.stock <= 0) {
      issues.push("out_of_stock");
    } else if (requestedVariantQuantity > item.variant.stock) {
      issues.push("insufficient_stock");
    }
  }

  if (!item.storeProductId) {
    issues.push("not_sold_by_store");
  }

  return issues;
};

export const getCartService = async (currentUserId: string) => {
  const cartFromDatabase = await findCartByUserId(currentUserId);

  const rows = cartFromDatabase ? await getCartItemsWithDetails(cartFromDatabase.id) : [];

  //currently the stock belongs to a variant and not to a store
  //for the same variant that belongs to many stores, its
  //requested quantities are counted together
  // const quantitiesByVariant = new Map<string, number>();

  // for (const item of rows) {
  //   quantitiesByVariant.set(item.variantId, (quantitiesByVariant.get(item.variantId) ?? 0) + item.quantity);
  // }

  const items = rows.map((row) => {
    // const issues = getCartItemIssues(row, quantitiesByVariant.get(row.variantId) ?? row.quantity);
    const issues = getCartItemIssues(row, row.quantity);

    const unitPrice = row.variant?.price ?? null;

    const lineTotal =
      unitPrice !== null ? formatMinorUnits(priceToMinorUnit(unitPrice) * BigInt(row.quantity)) : null;

    return {
      id: row.id,
      storeId: row.storeId,
      variantId: row.variantId,
      quantity: row.quantity,
      store: row.store,
      product: row.product,
      variant: row.variant,
      unitPrice,
      lineTotal,
      purchaseable: issues.length === 0,
      issues,
    };
  });

  const storeIds = [...new Set(items.map((item) => item.storeId))];

  const stores = storeIds.map((storeId) => {
    const storeItems = items.filter((item) => item.storeId === storeId);

    //items that are unavailable for purchase can be seen but their price
    //are not calculated in the total
    const subtotal = storeItems.reduce(
      (total, item) =>
        item.purchaseable && item.lineTotal !== null ? total + priceToMinorUnit(item.lineTotal) : total,
      0n,
    );

    return {
      storeId,
      store: storeItems[0].store,
      items: storeItems,
      purchaseableSubtotal: formatMinorUnits(subtotal),
    };
  });

  const subTotal = stores.reduce((total, store) => total + priceToMinorUnit(store.purchaseableSubtotal), 0n);

  return {
    id: cartFromDatabase?.id ?? null,
    updatedAt: cartFromDatabase?.updatedAt ?? null,
    itemCount: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    stores,
    purchaseableSubtotal: formatMinorUnits(subTotal),

    //shows the current cart and is not meant to reserve stock
    readyForCheckout: items.length > 0 && items.every((item) => item.purchaseable),
  };
}

export const setCartItemService = async (currentUserId: string, itemInfo: SetCartItemInput) => {
  return db.transaction(
    async (tx) => {
      const cartFromDatabase = await createCartIfMissingAndLock(tx, currentUserId);

      if (!cartFromDatabase) {
        throw new ServerError("Could not create or retrieve your cart!");
      }

      const listing = await findCartListing(tx, itemInfo.storeId, itemInfo.variantId);

      if (!listing) {
        throw new NotFoundError("Variant not found in this store!");
      }

      if (!listing.storeIsActive || !listing.productIsActive || !listing.isAvailable) {
        throw new ConflictError("This item is not currently available for purchase!");
      }

      const existingItems = await getCartItems(tx, cartFromDatabase.id);

      const existingItem = existingItems.find(
        (item) => item.storeId === listing.storeId && item.productVariantId === listing.variantId,
      );

      if (!existingItem && existingItems.length >= MAX_CART_ITEMS) {
        throw new ConflictError(`Your cart can only hold ${MAX_CART_ITEMS} number of different items!`);
      }

      //the user can select the variant from multiple stores
      //but those selection currently share one stock quantity
      // const quantityInOtherSelections = existingItems
      //   .filter((item) => item.productVariantId === listing.variantId && item.id !== existingItem?.id)
      //   .reduce((total, item) => total + item.quantity, 0);

      // const requestedVariantQuantity = quantityInOtherSelections + itemInfo.quantity;

      // if (requestedVariantQuantity > listing.stock) {
      //   throw new ConflictError("The requested cart quantity exceeds the available variant stock!");
      // }

      //the requested quantity is checked against this store's own variant stock.
      //setCartItem replaces the saved quantity rather than adding to it.
      if (itemInfo.quantity > listing.stock) {
        throw new ConflictError("The requested cart quantity exceeds the available variant stock!");
      }

      //discontinued variants are allowed while available stock remains.
      //we do not reserve or deduct any stock here.
      const item = await setCartItem(
        tx,
        cartFromDatabase.id,
        listing.storeId,
        listing.variantId,
        itemInfo.quantity,
      );

      if (!item) {
        throw new ServerError("Could not save the cart items!");
      }

      await updateCartTimestamp(tx, cartFromDatabase.id);

      return {
        item,
        created: !existingItem,
      };
    },
    { isolationLevel: "read committed" },
  );
};

export const removeCartItemService = async (currentUserId: string, itemId: string) => {
  return db.transaction(
    async (tx) => {
      const cartFromDatabase = await findCartForUpdate(tx, currentUserId);

      if (!cartFromDatabase) {
        throw new NotFoundError("Cart item not found!");
      }

      const item = await deleteCartItemById(tx, cartFromDatabase.id, itemId);

      if (!item) {
        throw new NotFoundError("Cart item not found!");
      }

      await updateCartTimestamp(tx, cartFromDatabase.id);

      return item;
    },
    { isolationLevel: "read committed" },
  );
};

export const clearCartService = async (currentUserId: string) => {
  return db.transaction(
    async (tx) => {
      const cartFromDatabase = await findCartForUpdate(tx, currentUserId);

      //when the user clears the cart but the cart does not exists
      //we don't need to do anything. we just return
      if (!cartFromDatabase) {
        return { removedItems: 0 };
      }

      const deletedItems = await deleteAllCartItems(tx, cartFromDatabase.id);

      if (deletedItems.length > 0) {
        await updateCartTimestamp(tx, cartFromDatabase.id);
      }

      return { removedItems: deletedItems.length };
    },
    { isolationLevel: "read committed" },
  );
};
