import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../config";

/**
 * @param {string} userId - id of the user who is logged in
 * @param {string} firstName - first name of the user
 * @returns {string} - signed jwt
 */
export const generateAccessToken = (userId: string, firstName: string): string => {
  const payload = {
    user: {
      id: userId,
      firstName,
    },
  };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "10m" });
};

/**
 * @param {string} userId - id of the user who is logged in
 * @param {string} firstName - first name of the user
 * @returns {string} - signed jwt
 */
export const generateRefreshToken = (userId: string, firstName: string): string => {
  const payload = {
    user: {
      id: userId,
      firstName,
    },
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

/**
 * @param {string} userId - id of the user who is logged in
 * @param {string} firstName - first name of the user
 * @returns {object} - signed jwt
 */
export const generateJWT = (userId: string, firstName: string) => {
  const accessToken = generateAccessToken(userId, firstName);
  const refreshToken = generateRefreshToken(userId, firstName);

  return { accessToken, refreshToken };
};

/**
 * @param {string} token - access token to verify
 * @returns {object} - user object with id and firstName
 */
export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as { user: { id: string; firstName: string } };
};

/**
 * @param {string} token - refresh token to verify
 * @returns {object} - user object with id and firstName
 */
export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { user: { id: string; firstName: string } };
};
