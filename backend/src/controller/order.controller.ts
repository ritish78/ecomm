import { Request, Response, NextFunction } from "express";
import { AuthError, BadRequestError } from "../utils/error";
import { createOrderSchema, filterOrdersSchema } from "../schema/order.schema";
import {
  createOrderService,
  getOrderByIdService,
  getOrdersService,
  getStoreOrderByIdService,
  getStoreOrdersService,
} from "../services/order.service";
import isUuid from "../utils/isUuid";

/**
 * @route                   /api/v1/orders
 * @method                  POST
 * @description             Place an order for one store cart items
 * @access                  Authenticated
 */
export const createOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login to continue!");
    }

    const userInput = createOrderSchema.parse(req.body);
    const result = await createOrderService(currentUserId, userInput);

    return res.status(result.replayed ? 200 : 201).send({
      message: result.replayed ? "Retried the previously placed order!" : "Placed your order successfully!",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/orders
 * @method                  GET
 * @description             Get the orders of the current user
 * @access                  Authenticated
 */
export const getOrdersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not Logged in! Please login to continue!");
    }

    const userInput = filterOrdersSchema.parse(req.query);
    const orders = await getOrdersService(currentUserId, userInput);

    return res.status(200).send({ message: "Retrieved your order successfully!", ...orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/orders/:orderId
 * @method                  GET
 * @description             Get the details of an order of the current user
 * @access                  Order owner
 */
export const getOrderByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const orderId = req.params.orderId as string;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    if (!orderId || !isUuid(orderId)) {
      throw new BadRequestError("Please provide correct order id!");
    }

    const result = await getOrderByIdService(currentUserId, orderId);

    return res.status(200).send({ message: "Retrieved your order successfully!", ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/stores/:storeId/orders
 * @method                  GET
 * @description             Get the orders of a store
 * @access                  store_orders:view
 */
export const getStoreOrdersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const storeId = req.params.storeId as string;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    const userInput = filterOrdersSchema.parse(req.query);

    const orders = await getStoreOrdersService(storeId, userInput, currentUserId);

    return res.status(200).send({ message: "Retrieved store orders successfully!", ...orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/stores/:storeId/orders/:orderId
 * @method                  GET
 * @description             Get the details of an order belonging to a store
 * @access                  store_orders:view
 */
export const getStoreOrderByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const storeId = req.params.storeId as string;
    const orderId = req.params.orderId as string;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Please login to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Please provide correct store id!");
    }

    if (!orderId || !isUuid(orderId)) {
      throw new BadRequestError("Please provide correct order id!");
    }

    const result = await getStoreOrderByIdService(storeId, orderId, currentUserId);

    return res.status(200).send({ message: "Retrieved store order successfully!", ...result });
  } catch (error) {
    next(error);
  }
};
