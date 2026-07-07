import { Permissions } from "../config/permissions";
import db from "../db";
import {
  countMemberWithRole,
  createCustomRoles,
  deleteRoleById,
  deleteRolePermissions,
  getAllRolesOfStore,
  getAllRolesWithPermissionOfStore,
  getPermissionByKeys,
  getRoleById,
  getRolesWithPermission,
  insertRolePermission,
} from "../repository/roles.repository";
import { isUserMemberOfStore } from "../repository/storeMembers.repository";
import { BadRequestError, ConflictError, ForbiddenError } from "../utils/error";

//replaces the roles permission with new permissions. first, we check to see
//if all the permission keys e.g. products:create key exists in our table or not
//if it does, then we first delete all permissions for that role and then
//add the permissions that have matched(means exists) in our database
/**
 * @param {string} roleId - id of the role to set permissions for
 * @param {string[]} permissionKeys - array of permission keys to set for the role
 * @returns {Promise<string[]>} - the set permission keys for the role
 */
export const setRolePermissionService = (roleId: string, permissionKeys: string[]) => {
  return db.transaction(async (tx) => {
    //we first get the ids of the permissionKeys
    const matchedPermissions = await getPermissionByKeys(tx, permissionKeys);

    if (matchedPermissions.length !== permissionKeys.length) {
      const foundKeys = new Set(matchedPermissions.map((perm) => perm.key));
      const missing = permissionKeys.filter((key) => !foundKeys.has(key));

      throw new BadRequestError(
        `Unknown permission${missing.length > 1 ? "s" : ""} provided: ${missing.join(", ")}`,
      );
    }

    await deleteRolePermissions(tx, roleId);

    await insertRolePermission(
      tx,
      roleId,
      matchedPermissions.map((perm) => perm.id),
    );

    return matchedPermissions.map((perm) => perm.key);
  });
};

/**
 * @param {string} storeId - id of the store to create the role for
 * @param {string} name - name of the role to create
 * @param {string[]} permissionKeys - array of permission keys to set for the role
 * @returns {Promise<roles>} - the created role with granted permissions
 */
export const createRoleForStoreService = async (
  storeId: string,
  name: string,
  permissionKeys: Permissions[],
) => {
  const role = await createCustomRoles(storeId, name);
  const grantedKeys = await setRolePermissionService(role.id, permissionKeys);

  return { ...role, permission: grantedKeys };
};

/**
 * @param {string} storeId - id of the store to get roles for
 * @param {string} roleId - id of the role whose permissions to update
 * @param {string[]} permissionKeys - array of permission keys to set for the role
 * @returns {Promise<roles>} - the updated role with granted permissions
 */
export const updateRolePermissionService = async (
  storeId: string,
  roleId: string,
  permissionKeys: Permissions[],
) => {
  const role = await getRoleById(roleId);

  if (role.storeId === null) {
    throw new BadRequestError("Can not update the global role!");
  }

  if (role.storeId !== storeId) {
    throw new BadRequestError("Can not update the role of another store!");
  }

  const grantedKeys = await setRolePermissionService(roleId, permissionKeys);

  //we are returning with same structure as in createRoleForStore
  return { ...role, permission: grantedKeys };
};

/**
 * @param {string} storeId - id of the store to get roles for
 * @param {string} userId - id of the user who requested to get roles
 * @returns {Promise<roles[]>} - the retrieved roles of the store
 */
export const getAllRolesOfStoreService = async (storeId: string, userId: string) => {
  //first, lets check that if the current user is member of the store
  const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

  if (!userMemberOfStore) {
    throw new ForbiddenError("You are not allowed to view roles of stores that you are not member of!");
  }

  return getAllRolesOfStore(storeId);
};

export const getAllRolesWithPermissionOfStoreService = async (storeId: string, userId: string) => {
  const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

  //TODO: need to implement to not throw error for admins
  if (!userMemberOfStore) {
    throw new ForbiddenError(
      "You are not allowed to view roles and permissions of the store that you are not member of!",
    );
  }

  return getAllRolesWithPermissionOfStore(storeId);
};

export const getPermissionOfRolesService = async (storeId: string, roleId: string, userId: string) => {
  const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

  if (!userMemberOfStore) {
    throw new ForbiddenError(
      "You are not allowed to view permissions of roles of the store that you are not member of!",
    );
  }

  return getRolesWithPermission(roleId);
};


export const deleteRoleByIdService = async (roleId: string) => {
  //unlike in the function above, getPermissionOfRolesService, we don't need to check
  //if the user is a member of the store. For getPermissionOfRolesService, users that
  //are member of the store were allowed to view permissions of roles.
  //but in this function, a middleware requirePermission("roles:delete") runs and checks
  //if the user has permission to delete the role using repository function hasStorePermission

  //first, we need to check how many users are given this role.
  const numberOfMembersOfProvidedRole = await countMemberWithRole(roleId);

  if (numberOfMembersOfProvidedRole > 0) {
    throw new ConflictError(
      `Currently, there are ${numberOfMembersOfProvidedRole} members of provided role to delete. First, reassign them to another role to delete this role!`,
    );
  }

  return deleteRoleById(roleId);
};
