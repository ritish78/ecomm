import { Request, Response, NextFunction } from "express";
import { getProductsService, getProductWithDetailsByIdOrSlugService } from "../services/product.services";
import { AuthError, BadRequestError } from "../utils/error";
import { filterProductSchema } from "../schema/product.schema";
import isUuid from "../utils/isUuid";
import { getProductHistoryService } from "../services/productHistory.services";

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

    const userInputFilters = filterProductSchema.parse(req.query);

    const historyOfProduct = await getProductHistoryService(storeId, productId, userInputFilters);

    return res.status(200).send({ message: "History of product retrieved successfully!", historyOfProduct });
  } catch (error) {
    next(error);
  }
};
