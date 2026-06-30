import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { stores } from "./store.model";
import { users } from "./users.model";
import { roles } from "./roles.model";
import { index } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const storeMembers = pgTable(
  "store_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("store_members_store_id_index").on(table.storeId),
    index("store_members_users_id_index").on(table.userId),
    unique("store_members_store_user_unique").on(table.storeId, table.userId),
  ],
);

export type StoreMembers = InferSelectModel<typeof storeMembers>;
