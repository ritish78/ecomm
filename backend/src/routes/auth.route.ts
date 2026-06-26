import { Router } from "express";
import {
  getCurrentUserController,
  loginController,
  loginUserUsingGoogleController,
  logoutController,
  refreshAccessTokenController,
  registerController,
} from "../controller/auth.controller";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/refresh", refreshAccessTokenController);//need to implement authenticate middleware and run it before refreshAccessTokenController
router.get("/me", getCurrentUserController);//need to implement authenticate middleware
router.post("/logout", logoutController);
router.post("/google", loginUserUsingGoogleController);

export default router;
