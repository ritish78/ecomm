import { Request, Response, NextFunction } from "express";
import { addMemberSchema } from "../schema/storeMembers.schema";
import { addMemberToStoreService, createStoreService } from "../services/store.service";
import { AuthError } from "../utils/error";
import { createStoreSchema } from "../schema/store.schema";

/**
 * @route               /stores
 * @method              POST
 * @description         Create a store to sell product. add current user as owner
 * @access              Authenticated
 */
export const createStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    const storeInput = createStoreSchema.parse(req.body);
    const result = await createStoreService(
      userId,
      storeInput.name,
      storeInput.description,
      storeInput.logoUrl,
    );

    return res.status(201).send({ message: "Store created successfully!", ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /stores/:storeId/members
 * @method              POST
 * @description         Add members to a store
 * @access              members:add
 */
export const addMembersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;

    const userInput = addMemberSchema.parse(req.body);

    const member = await addMemberToStoreService(storeId, userInput.email, userInput.roleId);

    return res.status(200).send({ message: "Member added successfully!", member });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /stores/:storeId/products
 * @method              POST
 * @description         Create product listing in a store
 * @access              products:create
 */
export const createProductListingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
  } catch (error) {
    next(error);
  }
};
