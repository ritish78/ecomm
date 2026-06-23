import { Request, Response, NextFunction } from "express";
import { LoginInput, loginSchema, RegisterInput, registerSchema } from "../schema/auth.schema";
import { loginUserService, registerUserService, revokeRefreshTokenService } from "../services/auth.service";
import { ACCESS_TOKEN_COOKIE_OPTIONS } from "../config";
import { alreadyAuthenticated } from "../utils/alreadyAuthenticated";

/**
 * @route           /api/v1/auth/login
 * @method          POST
 * @desc            Login user with email and password
 * @access          Public
 */
export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //a function that checks if the user is already authenticated by checking the accessToken and
    //refreshToken. If the user is already authenticated, then we just return the user object
    //from the accessToken or refreshToken without logging in again.
    //This is to prevent multiple logins and also to provide a better user experience.
    if (await alreadyAuthenticated(req, res)) {
      return;
    }

    const loginInput: LoginInput = loginSchema.parse(req.body);

    const { accessToken, refreshToken, user } = await loginUserService(loginInput.email, loginInput.password);

    res.cookie("accessToken", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    return res.status(200).send({ message: "Login successful!", user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route           /api/v1/auth/register
 * @method          POST
 * @desc            Register user with email and password
 * @access          Public
 */
export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //calling the same function as loginController to check if the user is already logged in
    if (await alreadyAuthenticated(req, res)) {
      return;
    }

    const registerInput: RegisterInput = registerSchema.parse(req.body);

    if (registerInput.password !== registerInput.confirmPassword) {
      return res.status(400).send({ message: "Password and confirm password do not match!" });
    }

    const user = await registerUserService(
      registerInput.firstName,
      registerInput.lastName,
      registerInput.email,
      registerInput.password,
    );

    return res.status(201).send({ message: "User registered successfully!", user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route           /api/v1/auth/logout
 * @method          POST
 * @desc            Logout user by revoking the refresh token and clearing the cookies
 * @access          Authenticated
 */
export const logoutController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await revokeRefreshTokenService(refreshToken);
  }

  //Clear the access and refresh tokens from cookies
  res.clearCookie("accessToken", ACCESS_TOKEN_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", ACCESS_TOKEN_COOKIE_OPTIONS);

  return res.status(200).send({ message: "Logout successful!" });
};
