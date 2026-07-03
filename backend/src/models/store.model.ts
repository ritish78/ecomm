import { InferSelectModel } from "drizzle-orm";
import { text, varchar } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
// import { users } from "./users.model";
import { boolean } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    //storing the logourl in this table like in users table. maybe we should move
    //image urls to a different table? we already have product_images table.
    //we could modify it to be images table and accept other images as well or,
    // we could leave it as is and create another table for storing avatar/logo url
    logoUrl: varchar("logo_url", { length: 500 }),
    //   ownerId: uuid("owner_id").references(() => users.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("stores_slug_index").on(table.slug)],
);

export type Store = InferSelectModel<typeof stores>;
