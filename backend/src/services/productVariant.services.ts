import db, { Tx } from "../db";
import {
  addProductVariant,
  findProductForUpdate,
  findProductVariantForUpdate,
  findStoreProductByStoreIdAndProductId,
  getProductStoreLinksForUpdate,
  getProductVariantsForManagement,
  updateProductVariantById,
} from "../repository/product.repository";
import { createProductVariantHistory } from "../repository/productVariantHistory.repository";
import { AddProductVariantInput, UpdateProductVariantInput } from "../schema/productVariants.schema";
import { ConflictError, NotFoundError } from "../utils/error";

export const assertCanManageProductVariants = async (tx: Tx, storeId: string, productId: string) => {
  //we lock the product before we lock its variant
  const productFromDatabase = await findProductForUpdate(tx, productId);

  if (!productFromDatabase) {
    throw new NotFoundError("Product not found!");
  }

  const productStoreLinks = await getProductStoreLinksForUpdate(tx, productId);

  const productBelongsToStore = productStoreLinks.some((storeProduct) => storeProduct.storeId === storeId);

  if (!productBelongsToStore) {
    throw new NotFoundError("Product not found in this store!");
  }

  //variants belong to the product rather than the store
  if (productStoreLinks.length > 1) {
    throw new ConflictError(
      "This variant is linked with more than one store, and so we can not update it thorugh this endpoint!",
    );
  }
};

export const getProductVariantsForManagementService = async (storeId: string, productId: string) => {
  const productFromStore = await findStoreProductByStoreIdAndProductId(storeId, productId);

  if (!productFromStore) {
    throw new NotFoundError("Product not found in this store!");
  }

  return getProductVariantsForManagement(productId);
};

export const addProductVariantService = async (
  storeId: string,
  productId: string,
  variantInfo: AddProductVariantInput,
) => {
  return db.transaction(async (tx) => {
    await assertCanManageProductVariants(tx, storeId, productId);

    const variant = await addProductVariant(tx, productId, variantInfo);

    //the unique constraint of SKU prevents the duplicate from being stored in our db
    if (!variant) {
      throw new ConflictError("A variant with this SKU already exists!");
    }

    return variant;
  });
};

export const updateProductVariantByIdService = async (
  storeId: string,
  productId: string,
  variantId: string,
  variantInfo: UpdateProductVariantInput,
  currentUserId: string,
) => {
  try {
    return await db.transaction(async (tx) => {
      await assertCanManageProductVariants(tx, storeId, productId);

      const variantFromDatabase = await findProductVariantForUpdate(tx, productId, variantId);

      if (!variantFromDatabase) {
        throw new NotFoundError("Variant not found in this product!");
      }

      //numeric columns are returned as string
      //we want to say weight '12' is equal to '12.00'
      const weightHasChanged =
        variantInfo.weight !== undefined && Number(variantInfo.weight) !== Number(variantFromDatabase.weight);

      const unitHasChanged = variantInfo.unit !== undefined && variantInfo.unit !== variantFromDatabase.unit;
      const skuHasChanged = variantInfo.sku !== undefined && variantInfo.sku !== variantFromDatabase.sku;
      const availabilityHasChanged =
        variantInfo.isAvailable !== undefined && variantInfo.isAvailable !== variantFromDatabase.isAvailable;
      const variantIsDiscontinued = variantFromDatabase.discontinuedAt !== null;

      //product which has been discontinued can still be sold
      if (variantIsDiscontinued && (weightHasChanged || unitHasChanged || skuHasChanged)) {
        throw new ConflictError("Weight, Unit and SKU of the discontinued product can not be changed!");
      }

      const shouldDiscontinue = variantInfo.discontinue === true && !variantIsDiscontinued;

      const variantHasChanges =
        weightHasChanged || unitHasChanged || skuHasChanged || availabilityHasChanged || shouldDiscontinue;

      if (!variantHasChanges) {
        return variantFromDatabase;
      }

      //we are going to pass only the provided values
      //if discontiue is sent again then we use the previous date
      const variantInfoToUpdate: UpdateProductVariantInput = {};

      if (weightHasChanged) {
        variantInfoToUpdate.weight = variantInfo.weight;
      }

      if (unitHasChanged) {
        variantInfoToUpdate.unit = variantInfo.unit;
      }

      if (skuHasChanged) {
        variantInfoToUpdate.sku = variantInfo.sku;
      }

      if (availabilityHasChanged) {
        variantInfoToUpdate.isAvailable = variantInfo.isAvailable;
      }

      if (shouldDiscontinue) {
        variantInfoToUpdate.discontinue = true;
      }

      //we save the previous product variant value in the database
      await createProductVariantHistory(tx, variantFromDatabase, currentUserId);

      const updatedVariant = await updateProductVariantById(tx, productId, variantId, variantInfoToUpdate);

      if (!updatedVariant) {
        throw new NotFoundError("Variant to update not found!");
      }

      return updatedVariant;
    });
  } catch (error) {
    //2305 is the unique constraint violation
    //SKU is the only column that could break that constraint
    const databaseError = error instanceof Error && error.cause ? error.cause : error;

    if (
      typeof databaseError === "object" &&
      databaseError !== null &&
      "code" in databaseError &&
      databaseError.code === "23505"
    ) {
      throw new ConflictError("A variant with the provided SKU already exists!");
    }

    throw error;
  }
};
