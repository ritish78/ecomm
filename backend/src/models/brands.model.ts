import { InferSelectModel } from "drizzle-orm";
import { varchar, timestamp, uuid, pgTable } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Brand = InferSelectModel<typeof brands>;
