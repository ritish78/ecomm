import { Request, Response, NextFunction } from "express";
import { addMemberSchema } from "../schema/storeMembers.schema";
import {
  addMemberToStoreService,
  createStoreService,
  deleteStoreByIdService,
  getAllMembersOfStoreService,
  getStoreByIdOrSlugService,
  removeMemberFromStoreService,
  updateStoreByIdService,
} from "../services/store.service";
import { AuthError, BadRequestError } from "../utils/error";
import { createStoreSchema, updateStoreSchema } from "../schema/store.schema";
import { CreateProductInput, filterProductSchema } from "../schema/product.schema";
import {
  createProductService,
  deleteProductByIdService,
  getProductsService,
} from "../services/product.services";
import {
  getAllRolesOfStoreService,
  getAllRolesWithPermissionOfStoreService,
  getPermissionOfRolesService,
} from "../services/roles.service";
import isUuid from "../utils/isUuid";

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

/**
 * @route                 /api/v1/stores/:storeId/roles
 * @method                GET
 * @description           Get all roles of a store
 * @access                Authenticate
 */
export const getAllRolesOfStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const userId = req.user?.id as string;

    const roles = await getAllRolesOfStoreService(storeId, userId);

    return res.status(200).send({ message: "Roles of store retrieved successfully!", roles });
  } catch (error) {
    next(error)
  }
};

/**
 * @route               /api/v1/stores/:storeId/roles-permissions
 * @method              GET
 * @description         Get all roles with permission of a store
 * @access              Authenticate
 */
export const getAllRolesWithPermissionOfStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const userId = req.user?.id as string;

    const roles = await getAllRolesWithPermissionOfStoreService(storeId, userId);

    return res.status(200).send({ message: "Roles and permissions of store retrieved successfully!", roles })
  } catch (error) {
    next(error);
  }
}

/**
 * @route               /api/v1/stores/:storeId/roles/:roleId/permissions 
 * @method              GET
 * @description         Get permissions of role
 * @access              Authenticate
 */
export const getPermissionOfRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;
    const userId = req.user?.id as string;

    const permissions = await getPermissionOfRolesService(storeId, roleId, userId);
    
    return res.status(200).send({ message: "Permission of role retrieved successfully!", permissions })
  } catch (error) {
    next(error);
  }
}

/**
 * @route               /api/v1/stores/:storeId/members/:userId 
 * @method              DELETE
 * @description         Remove a user from a store
 * @access              members:remove
 */
export const removeUserFromStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const targetUserId = req.params.userId as string;
    const currentUserId = req.user?.id as string;

    const user = await removeMemberFromStoreService(storeId, currentUserId, targetUserId);

      return res.status(200).send({ message: "Member removed successfully!", user })
  } catch (error) {
    next(error);
  }
}

/**
 * @route               /api/v1/stores/:identifier
 * @method              GET
 * @description         Get store details by its id or slug
 * @access              Public
 */
export const getStoreByIdOrSlugController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.identifier) {
      throw new BadRequestError("Invalid store identifier provided!");
    }

    const store = await getStoreByIdOrSlugService(req.params.identifier as string);

    return res.status(200).send({ message: "Store retrieved successfully!", store });
  } catch (error) {
    next(error);
  }
}

/**
 * @route              /api/v1/stores/:storeId
 * @method             PATCH
 * @description        Update store details by its id
 * @access             store:edit
 */
export const updateStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.storeId || !isUuid(req.params.storeId as string)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    const userInput = updateStoreSchema.parse(req.body);

    const updatedStore = await updateStoreByIdService(req.params.storeId as string, userInput);

    return res.status(200).send({ message: "Store updated successfully!", store: updatedStore });
  } catch (error) {
    next(error);
  }
}

/**
 * @route              /api/v1/stores/:storeId
 * @method             DELETE
 * @description        Delete store by its id
 * @access             store:remove 
 */
export const deleteStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.storeId || !isUuid(req.params.storeId as string)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    const deletedStore = await deleteStoreByIdService(req.params.storeId as string);

    return res.status(200).send({ message: "Store deleted successfully!", store: deletedStore });
  } catch (error) {
    next(error);
  }
}


/**
 * @route              /api/v1/stores/:storeId/members
 * @method             GET
 * @description        Get all members of a store
 * @access             Authenticate
 */
export const getAllMembersOfStoreController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const userId = req.user?.id as string;

    const members = await getAllMembersOfStoreService(storeId, userId);

    return res.status(200).send({ message: "Members of store retrieved successfully!", members });
  } catch (error) {
    next(error);
  }
}

