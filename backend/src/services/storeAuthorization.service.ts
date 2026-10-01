import { getRolesWithPermission } from "../repository/roles.repository";
import {
  getStoreForUpdate,
  getStoreMembershipWithPermission,
  hasStorePermission,
} from "../repository/store.repository";
import { hasPlatformRoleInTransaction } from "../repository/platformMember.repository";
import { ForbiddenError, NotFoundError } from "../utils/error";
import { Permissions } from "../config/permissions";
import db, { Tx } from "../db";

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
  tx: Tx,
) => {
  //we check platform membership using the same transaction.
  if (await hasPlatformRoleInTransaction(tx, currentUserId, "admin")) {
    return;
  }
  const membership = await getStoreMembershipWithPermission(currentUserId, storeId, tx);

  if (!membership || !isStrictSubset(permissionKeys, membership.permissions)) {
    throw new ForbiddenError("You can only grant a strictly smaller set of permissions than your own!");
  }
};

/**
 * @param {string} currentUserId - id of the user performing the action
 * @param {string} storeId - id of the store being managed
 * @param {Permissions} permissionKey - permission required for the action
 * @param action - checks and changes to run inside the transaction
 * @returns - the result of the action
 */
export const withStoreAuthorizationTransaction = async <T>(
  currentUserId: string,
  storeId: string,
  permissionKey: Permissions,
  action: (tx: Tx) => Promise<T>,
): Promise<T> => {
  return db.transaction(
    async (tx) => {
      //we acquire the store lock before reading memberships or permissions.
      //all role and member mutations must follow this same order.
      const storeFromDatabase = await getStoreForUpdate(tx, storeId);

      if (!storeFromDatabase) {
        throw new NotFoundError(`Store of id ${storeId} not found!`);
      }

      const isAdmin = await hasPlatformRoleInTransaction(
        tx,
        currentUserId,
        "admin",
      );

      if (!isAdmin) {
        //the middleware checked earlier, but permissions might have changed
        //while this request was waiting for the store lock.
        const hasPermission = await hasStorePermission(
          currentUserId,
          storeId,
          permissionKey,
          tx,
        );

        if (!hasPermission) {
          throw new ForbiddenError(
            "You don't have permission to perform this action! Contact the manager/owner/admin!",
          );
        }
      }

      return action(tx);
    },
    {
      isolationLevel: "read committed",
    },
  );
};

export const assertCanActOnRole = async (
  currentUserId: string,
  storeId: string,
  targetRoleId: string,
  tx: Tx,
) => {
  const targetRole = await getRolesWithPermission(targetRoleId, tx);

  if (!targetRole || (targetRole.storeId !== null && targetRole.storeId !== storeId)) {
    throw new NotFoundError("Role not found in this store!");
  }

  //Admins bypass hierarchy, but never the store boundary.
  //we check platform membership using the same transaction.
  if (await hasPlatformRoleInTransaction(tx, currentUserId, "admin")) {
    return;
  }
  const membership = await getStoreMembershipWithPermission(currentUserId, storeId, tx);

  if (
    !membership ||
    membership.roleId === targetRoleId ||
    !isStrictSubset(targetRole.permissions, membership.permissions)
  ) {
    throw new ForbiddenError("You can only act on roles with fewer permissions than your own!");
  }
};

export const assertCanActOnMember = async (
  currentUserId: string,
  storeId: string,
  targetUserId: string,
  tx: Tx,
) => {
  if (currentUserId === targetUserId) {
    throw new ForbiddenError("You are not allowed to perform this action on your account!");
  }

  const target = await getStoreMembershipWithPermission(targetUserId, storeId, tx);

  if (!target) {
    throw new NotFoundError("The target user is not a member of this store!");
  }

  //we check platform membership using the same transaction.
  if (await hasPlatformRoleInTransaction(tx, currentUserId, "admin")) {
    return;
  }

  const actor = await getStoreMembershipWithPermission(currentUserId, storeId, tx);

  if (!actor || actor.roleId === target.roleId || !isStrictSubset(target.permissions, actor.permissions)) {
    throw new ForbiddenError("You can only act on users with fewer permissions than your own!");
  }
};