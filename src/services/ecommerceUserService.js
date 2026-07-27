import { supabase } from "./primarySupabaseClient";
import { formatDateCR, getTodayCRDateString } from "../utils/dateUtils.js";

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

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";

const ROLE_BADGES = {
  administrador: "bg-[#C9A227]/15 text-[#C9A227]",
  admin: "bg-[#C9A227]/15 text-[#C9A227]",
  manager: "bg-[#C9A227]/15 text-[#C9A227]",
  gerente: "bg-[#C9A227]/15 text-[#C9A227]",
  encargado: "bg-[#C9A227]/15 text-[#C9A227]",

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
  const today = getTodayCRDateString();

  const hasStarted = !startDate || startDate <= today;
  const hasNotExpired = !endDate || endDate >= today;

  return hasStarted && hasNotExpired;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  return formatDateCR(dateValue);
}

function formatActivityDate(dateValue) {
  if (!dateValue) {
    return "Sin actividad registrada";
  }

  return `${formatDateCR(dateValue)} ${new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue))}`;
}

export async function getEcommerceUsers() {
  const applicationUsersResponse = await supabase
    .from("user_applications")
    .select(
      "user_application_id, user_id, application_id, is_active, start_date, end_date, created_at, updated_at",
    )
    .eq("application_id", ECOMMERCE_APPLICATION_ID)
    .order("created_at", { ascending: false });

  if (applicationUsersResponse.error) {
    throw new Error(
      `No fue posible cargar los usuarios del e-commerce: ${applicationUsersResponse.error.message}`,
    );
  }

  const applicationUsers = applicationUsersResponse.data || [];
  const userIds = [
    ...new Set(applicationUsers.map((user) => user.user_id).filter(Boolean)),
  ];

  if (userIds.length === 0) {
    return [];
  }

  const [
    profilesResponse,
    membershipsResponse,
    companiesResponse,
    rolesResponse,
    departmentsResponse,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "user_id, name, surname, email, identification, phone, is_active, created_at, updated_at",
      )
      .in("user_id", userIds),
    supabase
      .from("user_memberships")
      .select(
        "membership_id, user_id, company_id, department_id, role_id, is_active, start_date, end_date, created_at, updated_at",
      )
      .in("user_id", userIds),
    supabase
      .from("companies")
      .select("company_id, company_name, commercial_name"),
    supabase.from("roles").select("role_id, role_name, role_code"),
    supabase.from("departments").select("department_id, name"),
  ]);

  const firstError = [
    profilesResponse.error,
    membershipsResponse.error,
    companiesResponse.error,
    rolesResponse.error,
    departmentsResponse.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(
      `No fue posible cargar los usuarios del e-commerce: ${firstError.message}`,
    );
  }

  const profilesByUserId = new Map(
    (profilesResponse.data || []).map((profile) => [profile.user_id, profile]),
  );
  const companiesById = new Map(
    (companiesResponse.data || []).map((company) => [
      company.company_id,
      company,
    ]),
  );
  const rolesById = new Map(
    (rolesResponse.data || []).map((role) => [role.role_id, role]),
  );
  const departmentsById = new Map(
    (departmentsResponse.data || []).map((department) => [
      department.department_id,
      department,
    ]),
  );

  const membershipsByUserId = (membershipsResponse.data || []).reduce(
    (map, membership) => {
      const userMemberships = map.get(membership.user_id) || [];

      userMemberships.push(membership);
      map.set(membership.user_id, userMemberships);

      return map;
    },
    new Map(),
  );

  return applicationUsers.map((applicationUser) => {
    const profile = profilesByUserId.get(applicationUser.user_id) || {};
    const memberships = membershipsByUserId.get(applicationUser.user_id) || [];
    const primaryMembership =
      memberships.find((membership) => membership.is_active !== false) ||
      memberships[0] ||
      {};

    const role = rolesById.get(primaryMembership.role_id) || {};
    const department = departmentsById.get(primaryMembership.department_id) || {};
    const membershipCompanies = memberships
      .map((membership) => companiesById.get(membership.company_id))
      .filter(Boolean)
      .map((company) => company.commercial_name || company.company_name)
      .filter(Boolean);

    const fullName = `${profile.name || ""} ${profile.surname || ""}`.trim();

    const accessIsActive =
      applicationUser.is_active &&
      profile.is_active !== false &&
      primaryMembership.is_active !== false &&
      isDateRangeActive(applicationUser.start_date, applicationUser.end_date);

    const companies =
      membershipCompanies.length > 0
        ? [...new Set(membershipCompanies)]
        : ["Sin empresa asignada"];

    const roleName = role.role_name || "Sin rol asignado";
    const roleCode = role.role_code || "";

    return {
      id: applicationUser.user_application_id,
      profileId: profile.user_id,
      userApplicationId: applicationUser.user_application_id,

      initials: getInitials(profile.name, profile.surname),
      color: getAvatarColor(profile.user_id || applicationUser.user_id),

      name: fullName || "Usuario sin nombre",
      email: profile.email || "Sin correo",
      phone: profile.phone || "Sin telefono",

      role: roleName,
      roleCode,
      roleColor: getRoleBadge(roleName, roleCode),

      companies,
      department: department.name || "Sin departamento asignado",

      status: accessIsActive ? "Activo" : "Inactivo",
      isActive: accessIsActive,

      created: formatDate(profile.created_at),
      lastActivity: formatActivityDate(applicationUser.updated_at),

      applicationStartDate: applicationUser.start_date,
      applicationEndDate: applicationUser.end_date,

      has2fa: null,
    };
  });
}
