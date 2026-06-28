import { Request, Response, NextFunction } from "express";
import { AuthError } from "../utils/error";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new AuthError("Access token was not provided!");
    }

    const payload = verifyAccessToken(accessToken);

    req.user = payload.user;

    next();
  } catch (error) {
    next(error);
  }
};
