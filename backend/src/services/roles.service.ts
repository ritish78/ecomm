import { Permissions } from "../config/permissions";
import db from "../db";
import {
  createCustomRoles,
  deleteRolePermissions,
  getAllRolesOfStore,
  getPermissionByKeys,
  getRoleById,
  insertRolePermission,
} from "../repository/roles.repository";
import { BadRequestError } from "../utils/error";

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
 * @returns {Promise<roles[]>} - the retrieved roles of the store
 */
export const getAllRolesOfStoreService = async (storeId: string) => {
  return getAllRolesOfStore(storeId);
};
