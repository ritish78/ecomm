import { MAX_VARIANT_STOCK } from "../config/product";
import db, { Tx } from "../db";
import {
  addProductVariant,
  findProductForUpdate,
  findProductVariantForUpdate,
  findStoreProductByStoreIdAndProductId,
  getProductStoreLinksForUpdate,
  getProductVariantsForManagement,
  updateProductVariantById,
  updateProductVariantPriceById,
  updateProductVariantStockById,
} from "../repository/product.repository";
import {
  createProductVariantHistory,
  findProductVariantById,
  findProductVariantHistoryByRequestId,
  getProductVariantHistoryByVariantId,
} from "../repository/productVariantHistory.repository";
import { FilterProductVariantHistoryInput } from "../schema/productVariantHistory.schema";
import {
  AddProductVariantInput,
  CreateProductVariantStockAdjustmentInput,
  UpdateProductVariantInput,
  UpdateProductVariantPriceInput,
} from "../schema/productVariants.schema";
import { ConflictError, NotFoundError } from "../utils/error";
import { withStoreAuthorizationTransaction } from "./storeAuthorization.service";

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
      await createProductVariantHistory(tx, variantFromDatabase, currentUserId, {
        storeId,
        changeType: "details",
        reason: variantInfo.reason,
        note: variantInfo.note,
      });

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

export const getProductVariantHistoryService = async (
  storeId: string,
  productId: string,
  variantId: string,
  filters: FilterProductVariantHistoryInput,
) => {
  //the middleware checks for product:edit permission
  //we then have to check if the product belongs to the store
  const productFromStore = await findStoreProductByStoreIdAndProductId(storeId, productId);

  if (!productFromStore) {
    throw new NotFoundError("Product not found in this store!");
  }

  //an empty history and a missing variant are different cases.
  //an existing variant with no edits should return an empty history.
  const productVariantFromDatabase = await findProductVariantById(productId, variantId);

  if (!productVariantFromDatabase) {
    throw new NotFoundError("Product variant not found!");
  }

  return getProductVariantHistoryByVariantId(productId, variantId, filters.page, filters.limit);
};

export const updateProductVariantPriceByIdService = async (
  storeId: string,
  productId: string,
  variantId: string,
  priceInfo: UpdateProductVariantPriceInput,
  currentUserId: string,
) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "product_price:update", async (tx) => {
    //we lock the store and we recheck the permissions
    //we then lock the product and we check if it belongs to the store
    await assertCanManageProductVariants(tx, storeId, productId);

    const productVariantFromDatabase = await findProductVariantForUpdate(tx, productId, variantId);

    if (!productVariantFromDatabase) {
      throw new NotFoundError("Variant not found in this product!");
    }

    //we get the numeric column as strings from the database
    //we want to say price '17' is equal to '17.00'
    const priceHasChanged =
      priceInfo.price !== undefined && Number(priceInfo.price) !== Number(productVariantFromDatabase.price);

    if (!priceHasChanged) {
      return productVariantFromDatabase;
    }

    //we will allow the user to change the price of the discontinued variant
    //they could maybe put it as on sale to sell their remaining stock
    //while still having its availability and discontinued date

    //we also have to save the previous product variant value
    //in our database before we update the price
    await createProductVariantHistory(tx, productVariantFromDatabase, currentUserId, {
      storeId,
      changeType: "price",
      reason: priceInfo.reason,
      note: priceInfo.note,
    });

    const updatedVariant = await updateProductVariantPriceById(tx, productId, variantId, priceInfo.price);

    if (!updatedVariant) {
      throw new NotFoundError("Variant to update not found!");
    }

    return updatedVariant;
  });
};

export const createProductVariantStockAdjustmentService = async (
  storeId: string,
  productId: string,
  variantId: string,
  adjustmentInfo: CreateProductVariantStockAdjustmentInput,
  currentUserId: string,
) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "product_stock:update", async (tx) => {
    //we lock the store and we recheck the permissions
    //we then lock the product and we check if it belongs to the store
    await assertCanManageProductVariants(tx, storeId, productId);

    const productVariantFromDatabase = await findProductVariantForUpdate(tx, productId, variantId);

    if (!productVariantFromDatabase) {
      throw new NotFoundError("Variant not found in this product!");
    }

    //we then check for a previous stock adjustment with the same requestId
    const previousStockAdjustment = await findProductVariantHistoryByRequestId(
      tx,
      storeId,
      adjustmentInfo.requestId,
    );

    if (previousStockAdjustment) {
      const isSameRequest =
        previousStockAdjustment.changeType === "stock_adjustment" &&
        previousStockAdjustment.productId === productVariantFromDatabase.productId &&
        previousStockAdjustment.productVariantId === productVariantFromDatabase.id &&
        previousStockAdjustment.changedBy === currentUserId &&
        previousStockAdjustment.quantityChange === adjustmentInfo.quantityChange &&
        previousStockAdjustment.reason === adjustmentInfo.reason &&
        previousStockAdjustment.note === (adjustmentInfo.note ?? null);

      if (previousStockAdjustment && isSameRequest) {
        throw new ConflictError("This stock adjustment request has already been processed!");
      }

      //we then return the original history entry without changing
      //the stock or inserting another history entry
      return {
        adjustment: previousStockAdjustment,
        replayed: true,
      };
    }

    //retries are handled first because a previous successful stock adjustment
    //might have happened before the variant was disconitnued
    if (productVariantFromDatabase.discontinuedAt !== null && adjustmentInfo.reason === "replenishment") {
      throw new ConflictError("You can not increase stock for a discontinued variant!");
    }

    const resultingStock = productVariantFromDatabase.stock + adjustmentInfo.quantityChange;

    if (resultingStock < 0) {
      //should I throw BadRequestError instead?
      throw new ConflictError("This stock adjustment would make the stock count negative!");
    }

    if (resultingStock > MAX_VARIANT_STOCK) {
      throw new ConflictError(
        "This stock adjustment would make the stock count greater than the maximum stock limit!",
      );
    }

    const adjustment = await createProductVariantHistory(tx, productVariantFromDatabase, currentUserId, {
      storeId,
      changeType: "stock_adjustment",
      quantityChange: adjustmentInfo.quantityChange,
      resultingStock,
      requestId: adjustmentInfo.requestId,
      reason: adjustmentInfo.reason,
      note: adjustmentInfo.note,
    });

    if (!adjustment) {
      throw new ConflictError("This stock adjustment request could not be processed!");
    }

    const updatedProductVariant = await updateProductVariantStockById(
      tx,
      productId,
      variantId,
      resultingStock,
    );

    if (!updatedProductVariant) {
      throw new NotFoundError("Product variant to update not found!");
    }

    //the history entry and stock updates use the same transaction
    return {
      adjustment,
      replayed: false,
    };
  });
};
