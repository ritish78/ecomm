import { getRolesWithPermission } from "../repository/roles.repository";
import { getStoreMembershipWithPermission } from "../repository/store.repository";
import { ForbiddenError, NotFoundError } from "../utils/error";

//this function checks that if the current user is able to assign role
//to another member. they can only assign roles that are below them
export const assertCanActOnRole = async (currentUserId: string, storeId: string, targetRoleId: string) => {
  const currentUserMembership = await getStoreMembershipWithPermission(currentUserId, storeId);

  if (!currentUserMembership) {
    throw new ForbiddenError(
      "You are not a part of this store so you are not allowed to peform this action!",
    );
  }

  const targetRole = await getRolesWithPermission(targetRoleId);

  if (!targetRole) {
    throw new NotFoundError("Role to assign not found!");
  }

  const currentUserPermission = new Set(currentUserMembership.permissions);

  const targetIsStrictSubset =
    targetRole.permissions.every((perm) => currentUserPermission.has(perm)) &&
    currentUserMembership.roleId !== targetRoleId;

  if (!targetIsStrictSubset) {
    throw new ForbiddenError("You are not allowed to assign users with more or same permsission as you!");
  }
};

export const assertCanActOnMember = async (currentUserId: string, storeId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new ForbiddenError("You are not allowed to perform this action on your account!");
  }

  const [currentUserMembership, targetUserMembership] = await Promise.all([
    getStoreMembershipWithPermission(currentUserId, storeId),
    getStoreMembershipWithPermission(targetUserId, storeId),
  ]);

  if (!currentUserMembership) {
    throw new ForbiddenError(
      "You are not a part of this store so you are not allowed to peform this action!",
    );
  }

  if (!targetUserMembership) {
    throw new ForbiddenError(
      "The target user is not a part of this store so you are not allowed to peform this action!",
    );
  }

  const currentUserPermission = new Set(currentUserMembership.permissions);

  const targetIsSubset = targetUserMembership.permissions.every((perm) => currentUserPermission.has(perm));
  const isSameRole = currentUserMembership.roleId === targetUserMembership.roleId;

  if (!targetIsSubset || isSameRole) {
    throw new ForbiddenError("You can only act on users with fewer permission than you!");
  }
};
