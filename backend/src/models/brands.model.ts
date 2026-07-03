import { InferSelectModel } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";
import { varchar, timestamp, uuid, pgTable } from "drizzle-orm/pg-core";

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  //created an index on brand name as the brand name are unique
  //while testing, I am dropping tables/data from table and
  //seeding again the same data. since, id are uuid and are
  //generated randomly, I am needing to find new uuid and sending
  //the brandId in body while creating products.
  //TODO: I will try to change sending brand name instead of brand id.
  //Or maybe we could use slug as well. created slug later now
  (table) => [index("brand_name_index").on(table.name), index("brand_slug_index").on(table.slug)],
);

export type Brand = InferSelectModel<typeof brands>;
