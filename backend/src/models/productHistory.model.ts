import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { products } from "./products.model";
import { InferSelectModel } from "drizzle-orm";

export const productHistory = pgTable(
  "product_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    name: varchar("name", { length: 255 }).notNull(),
    //removing the unique() constraint of slug as we want to have many rows for
    //the same product. once the product is updated, we create a new row and so,
    //we need to have multiple rows for the same product and slug will be duplicated
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    brandId: uuid("brand_id"), //we are not referencing id of brand because brand might not exists later and we need to display its history
    brandName: varchar("brand_name", { length: 100 }),
    categoryId: uuid("category_id"), //same for the category. but category might not get deleted, they might be separated into different or joined
    categoryName: varchar("category_name", { length: 100 }),
    changed_at: timestamp("changed_at").defaultNow(),
    changed_by: uuid("changed_by"),
  },
  (table) => [
    index("product_id_history_index").on(table.productId),
    index("product_slug_history_index").on(table.slug),
  ],
);

export type ProductHistory = InferSelectModel<typeof productHistory>;
