import { Request, Response, NextFunction } from "express";
import { getAllBrandsService, getBrandByIdService } from "../services/brands.services";

/**
 * @route               /api/v1/brands
 * @method              GET
 * @description         Get all brands
 * @access              Public
 */
export const getAllBrandsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await getAllBrandsService();
    return res.status(200).send({ message: "Brands retrieved successfully!", brands });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/brands/:brandId
 * @method              GET
 * @description         Get brand by its id
 * @access              Public
 */
export const getBrandByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.params.brandId as string;
    const brand = await getBrandByIdService(brandId);

    if (!brand) {
      return res.status(404).send({ message: "Brand not found!" });
    }

    return res.status(200).send({ message: "Brand retrieved successfully!", brand });
  } catch (error) {
    next(error);
  }
};
