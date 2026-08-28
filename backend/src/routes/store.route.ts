import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import {
  addMembersController,
  createProductListingController,
  createStoreController,
  deleteProductListingController,
  deleteStoreController,
  getAllMembersOfStoreController,
  getAllProductsOfStoreController,
  getAllRolesOfStoreController,
  getAllRolesWithPermissionOfStoreController,
  getPermissionOfRoleController,
  getStoreByIdOrSlugController,
  removeUserFromStoreController,
  updateStoreController,
} from "../controller/store.controller";
import {
  createRoleController,
  deleteRoleController,
  updateNameOfRoleController,
  updateRolePermissionController,
} from "../controller/role.controller";

const router = Router();

router.post("/", authenticate, createStoreController);

router.get("/:identifier", getStoreByIdOrSlugController);
router.patch("/:storeId", authenticate, requirePermission("store:edit"), updateStoreController);
router.delete("/:storeId", authenticate, requirePermission("store:remove"), deleteStoreController);
router.get("/:storeId/products", getAllProductsOfStoreController);
router.get("/:storeId/roles", authenticate, getAllRolesOfStoreController);
router.get("/:storeId/roles-permissions", authenticate, getAllRolesWithPermissionOfStoreController);
router.get("/:storeId/roles/:roleId/permission", authenticate, getPermissionOfRoleController);
router.get("/:storeId/members", authenticate, getAllMembersOfStoreController);

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
  "/:storeId/roles/:roleId",
  authenticate,
  requirePermission("roles:update"),
  updateNameOfRoleController,
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
