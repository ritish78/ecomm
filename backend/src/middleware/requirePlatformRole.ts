import { Request, Response, NextFunction } from "express";
import { AuthError, ForbiddenError } from "../utils/error";
import { hasPlatformRole } from "../repository/platformMember.repository";

export const requirePlatformRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AuthError("Not logged in! Please login in to continue!");
      }

      const allowed = await hasPlatformRole(req.user.id, ...allowedRoles);

      if (!allowed) {
        throw new ForbiddenError("You do not have permission to perform this action. Please contact admin!");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
