import { jsonb, pgEnum } from "drizzle-orm/pg-core";
import { Address } from "./address.model";
import { pgTable } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { users } from "./users.model";
import { stores } from "./store.model";
import { varchar } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";
import { InferSelectModel, sql } from "drizzle-orm";

export const orderStatusEnum = pgEnum("order_status", ["placed", "processing", "completed", "cancelled"]);

export const orderPaymentStatusEnum = pgEnum("order_payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export type OrderAddressSnapshot = Pick<
  Address,
  | "recipientName"
  | "phoneNumber"
  | "countryCode"
  | "addressLineOne"
  | "addressLineTwo"
  | "locality"
  | "region"
  | "district"
  | "wardNumber"
  | "postalCode"
  | "landmark"
  | "deliveryInstruction"
>;

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),

    //we are going to save the name of the store that the order was placed from
    //the store could change their name later on and the user might be confused
    //or the store could start selling different products altogether
    storeName: varchar("store_name", { length: 255 }).notNull(),

    //the client will reuse this request id when retrying with the same order
    requestId: uuid("request_id").notNull(),

    //the same request id cannot be reused with different order details
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    status: orderStatusEnum("status").default("placed").notNull(),
    paymentStatus: orderPaymentStatusEnum("payment_status").default("pending").notNull(),
    addressSnapshot: jsonb("address_snapshot").$type<OrderAddressSnapshot>().notNull(),
    subtotal: numeric("subtotal", { precision: 24, scale: 2 }).notNull(),
    baseShippingFee: numeric("base_shipping_fee", { precision: 10, scale: 2 }).notNull(),
    standardShippingFee: numeric("standard_shipping_fee", { precision: 10, scale: 2 }).notNull(),
    additionalShippingFee: numeric("additional_shipping_fee", { precision: 24, scale: 2 }).notNull(),
    totalShippingFee: numeric("total_shipping_fee", { precision: 24, scale: 2 }).notNull(),
    freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }),
    freeShippingApplied: boolean("free_shipping_applied").notNull(),
    total: numeric("total", { precision: 24, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("orders_user_request_unique").on(table.userId, table.requestId),
    index("orders_user_created_index").on(table.userId, table.createdAt, table.id),
    index("orders_store_created_index").on(table.storeId, table.createdAt, table.id),
    check(
      "orders_amount_is_positive",
      sql`${table.subtotal} >= 0 AND ${table.baseShippingFee} >= 0 AND ${table.standardShippingFee} >= 0 AND ${table.additionalShippingFee} >= 0 AND ${table.totalShippingFee} >= 0 AND ${table.total} >= 0`,
    ),
    check(
      "orders_shipping_balance",
      sql`${table.totalShippingFee} = ${table.standardShippingFee} + ${table.additionalShippingFee}`,
    ),
    check("orders_total_balance", sql`${table.total} = ${table.subtotal} + ${table.totalShippingFee}`),
    check(
      "orders_free_shipping_threshold_is_positive",
      sql`${table.freeShippingThreshold} IS NULL OR ${table.freeShippingThreshold} > 0`,
    ),
    check(
      "orders_free_shipping_rule",
      sql`${table.freeShippingApplied} = (${table.freeShippingThreshold} IS NOT NULL AND ${table.subtotal} >= ${table.freeShippingThreshold})`,
    ),
    check(
      "orders_standard_shipping_rule",
      sql`${table.standardShippingFee} = CASE WHEN ${table.freeShippingApplied} THEN 0 ELSE ${table.baseShippingFee} END`,
    ),
  ],
);

export type Order = InferSelectModel<typeof orders>;
