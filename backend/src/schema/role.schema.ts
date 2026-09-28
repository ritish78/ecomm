import { z } from "zod";
import { PERMISSIONS } from "../config/permissions";

export const createRoleSchema = z
  .object({
    name: z.string().trim().max(50).min(1, {
      error: "Please enter the name of the new role!",
    }),
    permissionKeys: z.array(z.enum(Object.values(PERMISSIONS))).min(1, {
      error: "Please provide atleast one permission for the new role!",
    }),
  })
  .strict();

export const updateRoleSchema = z.object({
  name: z.string().trim().max(50).min(1, {
    error: "Please enter atleast one character for the new role name!",
  }),
});

export const updateRolePermissionSchema = z
  .object({
    permissionKeys: z.array(z.enum(Object.values(PERMISSIONS))).min(1, {
      error: "Please provide atleast one permission to update!",
    }),
  })
  .strict();

export const assignMemberRoleSchema = z
  .object({
    roleId: z.uuid(),
  })
  .strict();

export const assignMemberRoleParamsSchema = z.object({
  storeId: z.uuid(),
  userId: z.uuid(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionInput = z.infer<typeof updateRolePermissionSchema>;
export type AssignMemberRoleInput = z.infer<typeof assignMemberRoleSchema>;
