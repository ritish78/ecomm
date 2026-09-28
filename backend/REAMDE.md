# Store roles and permissions

The existing `permission`, `roles`, `role_permission`, `store_members`, and
`platform_members` tables remain unchanged. Action keys are defined in
`src/config/permissions.ts` and must already be seeded in the database.
The permission catalog reads those records; it does not create arbitrary action keys.

## Authorization rules

- Route middleware checks the action permission (such as `roles:create`).
- Ordinary store members may manage only strictly smaller permission sets.
  Different role IDs with identical permissions are peers, not lower roles.
- Creation and permission replacement may grant only a strictly smaller subset
  of the actor's own permissions.
- Custom target roles must belong to the store in the URL.
- Platform admins bypass membership and hierarchy checks, but not role/store
  boundaries, built-in-role protection, or self-reassignment protection.
- Shared roles (`storeId: null`) may be assigned, but cannot be renamed,
  deleted, or have their permissions edited through store endpoints.
- Roles assigned to members cannot be deleted.
- Member reassignment checks both the target's current role and the proposed role.
  It cannot change your own role or reassign an owner (identified by the existing
  `store:remove` convention). Ownership transfer needs a separate workflow.
- A member whose role has no permissions remains a member.
- Creating a role and its permission associations uses one database transaction.
  Duplicate permission keys are normalized; unknown/unseeded keys reject the write.

## Endpoints

All paths below start with `/api/v1/stores/:storeId` and require login cookies.

| Method | Path                        | Access                                         | Body                     |
| ------ | --------------------------- | ---------------------------------------------- | ------------------------ |
| GET    | `/permissions`              | Store member or platform admin                 | None                     |
| GET    | `/roles`                    | Store member or platform admin                 | None                     |
| GET    | `/roles-permissions`        | Store member or platform admin                 | None                     |
| GET    | `/roles/:roleId/permission` | Store member or platform admin                 | None                     |
| POST   | `/roles`                    | `roles:create` plus grant checks               | `name`, `permissionKeys` |
| PATCH  | `/roles/:roleId`            | `roles:update` plus hierarchy checks           | `name`                   |
| PATCH  | `/roles/:roleId/permission` | `roles:update` plus grant and hierarchy checks | `permissionKeys`         |
| DELETE | `/roles/:roleId`            | `roles:remove` plus hierarchy checks           | None                     |
| PATCH  | `/members/:userId/role`     | `roles:assign` plus member/role checks         | `roleId`                 |

Permission replacement replaces the entire set. Existing create/update contracts
continue to require at least one permission. Role names are trimmed and limited
to 50 characters to match the database column.

Example role creation:

```json
{
  "name": "Product editor",
  "permissionKeys": ["product:edit", "product_images:edit"]
}
```

Example member reassignment (use the real role UUID):

```json
{ "roleId": "f989d049-5e44-4a84-a5d2-395cff890873" }
```

The catalog returns `{ "permissions": [...] }` with database `id`, `key`, and
`description`. Assignment returns `{ "message": "...", "member": {...} }`.
Role create and permission replacement retain the existing `role.permission`
response field for compatibility.

## Verification

From `backend`, run:

```sh
pnpm run test:permissions
```

The 18 tests execute the real authorization/role services and validation schemas
with persistence stubs. They do not require credentials or mutate a database.
They cover peer roles, cross-store targets, escalation, admin overrides,
transaction usage, built-in roles, ownership, and member reassignment.
Live PostgreSQL and HTTP integration verification remains to be performed.

The normal TypeScript check currently reports existing unused imports/parameters
in unrelated backend files. A check with only unused-code diagnostics disabled
passes; no compiler settings were changed.
