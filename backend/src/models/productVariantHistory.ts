import { pgTable, uuid, numeric, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { productVariants, unitEnum } from "./productVariant.model";
import { index } from "drizzle-orm/pg-core";

export const productVariantHistory = pgTable(
  "product_variant_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull(),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
    unit: unitEnum("unit").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(), //decimal or numeric. in products table, it was decimal.
    stock: integer("stock").default(0).notNull(),
    sku: varchar("sku", { length: 100 }).unique(),
    isAvailable: boolean("is_available").notNull(),
    changedAt: timestamp("changed_at").defaultNow(),
    changedBy: timestamp("changed_by").defaultNow(),
  },
  (table) => [
    index("product_variant_id_history").on(table.productVariantId),
    index("product_id_variant_id_history").on(table.productId),
  ],
);
