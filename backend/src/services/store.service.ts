import { Permissions } from "../config/permissions";
import db from "../db";
import { findUserByEmail } from "../repository/auth.repository";
import { getGlobalOwnerRole } from "../repository/roles.repository";
import { createStore, hasStorePermission } from "../repository/store.repository";
import { addMemberToStore, isUserMemberOfStore } from "../repository/storeMembers.repository";
import { ConflictError, NotFoundError } from "../utils/error";
import toSlug from "../utils/toSlug";
import { assertCanActOnRole } from "./storeAuthorization.service";

/**
 * @param {string} userId - id of the user creating the store
 * @param {string} name - name of the store to create
 * @param {string} description - description of the store to create
 * @param {string | undefined} logoUrl - URL of the store's logo
 * @returns {Promise<{store: Store, member: StoreMember}>} - the created store and the member who created it
 */
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

/**
 * @param {string} userId - id of the user to check
 * @param {string} storeId - id of the store to check
 * @param {Permissions} permissionKey - key of the permission to check
 * @returns {Promise<boolean>} - true if the user has the permission, false otherwise
 */
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

/**
 * @param {string} currentUserId - id of the user adding the member
 * @param {string} storeId - id of the store to add the member to
 * @param {string} email - email of the user to add as a member
 * @param {string} roleId - id of the role to assign to the user
 * @returns {Promise<StoreMember>} - the added store member
 */
export const addMemberToStoreService = async (
  currentUserId: string,
  storeId: string,
  email: string,
  roleId: string,
) => {
  const userFromDatabase = await findUserByEmail(email);

  if (!userFromDatabase) {
    throw new NotFoundError(`User of provided email: ${email} not found!`);
  }

  const userIsAlreadyMember = await isUserMemberOfStore(storeId, userFromDatabase.id);

  if (userIsAlreadyMember) {
    throw new ConflictError("User to add is already member of the store!");
  }

  //we check if the new member that is being added does not have
  //higher or same level of role/permissions of the user.
  //if the new member has higher or same level of role/permissions then we throw an error.
  await assertCanActOnRole(currentUserId, storeId, roleId);

  //finally, if the user is not already a member of the store and
  //the new member does not have higher or same level of role/permissions
  //of the user, then we add the new member to the store.
  return addMemberToStore(storeId, userFromDatabase.id, roleId);
};
