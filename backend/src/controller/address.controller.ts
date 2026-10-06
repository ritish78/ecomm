import { Request, Response, NextFunction } from "express";
import { AuthError, BadRequestError } from "../utils/error";
import {
  createAddressService,
  deleteAddressByIdService,
  getAddressService,
  setDefaultAddressByIdService,
  updateAddressByIdService,
} from "../services/address.service";
import { createAddressSchema, updateAddressSchema } from "../schema/address.schema";
import isUuid from "../utils/isUuid";

/**
 * @route                       /api/v1/addresses
 * @method                      GET
 * @description                 Get the saved delivery addresses of the current signed in user
 * @access                      Authenticated
 */
export const getAddressesOfUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    //the function getAddressService should have been named getAddressesService
    //like this controller because we are retruning more than 1 address if it exists
    const addresses = await getAddressService(currentUserId);

    return res.status(200).send({ message: "Retrieved your addresses successfully!", addresses });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                       /api/v1/addresses
 * @method                      POST
 * @description                 Save the address for the current user
 * @access                      Authenticated
 */
export const createAddressController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    const userAddressInput = createAddressSchema.parse(req.body);

    const address = await createAddressService(currentUserId, userAddressInput);

    return res.status(201).send({ message: "Saved your delivery address successfully!", address });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                       /api/v1/addresses/:addressId
 * @method                      PUT
 * @description                 Update the details of a saved address
 * @access                      Address owner
 */
export const updateAddressByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const addressId = req.params.addressId as string;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    if (!addressId || !isUuid(addressId)) {
      throw new BadRequestError("Please provide correct address id to update!");
    }

    const userUpdateAddressInput = updateAddressSchema.parse(req.body);

    const updatedAddress = await updateAddressByIdService(currentUserId, addressId, userUpdateAddressInput);

    return res.status(200).send({ message: "Updated Address successfully!", address: updatedAddress });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                       /api/v1/addresses/:addressId/default
 * @method                      PATCH
 * @description                 Set the default address of the current signed in user
 * @access                      Address owner
 */
export const setDefaultAddressController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const addressId = req.params.addressId as string;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    if (!addressId || !isUuid(addressId)) {
      throw new BadRequestError("Please provide correct address id to set as default!");
    }

    const updatedAddress = await setDefaultAddressByIdService(currentUserId, addressId);

    return res
      .status(200)
      .send({ message: "Successfully updated your default address!", address: updatedAddress });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                       /api/v1/addresses/:addressId
 * @method                      DELETE
 * @description                 Delete an address of the current signed in user
 * @access                      Address owner
 */
export const deleteAddressByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const addressId = req.params.addressId as string;

    if (!currentUserId) {
      throw new AuthError("Not Logged in! Please login to continue!");
    }

    if (!addressId || !isUuid(addressId)) {
      throw new BadRequestError("Please provide correct address id to delete!");
    }

    const deletedAddress = await deleteAddressByIdService(currentUserId, addressId);

    return res.status(200).send({ message: "Deleted your address successfully!", address: deletedAddress });
  } catch (error) {
    next(error);
  }
};
