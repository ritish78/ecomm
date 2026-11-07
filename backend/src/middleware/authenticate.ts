import { Request, Response, NextFunction } from "express";
import { AuthError } from "../utils/error";
import { verifyAccessToken } from "../utils/jwt";
import { getCurrentUserService } from "../services/auth.service";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new AuthError("Access token was not provided!");
    }

    const payload = verifyAccessToken(accessToken);

    //the token can still be valid even if the user is deleted or is inactive
    const user = await getCurrentUserService(payload.user.id);

    req.user = {
      id: user.id,
      firstName: user.firstName,
    };

    next();
  } catch (error) {
    next(error);
  }
};
