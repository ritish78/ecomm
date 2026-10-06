import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  createAddressController,
  deleteAddressByIdController,
  getAddressesOfUserController,
  setDefaultAddressController,
  updateAddressByIdController,
} from "../controller/address.controller";

const router = Router();

router.get("/", authenticate, getAddressesOfUserController);
router.post("/", authenticate, createAddressController);
router.put("/:addressId", authenticate, updateAddressByIdController);
router.patch("/:addressId/default", authenticate, setDefaultAddressController);
router.delete("/:addressId", authenticate, deleteAddressByIdController);

export default router;
