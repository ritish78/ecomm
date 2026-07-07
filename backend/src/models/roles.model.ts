import { varchar } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { stores } from "./store.model";
import { index } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { unique } from "drizzle-orm/pg-core";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    //i have dropped unique contraint from name as different store
    //can create their own role. let's say a store has created a role
    //photographer which has only permission product_images_edit
    //while another store has also created the same role photographer
    //but also provides another permission, having unique constraint
    //on name was not working as db would throw error
    name: varchar("name", { length: 50 }).notNull(),
    //the column, store_id can be null. it denotes that the role
    //applies to every store. if a store creates a store let's say for
    //a new staff and they are only providing them with specific permissions,
    //then a new role will be created and we reference that store's id here.
    storeId: uuid("store_id").references(() => stores.id),
  },
  (table) => [
    index("role_store_id_index").on(table.storeId),
    unique("role_name_store_unique").on(table.name, table.storeId),
  ],
);

export type Roles = InferSelectModel<typeof roles>;
