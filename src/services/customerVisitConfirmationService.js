import { supabase } from "./primarySupabaseClient.js";

export const VISIT_STOP_STATUSES = {
  VISITED: "visited",
  NOT_VISITED: "not_visited",
};

const VISIT_CONFIRMATION_SELECT =
  "visit_confirmation_id, customer_id, sales_agent_user_id, visit_date, visit_route_day, visit_status, note, visited_at, created_at";

const LEGACY_VISIT_CONFIRMATION_SELECT =
  "visit_confirmation_id, customer_id, sales_agent_user_id, visit_date, visit_route_day, visited_at, created_at";

function isMissingVisitNotesSchemaError(error) {
  const message = String(error?.message || "");

  return (
    error?.code === "42703" ||
    message.includes("visit_status does not exist") ||
    message.includes("note does not exist")
  );
}

function createMissingVisitNotesSchemaError() {
  return new Error(
    "La base de datos todavía no tiene habilitadas las notas de visita. Aplique la migración de notas de rutas y vuelva a intentar.",
  );
}

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
    visitStatus: row.visit_status || VISIT_STOP_STATUSES.VISITED,
    note: row.note || "",
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
    .select(VISIT_CONFIRMATION_SELECT)
    .eq("visit_date", visitDate)
    .in("customer_id", normalizedCustomerIds)
    .order("visited_at", { ascending: false });

  if (isMissingVisitNotesSchemaError(response?.error)) {
    const legacyResponse = await supabase
      .from("customer_visit_confirmations")
      .select(LEGACY_VISIT_CONFIRMATION_SELECT)
      .eq("visit_date", visitDate)
      .in("customer_id", normalizedCustomerIds)
      .order("visited_at", { ascending: false });

    const legacyRows = throwIfError(
      legacyResponse,
      "No fue posible cargar las confirmaciones de visita",
    );

    return (legacyRows || []).map(normalizeConfirmationRow);
  }

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
  note = "Visita confirmada.",
} = {}) {
  return saveCustomerVisitStatus({
    customerId,
    salesAgentUserId,
    visitDate,
    visitRouteDay,
    visitStatus: VISIT_STOP_STATUSES.VISITED,
    note,
  });
}

export async function saveCustomerVisitStatus({
  customerId,
  salesAgentUserId,
  visitDate,
  visitRouteDay,
  visitStatus,
  note,
} = {}) {
  if (!customerId) {
    throw new Error("No se recibió el cliente de la parada.");
  }

  if (!salesAgentUserId) {
    throw new Error("No se recibió el agente responsable de la parada.");
  }

  if (!visitDate) {
    throw new Error("No se recibió la fecha de la visita.");
  }

  if (!visitRouteDay) {
    throw new Error("No se recibió el día de la ruta.");
  }

  if (
    ![
      VISIT_STOP_STATUSES.VISITED,
      VISIT_STOP_STATUSES.NOT_VISITED,
    ].includes(visitStatus)
  ) {
    throw new Error("Seleccione un estado válido para la parada.");
  }

  const trimmedNote = String(note || "").trim();

  if (!trimmedNote) {
    throw new Error("Debe registrar una nota para esta parada.");
  }

  const response = await supabase
    .from("customer_visit_confirmations")
    .upsert({
      customer_id: customerId,
      sales_agent_user_id: salesAgentUserId,
      visit_date: visitDate,
      visit_route_day: visitRouteDay,
      visit_status: visitStatus,
      note: trimmedNote,
      visited_at: new Date().toISOString(),
    }, {
      onConflict: "customer_id,visit_date",
    })
    .select(VISIT_CONFIRMATION_SELECT)
    .single();

  if (isMissingVisitNotesSchemaError(response?.error)) {
    throw createMissingVisitNotesSchemaError();
  }

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
      "No fue posible guardar el estado de la parada",
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
