import { Request, Response, NextFunction } from "express";
import { getProductsService, getProductWithDetailsByIdOrSlugService } from "../services/product.services";
import { AuthError, BadRequestError } from "../utils/error";
import { filterProductSchema } from "../schema/product.schema";
import isUuid from "../utils/isUuid";
import { getProductHistoryService } from "../services/productHistory.services";
import { filterProductHistorySchema } from "../schema/productHistory.schema";
import {
  addProductVariantService,
  getProductVariantsForManagementService,
  updateProductVariantByIdService,
} from "../services/productVariant.services";
import { addProductVariantSchema, updateProductVariantSchema } from "../schema/productVariants.schema";

/**
 * @route               /api/v1/products/:identifier
 * @method              GET
 * @description         Get product details by its id
 * @access              Public
 */
export const productByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.identifier) {
      throw new BadRequestError("Invalid product identifier provided!");
    }

    const product = await getProductWithDetailsByIdOrSlugService(req.params.identifier as string);

    return res.status(200).send({ message: "Product retrieved successfully!", product });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                 /api/v1/products
 * @method                GET
 * @description           Get products with filters
 * @access                Public
 */
export const getProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userInputFilters = filterProductSchema.parse(req.query);

    const products = await getProductsService(userInputFilters);

    return res.status(200).send({ message: "Products retrieved successfully!", products });
  } catch (error) {
    next(error);
  }
}

/**
 * @route               /api/v1/stores/:storeId/products/:productId/history
 * @method              GET
 * @description         Get previous details saved when a product was edited
 * @access              product:edit
 */
export const getProductHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const productId = req.params.productId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    if (!productId || !isUuid(productId)) {
      throw new BadRequestError("Please provide correct product id!");
    }

    //selected filterProductSchema from the dropdowb in ide before
    //when it should have been filterProductHistorySchema
    const userInputFilters = filterProductHistorySchema.parse(req.query);

    const historyOfProduct = await getProductHistoryService(storeId, productId, userInputFilters);

    return res.status(200).send({ message: "History of product retrieved successfully!", historyOfProduct });
  } catch (error) {
    next(error);
  }
};


/**
 * @route               /api/v1/stores/:storeId/products/:productId/variants
 * @method              GET
 * @description         Get all variants of a product for store management
 * @access              product:edit
 */
export const getProductVariantsForManagementController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const productId = req.params.productId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    if (!productId || !isUuid(productId)) {
      throw new BadRequestError("Please provide correct product id!");
    }

    //we also include unavailable and variants which are discontinued
    const variants = await getProductVariantsForManagementService(storeId, productId);

    return res.status(200).send({ message: "Product variant retrieved successfully!", variants });
  } catch (error) {
    next(error);
  }
}

export const addProductVariantController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const productId = req.params.productId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    if (!productId || !isUuid(productId)) {
      throw new BadRequestError("Please provide correct product id!");
    }

    const userInput = addProductVariantSchema.parse(req.body);

    //the service does the checks for permissions and storing the initial
    //stock and price. The service also checks for product owner
    const variant = await addProductVariantService(storeId, productId, userInput);

    return res.status(201).send({ message: "Product variant added successfully!", variant });
  } catch (error) {
    next(error);
  }
}

/**
 * @route               /api/v1/stores/:storeId/products/:productId/variants/:variantId
 * @method              PATCH
 * @description         Update variant weight, unit, SKU or availability
 * @access              product:edit
 */
export const updateProductVariantController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const productId = req.params.productId as string;
    const variantId = req.params.variantId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    if (!productId || !isUuid(productId)) {
      throw new BadRequestError("Please provide correct product id!")
    }

    if (!variantId || !isUuid(variantId)) {
      throw new BadRequestError("Please provide correct variant id!");
    }

    const userInput = updateProductVariantSchema.parse(req.body);

    //similar to the above controller, the service takes care of permissions and field endpoints
    const variant = await updateProductVariantByIdService(storeId, productId, variantId, userInput);

    return res.status(200).send({ message: "Product variant updated successfully!", variant });
  } catch (error) {
    next(error);
  }
}
