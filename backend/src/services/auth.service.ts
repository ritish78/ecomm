import {
  addUser,
  findUserByEmail,
  getActiveRefreshTokensOfUser,
  insertRefreshToken,
  revokeRefreshToken,
} from "../repository/auth.repository";
import { RefreshToken } from "../types/refreshTokens.type";
import { UserDTO } from "../types/user.types";
import { AuthError, ConflictError } from "../utils/error";
import hashPassword, { passwordMatches } from "../utils/hashPassword";
import { generateAccessToken, generateJWT, verifyRefreshToken } from "../utils/jwt";
import toUserDTO from "../utils/toUserDTO";

/**
 * @param {string} email - email of the user to login
 * @param {string} password - password of the user to login
 * @returns {Promise<{ accessToken: string; refreshToken: string; user: UserDTO } >} - object containing access token, refresh token and user data
 */
export const loginUserService = async (
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; user: UserDTO }> => {
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

/**
 * @param {string} firstName - first name of the user
 * @param {string} lastName - last name of the user
 * @param {string} email - email of the user
 * @param {string} password - password in plain text provided by the user
 */
export const registerUserService = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<UserDTO> => {
  //first, we are checking if user with the provided email already exists
  const userExists = await findUserByEmail(email);

  if (userExists) {
    throw new ConflictError("User is already registered with this email! Login instead!");
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await addUser(firstName, lastName, email, hashedPassword);

  return toUserDTO(newUser);
};

/**
 * @param {string} refreshToken - refresh token provided by the user to get a new access token
 * @returns {Promise<{ accessToken: string; user: UserDTO }>} - object containing the new access token and user data
 */
export const refreshAccessTokenService = async (
  refreshToken: string,
): Promise<{ accessToken: string; user: UserDTO }> => {
  //we need to verify the refresh token and also check if it exists in the database and is not revoked or expired
  //if it is valid, we generate a new access token and return it
  //if it is not valid, we throw an error

  let payload: { user: { id: string; firstName: string } };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AuthError("Invalid or expired refresh token!");
  }

  //We need to check if the refreshToken provided by the user exists
  //and hasn't expired or revoked
  const userTokens = await getActiveRefreshTokensOfUser(payload.user.id);

  let validToken: RefreshToken | null = null;

  //Setting up a for loop to check userTokens matches might seem that it will slow down the app
  //but in reality, the number of userTokens is low. usually its just one.
  for (const token of userTokens) {
    const tokenMatches = await passwordMatches(refreshToken, token.tokenHash);

    if (tokenMatches) {
      validToken = token;
      break;
    }
  }

  if (!validToken) {
    throw new AuthError("Invalid or expired refresh token!");
  }

  //After confirming that token exists and token has not been revoked or expired
  //we then check if the user exists
  const userFromDatabase = await findUserByEmail(payload.user.id);

  if (!userFromDatabase || !userFromDatabase.active || !userFromDatabase.emailVerified) {
    throw new AuthError("User not found!");
  }

  return {
    accessToken: generateAccessToken(userFromDatabase.id, userFromDatabase.firstName),
    user: toUserDTO(userFromDatabase),
  };
};

/**
 * @param {string} refreshToken - refreshToken provided by the user to revoke
 * @returns {Promise<void>}
 */
export const revokeRefreshTokenService = async (refreshToken: string): Promise<void> => {
  let payload: { user: { id: string; firstName: string } };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AuthError("Invalid or expired refresh token!");
  }

  //Once we know that the RefreshToken provided by user is a valid token, we then
  //need to see if the user hasn't logged out or the refresh token has not expired.
  const userTokens = await getActiveRefreshTokensOfUser(payload.user.id);

  //A user can have more than one refresh tokens. They can login in different browsers
  //or even different devices. So, we need to check which instance of their login
  //they want to log out of. Then, we can remove that refresh token.
  for (const token of userTokens) {
    const tokenMatches = await passwordMatches(refreshToken, token.tokenHash);

    if (tokenMatches) {
      //revoke the token by setting revoked to true
      await revokeRefreshToken(token.id);
      return;
    }
  }
};
