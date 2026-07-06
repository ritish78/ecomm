import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePlatformRole } from "../middleware/requirePlatformRole";
import { PLATFORM_ROLES } from "../config/roles";
import {
  createCategoryController,
  deleteCategoryController,
  getAllCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
} from "../controller/categories.controller";

const router = Router();

router.post("/", authenticate, requirePlatformRole(PLATFORM_ROLES.admin), createCategoryController);
router.get("/", getAllCategoriesController);
router.get("/:categoryId", getCategoryByIdController);
router.put("/:categoryId", authenticate, requirePlatformRole(PLATFORM_ROLES.admin), updateCategoryController);
router.delete(
  "/:categoryId",
  authenticate,
  requirePlatformRole(PLATFORM_ROLES.admin),
  deleteCategoryController,
);

export default router;
