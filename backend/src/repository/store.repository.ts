import { and, eq, inArray, sql } from "drizzle-orm";
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
import { UpdateStoreInput } from "../schema/store.schema";
import { users } from "../models/users.model";

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
  tx?: Tx,
): Promise<boolean> => {
  const database = tx ? tx : db;

  const result = await database
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
export const getStoreMembershipWithPermission = async (userId: string, storeId: string, tx?: Tx) => {
  const database = tx ? tx : db;
  const rows = await database
    .select({
      roleId: storeMembers.roleId,
      permissionKey: permission.key,
    })
    .from(storeMembers)
    .leftJoin(rolePermission, eq(rolePermission.roleId, storeMembers.roleId))
    .leftJoin(permission, eq(permission.id, rolePermission.permissionId))
    .where(and(eq(storeMembers.userId, userId), eq(storeMembers.storeId, storeId)));

  if (rows.length === 0) {
    return null;
  }

  return {
    roleId: rows[0].roleId,
    permissions: rows.flatMap((row) => (row.permissionKey ? [row.permissionKey] : [])),
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

export const updateStoreById = async (storeId: string, storeInfo: UpdateStoreInput, tx?: Tx) => {
  const database = tx ? tx : db;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  //Now, adding any provided fields to the update data
  if (storeInfo.description !== undefined) {
    updateData.description = storeInfo.description;
  }

  if (storeInfo.logoUrl !== undefined) {
    updateData.logoUrl = storeInfo.logoUrl;
  }

  if (storeInfo.isActive !== undefined) {
    updateData.isActive = storeInfo.isActive;
  }

  if (storeInfo.name !== undefined) {
    updateData.name = storeInfo.name;

    //since the user changed the name of the store, we have two options for slug
    //1. we keep the slug as it is since it describes the original store name
    //2. we change the slug to match the store's new name.
    //Currently, I am going with the first option as I don't want to have spam
    //stores that might only take money from user for products and then change
    //the name of the store to a different one.
    //Or someone creates a store for say Baby products, and has good ratings
    //and then changes to something different, say Electronics. The store might
    //use their rankings from baby products to sell electronics and scam people.

    //however, if we change the way that we want to implement the slug, we can
    //const newSlug = toSlug(storeInfo.name);
    //we also need to check if the slug is unique or not.
    //and then update the slug of the store.
  }

  const [updatedStore] = await database
    .update(stores)
    .set(updateData)
    .where(eq(stores.id, storeId))
    .returning();

  return updatedStore;
};

export const deleteStoreById = async (storeId: string, tx: Tx) => {
  const database = tx ? tx : db;

  const [deletedStore] = await database.delete(stores).where(eq(stores.id, storeId)).returning();

  return deletedStore;
};

export const getAllMembersOfStore = async (storeId: string) => {
  const members = await db
    .select({
      userId: storeMembers.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      roleId: storeMembers.roleId,
      role: roles.name,
    })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .innerJoin(roles, eq(roles.id, storeMembers.roleId))
    .where(eq(storeMembers.storeId, storeId));

  if (members.length === 0) return [];

  const roleIds = [...new Set(members.map((member) => member.roleId))];

  //now, we get all permissions at once for all roles to avoid N+1 query problem
  const rolePermissions = await db
    .select({ roleId: rolePermission.roleId, permissionKey: permission.key })
    .from(rolePermission)
    .innerJoin(permission, eq(permission.id, rolePermission.permissionId))
    .where(inArray(rolePermission.roleId, roleIds));

  //now, we create a map of roleId to permissions
  const rolePermissionsMap = new Map<string, string[]>();

  for (const { roleId, permissionKey } of rolePermissions) {
    if (!rolePermissionsMap.has(roleId)) {
      rolePermissionsMap.set(roleId, []);
    }
    rolePermissionsMap.get(roleId)?.push(permissionKey);
  }

  //now, we add the permissions to each member based on their roleId
  return members.map((member) => ({
    userId: member.userId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    avatarUrl: member.avatarUrl,
    // roleId: member.roleId,
    // role: member.role,
    // permissions: rolePermissionsMap.get(member.roleId) || [],
    //should I have role and permissions key separate or should it be inside an object?
    //the one for separate role and permissions is commented line above and
    //the one inside an object is in the line below
    role: {
      id: member.roleId,
      name: member.role,
      permissions: rolePermissionsMap.get(member.roleId) || [],
    },
  }));
};

/**
 * @param tx - database transaction
 * @param storeId - id of the store to lock
 */
export const getStoreForUpdate = async (tx: Tx, storeId: string) => {
  //all role and member changes will need to acquire this lock before checking permission
  const [storeFromDatabase] = await tx.select().from(stores).where(eq(stores.id, storeId)).for("update");

  return storeFromDatabase;
}
