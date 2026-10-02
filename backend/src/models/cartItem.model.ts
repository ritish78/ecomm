import { integer, unique, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { carts } from "./cart.model";
import { timestamp } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";
import { InferSelectModel, sql } from "drizzle-orm";

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),

    //we are making this to not reference the store table because
    //if the store gets deleted, we still want to keep the cart items
    //and show as unavailable instead of removing it entirely
    storeId: uuid("store_id").notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    //the same selection of product variant from the same store cannot be added to the cart more than once
    unique("cart_items_cart_store_variant_unique").on(table.cartId, table.storeId, table.productVariantId),

    check("cart_items_positive_quantity", sql`${table.quantity} > 0`),
  ],
);

export type CartItem = InferSelectModel<typeof cartItems>;
