import { and, asc, desc, eq } from "drizzle-orm";
import db, { Tx } from "../db";
import { users } from "../models/users.model";
import { address } from "../models/address.model";
import { CreateAddressInput, UpdateAddressInput } from "../schema/address.schema";

export const findAddressOwnerForUpdate = async (tx: Tx, currentUserId: string) => {
  const [userFromDatabase] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, currentUserId))
    .for("update");

  return userFromDatabase;
};

export const getUserAddress = async (currentUserId: string, tx?: Tx) => {
  const database = tx ? tx : db;

  return database
    .select()
    .from(address)
    .where(eq(address.userId, currentUserId))
    .orderBy(desc(address.isDefault), asc(address.createdAt), asc(address.id));
};

export const findUserAddressById = async (tx: Tx, currentUserId: string, addressId: string) => {
  const [addressFromDatabase] = await tx
    .select()
    .from(address)
    .where(and(eq(address.id, addressId), eq(address.userId, currentUserId)));

  return addressFromDatabase;
};

export const createUserAddress = async (
  tx: Tx,
  currentUserId: string,
  addressInfo: CreateAddressInput,
  isDefault: boolean,
) => {
  const [newAddress] = await tx
    .insert(address)
    .values({ ...addressInfo, userId: currentUserId, isDefault })
    .returning();

  return newAddress;
};

export const updateUserAddressById = async (
  tx: Tx,
  currentUserId: string,
  addressId: string,
  addressInfo: UpdateAddressInput,
) => {
  const [updatedAddress] = await tx
    .update(address)
    .set({ ...addressInfo, updatedAt: new Date() })
    .where(and(eq(address.id, addressId), eq(address.userId, currentUserId)))
    .returning();

  return updatedAddress;
};

export const clearDefaultAddress = async (tx: Tx, currentUserId: string) => {
  await tx
    .update(address)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(eq(address.userId, currentUserId), eq(address.isDefault, true)));
};

export const setDefaultUserAddressById = async (tx: Tx, currentUserId: string, addressId: string) => {
  const [updatedAddress] = await tx
    .update(address)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(address.id, addressId), eq(address.userId, currentUserId)))
    .returning();

  return updatedAddress;
};

export const deleteUserAddressById = async (tx: Tx, currentUserId: string, addressId: string) => {
  const [deletedAddress] = await tx
    .delete(address)
    .where(and(eq(address.id, addressId), eq(address.userId, currentUserId)))
    .returning();

  return deletedAddress;
};
