import { Router } from "express";
import { productByIdController } from "../controller/product.controller";

const router = Router();

router.get("/:id", productByIdController);

export default router;
