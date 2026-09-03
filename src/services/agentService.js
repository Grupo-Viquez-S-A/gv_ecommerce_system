import { supabase } from "./primarySupabaseClient.js";
import {
  addDaysCRDateString,
  getTodayCRDateString,
} from "../utils/dateUtils.js";

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";

const AVATAR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#C9A227",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#a855f7",
  "#ef4444",
];

function normalizeText(value = "") {
  return String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeCode(value = "") {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function isSalesAgentRole(role = {}) {
  const roleName = normalizeText(role.role_name);
  const roleCode = normalizeCode(role.role_code || role.role_name);

  return (
    roleName === "agente de ventas" ||
    roleName === "agente ventas" ||
    roleName === "vendedor" ||
    roleCode === "agente_de_ventas" ||
    roleCode === "agente_ventas" ||
    roleCode === "sales_agent" ||
    roleCode === "seller" ||
    roleCode === "vendedor"
  );
}

function isDateRangeActive(startDate, endDate) {
  const today = getTodayCRDateString();
  const hasStarted = !startDate || startDate <= today;
  const hasNotExpired = !endDate || endDate >= today;

  return hasStarted && hasNotExpired;
}

function getInitials(name = "", surname = "") {
  const fullName = `${name} ${surname}`.trim();

  return (
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "AG"
  );
}

function getAvatarColor(value = "") {
  const total = [...String(value)].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

function indexRowsByKey(rows = [], keyName) {
  return rows.reduce((indexedRows, row) => {
    const key = row?.[keyName];

    if (key) {
      indexedRows[key] = row;
    }

    return indexedRows;
  }, {});
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data || [];
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(getNumber(value, 0));
}

function createEmptyPerformance() {
  return {
    clientsCount: 0,
    salesLastMonthAmount: 0,
    totalQuotes: 0,
    totalOrders: 0,
  };
}

function getAgentPerformance(performanceByUserId, userId) {
  return performanceByUserId[userId] || createEmptyPerformance();
}

const CANCELLED_ORDER_STATUSES = new Set([
  "cancelado",
  "cancelada",
  "rechazado",
  "rechazada",
  "anulado",
  "anulada",
]);

async function getAgentPerformanceByUserId(userIds = []) {
  if (!userIds.length) {
    return {};
  }

  const performanceByUserId = userIds.reduce((result, userId) => {
    result[userId] = createEmptyPerformance();
    return result;
  }, {});

  const lastMonthStartDate = addDaysCRDateString(-30);

  const [customersResponse, quotationsResponse, productionOrdersResponse] =
    await Promise.all([
      supabase
        .from("customers")
        .select("customer_id, assigned_sales_agent_user_id, is_active, deleted_at")
        .in("assigned_sales_agent_user_id", userIds)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase
        .from("quotations")
        .select("quotation_id, user_id, total, is_active")
        .in("user_id", userIds)
        .eq("is_active", true),
      supabase
        .from("production_orders")
        .select("production_order_id, quotation_id, production_order_status, is_active, created_at")
        .eq("is_active", true)
        .gte("created_at", lastMonthStartDate),
    ]);

  const customers = throwIfError(
    customersResponse,
    "No fue posible cargar los clientes asignados",
  );
  const quotations = throwIfError(
    quotationsResponse,
    "No fue posible cargar las cotizaciones de los agentes",
  );
  const productionOrders = throwIfError(
    productionOrdersResponse,
    "No fue posible cargar las ventas acumuladas de los agentes",
  );

  for (const customer of customers) {
    const agentUserId = customer.assigned_sales_agent_user_id;

    if (performanceByUserId[agentUserId]) {
      performanceByUserId[agentUserId].clientsCount += 1;
    }
  }

  const quotationsById = indexRowsByKey(quotations, "quotation_id");

  for (const quotation of quotations) {
    if (performanceByUserId[quotation.user_id]) {
      performanceByUserId[quotation.user_id].totalQuotes += 1;
    }
  }

  for (const order of productionOrders) {
    const orderStatus = String(order.production_order_status || "")
      .trim()
      .toLowerCase();

    if (CANCELLED_ORDER_STATUSES.has(orderStatus)) {
      continue;
    }

    const quotation = quotationsById[order.quotation_id];

    if (!quotation || !performanceByUserId[quotation.user_id]) {
      continue;
    }

    performanceByUserId[quotation.user_id].totalOrders += 1;
    performanceByUserId[quotation.user_id].salesLastMonthAmount += getNumber(
      quotation.total,
      0,
    );
  }

  return performanceByUserId;
}

function createAgentItem({
  membership,
  profile,
  company,
  role,
  applicationAccess,
  performance,
}) {
  const fullName = [profile?.name, profile?.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  const isActive =
    Boolean(applicationAccess) &&
    profile?.is_active !== false &&
    membership?.is_active !== false &&
    isDateRangeActive(membership?.start_date, membership?.end_date) &&
    applicationAccess?.is_active !== false &&
    isDateRangeActive(applicationAccess?.start_date, applicationAccess?.end_date);

  const agentPerformance = performance || createEmptyPerformance();

  return {
    id: membership.membership_id,
    userId: membership.user_id,
    membershipId: membership.membership_id,
    initials: getInitials(profile?.name, profile?.surname),
    color: getAvatarColor(profile?.user_id || membership.user_id),
    name: fullName || profile?.email || "Agente sin nombre",
    email: profile?.email || "Sin correo",
    phone: profile?.phone || "Sin telefono",
    company:
      company?.commercial_name ||
      company?.company_name ||
      "Sin empresa asignada",
    companyId: membership.company_id || "",
    department: "Ventas",
    role: role?.role_name || "Agente de ventas",
    roleCode: role?.role_code || "",
    sales: formatCurrency(agentPerformance.salesLastMonthAmount),
    salesLastMonth: formatCurrency(agentPerformance.salesLastMonthAmount),
    salesLastMonthAmount: agentPerformance.salesLastMonthAmount,
    clientsCount: agentPerformance.clientsCount,
    totalQuotes: agentPerformance.totalQuotes,
    totalOrders: agentPerformance.totalOrders,
    commission: "No definida",
    status: isActive ? "Activo" : "Inactivo",
    notes:
      "Usuario importado desde Administracion de Usuarios. El alta y cambios del perfil se gestionan en esa seccion.",
  };
}

export async function getSalesAgents() {
  const roles = throwIfError(
    await supabase
      .from("roles")
      .select("role_id, role_name, role_code, is_active")
      .eq("is_active", true),
    "No fue posible cargar los roles",
  );

  const salesAgentRoles = roles.filter(isSalesAgentRole);
  const roleIds = salesAgentRoles.map((role) => role.role_id);

  if (!roleIds.length) {
    return [];
  }

  const memberships = throwIfError(
    await supabase
      .from("user_memberships")
      .select(
        "membership_id, user_id, company_id, department_id, role_id, is_active, start_date, end_date, created_at, updated_at",
      )
      .in("role_id", roleIds)
      .order("created_at", { ascending: false }),
    "No fue posible cargar los agentes de ventas",
  );

  if (!memberships.length) {
    return [];
  }

  const userIds = uniqueValues(memberships.map((membership) => membership.user_id));
  const companyIds = uniqueValues(
    memberships.map((membership) => membership.company_id),
  );

  const [profilesResponse, companiesResponse, applicationsResponse] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "user_id, name, surname, email, identification, phone, is_active, created_at, updated_at",
        )
        .in("user_id", userIds),
      companyIds.length
        ? supabase
            .from("companies")
            .select("company_id, company_name, commercial_name, is_active")
            .in("company_id", companyIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("user_applications")
        .select(
          "user_application_id, user_id, application_id, is_active, start_date, end_date",
        )
        .eq("application_id", ECOMMERCE_APPLICATION_ID)
        .in("user_id", userIds),
    ]);

  const profiles = throwIfError(
    profilesResponse,
    "No fue posible cargar los perfiles de los agentes",
  );
  const companies = throwIfError(
    companiesResponse,
    "No fue posible cargar las empresas de los agentes",
  );
  const applicationAccessRows = throwIfError(
    applicationsResponse,
    "No fue posible cargar los accesos al e-commerce",
  );

  const profilesByUserId = indexRowsByKey(profiles, "user_id");
  const companiesById = indexRowsByKey(companies, "company_id");
  const rolesById = indexRowsByKey(salesAgentRoles, "role_id");
  const applicationAccessByUserId = indexRowsByKey(
    applicationAccessRows,
    "user_id",
  );
  const performanceByUserId = await getAgentPerformanceByUserId(userIds);

  return memberships
    .filter((membership) => applicationAccessByUserId[membership.user_id])
    .map((membership) =>
      createAgentItem({
        membership,
        profile: profilesByUserId[membership.user_id],
        company: companiesById[membership.company_id],
        role: rolesById[membership.role_id],
        applicationAccess: applicationAccessByUserId[membership.user_id],
        performance: getAgentPerformance(
          performanceByUserId,
          membership.user_id,
        ),
      }),
    );
}

export async function getSalesAgentNames() {
  const agents = await getSalesAgents();

  return [...new Set(agents.map((agent) => agent.name).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "es-CR"),
  );
}
