import { getAllBrands, getBrandById, getBrandBySlug } from "../repository/brands.repository";

/**
 * @returns {Promise<Brand[]>} - the retrieved brands from the database
 */
export const getAllBrandsService = async () => {
  return getAllBrands();
};

/**
 * @param {string} brandId - id of the brand to get
 * @returns {Promise<Brand | null>} - the retrieved brand or null if not found
 */
export const getBrandByIdService = async (brandId: string) => {
  return getBrandById(brandId);
};

/**
 * @param {string} brandSlug - slug of the brand to get
 * @returns {Promise<Brand | null>} - the retrieved brand or null if not found
 */
export const getBrandBySlugService = async (brandSlug: string) => {
  return getBrandBySlug(brandSlug);
};
