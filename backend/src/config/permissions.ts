export const PERMISSIONS = {
  PRODUCT_CREATE: "product:create",
  PRODUCT_EDIT: "product:edit",
  PRODUCT_DELETE: "product:delete",

  PRODUCT_IMAGES_EDIT: "product_images:edit",

  PRODUCT_STOCK_UPDATE: "product_stock:update",
  PRODUCT_PRICE_UPDATE: "product_price:update",

  MEMBERS_ADD: "members:add",
  MEMBERS_REMOVE: "members:remove",

  ROLES_CREATE: "roles:create",
  ROLES_ASSIGN: "roles:assign",
  ROLES_REMOVE: "roles:remove",
  ROLES_UPDATE: "roles:update",

  PERMISSION_ADD: "permission:add",
  PERMISSION_REMOVE: "permission:remove",
  PERMISSION_UPDATE: "permission:update", //i think having update and add/remove makes it confusing

  STORE_CREATE: "store:create",
  STORE_EDIT: "store:edit",
  STORE_REMOVE: "store:remove",

  STORE_ORDERS_VIEW: "store_orders:view",

  USERS_DISABLE: "users:disable",
  USERS_REMOVE: "users:remove",
} as const;

export type Permissions = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
