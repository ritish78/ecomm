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
  updateProductListingController,
  updateStoreController,
} from "../controller/store.controller";
import {
  assignMemberRoleController,
  createRoleController,
  deleteRoleController,
  getStorePermissionCatalogController,
  updateNameOfRoleController,
  updateRolePermissionController,
} from "../controller/role.controller";
import { getProductHistoryController } from "../controller/product.controller";

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

router.patch(
  "/:storeId/products/:productId",
  authenticate,
  requirePermission("product:edit"),
  updateProductListingController,
);

router.post("/:storeId/members", authenticate, requirePermission("members:add"), addMembersController);
router.delete(
  "/:storeId/members/:userId",
  authenticate,
  requirePermission("members:remove"),
  removeUserFromStoreController,
);

router.get("/:storeId/permissions", authenticate, getStorePermissionCatalogController);

router.patch(
  "/:storeId/members/:userId/role",
  authenticate,
  requirePermission("roles:assign"),
  assignMemberRoleController,
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

router.get(
  "/:storeId/products/:productId/history",
  authenticate,
  requirePermission("product:edit"),
  getProductHistoryController,
);

export default router;
