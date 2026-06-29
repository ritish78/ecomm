import { Request, Response, NextFunction } from "express";
import { getProductWithDetailsByIdOrSlugService } from "../services/product.services";
import { BadRequestError } from "../utils/error";

/**
 * @route               /api/v1/product/:identifier
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

    return res.status(200).send(product);
  } catch (error) {
    next(error);
  }
};
