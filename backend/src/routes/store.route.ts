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
  getStoreByIdOrSlugController,
  removeUserFromStoreController,
} from "../controller/store.controller";
import {
  createRoleController,
  deleteRoleController,
  updateRolePermissionController,
} from "../controller/role.controller";

const router = Router();

router.post("/", authenticate, createStoreController);

router.get("/:identifier", getStoreByIdOrSlugController);
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
router.delete(
  "/:storeId/members/:userId",
  authenticate,
  requirePermission("members:remove"),
  removeUserFromStoreController,
);

router.post("/:storeId/roles", authenticate, requirePermission("roles:create"), createRoleController);
router.delete(
  "/:storeId/roles/:roleId",
  authenticate,
  requirePermission("roles:remove"),
  deleteRoleController,
);

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
