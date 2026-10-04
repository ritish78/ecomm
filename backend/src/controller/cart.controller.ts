import { Request, Response, NextFunction } from "express";
import { AuthError } from "../utils/error";
import { getCartService, setCartItemService } from "../services/cart.services";
import { setCartItemSchema } from "../schema/cart.schema";

/**
 * @route                   /api/v1/cart
 * @method                  GET
 * @description             Get the cart of the signed in user
 * @access                  Authenticated
 */
export const getCartController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not Logged in! Please login to continue!");
    }

    const cart = await getCartService(currentUserId);

    return res.status(200).send({ message: "Retrieved your cart successfully!", cart });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                   /api/v1/cart/items
 * @method                  PUT
 * @description             Add a item to the cart or set its total quantity
 * @access                  Authenticated
 */
export const setCartItemController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not Logged in! Please login to continue!");
    }

    const userInput = setCartItemSchema.parse(req.body);

    const result = await setCartItemService(currentUserId, userInput);

    return res
      .status(result.created ? 201 : 200)
      .send({
        message: result.created ? "Added item to the cart!" : "Updated cart item!",
        item: result.item,
      });
  } catch (error) {
    next(error);
  }
};
