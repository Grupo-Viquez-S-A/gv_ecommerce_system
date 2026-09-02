import { supabase } from "./primarySupabaseClient.js";
import { isSalesAgentRole } from "../utils/roles.js";
import { getVisitRouteDayFromDate } from "../utils/visitRouteDays.js";

function isActiveByDates(record = {}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    record.is_active !== false &&
    (!record.start_date || record.start_date <= today) &&
    (!record.end_date || record.end_date >= today)
  );
}

async function getCurrentUserSalesAgentRole(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_memberships")
    .select("is_active, start_date, end_date, roles (role_code, role_name, is_active)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  if (error) {
    throw error;
  }

  const activeMembership = (data || []).find((membership) => {
    const role = Array.isArray(membership.roles)
      ? membership.roles[0]
      : membership.roles;

    return (
      isActiveByDates(membership) &&
      role?.is_active !== false &&
      isSalesAgentRole(role)
    );
  });

  const role = Array.isArray(activeMembership?.roles)
    ? activeMembership.roles[0]
    : activeMembership?.roles;

  return role || null;
}

export async function getCurrentCustomerRouteAssignment() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    const role = await getCurrentUserSalesAgentRole(user?.id);
    const shouldAssignToCurrentUser = isSalesAgentRole(role);

    return {
      assigned_sales_agent_user_id: shouldAssignToCurrentUser ? user?.id : null,
      visit_route_day: getVisitRouteDayFromDate(new Date()),
    };
  } catch (error) {
    console.error(
      "No fue posible determinar la asignacion automatica de la ruta del cliente:",
      error,
    );

    return {
      assigned_sales_agent_user_id: null,
      visit_route_day: getVisitRouteDayFromDate(new Date()),
    };
  }
}
