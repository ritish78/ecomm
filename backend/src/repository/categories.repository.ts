import { eq } from "drizzle-orm";
import db from "../db";
import { categories } from "../models/categories.model";
import { toSimpleSlug } from "../utils/toSlug";

/**
 * @returns {Promise<Category[]>} - the retrieved categories from the database
 */
export const getAllCategories = async () => {
  const categoriesFromDatabase = await db.select().from(categories);

  return categoriesFromDatabase;
};

/**
 * @param {string} categoryId - id of the category to get
 * @returns {Promise<Category | null>} - the retrieved category or null if not found
 */
export const getCategoryById = async (categoryId: string) => {
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);

  return category;
};

/**
 * @param {string} categorySlug - slug of the category to get
 * @returns {Promise<Category | null>} - the retrieved category or null if not found
 */
export const getCategoryBySlug = async (categorySlug: string) => {
  const [category] = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);

  return category;
};

export const createCategory = async (name: string) => {
  const [category] = await db
    .insert(categories)
    .values({ name, slug: toSimpleSlug(name) })
    .returning();

  return category;
};

export const updateCategory = async (categoryId: string, name: string) => {
  const [category] = await db
    .update(categories)
    .set({ name, slug: toSimpleSlug(name) })
    .where(eq(categories.id, categoryId))
    .returning();

  return category;
};

export const deleteCategory = async (categoryId: string) => {
  const [category] = await db.delete(categories).where(eq(categories.id, categoryId)).returning();

  return category;
};
