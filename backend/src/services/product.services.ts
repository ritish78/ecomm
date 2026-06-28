import { findProductById, findProductWithDetailsById } from "../repository/product.repository";
import { NotFoundError } from "../utils/error";

export const getProductByIdService = async (productId: string) => {
  const product = await findProductById(productId);

  if (!product) {
    throw new NotFoundError(`Product of id ${productId} not found!`);
  }

  return product;
};

export const getProductWithDetailsByIdService = async (productId: string) => {
  const product = await findProductWithDetailsById(productId);

  if (!product) {
    throw new NotFoundError(`Product of id ${productId} not found!`);
  }

  return product;
};
