export const PERMISSIONS = {
  PRODUCT_CREATE: "product:create",
  PRODUCT_EDIT: "product:edit",
  PRODUCT_DELETE: "product:delete",

  PRODUCT_IMAGES_EDIT: "product_images:edit",

  PRODUCT_STOCK_UPDATE: "product_stock:update",
  PRODUCT_PRICE_UPDATE: "product_price:update",

  MEMBERS_ADD: "members:add",
  MEMBERS_REMOVE: "members:remove",

  ROLES_ASSIGN: "roles:assign",
  ROLES_ADD: "roles:add",
  ROLES_REMOVE: "roles:remove",

  PERMISSION_ADD: "permission:add",
  PERMISSION_REMOVE: "permission:remove",

  STORE_CREATE: "store:create",
  STORE_EDIT: "store:edit",
  STORE_REMOVE: "store:remove",

  STORE_ORDERS_VIEW: "store_orders:view",

  USERS_DISABLE: "users:disable",
  USERS_REMOVE: "users:remove",
} as const;

export type Permissions = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
