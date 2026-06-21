import { Request, Response, NextFunction } from "express";
import { LoginInput, loginSchema, RegisterInput, registerSchema } from "../schema/auth.schema";
import { loginUserService, registerUserService } from "../services/auth.service";
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

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
