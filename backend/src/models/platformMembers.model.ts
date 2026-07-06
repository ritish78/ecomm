import { index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.model";
import { InferSelectModel } from "drizzle-orm/table";

export const platformMembers = pgTable(
  "platform_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    role: varchar("role", { length: 50 }).notNull().unique(),
  },
  (table) => [index("platform_members_user_id_index").on(table.userId)],
);

export type PlatformMembers = InferSelectModel<typeof platformMembers>;
