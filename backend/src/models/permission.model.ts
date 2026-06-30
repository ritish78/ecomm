import { InferSelectModel } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const permission = pgTable(
  "permission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 75 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
  },
  (table) => [index("permission_key_index").on(table.key)],
);

export type Permission = InferSelectModel<typeof permission>;
