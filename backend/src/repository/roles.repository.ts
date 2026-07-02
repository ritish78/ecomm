import { and, eq, inArray, isNull, or } from "drizzle-orm";
import db, { Tx } from "../db";
import { permission } from "../models/permission.model";
import { roles } from "../models/roles.model";
import { rolePermission } from "../models/rolePermission.model";
import { storeMembers } from "../models/storeMembers.model";

// This function will create custom roles for a specific store.
// We have admin, owner, manager, moderator and storeMan.
// We could extend the roles to have a person deal with updating
// photos of a product. so, we could create a new role called
// photoEditor and provide them with ony product_images:edit permission
export const createCustomRoles = async (storeId: string, name: string) => {
  const [role] = await db.insert(roles).values({ storeId, name }).returning();

  return role;
};

export const getRoleById = async (roleId: string) => {
  const [role] = await db.select().from(roles).where(eq(roles.id, roleId));

  return role;
};

export const getPermissionByKeys = async (tx: Tx, keys: string[]) => {
  return tx.select().from(permission).where(inArray(permission.key, keys));
};

export const deleteRolePermissions = async (tx: Tx, roleId: string) => {
  return tx.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
};

export const insertRolePermission = async (tx: Tx, roleId: string, permissionIds: string[]) => {
  if (permissionIds.length === 0) return;

  return tx.insert(rolePermission).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
};

export const updateRoleOfStoreMember = async (storeId: string, userId: string, newRoleId: string) => {
  const [updated] = await db
    .update(storeMembers)
    .set({ roleId: newRoleId })
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
    .returning();

  return updated;
};

export const getAllRolesOfStore = async (storeId: string) => {
  return db
    .select()
    .from(roles)
    .where(or(eq(roles.storeId, storeId), isNull(roles.storeId)));
};

export const getRolesWithPermission = async (roleId: string) => {
  const [role] = await db.select().from(roles).where(eq(roles.id, roleId));

  if (!role) {
    return null;
  }

  const rolePermissions = await db
    .select({ key: permission.key })
    .from(rolePermission)
    .innerJoin(permission, eq(permission.id, rolePermission.permissionId))
    .where(eq(rolePermission.roleId, roleId));

  return {
    ...role,
    permissions: rolePermissions.map((rolePerm) => rolePerm.key),
  };
};
