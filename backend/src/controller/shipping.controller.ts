import { Request, Response, NextFunction } from "express";
import isUuid from "../utils/isUuid";
import { AuthError, BadRequestError } from "../utils/error";
import {
  getStoreShippingQuoteService,
  getStoreShippingService,
  updateStoreShippingSettingService,
} from "../services/shipping.service";
import { updateStoreShippingSchema } from "../schema/shipping.schema";

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
