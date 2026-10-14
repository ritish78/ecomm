import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { orders } from "./order.model";
import { products } from "./products.model";
import { productVariants, unitEnum } from "./productVariant.model";
import { varchar } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";
import { InferSelectModel, sql } from "drizzle-orm";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),

    //we are going to copy these from the product and product variant at checkout
    productName: varchar("product_name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }),
    weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
    unit: unitEnum("unit").notNull(),
    unitPrice: numeric("unit_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    quantity: integer("quantity").notNull(),

    //this is the additional shipping fee for one purchased unit
    additionalShippingFee: numeric("additional_shipping_fee", {
      precision: 10,
      scale: 2,
    }).notNull(),

    additionalShippingTotal: numeric("additional_shipping_total", {
      precision: 24,
      scale: 2,
    }).notNull(),

    lineTotal: numeric("line_total", { precision: 24, scale: 2 }).notNull(),
  },
  (table) => [
    unique("order_items_order_variant_unique").on(table.orderId, table.productVariantId),
    check("order_items_quantity_is_positive", sql`${table.quantity} > 0`),
    check(
      "order_items_amount_is_positive",
      sql`${table.unitPrice} >= 0 AND ${table.additionalShippingFee} >= 0 AND ${table.additionalShippingTotal} >= 0 AND ${table.lineTotal} >= 0`,
    ),
    check("order_items_line_total_balance", sql`${table.lineTotal} = ${table.unitPrice} * ${table.quantity}`),
    check(
      "order_items_shipping_balance",
      sql`${table.additionalShippingTotal} = ${table.additionalShippingFee} * ${table.quantity}`,
    ),
  ],
);

export type OrderItems = InferSelectModel<typeof orderItems>;
