import { and, desc, eq, sql } from "drizzle-orm";
import db, { Tx } from "../db";
import { ProductVariant, productVariants } from "../models/productVariant.model";
import { productVariantHistory } from "../models/productVariantHistory.model";
import { FilterProductVariantHistoryInput } from "../schema/productVariantHistory.schema";
import { findStoreProductByStoreIdAndProductId } from "./product.repository";
import { NotFoundError } from "../utils/error";

export const createProductVariantHistory = async (
  tx: Tx,
  variantFromDatabase: ProductVariant,
  currentUserId: string,
) => {
  //we use the previous values from the database rather than using the new
  //values sent by the user. the current value is in product variant table
  const [historyOfProductVariant] = await tx
    .insert(productVariantHistory)
    .values({
      productId: variantFromDatabase.productId,
      productVariantId: variantFromDatabase.id,
      weight: variantFromDatabase.weight,
      unit: variantFromDatabase.unit,
      price: variantFromDatabase.price,
      sku: variantFromDatabase.sku,
      stock: variantFromDatabase.stock,
      isAvailable: variantFromDatabase.isAvailable,
      discontinuedAt: variantFromDatabase.discontinuedAt,
      changedBy: currentUserId,
      changedAt: new Date(),
    })
    .returning();

  return historyOfProductVariant;
};

export const getProductVariantHistoryByVariantId = async (
  productId: string,
  variantId: string,
  page: number,
  limit: number,
) => {
  const offset = (page - 1) * limit;

  //we are going to use both id so that the product variant history is
  //always associated with the request product and its variant
  const whereClause = and(
    eq(productVariantHistory.productId, productId),
    eq(productVariantHistory.productVariantId, variantId),
  );

  //using db here
  const historyOfVariant = await db
    .select()
    .from(productVariantHistory)
    .where(whereClause)
    .orderBy(desc(productVariantHistory.changedAt), desc(productVariantHistory.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(productVariantHistory)
    .where(whereClause);

  return {
    totalHistory: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
    data: historyOfVariant,
  };
};

export const hasProductVariantHistory = async (tx: Tx, productId: string): Promise<boolean> => {
  const [historyOfProductVariant] = await tx
    .select()
    .from(productVariantHistory)
    .where(eq(productVariantHistory.productId, productId))
    .limit(1);

  return Boolean(historyOfProductVariant);
};

export const findProductVariantById = async (productId: string, variantId: string) => {
  const [productVariantFromDatabase] = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.id, variantId)))
    .limit(1);

  return productVariantFromDatabase;
};

export const getProductVariantHistoryService = async (
  storeId: string,
  productId: string,
  variantId: string,
  filters: FilterProductVariantHistoryInput,
) => {
  //the middleware checks for product:edit permission
  //we then have to check if the product belongs to the store
  const productFromStore = await findStoreProductByStoreIdAndProductId(storeId, productId);

  if (!productFromStore) {
    throw new NotFoundError("Product not found in this store!");
  }

  //an empty history and a missing variant are different cases.
  //an existing variant with no edits should return an empty history.
  const productVariantFromDatabase = await findProductVariantById(productId, variantId);

  if (!productVariantFromDatabase) {
    throw new NotFoundError("Product variant not found!");
  }

  return getProductVariantHistoryByVariantId(productId, variantId, filters.page, filters.limit);
};
