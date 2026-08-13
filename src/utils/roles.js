const SYSTEM_ACCESS_ROLE_CODES = new Set([
  "gerente",
  "encargado",
  "manager",
  "administrador",
  "admin",
  "presidente",
  "president",
  "super_admin",
]);

const CLIENT_DELETE_ROLE_CODES = new Set([
  "gerente",
  "encargado",
  "manager",
  "presidente",
  "president",
]);

function normalizeRoleValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function isClientAccount(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return roleCode === "client" || roleName === "cliente";
}

export function hasSystemAccess(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    SYSTEM_ACCESS_ROLE_CODES.has(roleCode) ||
    SYSTEM_ACCESS_ROLE_CODES.has(roleName)
  );
}

export function hasClientDeletionAccess(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    CLIENT_DELETE_ROLE_CODES.has(roleCode) ||
    CLIENT_DELETE_ROLE_CODES.has(roleName)
  );
}

export function isSalesAgent(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    roleCode === "sales_agent" ||
    roleCode === "sales agent" ||
    roleCode === "agente_ventas" ||
    roleName === "agente de ventas"
  );
}

const CATALOG_PURCHASE_ROLE_CODES = new Set([
  ...SYSTEM_ACCESS_ROLE_CODES,
  "sales_agent",
  "sales agent",
  "agente_ventas",
  "agente de ventas",
  "vendedor",
]);

export function hasCatalogPurchaseAccess(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    CATALOG_PURCHASE_ROLE_CODES.has(roleCode) ||
    CATALOG_PURCHASE_ROLE_CODES.has(roleName)
  );
}
