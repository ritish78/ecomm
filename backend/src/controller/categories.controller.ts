import { Request, Response, NextFunction } from "express";
import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesServices,
  getCategoryByIdService,
  updateCategoryService,
} from "../services/categories.service";
import { createCategorySchema } from "../schema/categories.schema";

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

/**
 * @route               /api/v1/categories
 * @method              POST
 * @description         Create a new category
 * @access              Admin
 */
export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createCategorySchema.parse(req.body);

    const category = await createCategoryService(body.name);

    return res.status(201).send({ message: "Category created successfully!", category });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/categories/:categoryId
 * @method              PUT
 * @description         Update a category by its id
 * @access              Admin
 */
export const updateCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.categoryId as string;
    const body = createCategorySchema.parse(req.body);

    const category = await updateCategoryService(categoryId, body.name);
    
    return res.status(200).send({ message: "Category updated successfully!", category });
  } catch (error) {
    next(error);
  }
}
/**
 * @route               /api/v1/categories/:categoryId
 * @method              DELETE
 * @description         Delete a category by its id
 * @access              Admin
 */
export const deleteCategoryController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = req.params.categoryId as string;

        const result = await deleteCategoryService(categoryId);

        return res.status(200).send({ message: "Category deleted successfully!", ...result });
    } catch (error) {
        next(error)
    }
}