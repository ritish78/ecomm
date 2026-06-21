import argon2 from "argon2";

/**
 * @param plainPassword     string - password in plain text to hash
 * @returns                 string - argon2 hash of the provided password
 */
const hashPassword = async (plainPassword: string) => {
  const hashedPassword = await argon2.hash(plainPassword);

  return hashedPassword;
};

/**
 * @param plainPassword     string - password in plain text to verify
 * @param hashedPassword    string - hashed password from the database to verify against
 * @returns
 */
export const passwordMatches = async (plainPassword: string, hashedPassword: string) => {
  const isPasswordSame = await argon2.verify(hashedPassword, plainPassword);

  return isPasswordSame;
};

export default hashPassword;
