import { and, asc, eq } from "drizzle-orm";
import db, { Tx } from "../db";
import { carts } from "../models/cart.model";
import { stores } from "../models/store.model";
import { products } from "../models/products.model";
import { productVariants } from "../models/productVariant.model";
import { storeProducts } from "../models/storeProducts.model";
import { cartItems } from "../models/cartItem.model";

export const findCartByUserId = async (userId: string) => {
  const [cartFromDatabase] = await db.select().from(carts).where(eq(carts.userId, userId));
  return cartFromDatabase;
};

export const findCartForUpdate = async (tx: Tx, currentUserId: string) => {
  const [cartFromDatabase] = await tx
    .select()
    .from(carts)
    .where(eq(carts.userId, currentUserId))
    .for("update");

  return cartFromDatabase;
};

export const createCartIfMissingAndLock = async (tx: Tx, currentUserId: string) => {
  //two different requests might try to create the cart of the user at the
  //same time. the unique constraint on the userId column will prevent it
  await tx.insert(carts).values({ userId: currentUserId }).onConflictDoNothing({ target: carts.userId });

  //all the cart items need to acquire this lock before updating the cart
  return findCartForUpdate(tx, currentUserId);
};

export const getCartItems = async (tx: Tx, cartId: string) => {
  return tx.select().from(cartItems).where(eq(carts.id, cartId));
};

export const findCartListing = async (tx: Tx, storeId: string, variantId: string) => {
  const [listing] = await tx
    .select({
      storeId: stores.id,
      storeIsActive: stores.isActive,
      productId: products.id,
      productIsActive: products.isActive,
      variantId: productVariants.id,
      isAvailable: productVariants.isAvailable,
      stock: productVariants.stock,
      //   price: productVariants.price,
    })
    .from(stores)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(storeProducts, eq(storeProducts.productId, products.id))
    .innerJoin(stores, eq(stores.id, storeProducts.storeId))
    .where(and(eq(stores.id, storeId), eq(productVariants.id, variantId)))
    .limit(1);

  return listing;
};

export const setCartItem = async (
  tx: Tx,
  cartId: string,
  storeId: string,
  productVariantId: string,
  quantity: number,
) => {
  const [item] = await tx
    .insert(cartItems)
    .values({ cartId, storeId, productVariantId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.storeId, cartItems.productVariantId],
      set: {
        quantity,
        updatedAt: new Date(),
      },
    })
    .returning();

  return item;
};

export const updateCartTimestamp = async (tx: Tx, cartId: string) => {
  await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
};

export const deleteCartItemById = async (tx: Tx, cartId: string, itemId: string) => {
  const [deletedItem] = await tx
    .delete(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.id, itemId)))
    .returning();

  return deletedItem;
};

export const deleteAllCartItems = async (tx: Tx, cartId: string) => {
  return tx.delete(cartItems).where(eq(cartItems.cartId, cartId)).returning({ id: cartItems.id });
};

export const getCartItemsWithDetails = async (cartId: string) => {
  return db
    .select({
      id: cartItems.id,
      storeId: cartItems.storeId,
      variantId: cartItems.productVariantId,
      quantity: cartItems.quantity,
      storeProductId: storeProducts.id,
      store: {
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        isActive: stores.isActive,
      },
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        isActive: products.isActive,
      },
      variant: {
        id: productVariants.id,
        sku: productVariants.sku,
        weight: productVariants.weight,
        unit: productVariants.unit,
        price: productVariants.price,
        stock: productVariants.stock,
        isAvailable: productVariants.isAvailable,
        discontinuedAt: productVariants.discontinuedAt,
      },
    })
    .from(cartItems)
    .leftJoin(stores, eq(stores.id, cartItems.storeId))
    .leftJoin(productVariants, eq(productVariants.id, cartItems.productVariantId))
    .leftJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(
      storeProducts,
      and(eq(storeProducts.storeId, cartItems.storeId), eq(storeProducts.productId, products.id)),
    )
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.id));
};
