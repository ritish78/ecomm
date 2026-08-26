import { and, eq, sql } from "drizzle-orm";
import { Permissions } from "../config/permissions";
import db, { Tx } from "../db";
import { permission } from "../models/permission.model";
import { rolePermission } from "../models/rolePermission.model";
import { storeMembers } from "../models/storeMembers.model";
import { roles } from "../models/roles.model";
import { stores } from "../models/store.model";
import isUuid from "../utils/isUuid";
import { products } from "../models/products.model";
import { storeProducts } from "../models/storeProducts.model";

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} name - name of the store to create
 * @param {string} slug - slug of the store to create
 * @param {string} description - description of the store to create
 * @param {string | undefined} logoUrl - URL of the store's logo
 * @returns {Promise<Store>} - the created store
 */
export const createStore = async (
  tx: Tx,
  name: string,
  slug: string,
  description: string,
  logoUrl: string | undefined,
) => {
  const [store] = await tx
    .insert(stores)
    .values({ name, slug, description, logoUrl, isActive: true })
    .returning();

  return store;
};

/**
 * @param {string} storeId - id of the store to get
 * @returns {Promise<Store | null>} - the retrieved store or null if not found
 */
export const getStoreById = async (storeId: string) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

  return store;
};

/**
 * @param {string} slug - slug of the store to get
 * @returns {Promise<Store | null>} - the retrieved store or null if not found
 */
export const getStoreBySlug = async (slug: string) => {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug));

  return store;
};

/**
 * @param {string} userId - id of the user to check
 * @param {string} storeId - id of the store to check
 * @param {Permissions} permissionKey - key of the permission to check
 * @returns {Promise<boolean>} - true if the user has the permission, false otherwise
 */
export const hasStorePermission = async (
  userId: string,
  storeId: string,
  permissionKey: Permissions,
): Promise<boolean> => {
  const result = await db
    .select({ permissionId: permission.id })
    .from(storeMembers)
    .innerJoin(roles, eq(storeMembers.roleId, roles.id))
    .innerJoin(rolePermission, eq(rolePermission.roleId, roles.id))
    .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
    .where(
      and(
        eq(storeMembers.userId, userId),
        eq(storeMembers.storeId, storeId),
        eq(permission.key, permissionKey),
      ),
    )
    .limit(1);

  return result.length > 0;
};

/**
 * @param {string} userId - id of the user to check
 * @param {string} storeId - id of the store to check
 * @returns {Promise<StoreMembershipWithPermission | null>} - the store membership with permissions or null if not found
 */
export const getStoreMembershipWithPermission = async (userId: string, storeId: string) => {
  const rows = await db
    .select({ roleId: storeMembers.roleId, permissionKey: permission.key })
    .from(storeMembers)
    .innerJoin(rolePermission, eq(rolePermission.roleId, storeMembers.roleId))
    .innerJoin(permission, eq(permission.id, rolePermission.permissionId))
    .where(and(eq(storeMembers.userId, userId), eq(storeMembers.storeId, storeId)));

  if (rows.length === 0) {
    return null;
  }

  return {
    roleId: rows[0].roleId,
    permissions: rows.map((row) => row.permissionKey),
  };
};

export const findStoreByIdOrSlug = async (identifier: string) => {
  const isIdentifierUuid = isUuid(identifier);

  const [store] = await db
    .select()
    .from(stores)
    .where(isIdentifierUuid ? eq(stores.id, identifier) : eq(stores.slug, identifier));

  if (!store) {
    return null;
  }

  //after confirming that the store exists, we also get the number of products that it is selling
  const [productCount] = await db
    .select({ totalProducts: sql<number>`COUNT (*)` })
    .from(storeProducts)
    .innerJoin(products, eq(products.id, storeProducts.productId))
    .where(and(eq(storeProducts.storeId, store.id), eq(products.isActive, true)));

  return { ...store, productCount };
};
