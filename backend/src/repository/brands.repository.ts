import { eq } from "drizzle-orm";
import db from "../db";
import { brands } from "../models/brands.model";
import { toSimpleSlug } from "../utils/toSlug";

/**
 * @returns {Promise<Brand[]>} - the retrieved brands from the database
 */
export const getAllBrands = async () => {
  const brandsFromDatabase = await db.select().from(brands);

  return brandsFromDatabase;
};

/**
 * @param {string} brandId - id of the brand to get
 * @returns {Promise<Brand | null>} - the retrieved brand or null if not found
 */
export const getBrandById = async (brandId: string) => {
  const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);

  return brand;
};

/**
 * @param {string} brandSlug - slug of the brand to get
 * @returns {Promise<Brand | null>} - the retrieved brand or null if not found
 */
export const getBrandBySlug = async (brandSlug: string) => {
  const [brand] = await db.select().from(brands).where(eq(brands.slug, brandSlug)).limit(1);

  return brand;
};

export const createBrand = async (name: string) => {
  const [brand] = await db
    .insert(brands)
    .values({ name, slug: toSimpleSlug(name) })
    .returning();

  return brand;
};

export const updateBrand = async (brandId: string, name: string) => {
  const [brand] = await db
    .update(brands)
    .set({ name, slug: toSimpleSlug(name) })
    .where(eq(brands.id, brandId))
    .returning();

  return brand;
};

export const deleteBrand = async (brandId: string) => {
  const [brand] = await db.delete(brands).where(eq(brands.id, brandId)).returning();

  return brand;
};
