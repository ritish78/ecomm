const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

//Stub only persistence.
//The real authorization and role services run below.
let state;

const repoPath = (name) => require.resolve(`../src/repository/${name}.ts`);

const stub = (path, exports) => {
  require.cache[path] = {
    id: path,
    filename: path,
    loaded: true,
    exports,
  };
};

const role = (id, permissions, storeId = "store") => ({
  id,
  name: id,
  storeId,
  permissions,
});

stub(repoPath("platformMember.repository"), {
  hasPlatformRole: async (id) => id === "admin",
});

stub(repoPath("store.repository"), {
  getStoreMembershipWithPermission: async (id, storeId) =>
    storeId === "store" ? (state.members[id] ?? null) : null,
});

stub(repoPath("storeMembers.repository"), {
  isUserMemberOfStore: async (storeId, id) => storeId === "store" && Boolean(state.members[id]),
});

stub(repoPath("roles.repository"), {
  getRolesWithPermission: async (id) => state.roles[id] ?? null,

  getRoleById: async (id) => state.roles[id] ?? null,

  countMemberWithRole: async (id) =>
    Object.values(state.members).filter((member) => member.roleId === id).length,

  createCustomRoles: async (storeId, name, tx) => {
    assert.equal(tx, state.tx);

    const created = role("new", [], storeId);
    created.name = name;
    state.roles.new = created;

    return created;
  },

  getPermissionByKeys: async (tx, keys) => {
    assert.equal(tx, state.tx);

    return keys.filter((key) => state.catalog.includes(key)).map((key) => ({ id: key, key }));
  },

  deleteRolePermissions: async (tx, id) => {
    assert.equal(tx, state.tx);
    state.roles[id].permissions = [];
  },

  insertRolePermission: async (tx, id, ids) => {
    assert.equal(tx, state.tx);
    state.roles[id].permissions = ids;
  },

  deleteRoleById: async (id) => {
    const previous = state.roles[id];
    delete state.roles[id];
    return previous;
  },

  updateRoleName: async (id, name) => {
    state.roles[id].name = name;
    return state.roles[id];
  },

  updateRoleOfStoreMember: async (storeId, id, roleId) => {
    assert.equal(storeId, "store");

    state.members[id].roleId = roleId;

    return state.members[id];
  },

  getAllPermissions: async () => state.catalog,
});

stub(require.resolve("../src/db/index.ts"), {
  transaction: async (fn) => {
    const previous = structuredClone(state.roles);

    try {
      return await fn(state.tx);
    } catch (error) {
      state.roles = previous;
      throw error;
    }
  },
});

const auth = require("../src/services/storeAuthorization.service.ts");
const services = require("../src/services/roles.service.ts");
const schema = require("../src/schema/role.schema.ts");

const denied = (promise, code = 403) => assert.rejects(promise, (error) => error.statusCode === code);

beforeEach(() => {
  state = {
    tx: {},
    catalog: ["product:edit", "roles:create", "roles:update", "roles:assign"],
    members: {
      manager: {
        roleId: "manager",
        permissions: ["product:edit", "roles:create", "roles:update", "roles:assign"],
      },
      staff: {
        roleId: "staff",
        permissions: ["product:edit"],
      },
      empty: {
        roleId: "empty",
        permissions: [],
      },
    },
    roles: {
      staff: role("staff", ["product:edit"]),
      empty: role("empty", []),
      peer: role("peer", ["product:edit", "roles:create", "roles:update", "roles:assign"]),
      foreign: role("foreign", ["product:edit"], "other-store"),
      global: role("global", ["product:edit"], null),
    },
  };
});

test("allows lower roles and denies equal sets under different IDs", async () => {
  await auth.assertCanActOnRole("manager", "store", "staff");

  await denied(auth.assertCanActOnRole("manager", "store", "peer"));
});

test("foreign roles remain inaccessible even to a platform admin", async () => {
  await denied(auth.assertCanActOnRole("manager", "store", "foreign"), 404);

  await denied(auth.assertCanActOnRole("admin", "store", "foreign"), 404);
});

test("admin can act without store membership; outsiders cannot", async () => {
  await auth.assertCanActOnRole("admin", "store", "staff");

  await denied(auth.assertCanActOnRole("outsider", "store", "staff"));
});

test("members with zero permissions can still be managed", async () => {
  await auth.assertCanActOnMember("manager", "store", "empty");
});

test("self changes and peer member changes are denied", async () => {
  await denied(auth.assertCanActOnMember("manager", "store", "manager"));

  state.members.other = {
    roleId: "peer",
    permissions: [...state.members.manager.permissions],
  };

  await denied(auth.assertCanActOnMember("manager", "store", "other"));
});

test("creation rejects escalation and grants equal to actor permissions", async () => {
  await denied(services.createRoleForStoreService("manager", "store", "Escalated", ["users:remove"]));

  await denied(
    services.createRoleForStoreService("manager", "store", "Peer", state.members.manager.permissions),
  );

  assert.equal(state.roles.new, undefined);
});

test("creation deduplicates permissions and uses one transaction", async () => {
  const result = await services.createRoleForStoreService("manager", "store", "Editor", [
    "product:edit",
    "product:edit",
  ]);

  assert.deepEqual(result.permission, ["product:edit"]);
});

test("unseeded permission rolls back role creation", async () => {
  await denied(services.createRoleForStoreService("admin", "store", "Invalid", ["missing:key"]), 400);

  assert.equal(state.roles.new, undefined);
});

test("permission update rejects escalation and equal-set promotion", async () => {
  await denied(services.updateRolePermissionService("manager", "store", "staff", ["users:remove"]));

  await denied(
    services.updateRolePermissionService("manager", "store", "staff", state.members.manager.permissions),
  );

  assert.deepEqual(state.roles.staff.permissions, ["product:edit"]);
});

test("admin can update custom permissions without membership", async () => {
  const result = await services.updateRolePermissionService("admin", "store", "staff", ["roles:create"]);

  assert.deepEqual(result.permission, ["roles:create"]);
});

test("global roles cannot be changed or deleted, including by admin", async () => {
  await denied(services.updateRolePermissionService("admin", "store", "global", ["roles:create"]), 400);

  await denied(services.updateRoleByIdService("global", "store", { name: "New" }, "admin"));

  await denied(services.deleteRoleByIdService("global", "admin", "store"), 404);
});

test("foreign roles cannot be renamed or deleted", async () => {
  await denied(services.updateRoleByIdService("foreign", "store", { name: "New" }, "admin"), 404);

  await denied(services.deleteRoleByIdService("foreign", "admin", "store"), 404);
});

test("renaming a peer role is denied", async () => {
  await denied(services.updateRoleByIdService("peer", "store", { name: "New" }, "manager"));
});

test("assigned roles cannot be deleted; unassigned custom roles can", async () => {
  await denied(services.deleteRoleByIdService("staff", "manager", "store"), 409);

  state.roles.unassigned = role("unassigned", ["product:edit"]);

  await services.deleteRoleByIdService("unassigned", "manager", "store");

  assert.equal(state.roles.unassigned, undefined);
});

test("member reassignment checks both the existing member and the new role", async () => {
  await denied(services.assignMemberRoleService("store", "manager", "staff", "peer"));

  await denied(services.assignMemberRoleService("store", "manager", "staff", "foreign"), 404);

  await services.assignMemberRoleService("store", "manager", "empty", "staff");

  assert.equal(state.members.empty.roleId, "staff");
});

test("permission catalog is available only to members and platform admins", async () => {
  assert.deepEqual(await services.getStorePermissionCatalogService("store", "manager"), state.catalog);

  assert.deepEqual(await services.getStorePermissionCatalogService("store", "admin"), state.catalog);

  await denied(services.getStorePermissionCatalogService("store", "outsider"));
});

test("role input rejects blank names, oversized names, unknown permissions and extra fields", () => {
  const input = {
    name: "Editor",
    permissionKeys: ["product:edit"],
  };

  const invalidInputs = [
    { ...input, name: "  " },
    { ...input, name: "x".repeat(51) },
    { ...input, permissionKeys: ["unknown"] },
    { ...input, extra: true },
  ];

  for (const value of invalidInputs) {
    assert.equal(schema.createRoleSchema.safeParse(value).success, false);
  }

  assert.equal(
    schema.createRoleSchema.parse({
      ...input,
      name: " Editor ",
    }).name,
    "Editor",
  );
});

test("member reassignment preserves store ownership, even for admins", async () => {
  state.members.owner = {
    roleId: "owner",
    permissions: ["store:remove"],
  };

  await denied(services.assignMemberRoleService("store", "admin", "owner", "staff"));

  assert.equal(state.members.owner.roleId, "owner");
});
