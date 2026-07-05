import { Request, Response, NextFunction } from "express";
import { addMemberSchema } from "../schema/storeMembers.schema";
import { addMemberToStoreService, createStoreService } from "../services/store.service";
import { AuthError } from "../utils/error";
import { createStoreSchema } from "../schema/store.schema";
import { CreateProductInput, filterProductSchema } from "../schema/product.schema";
import {
  createProductService,
  deleteProductByIdService,
  getProductsService,
} from "../services/product.services";

/**
 * @route               /api/v1/stores
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
 * @route               /api/v1/stores/:storeId/members
 * @method              POST
 * @description         Add members to a store
 * @access              members:add
 */
export const addMembersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;

    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    const userInput = addMemberSchema.parse(req.body);

    const member = await addMemberToStoreService(currentUserId, storeId, userInput.email, userInput.roleId);

    return res.status(200).send({ message: "Member added successfully!", member });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/products
 * @method              POST
 * @description         Create product listing in a store
 * @access              products:create
 */
export const createProductListingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Creating product!");
    const storeId = req.params.storeId as string;

    const body = req.body as CreateProductInput;

    const result = await createProductService(storeId, body);

    return res.status(201).send({ message: "Product Created successfully!", ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/products/:productId
 * @method              DELETE
 * @description         Delete product listing in a store
 * @access              products:delete
 */
export const deleteProductListingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const productId = req.params.productId as string;

    const result = await deleteProductByIdService(productId, storeId);

    return res.status(200).send({ message: "Product deleted successfully!", ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/products
 * @method              GET
 * @description         Get all products of a store
 * @access              Public
 */
export const getAllProductsOfStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;

    const userInputFilters = filterProductSchema.parse({ ...req.query, storeId });

    const products = await getProductsService(userInputFilters);

    return res.status(200).send({ message: "Products of store retrieved successfully!", products });
  } catch (error) {
    next(error);
  }
}
