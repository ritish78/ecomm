import { and, eq, gte } from "drizzle-orm";
import db from "../db";
import { User, user } from "../models/user.model";
import { refreshTokens } from "../models/resfreshTokens.model";
import hashPassword from "../utils/hashPassword";
import { RefreshToken } from "../types/refreshTokens.type";

/**
 * @param {string} email - email to use to search the user
 * @returns {User | null}
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const [userFromDatabase] = await db.select().from(user).where(eq(user.email, email));

  return userFromDatabase;
};

/**
 * @param {number} userId - id to use to search the user
 * @returns {User | null}
 */
export const findUserById = async (userId: string): Promise<User | null> => {
  const [userFromDatabase] = await db.select().from(user).where(eq(user.id, userId));

  return userFromDatabase;
};

/**
 * @param {number} googleId - googleid to use to search the user
 * @returns {User | null}
 */
export const findUserFromGoogleId = async (googleId: string): Promise<User | null> => {
  const [userFromDatabase] = await db.select().from(user).where(eq(user.googleId, googleId));

  return userFromDatabase;
};

/**
 * @param {User} userData - data to use to create the user [fistName, lastName, email, password, googleId, avatarUrl, emailVerified, emailVerifiedAt, active]
 * @returns {User}
 */
export const addUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  googleId: string | null = null,
  avatarUrl: string | null = null,
): Promise<User> => {
  const [addedUser] = await db
    .insert(user)
    .values({ firstName, lastName, email, password, googleId, avatarUrl, emailVerified: false, active: true })
    .returning();

  return addedUser;
};

/**
 * @param {string} userId - id of the user to link the google account
 * @param {string} googleId - googleid to use to search the user
 * @returns {User}
 */
export const linkGoogleAccountToExistingUser = async (
  userId: string,
  googleId: string,
  avatarUrl?: string,
): Promise<User> => {
  const [updatedUser] = await db
    .update(user)
    .set({ googleId, avatarUrl, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser;
};

/**
 * @param {string} userId - id of the user to link the google account
 * @param {string} refreshToken - refresh token to store in the database
 */
export const insertRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  const hashedToken = await hashPassword(refreshToken);

  await db
    .insert(refreshTokens)
    .values({ userId, tokenHash: hashedToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
};

/**
 * @param {string} userId - id of the user to get the active refresh tokens
 * @returns {RefreshToken[]}
 */
export const getActiveRefreshTokensOfUser = async (userId: string): Promise<RefreshToken[]> => {
  const refreshTokensFromDatabase = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.revoked, false),
        gte(refreshTokens.expiresAt, new Date()),
      ),
    );

  return refreshTokensFromDatabase;
};

/**
 * @param {number} tokenId - id of the token to revoke
 */
export const revokeRefreshToken = async (tokenId: number): Promise<void> => {
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, tokenId));
};
