const SYSTEM_ACCESS_ROLE_CODES = new Set([
  "brand_manager",
  "brand manager",
  "gerente_marca",
  "gerente de marca",
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
  "brand_manager",
  "brand manager",
  "gerente_marca",
  "gerente de marca",
  "gerente",
  "encargado",
  "manager",
  "presidente",
  "president",
]);

const PAYMENT_APPROVAL_ROLE_CODES = new Set([
  "contador",
  "accountant",
  "presidente",
  "president",
]);

const QUOTATION_ADJUSTMENT_ROLE_CODES = new Set([
  "brand_manager",
  "brand manager",
  "gerente_marca",
  "gerente de marca",
  "encargado",
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

export function hasPaymentApprovalAccess(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    PAYMENT_APPROVAL_ROLE_CODES.has(roleCode) ||
    PAYMENT_APPROVAL_ROLE_CODES.has(roleName)
  );
}

export function hasQuotationAdjustmentAccess(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    QUOTATION_ADJUSTMENT_ROLE_CODES.has(roleCode) ||
    QUOTATION_ADJUSTMENT_ROLE_CODES.has(roleName)
  );
}

export function isSalesAgent(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return isSalesAgentRole({
    role_code: roleCode,
    role_name: roleName,
  });
}

export function isSalesAgentRole(role = {}) {
  const roleCode = normalizeRoleValue(role.role_code || role.code);
  const roleName = normalizeRoleValue(role.role_name || role.name);

  return (
    roleCode === "sales_agent" ||
    roleCode === "sales agent" ||
    roleCode === "agente_ventas" ||
    roleCode === "agente de ventas" ||
    roleCode === "vendedor" ||
    roleName === "agente de ventas" ||
    roleName === "vendedor"
  );
}

export function isBrandManager(user) {
  const roleCode = normalizeRoleValue(user?.role?.code);
  const roleName = normalizeRoleValue(user?.role?.name);

  return (
    roleCode === "brand_manager" ||
    roleCode === "brand manager" ||
    roleCode === "gerente_marca" ||
    roleName === "gerente de marca"
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
