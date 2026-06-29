import { InferSelectModel } from "drizzle-orm";
import { varchar, timestamp, uuid, pgTable, index, boolean } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 25 }).notNull(),
    lastName: varchar("last_name", { length: 25 }).notNull(),
    email: varchar("email", { length: 75 }).unique().notNull(),
    password: varchar("password", { length: 255 }),
    googleId: varchar("google_id", { length: 255 }).unique(),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("email_index").on(table.email), index("google_id_index").on(table.googleId)],
);

export type User = InferSelectModel<typeof users>;
