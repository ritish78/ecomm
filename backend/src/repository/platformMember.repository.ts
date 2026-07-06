import { and, eq, inArray } from "drizzle-orm";
import db from "../db";
import { platformMembers } from "../models/platformMembers.model";

export const hasPlatformRole = async (userId: string, ...allowedRoles: string[]): Promise<boolean> => {
  const [row] = await db
    .select()
    .from(platformMembers)
    .where(and(eq(platformMembers.userId, userId), inArray(platformMembers.role, allowedRoles)))
    .limit(1);

  return Boolean(row);
};
