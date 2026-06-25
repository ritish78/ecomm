import { Router } from "express";
import {
  loginController,
  loginUserUsingGoogleController,
  logoutController,
  registerController,
} from "../controller/auth.controller";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/logout", logoutController);
router.post("/google", loginUserUsingGoogleController);

export default router;
