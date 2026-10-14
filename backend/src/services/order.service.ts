import { createHash, randomUUID } from "node:crypto";
import { Order, OrderAddressSnapshot } from "../models/order.model";
import { CreateOrderInput, FilterOrderInput } from "../schema/order.schema";
import db from "../db";
import {
  createOrder,
  createOrderItems,
  deleteOrderedCartItems,
  findOrderById,
  findOrderByRequestId,
  getOrderItems,
  getOrders,
  getProductVariantsForOrder,
  getStoreCartItemsForOrder,
  lockOrderRequest,
} from "../repository/order.repository";
import { ConflictError, NotFoundError, ServerError } from "../utils/error";
import { findCartForUpdate, updateCartTimestamp } from "../repository/cart.repository";
import { getStoreForUpdate } from "../repository/store.repository";
import { findUserAddressById } from "../repository/address.repository";
import { Product } from "../models/products.model";
import {
  findProductForUpdate,
  findProductVariantForUpdate,
  getProductStoreLinksForUpdate,
  updateProductVariantStockById,
} from "../repository/product.repository";
import { ProductVariant } from "../models/productVariant.model";
import { formatMinorUnits, priceToMinorUnit } from "../utils/money";
import { calculateShippingFee } from "../utils/calculateShipping";
import { createProductVariantHistory } from "../repository/productVariantHistory.repository";
import { withStoreAuthorizationTransaction } from "./storeAuthorization.service";

const toOrderResponse = (order: Order) => {
  //we are using request hash internally only
  const { requestHash, ...orderInfo } = order;

  return orderInfo;
};

const getOrderRequestHash = (orderInfo: CreateOrderInput) => {
  //the same items from a different array order still represent the same value
  const items = [...orderInfo.items].sort((firstItem, secondItem) =>
    firstItem.cartItemId.localeCompare(secondItem.cartItemId),
  );

  return createHash("sha256")
    .update(
      JSON.stringify({
        storeId: orderInfo.storeId,
        addressId: orderInfo.addressId,
        totalShippingFee: orderInfo.totalShippingFee,
        total: orderInfo.total,
        items,
      }),
    )
    .digest("hex");
};

export const createOrderService = async (currentUserId: string, orderInfo: CreateOrderInput) => {
  const requestHash = getOrderRequestHash(orderInfo);

  return db.transaction(
    async (tx) => {
      await lockOrderRequest(tx, currentUserId, orderInfo.requestId);

      //we need to check for retries before the cart because a successful
      //order will already have removed its purchased cart items
      const previousOrder = await findOrderByRequestId(tx, currentUserId, orderInfo.requestId);

      if (previousOrder) {
        if (previousOrder.requestHash !== requestHash) {
          throw new ConflictError("This request id has already been used for a different order!");
        }

        const items = await getOrderItems(previousOrder.id, tx);

        return {
          order: toOrderResponse(previousOrder),
          items,
          replayed: true,
        };
      }

      //cart mutation also use the same cart lock
      const cartFromDatabase = await findCartForUpdate(tx, currentUserId);

      if (!cartFromDatabase) {
        throw new ConflictError("Your cart is empty!");
      }

      //customers do not need to have store management permission to buy
      //we are going to lock the store directly to keep its shipping details stable
      const storeFromDatabase = await getStoreForUpdate(tx, orderInfo.storeId);

      if (!storeFromDatabase) {
        throw new NotFoundError("Store not found!");
      }

      if (!storeFromDatabase.isActive) {
        throw new ConflictError("This store is not currently accepting orders!");
      }

      if (storeFromDatabase.shippingFee === null) {
        throw new ConflictError("The store has not added its shipping fee!");
      }

      const addressFromDatabase = await findUserAddressById(tx, currentUserId, orderInfo.addressId);

      if (!addressFromDatabase) {
        throw new NotFoundError("Address of the user not found!");
      }

      const cartItemsFromDatabase = await getStoreCartItemsForOrder(
        tx,
        cartFromDatabase.id,
        storeFromDatabase.id,
      );

      if (cartItemsFromDatabase.length === 0 || cartItemsFromDatabase.length !== orderInfo.items.length) {
        throw new ConflictError("Your cart has changed! Please check your cart again and try again!");
      }

      const requestedItems = new Map(orderInfo.items.map((item) => [item.cartItemId, item]));

      for (const item of cartItemsFromDatabase) {
        const requestedItem = requestedItems.get(item.id);

        if (
          !requestedItem ||
          requestedItem.variantId !== item.productVariantId ||
          requestedItem.quantity !== item.quantity
        ) {
          throw new ConflictError("Your cart has changed! Please check your cart again and try again!");
        }
      }

      const variantIds = cartItemsFromDatabase.map((item) => item.productVariantId);

      if (new Set(variantIds).size !== variantIds.length) {
        throw new ConflictError(
          "Your cart contains duplicate product variants! Please check your cart again and try again!",
        );
      }

      const productVariantsFromDatabase = await getProductVariantsForOrder(tx, variantIds);

      if (productVariantsFromDatabase.length !== variantIds.length) {
        throw new ConflictError("Some cart items are not currently available!");
      }

      //we are going to lock all the products before we lock their variants
      //we are sorting so that when we lock, it will be consistent order when we acquire locks
      const productIds = [
        ...new Set(productVariantsFromDatabase.map((productVariant) => productVariant.productId)),
      ].sort();

      const productsFromDatabase = new Map<string, Product>();

      for (const productId of productIds) {
        const productFromDatabase = await findProductForUpdate(tx, productId);

        if (!productFromDatabase || !productFromDatabase.isActive) {
          throw new ConflictError("Some products are not available to order currently!");
        }

        const productStoreLinks = await getProductStoreLinksForUpdate(tx, productId);

        if (productStoreLinks.length !== 1 || productStoreLinks[0].storeId !== storeFromDatabase.id) {
          throw new ConflictError("A product in cart is not sold by the associated store!");
        }

        productsFromDatabase.set(productId, productFromDatabase);
      }

      const preparedItems: {
        product: Product;
        variant: ProductVariant;
        quantity: number;
        unitPrice: string;
        additionalShippingFee: string;
        lineTotal: string;
        additionalShippingTotal: string;
      }[] = [];

      //the repository returns the product variants by id
      for (const productVariant of productVariantsFromDatabase) {
        const varaintFromDatabase = await findProductVariantForUpdate(
          tx,
          productVariant.productId,
          productVariant.id,
        );

        const productFromDatabase = productsFromDatabase.get(productVariant.productId);

        const cartItemFromDatabase = cartItemsFromDatabase.find(
          (item) => item.productVariantId === productVariant.id,
        );

        if (!varaintFromDatabase || !productFromDatabase || !cartItemFromDatabase) {
          throw new ConflictError(
            "Some cart items have changed! Please check your cart again and try again!",
          );
        }

        const requestedItem = requestedItems.get(cartItemFromDatabase.id);

        if (!requestedItem) {
          throw new ConflictError("Your cart has changed! Please check your cart again and try again!");
        }

        if (!varaintFromDatabase.isAvailable) {
          throw new ConflictError(`${productFromDatabase.name} is not available for purchase!`);
        }

        const quantity = cartItemFromDatabase.quantity;

        //a store could also be selling the remaining stock of a discontinued variant
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > varaintFromDatabase.stock) {
          throw new ConflictError(
            "Please check the quantity of your order! You might have ordered more than what the store has in stock!",
          );
        }

        const unitPrice = priceToMinorUnit(varaintFromDatabase.price);

        const additionalShippingFee = priceToMinorUnit(varaintFromDatabase.additionalShippingFee);

        if (
          unitPrice !== priceToMinorUnit(requestedItem.unitPrice) ||
          additionalShippingFee !== priceToMinorUnit(requestedItem.additionalShippingFee)
        ) {
          throw new ConflictError(
            `The price or the shipping fee of ${productFromDatabase.name} has changed! Please review your order again!`,
          );
        }

        preparedItems.push({
          product: productFromDatabase,
          variant: varaintFromDatabase,
          quantity,
          unitPrice: formatMinorUnits(unitPrice),
          additionalShippingFee: formatMinorUnits(additionalShippingFee),
          lineTotal: formatMinorUnits(unitPrice * BigInt(quantity)),
          additionalShippingTotal: formatMinorUnits(additionalShippingFee * BigInt(quantity)),
        });
      }

      //we are going to use the same calculation as the shipping quote
      const shipping = calculateShippingFee(
        {
          shippingFee: storeFromDatabase.shippingFee,
          freeShippingThreshold: storeFromDatabase.freeShippingThreshold,
        },
        preparedItems,
      );

      if (
        priceToMinorUnit(shipping.totalShippingFee) !== priceToMinorUnit(orderInfo.totalShippingFee) ||
        priceToMinorUnit(shipping.total) !== priceToMinorUnit(orderInfo.total)
      ) {
        throw new ConflictError("Your order total has changed! Please get a new shipping fee quote!");
      }

      //only the delivery details are copied into the order
      const addressSnapshot: OrderAddressSnapshot = {
        recipientName: addressFromDatabase.recipientName,
        phoneNumber: addressFromDatabase.phoneNumber,
        countryCode: addressFromDatabase.countryCode,
        addressLineOne: addressFromDatabase.addressLineOne,
        addressLineTwo: addressFromDatabase.addressLineTwo,
        locality: addressFromDatabase.locality,
        region: addressFromDatabase.region,
        district: addressFromDatabase.district,
        wardNumber: addressFromDatabase.wardNumber,
        postalCode: addressFromDatabase.postalCode,
        landmark: addressFromDatabase.landmark,
        deliveryInstruction: addressFromDatabase.deliveryInstruction,
      };

      const order = await createOrder(tx, {
        userId: currentUserId,
        storeId: storeFromDatabase.id,
        storeName: storeFromDatabase.name,
        requestId: orderInfo.requestId,
        requestHash,
        addressSnapshot,
        freeShippingThreshold: storeFromDatabase.freeShippingThreshold,
        ...shipping,
      });

      if (!order) {
        throw new ServerError("The server could not create your order! Please try again later!");
      }

      const items = await createOrderItems(
        tx,
        preparedItems.map((item) => ({
          orderId: order.id,
          productId: item.product.id,
          productVariantId: item.variant.id,
          productName: item.product.name,
          sku: item.variant.sku,
          weight: item.variant.weight,
          unit: item.variant.unit,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          additionalShippingFee: item.additionalShippingFee,
          additionalShippingTotal: item.additionalShippingTotal,
          lineTotal: item.lineTotal,
        })),
      );

      if (items.length !== preparedItems.length) {
        throw new ServerError("The server could not save all order items!");
      }

      for (const item of preparedItems) {
        const resultingStock = item.variant.stock - item.quantity;

        //each product variant gets its own stock history row record
        //the order request id protects the complete checkout from retries
        const adjustment = await createProductVariantHistory(tx, item.variant, currentUserId, {
          storeId: storeFromDatabase.id,
          changeType: "stock_adjustment",
          quantityChange: -item.quantity,
          resultingStock,
          requestId: randomUUID(),
          reason: "order",
          note: `Stock deducted for order ${order.id}`,
        });

        if (!adjustment) {
          throw new ServerError("We could not save the order stock change!");
        }

        const updatedProductVariant = await updateProductVariantStockById(
          tx,
          item.product.id,
          item.variant.id,
          resultingStock,
        );

        if (!updatedProductVariant) {
          throw new ServerError("The server could not update the ordered product variant stock!");
        }
      }

      const deletedItems = await deleteOrderedCartItems(
        tx,
        cartFromDatabase.id,
        storeFromDatabase.id,
        cartItemsFromDatabase.map((item) => item.id),
      );

      if (deletedItems.length !== cartItemsFromDatabase.length) {
        throw new ServerError("Could not remove the ordered cart items!");
      }

      await updateCartTimestamp(tx, cartFromDatabase.id);

      return {
        order: toOrderResponse(order),
        items,
        replayed: false,
      };
    },
    { isolationLevel: "read committed" },
  );
};

export const getOrdersService = async (currentUserId: string, filters: FilterOrderInput) => {
  return getOrders({ userId: currentUserId }, filters);
};

export const getOrderByIdService = async (currentUserId: string, orderId: string) => {
  const orderFromDatabase = await findOrderById(orderId, { userId: currentUserId });

  if (!orderFromDatabase) {
    throw new NotFoundError("Order of the provided id not found!");
  }

  const items = await getOrderItems(orderFromDatabase.id);

  return {
    order: toOrderResponse(orderFromDatabase),
    items,
  };
};

export const getStoreOrdersService = async (
  storeId: string,
  filters: FilterOrderInput,
  currentUserId: string,
) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "store_orders:view", async (tx) => {
    return getOrders({ storeId }, filters, tx);
  });
};

export const getStoreOrderByIdService = async (storeId: string, orderId: string, currentUserId: string) => {
  return withStoreAuthorizationTransaction(currentUserId, storeId, "store_orders:view", async (tx) => {
    const orderFromDatabase = await findOrderById(orderId, { storeId }, tx);

    if (!orderFromDatabase) {
      throw new NotFoundError("Order not found in this store!");
    }

    const items = await getOrderItems(orderFromDatabase.id, tx);

    return {
      order: toOrderResponse(orderFromDatabase),
      items,
    };
  });
};
