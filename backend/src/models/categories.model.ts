import { InferSelectModel } from "drizzle-orm";
import { uuid, varchar, timestamp, pgTable, index } from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("category_slug_index").on(table.slug)],
);

export type Category = InferSelectModel<typeof categories>;
