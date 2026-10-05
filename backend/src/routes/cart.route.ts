import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  clearCartController,
  getCartController,
  removeCartItemController,
  setCartItemController,
} from "../controller/cart.controller";

const router = Router();

router.get("/", authenticate, getCartController);
router.put("/items", authenticate, setCartItemController);
router.delete("/items/:itemId", authenticate, removeCartItemController);
router.delete("/", authenticate, clearCartController);

export default router;
