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
