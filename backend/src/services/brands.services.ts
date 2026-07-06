import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
} from "../repository/brands.repository";
import { ConflictError, NotFoundError } from "../utils/error";
import { toSimpleSlug } from "../utils/toSlug";

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

export const createBrandService = async (name: string) => {
  //first, lets check to see if the brand already exists or not
  const brandFromDatabase = await getBrandBySlug(toSimpleSlug(name));

  if (brandFromDatabase) {
    throw new ConflictError(`Brand with name ${name} already exists!`);
  }

  return createBrand(name);
};

export const updateBrandService = async (brandId: string, name: string) => {
  const brandFromDatabase = await getBrandById(brandId);

  if (!brandFromDatabase) {
    throw new NotFoundError(`Brand to update of id ${brandId} does not exist!`);
  }

  const brandWithSameName = await getBrandBySlug(toSimpleSlug(name));

  if (brandWithSameName && brandWithSameName.id !== brandId) {
    throw new ConflictError(`Brand with name ${name} already exists!`);
  }

  return updateBrand(brandId, name);
};

export const deleteBrandService = async (brandId: string) => {
  const brandFromDatabase = await getBrandById(brandId);

  if (!brandFromDatabase) {
    throw new NotFoundError(`Brand to delete of id ${brandId} does not exist!`);
  }

  return deleteBrand(brandId);
};
