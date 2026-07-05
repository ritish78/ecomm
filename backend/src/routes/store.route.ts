import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import {
  addMembersController,
  createProductListingController,
  createStoreController,
  deleteProductListingController,
  getAllProductsOfStoreController,
} from "../controller/store.controller";
import { createRoleController, updateRolePermissionController } from "../controller/role.controller";

const router = Router();

router.post("/", authenticate, createStoreController);

router.post(
  "/:storeId/products",
  authenticate,
  requirePermission("product:create"),
  createProductListingController,
);

router.post("/:storeId/members", authenticate, requirePermission("members:add"), addMembersController);

router.post("/:storeId/roles", authenticate, requirePermission("roles:create"), createRoleController);

router.patch(
  "/:storeId/roles/:roleId/permission",
  authenticate,
  requirePermission("roles:update"),
  updateRolePermissionController,
);

router.delete(
  "/:storeId/products/:productId",
  authenticate,
  requirePermission("product:delete"),
  deleteProductListingController,
);

router.get("/:storeId/products", getAllProductsOfStoreController);

export default router;
