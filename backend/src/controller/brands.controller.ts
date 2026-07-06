import { Request, Response, NextFunction } from "express";
import {
  createBrandService,
  deleteBrandService,
  getAllBrandsService,
  getBrandByIdService,
  updateBrandService,
} from "../services/brands.services";
import { createBrandSchema, updateBrandSchema } from "../schema/brand.schema";

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

/**
 * @route               /api/v1/brands
 * @method              POST
 * @description         Create a new brand
 * @access              Admin
 */
export const createBrandController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createBrandSchema.parse(req.body);

    const brand = await createBrandService(body.name);

    return res.status(201).send({ message: "Brand created successfully!", brand });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/brands/:brandId
 * @method              PUT
 * @description         Update a brand by its id
 * @access              Admin
 */
export const updateBrandController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.params.brandId as string;
    const body = updateBrandSchema.parse(req.body);

    const brand = await updateBrandService(brandId, body.name);

    return res.status(200).send({ message: "Brand updated successfully!", brand });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/brands/:brandId
 * @method              DELETE
 * @description         Delete a brand by its id
 * @access              Admin
 */
export const deleteBrandController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.params.brandId as string;

    const result = await deleteBrandService(brandId);

    return res.status(200).send({ message: "Brand deleted successfully!", ...result });
  } catch (error) {
    next(error);
  }
};
