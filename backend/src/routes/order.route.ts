import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  createOrderController,
  getOrderByIdController,
  getOrdersController,
} from "../controller/order.controller";

const router = Router();

router.post("/", authenticate, createOrderController);
router.get("/", authenticate, getOrdersController);
router.get("/:orderId", authenticate, getOrderByIdController);

export default router;
