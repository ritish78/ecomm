import {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../repository/categories.repository";
import { ConflictError, NotFoundError } from "../utils/error";
import { toSimpleSlug } from "../utils/toSlug";

/**
 * @returns {Promise<Category[]>} - the retrieved categories from the database
 */
export const getAllCategoriesServices = async () => {
  return getAllCategories();
};

/**
 * @param {string} categoryId - id of the category to get
 * @returns {Promise<Category | null>} - the retrieved category or null if not found
 */
export const getCategoryByIdService = async (categoryId: string) => {
  return getCategoryById(categoryId);
};

/**
 * @param {string} categorySlug - slug of the category to get
 * @returns {Promise<Category | null>} - the retrieved category or null if not found
 */
export const getCategoryBySlugService = async (categorySlug: string) => {
  return getCategoryBySlug(categorySlug);
};

export const createCategoryService = async (name: string) => {
  const categoryFromDatabase = await getCategoryBySlug(toSimpleSlug(name));

  if (categoryFromDatabase) {
    throw new ConflictError(`Category with name ${name} already exists!`);
  }

  return createCategory(name);
};

export const updateCategoryService = async (categoryId: string, name: string) => {
  const categoryFromDatabase = await getCategoryById(categoryId);

  if (!categoryFromDatabase) {
    throw new NotFoundError(`Category to update of id ${categoryId} does not exist!`);
  }

  const categoryWithSameName = await getCategoryBySlug(toSimpleSlug(name));

  if (categoryWithSameName && categoryWithSameName.id !== categoryId) {
    throw new ConflictError(`Category with name ${name} already exists!`);
  }

  return updateCategory(categoryId, name);
};

export const deleteCategoryService = async (categoryId: string) => {
  const categoryFromDatabase = await getCategoryById(categoryId);

  if (!categoryFromDatabase) {
    throw new NotFoundError(`Category to delete of id ${categoryId} does not exist!`);
  }

  return deleteCategory(categoryId);
};
