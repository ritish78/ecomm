import {
  pgTable,
  uuid,
  numeric,
  integer,
  varchar,
  boolean,
  timestamp,
  index,
  text,
  unique,
  check,
  pgEnum,
} from "drizzle-orm/pg-core";
import { productVariants, unitEnum } from "./productVariant.model";
import { InferSelectModel, sql } from "drizzle-orm";

export const variantHistoryChangeTypeEnum = pgEnum("variant_history_change_type", [
  "details",
  "price",
  "stock_adjustment",
  "shipping",
]);

export const productVariantHistory = pgTable(
  "product_variant_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull(),

    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id), //we are preventing deletion of a variant when history exists. its just a desgin choice.

    weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
    unit: unitEnum("unit").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(), //decimal or numeric. in products table, it was decimal.

    //adding additional shipping fee column here as well
    //making this nullable as we already are testing with dummy products
    //which already fills this table
    additionalShippingFee: numeric("additional_shipping_fee", { precision: 10, scale: 2 }),

    //this remains the stock before the change.
    stock: integer("stock").default(0).notNull(),

    sku: varchar("sku", { length: 100 }), //here, sku should not be unique. This is a history table, so same variant can have many rows when they are edited
    isAvailable: boolean("is_available").notNull(),
    discontinuedAt: timestamp("discontinued_at"),

    //older history entries do not tell us which endpoint created them
    //we leave their type null instead of guessing
    //new history entries will explicitly provide their change type
    changeType: variantHistoryChangeTypeEnum("change_type"),

    //we record the store where the change was made
    //this stays nullable because older history entries did not record it
    storeId: uuid("store_id"),

    //reason and note can explain any kind of edit
    //stock adjustments will require one of our supported stock reasons
    reason: varchar("reason", { length: 100 }),
    note: text("note"),

    //these fields are only used for stock adjustments
    //stock + quantityChange must equal resultingStock
    quantityChange: integer("quantity_change"),
    resultingStock: integer("resulting_stock"),

    //the client reuses this id when retrying the same stock adjustment
    requestId: uuid("request_id"),

    changedAt: timestamp("changed_at").defaultNow(),
    changedBy: uuid("changed_by"),
  },
  (table) => [
    index("product_variant_id_history").on(table.productVariantId),
    index("product_id_variant_id_history").on(table.productId),

    //one request id identifies one stock adjustment within a store
    //ordinary edits have a null requestId and can have multiple entries
    unique("variant_history_store_request_unique").on(table.storeId, table.requestId),

    //stock adjustments need enough information to explain the change
    //and safely identify a repeated request
    check(
      "variant_history_stock_required",
      sql`
        ${table.changeType} IS DISTINCT FROM 'stock_adjustment'
        OR (
          ${table.storeId} IS NOT NULL
          AND ${table.requestId} IS NOT NULL
          AND ${table.quantityChange} IS NOT NULL
          AND ${table.resultingStock} IS NOT NULL
          AND ${table.reason} IS NOT NULL
          AND ${table.changedBy} IS NOT NULL
          AND ${table.changedAt} IS NOT NULL
        )
      `,
    ),

    //ordinary edits should not accidentally contain stock-adjustment fields.
    //reason and note can still be provided for those edits.
    check(
      "variant_history_stock_fields",
      sql`
        ${table.changeType} IS NOT DISTINCT FROM 'stock_adjustment'
        OR (
          ${table.quantityChange} IS NULL
          AND ${table.resultingStock} IS NULL
          AND ${table.requestId} IS NULL
        )
      `,
    ),

    //we check the recorded quantities without overflowing integer arithmetic.
    check(
      "variant_history_stock_balance",
      sql`
        ${table.changeType} IS DISTINCT FROM 'stock_adjustment'
        OR (
          ${table.stock} >= 0
          AND ${table.quantityChange} <> 0
          AND ${table.resultingStock} >= 0
          AND (
            ${table.stock}::bigint + ${table.quantityChange}::bigint
            = ${table.resultingStock}::bigint
          )
        )
      `,
    ),
  ],
);

export type ProductVariantHistory = InferSelectModel<typeof productVariantHistory>;
