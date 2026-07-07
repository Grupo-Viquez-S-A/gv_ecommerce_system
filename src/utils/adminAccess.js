function normalizeAccessValue(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function canManageSystemUsers(user) {
  const departmentName = normalizeAccessValue(user?.department?.name);
  const roleName = normalizeAccessValue(user?.role?.name);
  const roleCode = normalizeAccessValue(user?.role?.code);

  return (
    departmentName === "INFORMATICA" &&
    (roleName === "ENCARGADO" || roleCode === "ENCARGADO")
  );
}
