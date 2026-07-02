import db from "../db";
import { storeMembers } from "../models/storeMembers.model";

export const addMemberToStore = async (storeId: string, userId: string, roleId: string) => {
  //we have unique constraint on (storeId, userId)
  const [member] = await db.insert(storeMembers).values({ storeId, userId, roleId }).returning();

  return member;
};
