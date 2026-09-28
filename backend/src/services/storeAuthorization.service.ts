import { getRolesWithPermission } from "../repository/roles.repository";
import { getStoreMembershipWithPermission } from "../repository/store.repository";
import { hasPlatformRole } from "../repository/platformMember.repository";
import { ForbiddenError, NotFoundError } from "../utils/error";

// Equal permission sets are peers, even when their role IDs differ.
const isStrictSubset = (target: string[], actor: string[]) => {
  const targetKeys = new Set(target);
  const actorKeys = new Set(actor);

  return targetKeys.size < actorKeys.size && [...targetKeys].every((key) => actorKeys.has(key));
};

export const assertCanGrantPermissions = async (
  currentUserId: string,
  storeId: string,
  permissionKeys: string[],
) => {
  if (await hasPlatformRole(currentUserId, "admin")) return;

  const membership = await getStoreMembershipWithPermission(currentUserId, storeId);

  if (!membership || !isStrictSubset(permissionKeys, membership.permissions)) {
    throw new ForbiddenError("You can only grant a strictly smaller set of permissions than your own!");
  }
};

export const assertCanActOnRole = async (currentUserId: string, storeId: string, targetRoleId: string) => {
  const targetRole = await getRolesWithPermission(targetRoleId);

  if (!targetRole || (targetRole.storeId !== null && targetRole.storeId !== storeId)) {
    throw new NotFoundError("Role not found in this store!");
  }

  //Admins bypass hierarchy, but never the store boundary.
  if (await hasPlatformRole(currentUserId, "admin")) return;

  const membership = await getStoreMembershipWithPermission(currentUserId, storeId);

  if (
    !membership ||
    membership.roleId === targetRoleId ||
    !isStrictSubset(targetRole.permissions, membership.permissions)
  ) {
    throw new ForbiddenError("You can only act on roles with fewer permissions than your own!");
  }
};;

export const assertCanActOnMember = async (currentUserId: string, storeId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new ForbiddenError("You are not allowed to perform this action on your account!");
  }

  const target = await getStoreMembershipWithPermission(targetUserId, storeId);

  if (!target) {
    throw new NotFoundError("The target user is not a member of this store!");
  }

  if (await hasPlatformRole(currentUserId, "admin")) return;

  const actor = await getStoreMembershipWithPermission(currentUserId, storeId);

  if (!actor || actor.roleId === target.roleId || !isStrictSubset(target.permissions, actor.permissions)) {
    throw new ForbiddenError("You can only act on users with fewer permissions than your own!");
  }
};
