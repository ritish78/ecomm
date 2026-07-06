import { Request, Response, NextFunction } from "express";
import {
  getAllCategoriesServices,
  getCategoryByIdService,
  getCategoryBySlugService,
} from "../services/categories.service";

/**
 * @route               /api/v1/categories
 * @method              GET
 * @description         Get all categories
 * @access              Public
 */
export const getAllCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getAllCategoriesServices();
    return res.status(200).send({ message: "Categories retrieved successfully!", categories });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/categories/:categoryId
 * @method              GET
 * @description         Get category by its id
 * @access              Public
 */
export const getCategoryByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.categoryId as string;
    const category = await getCategoryByIdService(categoryId);

    if (!category) {
      return res.status(404).send({ message: "Category not found!" });
    }

    return res.status(200).send({ message: "Category retrieved successfully!", category });
  } catch (error) {
    next(error);
  }
};
