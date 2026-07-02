import { Permissions } from "../config/permissions";
import db from "../db";
import {
  createCustomRoles,
  deleteRolePermissions,
  getPermissionByKeys,
  getRoleById,
  getRolesWithPermission,
  insertRolePermission,
} from "../repository/roles.repository";
import { BadRequestError } from "../utils/error";

//replaces the roles permission with new permissions. first, we check to see
//if all the permission keys e.g. products:create key exists in our table or not
//if it does, then we first delete all permissions for that role and then
//add the permissions that have matched(means exists) in our database
export const setRolePermission = (roleId: string, permissionKeys: string[]) => {
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

export const createRoleForStore = async (storeId: string, name: string, permissionKeys: Permissions[]) => {
  const role = await createCustomRoles(storeId, name);
  const grantedKeys = await setRolePermission(role.id, permissionKeys);

  return { ...role, permission: grantedKeys };
};

export const updateRolePermission = async (
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

  const grantedKeys = await setRolePermission(roleId, permissionKeys);

  //we are returning with same structure as in createRoleForStore
  return { ...role, permission: grantedKeys };
};
