import { Permissions } from "../config/permissions";
import db from "../db";
import { findUserByEmail } from "../repository/auth.repository";
import { getGlobalOwnerRole } from "../repository/roles.repository";
import { createStore, hasStorePermission } from "../repository/store.repository";
import { addMemberToStore } from "../repository/storeMembers.repository";
import { NotFoundError } from "../utils/error";
import toSlug from "../utils/toSlug";

export const createStoreService = async (
  userId: string,
  name: string,
  description: string,
  logoUrl: string | undefined,
) => {
  return db.transaction(async (tx) => {
    const slug = toSlug(name);
    const store = await createStore(tx, name, slug, description, logoUrl);

    const ownerRole = await getGlobalOwnerRole(tx);

    //there should be owner role in our database. if there isn't then that means,
    //we have not seeded the owner role in our database.
    //i am going optimistically that we have seeded our database.
    const member = await addMemberToStore(store.id, userId, ownerRole.id, tx);

    return { store, member };
  });
};

export const hasStorePermissionService = async (
  userId: string,
  storeId: string,
  permissionKey: Permissions,
): Promise<boolean> => {
    console.log("Checking permission service", userId, storeId, permissionKey);
    const result = await hasStorePermission(userId, storeId, permissionKey);

    console.log("Result", result);

    return result;
};

export const addMemberToStoreService = async (storeId: string, email: string, roleId: string) => {
  const userFromDatabase = await findUserByEmail(email);

  if (!userFromDatabase) {
    throw new NotFoundError(`User of provided email: ${email} not found!`);
  }

  //Todo:
  //add a check to see if the user that we are adding is already a part of the store
  //then need to use assertCanActOnRole

  return addMemberToStore(storeId, userFromDatabase.id, roleId);
};
