import { pgTable, uuid, numeric, integer, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { productVariants, unitEnum } from "./productVariant.model";
import { InferSelectModel } from "drizzle-orm";

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
    stock: integer("stock").default(0).notNull(),
    sku: varchar("sku", { length: 100 }), //here, sku should not be unique. This is a history table, so same variant can have many rows when they are edited
    isAvailable: boolean("is_available").notNull(),
    discontinuedAt: timestamp("discontinued_at"),
    changedAt: timestamp("changed_at").defaultNow(),
    changedBy: uuid("changed_by"),
  },
  (table) => [
    index("product_variant_id_history").on(table.productVariantId),
    index("product_id_variant_id_history").on(table.productId),
  ],
);

export type ProductVariantHistory = InferSelectModel<typeof productVariantHistory>;
