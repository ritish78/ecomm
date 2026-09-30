import { and, eq, inArray } from "drizzle-orm";
import db, { Tx } from "../db";
import { platformMembers } from "../models/platformMembers.model";

export const hasPlatformRole = async (userId: string, ...allowedRoles: string[]): Promise<boolean> => {
  const [row] = await db
    .select()
    .from(platformMembers)
    .where(and(eq(platformMembers.userId, userId), inArray(platformMembers.role, allowedRoles)))
    .limit(1);

  return Boolean(row);
};

/**
 * @param {Tx} tx - database transaction
 * @param {string} userId - id of the user to check
 * @param {string[]} allowedRoles - platform roles that allow this action
 * @returns {Promise<boolean>} - whether the user has an allowed platform role
 */
export const hasPlatformRoleInTransaction = async (
  tx: Tx,
  userId: string,
  ...allowedRoles: string[]
): Promise<boolean> => {
  //we use the transaction connection for this authorization check
  //if a matching platform membership exists, we also prevent it from
  //being changed or removed until this transaction finishes
  const [platformMembership] = await tx
    .select()
    .from(platformMembers)
    .where(
      and(
        eq(platformMembers.userId, userId),
        inArray(platformMembers.role, allowedRoles),
      ),
    )
    .limit(1)
    .for("share");

  return Boolean(platformMembership);
};
