import { desc, eq, sql } from "drizzle-orm";
import db, { Tx } from "../db";
import { productHistory } from "../models/productHistory.model";
import { Product } from "../models/products.model";

export const createProductHistory = async (
  tx: Tx,
  productFromDatabase: Product,
  brandName: string,
  categoryName: string,
  currentUserId: string,
) => {
  //here, we save the previous value from the database rather than
  //the current product info sent by the user. products table will
  //have the current info of the product
  const [historyOfProduct] = await tx
    .insert(productHistory)
    .values({
      productId: productFromDatabase.id,
      name: productFromDatabase.name,
      slug: productFromDatabase.name,
      description: productFromDatabase.description,
      categoryId: productFromDatabase.categoryId,
      categoryName,
      brandId: productFromDatabase.brandId,
      brandName,
      changed_by: currentUserId,

      //setting the changed_at after acquiring the lock
      //the transaction could have started earlier and  could
      //have waited for other transaction to complete
      changed_at: new Date(),
    })
    .returning();

  return historyOfProduct;
};

export const getProductHistoryByProductId = async (productId: string, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const historyOfProduct = await db
    .select()
    .from(productHistory)
    .where(eq(productHistory.productId, productId))
    .orderBy(desc(productHistory.changed_at), desc(productHistory.id))
    .limit(limit)
    .offset(offset);

  //we then count the total number of history row of products
  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(productHistory)
    .where(eq(productHistory.productId, productId));

  return {
    totalHistory: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
    data: historyOfProduct,
  };
};

export const hasProductHistory = async (tx: Tx, productId: string): Promise<boolean> => {
  const [historyOfProduct] = await tx
    .select({ id: productHistory.id })
    .from(productHistory)
    .where(eq(productHistory.productId, productId))
    .limit(1); //we only need 1 row to know if the product has been updated

  return Boolean(historyOfProduct);
};
