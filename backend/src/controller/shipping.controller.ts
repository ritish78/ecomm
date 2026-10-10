import { Request, Response, NextFunction } from "express";
import isUuid from "../utils/isUuid";
import { AuthError, BadRequestError } from "../utils/error";
import {
  getStoreShippingQuoteService,
  getStoreShippingService,
  updateStoreShippingSettingService,
} from "../services/shipping.service";
import { updateProductVariantShippingFeeSchema, updateStoreShippingSchema } from "../schema/shipping.schema";
import { updateProductVariantShippingFeeByIdService } from "../services/productVariant.services";

/**
 * @route                   /api/v1/stores/:storeId/shipping-settings
 * @method                  GET
 * @description             Get the shipping settings of a store
 * @access                  store:edit
 */
export const getStoreShippingSettingsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const storeId = req.params.storeId as string;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    const shippingSettings = await getStoreShippingService(storeId, currentUserId);

    return res.status(200).send({ message: "Retrieved store shipping details!", shippingSettings });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/stores/:storeId/shipping-settings
 * @method                  PUT
 * @description             Replace the shipping settings of a store
 * @access                  store:edit
 */
export const updateStoreShippingSettingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = req.user?.id;
    const storeId = req.params.storeId as string;

    if (!currentUserId) {
      throw new AuthError("Not Logged in! Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    const userInput = updateStoreShippingSchema.parse(req.body);

    const shippingSettings = await updateStoreShippingSettingService(storeId, userInput, currentUserId);

    return res.status(200).send({ message: "Updated store shipping info successfully!", shippingSettings });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/stores/:storeId/shipping-quote
 * @method                  GET
 * @description             Calculate shipping of store cart items of the current user
 * @access                  Authenticated
 */
export const getStoreShippingQuoteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const storeId = req.params.storeId as string;

    if (!currentUserId) {
      throw new AuthError("Not Logged in! Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    const quote = await getStoreShippingQuoteService(storeId, currentUserId);

    return res.status(200).send({ message: "Calculated the quote of shipping successfully!", quote });
  } catch (error) {
    next(error);
  }
};


/**
 * @route                   /api/v1/stores/:storeId/products/:productId/variants/:variantId/shipping-fee
 * @method                  PATCH
 * @description             Update the additional shipping fee of a variant
 * @access                  product_price:update
 */
export const updateProductVariantShippingFeeController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?.id;
        const storeId = req.params.storeId as string;
        const productId = req.params.productId as string;
        const variantId = req.params.variantId as string;

        if (!currentUserId) {
            throw new AuthError("Not logged in! Please login to continue!");
        }

        if (!storeId || !isUuid(storeId)) {
            throw new BadRequestError("Please provide correct store id!");
        }

        if (!productId || !isUuid(productId)) {
            throw new BadRequestError("Please provide correct product id!");
        }

        if (!variantId || !isUuid(variantId)) {
            throw new BadRequestError("Please provide correct product variant id!");
        }

        const userInput = updateProductVariantShippingFeeSchema.parse(req.body);

        const updatedProductVariant = await updateProductVariantShippingFeeByIdService(storeId, productId, variantId, userInput, currentUserId);

        return res.status(200).send({ message: "Updated product variant successfully!", variant: updatedProductVariant })
    } catch (error) {
        next(error);
    }
}
