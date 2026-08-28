import { Permissions } from "../config/permissions";
import db from "../db";
import { findUserByEmail } from "../repository/auth.repository";
import { getGlobalOwnerRole } from "../repository/roles.repository";
import {
  createStore,
  deleteStoreById,
  findStoreByIdOrSlug,
  getAllMembersOfStore,
  getStoreMembershipWithPermission,
  hasStorePermission,
  updateStoreById,
} from "../repository/store.repository";
import {
  addMemberToStore,
  isUserMemberOfStore,
  removeMemberFromStore,
} from "../repository/storeMembers.repository";
import { UpdateStoreInput } from "../schema/store.schema";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/error";
import toSlug from "../utils/toSlug";
import { assertCanActOnMember, assertCanActOnRole } from "./storeAuthorization.service";

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


export const removeMemberFromStoreService = async (
  storeId: string,
  currentUserId: string,
  targetUserId: string,
) => {
  //checking to see if the user wants to remove themselves from the store
  if (currentUserId === targetUserId) {
    throw new ForbiddenError("You are not allowed to remove yourself from the store!");
  }

  const userIsMember = await isUserMemberOfStore(storeId, targetUserId);

  if (!userIsMember) {
    throw new NotFoundError("User to remove is not member of this store!");
  }

  //checking to see if the current user is trying to remove user that is above them
  await assertCanActOnMember(currentUserId, storeId, targetUserId);

  const targetUserMembership = await getStoreMembershipWithPermission(targetUserId, storeId);

  //checking to see if the current user is trying to remove owner of the store.
  //only owner has store:remove, store:edit permission. so using store:remove
  const targetIsOwnerOfStore = targetUserMembership?.permissions.includes("store:remove");

  if (targetIsOwnerOfStore) {
    throw new ForbiddenError("You can not remove owner of the store! Contact admin of this app!");
  }

  return removeMemberFromStore(storeId, targetUserId);
};


export const getStoreByIdOrSlugService = async (identifier: string) => {
  const store = await findStoreByIdOrSlug(identifier);

  if (!store) {
    throw new NotFoundError(`Store of id/slug ${identifier} not found!`);
  }

  return store;
};


export const updateStoreByIdService = async (storeId: string, storeInfo: UpdateStoreInput) => {
  //using the above function findStoreByIdOrSlug to check if the store of the
  //provided storeId exists or not. Currently, we are ony using the ID of the
  //store but we are still using the findStoreByIdOrSlug function because we
  //might use the slug of the store in the future.
  const store = await findStoreByIdOrSlug(storeId);

  if (!store) {
    throw new NotFoundError(`Store of id ${storeId} not found!`);
  }

  return updateStoreById(storeId, storeInfo);
};

//Todo:
//on a second thougth while scrolling, it has been a while since I returned back to this project
//should we delete the store outright? There will be products, orders and members associated to 
//that store. By deleting the store, we are removing just the record of the table.
export const deleteStoreByIdService = async (storeId: string) => {
  //same like in above updateStoreByIdService function, we are using
  //findStoreByIdOrSlug function to check if the store of the provided id exists.
  const store = await findStoreByIdOrSlug(storeId);

  if (!store) {
    throw new NotFoundError(`Store of id ${storeId} not found!`);
  }

  return deleteStoreById(storeId);
};


export const getAllMembersOfStoreService = async (storeId: string, userId: string) => {
  const userMemberOfStore = await isUserMemberOfStore(storeId, userId);

  if (!userMemberOfStore) {
    throw new ForbiddenError("You are not allowed to view members of stores that you are not member of!");
  }

  return getAllMembersOfStore(storeId);
};


