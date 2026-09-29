import { findStoreProductByStoreIdAndProductId } from "../repository/product.repository";
import { getProductHistoryByProductId } from "../repository/productHistory.repository";
import { FilterProductHistoryInput } from "../schema/productHistory.schema";
import { NotFoundError } from "../utils/error";

export const getProductHistoryService = async (
  storeId: string,
  productId: string,
  filters: FilterProductHistoryInput,
) => {
  //the middleware checks for product:edit permission of the user
  //we then check if the product belongs to the store or not
  const productFromStore = await findStoreProductByStoreIdAndProductId(storeId, productId);

  if (!productFromStore) {
    throw new NotFoundError("Product not found!");
  }

  return getProductHistoryByProductId(productId, filters.page, filters.limit);
};
