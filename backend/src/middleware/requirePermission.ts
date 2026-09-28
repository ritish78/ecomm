import { Request, Response, NextFunction } from "express";
import { AuthError, BadRequestError, ForbiddenError } from "../utils/error";
import { Permissions } from "../config/permissions";
import { hasStorePermissionService } from "../services/store.service";
import { hasPlatformRole } from "../repository/platformMember.repository";
import isUuid from "../utils/isUuid";

export const requirePermission = (permissionKey: Permissions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.id;
      const storeId = req.params.storeId as string;

      if (!currentUserId) {
        throw new AuthError("Not logged in! Login in to continue!");
      }

      //this middleware runs before the controller, so we need to validate
      //the store id here before using it in our permission query.
      if (!storeId || !isUuid(storeId)) {
        throw new BadRequestError("Invalid store id provided!");
      }

      const isAdmin = await hasPlatformRole(currentUserId, "admin");

      if (isAdmin) {
        return next();
      }

      const hasPermission = await hasStorePermissionService(currentUserId, storeId, permissionKey);

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
