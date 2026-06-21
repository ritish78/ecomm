import { findUserByEmail, insertRefreshToken } from "../repository/auth.repository";
import { AuthError } from "../utils/error";
import { passwordMatches } from "../utils/hashPassword";
import { generateJWT } from "../utils/jwt";
import toUserDTO from "../utils/toUserDTO";

/**
 * @param {string} email - email of the user to login
 * @param {string} password - password of the user to login
 * @returns {Promise<any>} - object containing access token, refresh token and user data
 */
export const loginUserService = async (email: string, password: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AuthError("Invalid email or password!");
  }

  if (!user.password) {
    //should we use the same "Invalid email or password!"?
    //we need to make sure not to leak information about whether the email is registered or not
    //but user might be confused if they registered with google and are trying to login with email and password
    //when they see "Invalid email or password!" they might think they entered the wrong password
    //when the real issue is that they registered with google and don't have a password set
    throw new AuthError("This email is registered with Google. Please login with Google!");
  }

  const isPasswordValid = await passwordMatches(password, user.password);

  if (!isPasswordValid) {
    throw new AuthError("Invalid email or password!");
  }

  if (!user.active) {
    throw new AuthError("Your account is inactive. Please contact support.");
  }

  if (!user.emailVerified) {
    throw new AuthError("Please verify your email before logging in!");
  }

  const tokens = generateJWT(user.id, user.firstName);

  await insertRefreshToken(user.id, tokens.refreshToken);

  return {
    ...tokens,
    user: toUserDTO(user),
  };
};
