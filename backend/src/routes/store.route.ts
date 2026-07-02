import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import { addMembersController } from "../controller/storeMembers.controller";
import { createRoleController, updateRolePermissionController } from "../controller/role.controller";

const router = Router();

router.post("/:storeId/members", authenticate, requirePermission("members:add"), addMembersController);

router.post("/:storeId/roles", authenticate, requirePermission("roles:create"), createRoleController);

router.patch(
  "/:storeId/roles/:roleId/permission",
  authenticate,
  requirePermission("roles:update"),
  updateRolePermissionController,
);

export default router;
