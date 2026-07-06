import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePlatformRole } from "../middleware/requirePlatformRole";
import {
  createBrandController,
  deleteBrandController,
  getAllBrandsController,
  getBrandByIdController,
  updateBrandController,
} from "../controller/brands.controller";
import { PLATFORM_ROLES } from "../config/roles";

const router = Router();

router.post("/", authenticate, requirePlatformRole(PLATFORM_ROLES.admin), createBrandController);
router.get("/", getAllBrandsController);
router.get("/:brandId", getBrandByIdController);
router.put("/:brandId", authenticate, requirePlatformRole(PLATFORM_ROLES.admin), updateBrandController);
router.delete("/:brandId", authenticate, requirePlatformRole(PLATFORM_ROLES.admin), deleteBrandController);

export default router;
