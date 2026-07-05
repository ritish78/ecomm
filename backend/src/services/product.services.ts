import db from "../db";
import {
  createProduct,
  createProductVariants,
  deleteProductById,
  filterProducts,
  findProductById,
  findProductWithDetailsByIdOrSlug,
  findStoreProductByStoreIdAndProductId,
  linkProductToStore,
} from "../repository/product.repository";
import { CreateProductInput, FilterProductInput } from "../schema/product.schema";
import { NotFoundError } from "../utils/error";
import toSlug from "../utils/toSlug";

/**
 * @param {string} productId - id of the product to get
 * @returns {Promise<Product>} - the retrieved product
 */
export const getProductByIdService = async (productId: string) => {
  const product = await findProductById(productId);

  if (!product) {
    throw new NotFoundError(`Product of id ${productId} not found!`);
  }

  return product;
};

/**
 * @param {string} productIdentifier - id or slug of the product to get
 * @returns {Promise<ProductWithDetails>} - the retrieved product with details
 */
export const getProductWithDetailsByIdOrSlugService = async (productIdentifier: string) => {
  const product = await findProductWithDetailsByIdOrSlug(productIdentifier);

  if (!product) {
    throw new NotFoundError(`Product of id/slug ${productIdentifier} not found!`);
  }

  return product;
};

/**
 * @param {FilterProductInput} filterProduct - filter criteria for products
 * @returns {Promise<Product[]>} - the retrieved products matching the filter criteria 
 */
export const getProductsService = async (filterProduct: FilterProductInput) => {
  return filterProducts(filterProduct);
};

/**
 * @param {string} storeId - id of the store to create the product for
 * @param {CreateProductInput} product - product data to create
 * @returns {Promise<ProductWithVariants>} - the created product with variants
 */
export const createProductService = async (storeId: string, product: CreateProductInput) => {
  return db.transaction(async (tx) => {
    const slug = toSlug(product.name);
    const createdProduct = await createProduct(
      tx,
      product.name,
      slug,
      product.description,
      product.brandId,
      product.categoryId,
    );
    const createdProductVariant = await createProductVariants(tx, createdProduct.id, product.variants);
    const createProductStoreLink = await linkProductToStore(tx, storeId, createdProduct.id);

    return { storeId: createProductStoreLink.storeId, ...createdProduct, variants: createdProductVariant };
  });
};

/**
 * @param {string} productId - id of the product to delete
 * @param {string} storeId - id of the store to delete the product
 * @returns {Promise<Product>} - the deleted product
 */
export const deleteProductByIdService = async (productId: string, storeId: string) => {
  const product = await findStoreProductByStoreIdAndProductId(storeId, productId);

  if (!product) {
    throw new NotFoundError(`Product to delete of id ${productId} not found!`);
  }

  const deletedProduct = await deleteProductById(productId);

  if (!deletedProduct) {
    throw new NotFoundError(`Product to delete of id ${productId} not found!`);
  }

  return deletedProduct;
};
