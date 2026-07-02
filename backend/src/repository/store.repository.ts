import { and, eq } from "drizzle-orm";
import { Permissions } from "../config/permissions";
import db, { Tx } from "../db";
import { permission } from "../models/permission.model";
import { rolePermission } from "../models/rolePermission.model";
import { storeMembers } from "../models/storeMembers.model";
import { roles } from "../models/roles.model";
import { stores } from "../models/store.model";

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

export const getStoreById = async (tx: Tx, storeId: string) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

  return store;
};

export const getStoreBySlug = async (tx: Tx, slug: string) => {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug));

  return store;
};

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
    .innerJoin(permission, eq(rolePermission.permissionId, roles.id))
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
