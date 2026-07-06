import { getAllCategories, getCategoryBySlug, getCategoryById } from "../repository/categories.repository";

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
