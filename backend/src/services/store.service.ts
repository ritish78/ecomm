import { Permissions } from "../config/permissions";
import { hasStorePermission } from "../repository/store.repository";

export const hasStorePermissionService = async (
  userId: string,
  storeId: string,
  permissionKey: Permissions,
): Promise<boolean> => {
  return hasStorePermission(userId, storeId, permissionKey);
};
