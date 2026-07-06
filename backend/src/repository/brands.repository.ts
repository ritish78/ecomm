import { eq } from "drizzle-orm";
import db from "../db";
import { brands } from "../models/brands.model";

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
