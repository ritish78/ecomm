import { Router } from "express";
import { getProductsController, productByIdController } from "../controller/product.controller";

const router = Router();

router.get("/:identifier", productByIdController);
router.get("/", getProductsController);

export default router;
