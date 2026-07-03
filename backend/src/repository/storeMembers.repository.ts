import { and, eq } from "drizzle-orm";
import db, { Tx } from "../db";
import { storeMembers } from "../models/storeMembers.model";

export const addMemberToStore = async (storeId: string, userId: string, roleId: string, tx?: Tx) => {
  const userClient = tx ? tx : db;
  //we have unique constraint on (storeId, userId)
  const [member] = await userClient.insert(storeMembers).values({ storeId, userId, roleId }).returning();

  return member;
};

export const isUserMemberOfStore = async (storeId: string, userId: string) => {
  const [userFromStore] = await db
    .select({ id: storeMembers.id })
    .from(storeMembers)
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
    .limit(1);

  return Boolean(userFromStore);
};
