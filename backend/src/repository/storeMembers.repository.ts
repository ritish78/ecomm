import { and, eq } from "drizzle-orm";
import db, { Tx } from "../db";
import { storeMembers } from "../models/storeMembers.model";

/**
 * @param {string} storeId - id of the store to add the member to
 * @param {string} userId - id of the user to add as a member
 * @param {string} roleId - id of the role to assign to the user
 * @param {Tx} tx - database transaction or a database connection
 * @returns {Promise<StoreMember>} - the added store member
 */
export const addMemberToStore = async (storeId: string, userId: string, roleId: string, tx?: Tx) => {
  const userClient = tx ? tx : db;
  //we have unique constraint on (storeId, userId)
  const [member] = await userClient.insert(storeMembers).values({ storeId, userId, roleId }).returning();

  return member;
};

/**
 * @param {string} storeId - id of the store to check
 * @param {string} userId - id of the user to check
 * @returns {Promise<boolean>} - true if the user is a member of the store, false otherwise
 */
export const isUserMemberOfStore = async (storeId: string, userId: string) => {
  const [userFromStore] = await db
    .select({ id: storeMembers.id })
    .from(storeMembers)
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
    .limit(1);

  return Boolean(userFromStore);
};
