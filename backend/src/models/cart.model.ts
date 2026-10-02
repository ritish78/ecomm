import { pgTable, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.model";
import { timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  //we are limiting one cart to one user
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Cart = InferSelectModel<typeof carts>;
