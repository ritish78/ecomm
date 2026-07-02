import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { stores } from "./store.model";
import { products } from "./products.model";
import { timestamp } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const storeProducts = pgTable(
  "store_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("store_products_unique").on(table.storeId, table.productId),
    index("store_products_store_id_index").on(table.storeId),
    index("store_products_product_id_index").on(table.productId),
  ],
);

export type StoreProducts = InferSelectModel<typeof storeProducts>;
