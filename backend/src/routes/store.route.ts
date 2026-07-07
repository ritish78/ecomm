import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import {
  addMembersController,
  createProductListingController,
  createStoreController,
  deleteProductListingController,
  getAllProductsOfStoreController,
  getAllRolesOfStoreController,
  getAllRolesWithPermissionOfStoreController,
  getPermissionOfRoleController,
} from "../controller/store.controller";
import { createRoleController, updateRolePermissionController } from "../controller/role.controller";

const router = Router();

router.post("/", authenticate, createStoreController);

router.get("/:storeId/products", getAllProductsOfStoreController);
router.get("/:storeId/roles", authenticate, getAllRolesOfStoreController);
router.get("/:storeId/roles-permissions", authenticate, getAllRolesWithPermissionOfStoreController);
router.get("/:storeId/roles/:roleId/permission", authenticate, getPermissionOfRoleController);

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

export default router;
