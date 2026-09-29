import db from "../db";
import {
  createProduct,
  createProductVariants,
  deleteProductById,
  filterProducts,
  findProductById,
  findProductForUpdate,
  findProductWithDetailsByIdOrSlug,
  findStoreProductByStoreIdAndProductId,
  getProductReferencesForUpdate,
  getProductStoreLinksForUpdate,
  linkProductToStore,
  updateProductById,
} from "../repository/product.repository";
import { CreateProductInput, FilterProductInput, UpdateProductInput } from "../schema/product.schema";
import { ConflictError, NotFoundError } from "../utils/error";
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


export const updateProductByIdService = async (
  storeId: string,
  productId: string,
  productInfo: UpdateProductInput,
) => {
  return db.transaction(async (tx) => {
    const productFromDatabase = await findProductForUpdate(tx, productId);

    if (!productFromDatabase) {
      throw new NotFoundError("Product to update not found!");
    }

    const productStoreLinks = await getProductStoreLinksForUpdate(tx, productId);

    const productBelongsToStore = productStoreLinks.some((storeProduct) => storeProduct.storeId === storeId);

    //after checking the permission to edit products of the store,
    //we then check to see if the product belongs to the store
    if (!productBelongsToStore) {
      throw new NotFoundError("Product to update not found in this store!");
    }

    //our store_products table allows a product to be linked to more than
    //one store. Updating that product would change it for every linked store.
    //until we decide how shared products should be managed, we reject the edit.
    if (productStoreLinks.length > 1) {
      throw new ConflictError(
        "This product is linked to multiple stores and can not be edited through this endpoint yet!",
      );
    }

    const brandId = productInfo.brandId ?? productFromDatabase.brandId;
    const categoryId = productInfo.categoryId ?? productFromDatabase.categoryId;

    const { brand, category } = await getProductReferencesForUpdate(tx, brandId, categoryId);

    if (!brand) {
      //should we throw a NotFoundError or a BadRequestError?
      throw new NotFoundError(`Brand of id ${brandId} not found!`);
    }

    if (!category) {
      throw new NotFoundError(`Category of id ${categoryId} not found!`);
    }

    const productHasChanges =
      (productInfo.name !== undefined && productInfo.name !== productFromDatabase.name) ||
      (productInfo.description !== undefined &&
        productInfo.description !== productFromDatabase.description) ||
      (productInfo.brandId !== undefined && productInfo.brandId !== productFromDatabase.brandId) ||
      (productInfo.categoryId !== undefined && productInfo.categoryId !== productFromDatabase.categoryId);

    //if no changes need to be done, then we return the product from our database.
    if (!productHasChanges) {
      return productFromDatabase;
    }

    const updatedProduct = await updateProductById(tx, productId, productInfo);

    if (!updatedProduct) {
      throw new NotFoundError("Product to update not found in this store!");
    }

    return updatedProduct;
  });
};
