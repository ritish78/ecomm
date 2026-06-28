import { InferSelectModel } from "drizzle-orm";
import { varchar, timestamp, uuid, pgTable, index, boolean, text } from "drizzle-orm/pg-core";
import { brands } from "./brands.model";
import { categories } from "./categories.model";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("product_slug_index").on(table.slug),
    index("product_brand_id_index").on(table.brandId),
    index("product_category_id_index").on(table.categoryId),
  ],
);

export type Product = InferSelectModel<typeof products>;
