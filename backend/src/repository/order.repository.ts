import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import db, { Tx } from "../db";
import { orders } from "../models/order.model";
import { cartItems } from "../models/cartItem.model";
import { productVariants } from "../models/productVariant.model";
import { orderItems } from "../models/orderItem.model";
import { FilterOrderInput } from "../schema/order.schema";
import fi from "zod/v4/locales/fi.js";

type OrderScope = { userId: string } | { storeId: string };

export const lockOrderRequest = async (tx: Tx, currentUserId: string, requestId: string) => {
  //the lock exists even before the order has been inserted to the database
  //subsequent retries wait for the first request to finish
  const requestKey = `order:${currentUserId}:${requestId}`;

  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${requestKey}, 0))`);
};

export const findOrderByRequestId = async (tx: Tx, currentUserId: string, requestId: string) => {
  const [orderFromDatabase] = await tx
    .select()
    .from(orders)
    .where(and(eq(orders.userId, currentUserId), eq(orders.requestId, requestId)));

  return orderFromDatabase;
};

export const getStoreCartItemsForOrder = async (tx: Tx, cartId: string, storeId: string) => {
  return tx
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.storeId, storeId)))
    .orderBy(asc(cartItems.id));
};

export const getProductVariantsForOrder = async (tx: Tx, variantIds: string[]) => {
  if (variantIds.length === 0) {
    return [];
  }

  //this read identifies that the product needs to be locked first
  //the service then reads each variant under its own row lock
  return tx
    .select()
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds))
    .orderBy(asc(productVariants.id));
};

export const createOrder = async (tx: Tx, orderInfo: typeof orders.$inferInsert) => {
  const [order] = await tx.insert(orders).values(orderInfo).returning();

  return order;
};

export const createOrderItems = async (tx: Tx, items: (typeof orderItems.$inferInsert)[]) => {
  return tx.insert(orderItems).values(items).returning();
};

export const deleteOrderedCartItems = async (tx: Tx, cartId: string, storeId: string, itemIds: string[]) => {
  return tx
    .delete(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.storeId, storeId), inArray(cartItems.id, itemIds)))
    .returning({ id: cartItems.id });
};

export const getOrderItems = async (orderId: string, tx?: Tx) => {
  const database = tx ? tx : db;

  return database
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(asc(orderItems.id));
};

export const findOrderById = async (orderId: string, scope: OrderScope, tx?: Tx) => {
  const database = tx ? tx : db;

  const ownerCondition =
    "userId" in scope ? eq(orders.userId, scope.userId) : eq(orders.storeId, scope.storeId);

  const [orderFromDatabase] = await database
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), ownerCondition));

  return orderFromDatabase;
};

export const getOrders = async (scope: OrderScope, filters: FilterOrderInput, tx?: Tx) => {
  const database = tx ? tx : db;

  const ownerCondition =
    "userId" in scope ? eq(orders.userId, scope.userId) : eq(orders.storeId, scope.storeId);

  const ordersFromDatbase = await database
    .select({
      id: orders.id,
      storeId: orders.storeId,
      storeName: orders.storeName,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      subtotal: orders.subtotal,
      totalShippingFee: orders.totalShippingFee,
      total: orders.total,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(ownerCondition)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(filters.limit + 1)
    .offset((filters.page - 1) * filters.limit);

  return {
    page: filters.page,
    limit: filters.limit,
    hasMore: ordersFromDatbase.length > filters.limit,
    data: ordersFromDatbase.slice(0, filters.limit),
  };
};

export const hasStoreOrders = async (tx: Tx, storeId: string) => {
  const [orderFromDatabase] = await tx
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .limit(1);

  return Boolean(orderFromDatabase);
};
