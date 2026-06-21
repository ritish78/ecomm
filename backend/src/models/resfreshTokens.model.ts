import { uuid, serial, pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { user } from "./user.model";

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(), //using serial here because we don't need to reference this id anywhere else in our database. We just need it to uniquely identify each refresh token in our database. Using uuid here would be an overkill.
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RefreshToken = InferSelectModel<typeof refreshTokens>;
