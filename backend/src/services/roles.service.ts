import { Permissions } from "../config/permissions";
import db, { Tx } from "../db";
import { hasPlatformRole } from "../repository/platformMember.repository";
import {
  countMemberWithRole,
  createCustomRoles,
  deleteRoleById,
  deleteRolePermissions,
  getAllPermissions,
  getAllRolesOfStore,
  getAllRolesWithPermissionOfStore,
  getPermissionByKeys,
  getRoleById,
  getRolesWithPermission,
  insertRolePermission,
  updateRoleName,
  updateRoleOfStoreMember,
} from "../repository/roles.repository";
import { getStoreMembershipWithPermission } from "../repository/store.repository";
import { isUserMemberOfStore } from "../repository/storeMembers.repository";
import { UpdateRoleInput } from "../schema/role.schema";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/error";
import {
  assertCanActOnMember,
  assertCanActOnRole,
  assertCanGrantPermissions,
} from "./storeAuthorization.service";

//replaces the roles permission with new permissions. first, we check to see
//if all the permission keys e.g. products:create key exists in our table or not
//if it does, then we first delete all permissions for that role and then
//add the permissions that have matched(means exists) in our database
/**
 * @param {string} roleId - id of the role to set permissions for
 * @param {string[]} permissionKeys - array of permission keys to set for the role
 * @returns {Promise<string[]>} - the set permission keys for the role
 */
const setRolePermissionService = async (tx: Tx, roleId: string, inputKeys: string[]) => {
  const permissionKeys = [...new Set(inputKeys)];

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
};

/**
 * @param {string} storeId - id of the store to create the role for
 * @param {string} name - name of the role to create
 * @param {string[]} permissionKeys - array of permission keys to set for the role
 * @returns {Promise<roles>} - the created role with granted permissions
 */
export const createRoleForStoreService = async (
  currentUserId: string,
  storeId: string,
  name: string,
  permissionKeys: Permissions[],
) => {
  await assertCanGrantPermissions(currentUserId, storeId, permissionKeys);

  return db.transaction(async (tx) => {
    const role = await createCustomRoles(storeId, name, tx);

    const grantedKeys = await setRolePermissionService(tx, role.id, permissionKeys);

    return {
      ...role,
      permission: grantedKeys,
    };
  });
};

/**
 * @param {string} storeId - id of the store to get roles for
 * @param {string} roleId - id of the role whose permissions to update
 * @param {string[]} permissionKeys - array of permission keys to set for the role
 * @returns {Promise<roles>} - the updated role with granted permissions
 */
export const updateRolePermissionService = async (
  currentUserId: string,
  storeId: string,
  roleId: string,
  permissionKeys: Permissions[],
) => {
  const role = await getRoleById(roleId);

  if (!role) {
    throw new NotFoundError("Could not find the requested role!");
  }

  if (role.storeId === null) {
    throw new BadRequestError("Can not update the global role!");
  }

  if (role.storeId !== storeId) {
    throw new BadRequestError("Can not update the role of another store!");
  }

  await assertCanActOnRole(currentUserId, storeId, roleId);

  await assertCanGrantPermissions(currentUserId, storeId, permissionKeys);

  const grantedKeys = await db.transaction((tx) => setRolePermissionService(tx, roleId, permissionKeys));

  return {
    ...role,
    permission: grantedKeys,
  };
};

/**
 * @param {string} storeId - id of the store to get roles for
 * @param {string} userId - id of the user who requested to get roles
 * @returns {Promise<roles[]>} - the retrieved roles of the store
 */
export const getAllRolesOfStoreService = async (storeId: string, userId: string) => {
  //first, lets check that if the current user is an admin
  const isUserAdmin = await hasPlatformRole(userId, "admin");

  if (isUserAdmin) {
    return getAllRolesOfStore(storeId);
  }

  //then, lets check that if the current user is member of the store
  const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

  if (!userMemberOfStore) {
    throw new ForbiddenError("You are not allowed to view roles of stores that you are not member of!");
  }

  return getAllRolesOfStore(storeId);
};

export const getAllRolesWithPermissionOfStoreService = async (storeId: string, userId: string) => {
  //first, lets check that if the current user is an admin
  const isUserAdmin = await hasPlatformRole(userId, "admin");

  if (isUserAdmin) {
    return getAllRolesWithPermissionOfStore(storeId);
  }

  const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

  if (!userMemberOfStore) {
    throw new ForbiddenError(
      "You are not allowed to view roles and permissions of the store that you are not member of!",
    );
  }

  return getAllRolesWithPermissionOfStore(storeId);
};

export const getPermissionOfRolesService = async (storeId: string, roleId: string, userId: string) => {
  //first, lets check that if the current user is an admin
  const isUserAdmin = await hasPlatformRole(userId, "admin");

  if (!isUserAdmin) {
    const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

    if (!userMemberOfStore) {
      throw new ForbiddenError(
        "You are not allowed to view permissions of roles of the store that you are not member of!",
      );
    }
  }

  const role = await getRolesWithPermission(roleId);

  if (!role) {
    throw new NotFoundError("Role not found!");
  }

  if (role.storeId !== null && role.storeId !== storeId) {
    throw new NotFoundError("Role not found!");
  }

  return role;
};

export const deleteRoleByIdService = async (roleId: string, userId: string, storeId: string) => {
  // The route checks requirePermission("roles:remove").
  const role = await getRoleById(roleId);

  if (!role || role.storeId !== storeId) {
    throw new NotFoundError("Custom role not found in this store!");
  }

  //unlike in the function above, getPermissionOfRolesService, we don't need to check
  //if the user is a member of the store. For getPermissionOfRolesService, users that
  //are member of the store were allowed to view permissions of roles.
  //but in this function, a middleware requirePermission("roles:delete") runs and checks
  //if the user has permission to delete the role using repository function hasStorePermission

  //first, lets check if the user is trying to delete role that is higher than them
  await assertCanActOnRole(userId, storeId, roleId);

  const numberOfMembersOfProvidedRole = await countMemberWithRole(roleId);

  if (numberOfMembersOfProvidedRole > 0) {
    throw new ConflictError(
      `Currently, there are ${numberOfMembersOfProvidedRole} members of provided role to delete. First, reassign them to another role to delete this role!`,
    );
  }

  return deleteRoleById(roleId);
};;

export const updateRoleByIdService = async (
  roleId: string,
  storeId: string,
  roleInfo: UpdateRoleInput,
  currentUserId: string,
) => {
  const roleFromDatabase = await getRoleById(roleId);

  if (!roleFromDatabase) {
    throw new NotFoundError(`Role of id ${roleId} not found!`);
  }

  //currently, when a role has storeId as null it means that the role is throughout
  //the application. For e.g. admin, owner, manager, moderator, and storeMan.
  //we are not going to update these roles. If a user wants to modify the name or
  //permissions they need to create another role with the permissions that they want
  //to assign and then only they should assign that role to the user.
  //we won't allow to modify the application roles as it will change it for all users.
  if (roleFromDatabase.storeId === null) {
    throw new ForbiddenError(
      "You are not allowed to change the built in roles. Create another role and assign users with the permissions that you want!",
    );
  }

  if (roleFromDatabase.storeId !== storeId) {
    throw new NotFoundError("Provided role to update does not exists in this store!");
  }

  await assertCanActOnRole(currentUserId, storeId, roleId);

  const updatedRole = await updateRoleName(roleId, roleInfo.name);

  return updatedRole;
};

// The catalog contains seeded action keys.
// Adding a key does not create an API capability.
export const getStorePermissionCatalogService = async (storeId: string, userId: string) => {
  if (!(await hasPlatformRole(userId, "admin")) && !(await isUserMemberOfStore(storeId, userId))) {
    throw new ForbiddenError("You are not allowed to view permissions for this store!");
  }

  return getAllPermissions();
};

export const assignMemberRoleService = async (
  storeId: string,
  currentUserId: string,
  targetUserId: string,
  roleId: string,
) => {
  await assertCanActOnMember(currentUserId, storeId, targetUserId);

  // Preserve the existing ownership rule until a dedicated
  // transfer flow exists.
  const target = await getStoreMembershipWithPermission(targetUserId, storeId);

  if (target?.permissions.includes("store:remove")) {
    throw new ForbiddenError("The owner's role cannot be reassigned through member management!");
  }

  await assertCanActOnRole(currentUserId, storeId, roleId);

  const member = await updateRoleOfStoreMember(storeId, targetUserId, roleId);

  if (!member) {
    throw new NotFoundError("Member not found in this store!");
  }

  return member;
};
