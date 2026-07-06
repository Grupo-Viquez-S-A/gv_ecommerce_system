import { supabase } from "./primarySupabaseClient";

const AVATAR_COLORS = [
  "#C9A227",
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#38bdf8",
  "#a855f7",
];

const ROLE_BADGES = {
  administrador: "bg-[#C9A227]/15 text-[#C9A227]",
  admin: "bg-[#C9A227]/15 text-[#C9A227]",
  manager: "bg-[#C9A227]/15 text-[#C9A227]",
  gerente: "bg-[#C9A227]/15 text-[#C9A227]",

  supervisor: "bg-[#2d1b4e] text-[#c084fc]",

  vendedor: "bg-[#1a2e1a] text-[#4ade80]",
  desarrollador: "bg-[#14301a] text-[#4ade80]",
  developer: "bg-[#14301a] text-[#4ade80]",

  contador: "bg-[#2d200a] text-[#fbbf24]",
  contabilidad: "bg-[#2d200a] text-[#fbbf24]",

  cliente: "bg-[#0d2030] text-[#38bdf8]",
  client: "bg-[#0d2030] text-[#38bdf8]",
};

function getInitials(name = "", surname = "") {
  const fullName = `${name} ${surname}`.trim();

  if (!fullName) {
    return "US";
  }

  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getAvatarColor(value = "") {
  const total = [...value].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

function getRoleBadge(roleName = "", roleCode = "") {
  const normalizedRole = roleName.trim().toLowerCase();
  const normalizedCode = roleCode.trim().toLowerCase();

  return (
    ROLE_BADGES[normalizedCode] ||
    ROLE_BADGES[normalizedRole] ||
    "bg-[#22304a] text-gray-300"
  );
}

function isDateRangeActive(startDate, endDate) {
  const today = new Date().toISOString().slice(0, 10);

  const hasStarted = !startDate || startDate <= today;
  const hasNotExpired = !endDate || endDate >= today;

  return hasStarted && hasNotExpired;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatActivityDate(dateValue) {
  if (!dateValue) {
    return "Sin actividad registrada";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export async function getEcommerceUsers() {
  const { data, error } = await supabase.rpc(
    "get_ecommerce_users_for_admin",
  );

  if (error) {
    throw new Error(
      `No fue posible cargar los usuarios del e-commerce: ${error.message}`,
    );
  }

  return (data || []).map((user) => {
    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    const accessIsActive =
      user.application_active &&
      user.application_access_active &&
      user.profile_active &&
      isDateRangeActive(
        user.application_start_date,
        user.application_end_date,
      );

    const companies =
      Array.isArray(user.companies) && user.companies.length > 0
        ? user.companies
        : ["Sin empresa asignada"];

    const roleName = user.role_name || "Sin rol asignado";
    const roleCode = user.role_code || "";

    return {
      id: user.user_application_id,
      profileId: user.profile_id,
      userApplicationId: user.user_application_id,

      initials: getInitials(user.name, user.surname),
      color: getAvatarColor(user.profile_id),

      name: fullName || "Usuario sin nombre",
      email: user.email || "Sin correo",
      phone: user.phone || "Sin teléfono",

      role: roleName,
      roleCode,
      roleColor: getRoleBadge(roleName, roleCode),

      companies,
      department: user.department_name || "Sin departamento asignado",

      status: accessIsActive ? "Activo" : "Inactivo",
      isActive: accessIsActive,

      created: formatDate(user.profile_created_at),
      lastActivity: formatActivityDate(user.last_activity),

      applicationStartDate: user.application_start_date,
      applicationEndDate: user.application_end_date,

      has2fa: null,
    };
  });
}