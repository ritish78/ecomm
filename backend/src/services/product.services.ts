import db from "../db";
import {
  createProduct,
  createProductVariants,
  filterProducts,
  findProductById,
  findProductWithDetailsByIdOrSlug,
  linkProductToStore,
} from "../repository/product.repository";
import { CreateProductInput, CreateProductVariantInput, FilterProductInput } from "../schema/product.schema";
import { NotFoundError } from "../utils/error";
import toSlug from "../utils/toSlug";

export const getProductByIdService = async (productId: string) => {
  const product = await findProductById(productId);

  if (!product) {
    throw new NotFoundError(`Product of id ${productId} not found!`);
  }

  return product;
};

export const getProductWithDetailsByIdOrSlugService = async (productIdentifier: string) => {
  const product = await findProductWithDetailsByIdOrSlug(productIdentifier);

  if (!product) {
    throw new NotFoundError(`Product of id/slug ${productIdentifier} not found!`);
  }

  return product;
};

export const getProductsService = async (filterProduct: FilterProductInput) => {
  return filterProducts(filterProduct);
};

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
