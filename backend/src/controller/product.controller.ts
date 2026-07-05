import { Request, Response, NextFunction } from "express";
import { getProductsService, getProductWithDetailsByIdOrSlugService } from "../services/product.services";
import { BadRequestError } from "../utils/error";
import { filterProductSchema } from "../schema/product.schema";

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
