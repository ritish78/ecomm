import { Request, Response, NextFunction } from "express";
import { AuthError, BadRequestError, ForbiddenError } from "../utils/error";
import { Permissions } from "../config/permissions";
import { hasStorePermissionService } from "../services/store.service";
import { hasPlatformRole } from "../repository/platformMember.repository";

export const requirePermission = (permissionKey: Permissions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        throw new AuthError("User is not authenticated!");
      }

      const storeId = req.params.storeId as string;

      if (!storeId) {
        throw new BadRequestError(`Store not found of id: ${storeId}`);
      }

      const isAdmin = await hasPlatformRole(req.user.id, "admin");
      if (isAdmin) {
        return next();
      }

      const hasPermission = await hasStorePermissionService(req.user.id, storeId, permissionKey);

      if (!hasPermission) {
        throw new ForbiddenError(
          "You don't have permission to perform this action! Contact the manager/owner/admin!",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
