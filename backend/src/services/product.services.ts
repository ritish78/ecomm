import {
  filterProducts,
  findProductById,
  findProductWithDetailsByIdOrSlug,
} from "../repository/product.repository";
import { FilterProductInput } from "../schema/product.schema";
import { NotFoundError } from "../utils/error";

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
