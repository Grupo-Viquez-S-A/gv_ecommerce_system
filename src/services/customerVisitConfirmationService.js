import { supabase } from "./primarySupabaseClient.js";

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data;
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

function normalizeConfirmationRow(row = {}) {
  return {
    id: row.visit_confirmation_id,
    visitConfirmationId: row.visit_confirmation_id,
    customerId: row.customer_id,
    salesAgentUserId: row.sales_agent_user_id,
    visitDate: row.visit_date,
    visitRouteDay: row.visit_route_day,
    visitedAt: row.visited_at,
    createdAt: row.created_at,
  };
}

export async function getCustomerVisitConfirmations({
  customerIds = [],
  visitDate,
} = {}) {
  const normalizedCustomerIds = [...new Set(customerIds.filter(Boolean))];

  if (!visitDate || !normalizedCustomerIds.length) {
    return [];
  }

  const response = await supabase
    .from("customer_visit_confirmations")
    .select(
      "visit_confirmation_id, customer_id, sales_agent_user_id, visit_date, visit_route_day, visited_at, created_at",
    )
    .eq("visit_date", visitDate)
    .in("customer_id", normalizedCustomerIds)
    .order("visited_at", { ascending: false });

  const rows = throwIfError(
    response,
    "No fue posible cargar las confirmaciones de visita",
  );

  return (rows || []).map(normalizeConfirmationRow);
}

export async function confirmCustomerVisit({
  customerId,
  salesAgentUserId,
  visitDate,
  visitRouteDay,
} = {}) {
  if (!customerId) {
    throw new Error("No se recibió el cliente a confirmar.");
  }

  if (!salesAgentUserId) {
    throw new Error("No se recibió el agente responsable de la visita.");
  }

  if (!visitDate) {
    throw new Error("No se recibió la fecha de la visita.");
  }

  if (!visitRouteDay) {
    throw new Error("No se recibió el día de la ruta.");
  }

  const response = await supabase
    .from("customer_visit_confirmations")
    .insert({
      customer_id: customerId,
      sales_agent_user_id: salesAgentUserId,
      visit_date: visitDate,
      visit_route_day: visitRouteDay,
    })
    .select(
      "visit_confirmation_id, customer_id, sales_agent_user_id, visit_date, visit_route_day, visited_at, created_at",
    )
    .single();

  if (response?.error?.code === "23505") {
    const existingRows = await getCustomerVisitConfirmations({
      customerIds: [customerId],
      visitDate,
    });

    return existingRows[0] || null;
  }

  return normalizeConfirmationRow(
    throwIfError(
      response,
      "No fue posible confirmar la visita del cliente",
    ),
  );
}

export async function removeCustomerVisitConfirmation({
  customerId,
  visitDate,
} = {}) {
  if (!customerId) {
    throw new Error("No se recibió el cliente a revertir.");
  }

  if (!visitDate) {
    throw new Error("No se recibió la fecha de la visita.");
  }

  const response = await supabase
    .from("customer_visit_confirmations")
    .delete()
    .eq("customer_id", customerId)
    .eq("visit_date", visitDate);

  throwIfError(
    response,
    "No fue posible revertir la confirmación de visita",
  );
}
