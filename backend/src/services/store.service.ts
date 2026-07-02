import { Permissions } from "../config/permissions";
import { findUserByEmail } from "../repository/auth.repository";
import { hasStorePermission } from "../repository/store.repository";
import { addMemberToStore } from "../repository/storeMembers.repository";
import { NotFoundError } from "../utils/error";

export const hasStorePermissionService = async (
  userId: string,
  storeId: string,
  permissionKey: Permissions,
): Promise<boolean> => {
  return hasStorePermission(userId, storeId, permissionKey);
};

export const addMemberToStoreService = async (storeId: string, email: string, roleId: string) => {
  const userFromDatabase = await findUserByEmail(email);

  if (!userFromDatabase) {
    throw new NotFoundError(`User of provided email: ${email} not found!`);
  }

  return addMemberToStore(storeId, userFromDatabase.id, roleId);
};
