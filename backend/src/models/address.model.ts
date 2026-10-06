import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { ADDRESS_COUNTRIES } from "../config/address";
import { uuid } from "drizzle-orm/pg-core";
import { users } from "./users.model";
import { varchar } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { uniqueIndex } from "drizzle-orm/pg-core";
import { InferSelectModel, sql } from "drizzle-orm";
import { check } from "drizzle-orm/pg-core";

export const addressCountryEnum = pgEnum("address_country", ADDRESS_COUNTRIES);

export const address = pgTable(
  "address",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 50 }),
    recipientName: varchar("recipient_name", { length: 100 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 16 }).notNull(),
    countryCode: addressCountryEnum("country_code").notNull(),

    addressLineOne: varchar("address_line_one", { length: 200 }).notNull(),
    addressLineTwo: varchar("address_line_two", { length: 200 }),

    //in Australia, locality means suburb or town
    //in Nepal, locality means municipality
    locality: varchar("locality", { length: 100 }).notNull(),
    region: varchar("region", { length: 100 }).notNull(),

    district: varchar("district", { length: 100 }),
    wardNumber: integer("ward_number"),

    postalCode: varchar("postal_code", { length: 10 }),

    landmark: varchar("landmark", { length: 200 }),
    deliveryInstruction: varchar("delivery_instruction", { length: 500 }),

    isDefault: boolean("is_default").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_addresses_user_id").on(table.userId),

    uniqueIndex("user_addresses_one_default_per_user")
      .on(table.userId)
      .where(sql`${table.isDefault} = true`),

    check(
      "user_addresses_country_fields",
      sql`(
        ${table.countryCode} = 'AU'
        AND ${table.district} IS NULL
        AND ${table.wardNumber} IS NULL
        AND ${table.postalCode} IS NOT NULL
      ) OR (
        ${table.countryCode} = 'NP'
        AND ${table.district} IS NOT NULL
        AND ${table.wardNumber} IS NOT NULL
        AND ${table.wardNumber} > 0
      )`,
    ),
  ],
);

export type Address = InferSelectModel<typeof address>;
