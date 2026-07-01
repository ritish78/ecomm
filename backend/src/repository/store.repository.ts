import { and, eq } from "drizzle-orm";
import { Permissions } from "../config/permissions";
import db from "../db";
import { permission } from "../models/permission.model";
import { rolePermission } from "../models/rolePermission.model";
import { storeMembers } from "../models/storeMembers.model";
import { roles } from "../models/roles.model";

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
