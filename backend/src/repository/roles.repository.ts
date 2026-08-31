import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import db, { Tx } from "../db";
import { permission } from "../models/permission.model";
import { roles } from "../models/roles.model";
import { rolePermission } from "../models/rolePermission.model";
import { storeMembers } from "../models/storeMembers.model";
import { USER_ROLES } from "../config/roles";

// This function will create custom roles for a specific store.
// We have admin, owner, manager, moderator and storeMan.
// We could extend the roles to have a person deal with updating
// photos of a product. so, we could create a new role called
// photoEditor and provide them with ony product_images:edit permission
/**
 * @param {string} storeId - id of the store to create the role for
 * @param {string} name - name of the role to create
 * @returns {Promise<roles>} - the created role
 */
export const createCustomRoles = async (storeId: string, name: string) => {
  const [role] = await db.insert(roles).values({ storeId, name }).returning();

  return role;
};

/**
 * @param {string} roleId - id of the role to get
 * @returns {Promise<roles | null>} - the retrieved role or null if not found
 */
export const getRoleById = async (roleId: string) => {
  const [role] = await db.select().from(roles).where(eq(roles.id, roleId));

  return role;
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string[]} keys - array of permission keys to get
 * @returns {Promise<Permission[]>} - the retrieved permissions
 */
export const getPermissionByKeys = async (tx: Tx, keys: string[]) => {
  return tx.select().from(permission).where(inArray(permission.key, keys));
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} roleId - id of the role whose permissions to delete
 * @returns {Promise<void>} - a promise resolving when the permissions are deleted
 */
export const deleteRolePermissions = async (tx: Tx, roleId: string) => {
  return tx.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} roleId - id of the role to insert permissions for
 * @param {string[]} permissionIds - array of permission IDs to insert
 * @returns {Promise<void>} - a promise resolving when the permissions are inserted
 */
export const insertRolePermission = async (tx: Tx, roleId: string, permissionIds: string[]) => {
  if (permissionIds.length === 0) return;

  await tx.insert(rolePermission).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
};

/**
 * @param {string} storeId - id of the store to get roles for
 * @param {string} userId - id of the user whose role to update
 * @param {string} newRoleId - id of the new role to assign
 * @returns {Promise<StoreMember>} - the updated store member
 */
export const updateRoleOfStoreMember = async (storeId: string, userId: string, newRoleId: string) => {
  const [updated] = await db
    .update(storeMembers)
    .set({ roleId: newRoleId })
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
    .returning();

  return updated;
};

/**
 * @param {string} storeId - id of the store to get roles for
 * @returns {Promise<Role[]>} - the retrieved roles
 */
export const getAllRolesOfStore = async (storeId: string) => {
  return db
    .select()
    .from(roles)
    .where(or(eq(roles.storeId, storeId), isNull(roles.storeId)));
};

/**
 * @param {string} storeId - id of the store to get roles for
 */
export const getAllRolesWithPermissionOfStore = async (storeId: string) => {
  const storeRoles = await getAllRolesOfStore(storeId);

  if (storeRoles.length === 0) return [];

  const roleIds = storeRoles.map((role) => role.id);

  const allPermissions = await db
    .select({
      roleId: rolePermission.roleId,
      key: permission.key,
      description: permission.description,
    })
    .from(rolePermission)
    .innerJoin(permission, eq(permission.id, rolePermission.permissionId))
    .where(inArray(rolePermission.roleId, roleIds));

  const permissionsByRoleId = allPermissions.reduce<
    Record<string, { key: string; description: string | null }[]>
  >((acc, { roleId, key, description }) => {
    if (!acc[roleId]) acc[roleId] = [];

    //Pushing the object instead of just the string
    acc[roleId].push({ key, description });
    return acc;
  }, {});

  return storeRoles.map((role) => ({
    id: role.id,
    name: role.name,
    storeId: role.storeId,
    permissions: permissionsByRoleId[role.id] ?? [], //without null coalescing, it was returning without permissions key in json if there was no permission for a role
  }));
};

/**
 * @param {string} roleId - id of the role to get permissions for
 * @returns {Promise<Role | null>} - the role with its permissions or null if not found
 */
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

/**
 * @param {Tx} tx - database transaction or a database connection
 * @returns {Promise<Role | null>} - the global owner role or null if not found
 */
export const getGlobalOwnerRole = async (tx: Tx) => {
  const [ownerRole] = await tx
    .select()
    .from(roles)
    .where(and(eq(roles.name, USER_ROLES.owner), isNull(roles.storeId)))
    .limit(1);

  return ownerRole;
};

export const deleteRoleById = async (roleId: string) => {
  const [deletedRole] = await db
    .delete(roles)
    .where(and(isNotNull(roles.storeId), eq(roles.id, roleId)))
    .returning();

  return deletedRole;
};

export const countMemberWithRole = async (roleId: string) => {
  const rows = await db
    .select({ id: storeMembers.id })
    .from(storeMembers)
    .where(eq(storeMembers.roleId, roleId));
  //for where statement, we are only using roleId we could also also
  //and(eq(storeMembers.storeId, storeId)) after passing storeId
  // like in deleteRoleById, but roleId is already unique.

  return rows.length;
};

export const updateRoleName = async (roleId: string, roleName: string) => {
  const [updatedRole] = await db
    .update(roles)
    .set({ name: roleName })
    .where(eq(roles.id, roleId))
    .returning();

  return updatedRole;
};
