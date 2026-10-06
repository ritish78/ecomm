import { MAX_ADDRESSES_PER_USER } from "../config/address";
import db, { Tx } from "../db";
import {
  createUserAddress,
  deleteUserAddressById,
  findAddressOwnerForUpdate,
  findUserAddressById,
  getUserAddress,
  setDefaultUserAddressById,
  updateUserAddressById,
} from "../repository/address.repository";
import { CreateAddressInput, UpdateAddressInput } from "../schema/address.schema";
import { AuthError, ConflictError, NotFoundError, ServerError } from "../utils/error";

const withUserAddressTransaction = async <T>(currentUserId: string, action: (tx: Tx) => Promise<T>) => {
  return db.transaction(
    async (tx) => {
      //we are going to lock the user since they exists even before their first address
      //all the mutations in our address table needs to acquire this lock
      const userFromDatabase = await findAddressOwnerForUpdate(tx, currentUserId);

      if (!userFromDatabase) {
        throw new AuthError("Not Logged in! Please login to continue!");
      }

      return action(tx);
    },
    { isolationLevel: "read committed" },
  );
};

export const getAddressService = async (currentUserId: string) => {
  return getUserAddress(currentUserId);
};

export const createAddressService = async (currentUserId: string, addressInfo: CreateAddressInput) => {
  return withUserAddressTransaction(currentUserId, async (tx) => {
    const addressFromDatabase = await getUserAddress(currentUserId, tx);

    if (addressFromDatabase.length >= MAX_ADDRESSES_PER_USER) {
      //Should we throw BadRequestError or ConflictError?
      throw new ConflictError(`You can only save ${MAX_ADDRESSES_PER_USER} number of address!`);
    }

    //if the user has not provided address before and this is their only
    //address, then we are going to make this default automatically
    const userAddress = await createUserAddress(
      tx,
      currentUserId,
      addressInfo,
      addressFromDatabase.length === 0,
    );

    if (!userAddress) {
      throw new ServerError("We could not store your address! Please try again later!");
    }

    return userAddress;
  });
};

export const updateAddressByIdService = async (
  currentUserId: string,
  addressId: string,
  addressInfo: UpdateAddressInput,
) => {
  return withUserAddressTransaction(currentUserId, async (tx) => {
    const updatedAddress = await updateUserAddressById(tx, currentUserId, addressId, addressInfo);

    if (!updatedAddress) {
      throw new NotFoundError("Address to update not found!");
    }

    return updatedAddress;
  });
};

export const setDefaultAddressByIdService = async (currentUserId: string, addressId: string) => {
  return withUserAddressTransaction(currentUserId, async (tx) => {
    const addressFromDatabase = await findUserAddressById(tx, currentUserId, addressId);

    if (!addressFromDatabase) {
      throw new NotFoundError("Address to make default not found!");
    }

    //if the address is already default, then we just return the address
    if (addressFromDatabase.isDefault) {
      return addressFromDatabase;
    }

    //we first have to clear the already existing default address
    //before we set the new default address
    const updatedAddress = await setDefaultUserAddressById(tx, currentUserId, addressId);

    //should I return it like this or use returning() in the setDefaultUserAddressById() function
    //and return the updatedAddress like what I did in above function updatedAddressByIdService
    // return { ...addressFromDatabase, isDefault: true };

    if (!updatedAddress) {
      //somehow, the updating function does not return the address is it
      //NotFoundError now? but I have already checked if(!addressFromDatabase) already
      //AND is calling const addressFromDatabase = await findUserAddres(tx, currentUserId, addressId);
      //redundant? While making the function deleteAddressByIdService, I felt like it is.
      throw new NotFoundError("Address to make default not found!");
    }
    return updatedAddress;
  });
};

export const deleteAddressByIdService = async (currentUserId: string, addressId: string) => {
  return withUserAddressTransaction(currentUserId, async (tx) => {
    //should we check if there is address like what I did in setDefaultAddressById service
    const deletedAddress = await deleteUserAddressById(tx, currentUserId, addressId);

    if (!deletedAddress) {
      throw new NotFoundError("Address to delete not found!");
    }

    if (deletedAddress.isDefault) {
      const [nextAddress] = await getUserAddress(currentUserId, tx);

      //after we delete the user's address. We then need to choose the default address
      //I am going to implement that we make the oldest address to be default,
      //we could also make the newest address to be the default. The user could also
      //not have other adddress for us to set it as default
      if (nextAddress) {
        const updatedAddress = await setDefaultUserAddressById(tx, currentUserId, nextAddress.id);

        if (!updatedAddress) {
          throw new ServerError("We could not update your address! Please try again later! ");
        }
      }
    }

    return deletedAddress;
  });
};
