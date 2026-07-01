import { Request, Response, NextFunction } from "express";
import { AuthError, BadRequestError, ForbiddenError } from "../utils/error";
import { Permissions } from "../config/permissions";
import { hasStorePermissionService } from "../services/store.service";

export const requirePermission = (
  permissionKey: Permissions,
  getStoreId: (req: Request) => Promise<string | null> | string | null,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        throw new AuthError("User is not authenticated!");
      }

      const storeId = await getStoreId(req);

      if (!storeId) {
        throw new BadRequestError(`Store not found of id: ${storeId}`);
      }

      const hasPermission = await hasStorePermissionService(req.user.id, storeId, permissionKey);

      if (!hasPermission) {
        throw new ForbiddenError(
          "You don't have permission to perform this action! Contact the manager/owner/admin!",
        );
      }
    } catch (error) {
      next(error);
    }
  };
};
