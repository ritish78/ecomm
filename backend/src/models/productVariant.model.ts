import { InferSelectModel } from "drizzle-orm";
import {
  varchar,
  timestamp,
  uuid,
  pgTable,
  index,
  integer,
  boolean,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { products } from "./products.model.js";

export const unitEnum = pgEnum("unit", ["g", "kg", "ml", "l", "pc"]);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    weight: numeric("weight", { precision: 10, scale: 2 }).notNull(),
    unit: unitEnum("unit").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(), //decimal or numeric. in products table, it was decimal.
    stock: integer("stock").default(0).notNull(),
    sku: varchar("sku", { length: 100 }).unique(),
    isAvailable: boolean("is_available").default(true).notNull(),
    //creating another column which tracks if the product is discontinued or not
    //isAvailable will have true or false if the stock exists for the product
    //or if we were to sell the product or not even if product exists or not
    //discontinuedAt will track if the product is discontinued and when it was
    //discontinued even if we have stock available for it.
    discontinuedAt: timestamp("discontinued_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("variant_product_id_index").on(table.productId),
    index("variant_sku_index").on(table.sku),
  ],
);

export type ProductVariant = InferSelectModel<typeof productVariants>;
