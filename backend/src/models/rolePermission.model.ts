import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { roles } from "./roles.model";
import { permission } from "./permission.model";
import { primaryKey } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const rolePermission = pgTable(
  "role_permission",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export type RolePermission = InferSelectModel<typeof rolePermission>;
