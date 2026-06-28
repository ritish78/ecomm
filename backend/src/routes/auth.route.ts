import { Router } from "express";
import {
  getCurrentUserController,
  loginController,
  loginUserUsingGoogleController,
  logoutController,
  refreshAccessTokenController,
  registerController,
} from "../controller/auth.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/refresh", refreshAccessTokenController);
router.get("/me", authenticate, getCurrentUserController);
router.post("/logout", logoutController);
router.post("/google", loginUserUsingGoogleController);

export default router;
