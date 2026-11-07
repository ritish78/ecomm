import { Request, Response } from "express";
import { verifyAccessToken } from "./jwt";
import { getCurrentUserService, refreshAccessTokenService } from "../services/auth.service";
import { ACCESS_TOKEN_COOKIE_OPTIONS } from "../config";
import { AuthError } from "./error";

export const alreadyAuthenticated = async (req: Request, res: Response) => {
  //First checking if the user has valid accessToken. if yes, then we just return the user
  //from the provided accessToken
  try {
    const accessToken = req.cookies?.accessToken;
    //First, lets see if the user has sent accessToken
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);

      //we also check if the user still exists and is active before treating them as logged in
      const user = await getCurrentUserService(payload.user.id);

      //should we send a 200 or a 400? I think 400 is better because the user is trying to login but they are already logged in
      return res.status(400).send({ message: "You are already logged in!", user });
    }
  } catch (error) {
    //we continue if the session is invalid, but other errors should not be ignored
    if (!(error instanceof AuthError)) {
      throw error;
    }
  }

  //If the user does not have valid accessToken, then we move to check if they have
  //valid refreshTokens. If they have valid refreshToken, the we renew their accessToken
  //and send it back with the user object back
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const { accessToken, user } = await refreshAccessTokenService(refreshToken);

      res.cookie("accessToken", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

      return res.status(400).send({ message: "You are already logged in!", user });
    }
  } catch (error) {
    //we continue if the session is invalid, but other errors should not be ignored
    if (!(error instanceof AuthError)) {
      throw error;
    }
  }

  //If the accessToken and refreshToken are not valid, then we login as normal
  //clearing the old cookies if it exists to set new cookies after logging in.
  res.clearCookie("accessToken", ACCESS_TOKEN_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", ACCESS_TOKEN_COOKIE_OPTIONS);

  return false;
};
