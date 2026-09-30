import { Permissions } from "../config/permissions";
import db from "../db";
import { findUserByEmail } from "../repository/auth.repository";
import { hasPlatformRole } from "../repository/platformMember.repository";
import { getGlobalOwnerRole } from "../repository/roles.repository";
import {
  createStore,
  deleteStoreById,
  findStoreByIdOrSlug,
  getAllMembersOfStore,
  getStoreById,
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
import {
  assertCanActOnMember,
  assertCanActOnRole,
  withStoreAuthorizationTransaction,
} from "./storeAuthorization.service";

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

    if (!member) {
      throw new ConflictError("Could not add the owner to the new store!");
    }

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
 * @returns - the added store member
 */
export const addMemberToStoreService = async (
  currentUserId: string,
  storeId: string,
  email: string,
  roleId: string,
) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "members:add", async (tx) => {
    //the helper has already checked that the store exists and
    //that the current user still has permission to add members.

    //we check that the requested role belongs to this store or is global,
    //and that the current user is allowed to assign it.
    await assertCanActOnRole(currentUserId, storeId, roleId, tx);

    const userFromDatabase = await findUserByEmail(email, tx);

    if (!userFromDatabase) {
      throw new NotFoundError(`User of provided email: ${email} not found!`);
    }

    const userIsAlreadyMember = await isUserMemberOfStore(storeId, userFromDatabase.id, tx);

    if (userIsAlreadyMember) {
      throw new ConflictError("User to add is already member of the store!");
    }

    const member = await addMemberToStore(storeId, userFromDatabase.id, roleId, tx);

    //we keep the unique constraint and conflict handling as an
    //additional database safeguard against duplicate memberships.
    if (!member) {
      throw new ConflictError("User to add is already member of the store!");
    }

    return member;
  });
};

/**
 * @param {string} storeId - id of the store to remove the member from
 * @param {string} currentUserId - id of the user performing the removal
 * @param {string} targetUserId - id of the member to remove
 * @returns - the removed store member
 */
export const removeMemberFromStoreService = async (
  storeId: string,
  currentUserId: string,
  targetUserId: string,
) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "members:remove", async (tx) => {
    //checking to see if the user wants to remove themselves from the store.
    if (currentUserId === targetUserId) {
      throw new ForbiddenError("You are not allowed to remove yourself from the store!");
    }

    //this checks that the target is a member and that the current
    //user is allowed to act on their current role.
    await assertCanActOnMember(currentUserId, storeId, targetUserId, tx);

    const targetUserMembership = await getStoreMembershipWithPermission(targetUserId, storeId, tx);

    if (!targetUserMembership) {
      throw new NotFoundError("User to remove is not member of this store!");
    }

    //our current implementation uses store:remove to identify a protected
    //owner membership. This restriction also applies to platform admins.
    const targetIsOwnerOfStore = targetUserMembership.permissions.includes("store:remove");

    if (targetIsOwnerOfStore) {
      throw new ForbiddenError("You can not remove owner of the store through member management!");
    }

    //role assignment uses the same store lock, so the target's role
    //can not change between our hierarchy check and this removal.
    const removedMember = await removeMemberFromStore(storeId, targetUserId, tx);

    if (!removedMember) {
      throw new NotFoundError("User to remove is not member of this store!");
    }

    return removedMember;
  });
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
export const deleteStoreByIdService = async (storeId: string, currentUserId: string) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "store:remove", async (tx) => {
    const deletedStore = await deleteStoreById(storeId, tx);

    if (!deletedStore) {
      throw new NotFoundError(`Store of id ${storeId} not found!`);
    }

    return deletedStore;
  });
};
/**
 * @param {string} storeId - id of the store to get members from
 * @param {string} currentUserId - id of the user requesting the members
 * @returns {Promise<object[]>} - members with their roles and permissions
 */
export const getAllMembersOfStoreService = async (
  storeId: string,
  currentUserId: string,
) => {
  //first, we check if the current user is a platform admin.
  //admins can view the members without being a member of the store.
  const isUserAdmin = await hasPlatformRole(currentUserId, "admin");

  if (!isUserAdmin) {
    const userMemberOfStore = await isUserMemberOfStore(storeId, currentUserId);

    if (!userMemberOfStore) {
      throw new ForbiddenError("You are not allowed to view members of stores that you are not member of!");
    }
  }

  const storeFromDatabase = await getStoreById(storeId);

  if (!storeFromDatabase) {
    throw new NotFoundError(`Store of id ${storeId} not found!`);
  }

  return getAllMembersOfStore(storeId);
};
