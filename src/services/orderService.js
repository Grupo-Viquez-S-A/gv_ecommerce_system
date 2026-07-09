import { supabase } from "./primarySupabaseClient.js";

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data ?? [];
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
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

export const PENDING_PAYMENT_STATUSES = ["pendiente", "parcial"];

export const PAYMENT_STATUS_LABELS = {
  pendiente: "Pendiente de pago",
  parcial: "Pago adelantado",
  pagado: "Pagado",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const PRODUCTION_STATUS_LABELS = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  pausada: "Pausada",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

function getInitials(fullName) {
  if (!fullName) {
    return "NA";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Loads real production orders that are pending payment or with an
 * advance payment made ("Pendientes de pago" o "Pago adelantado"),
 * joined with their quotation, business, branch and representative data.
 */
export async function getSalesOrders({
  paymentStatuses = PENDING_PAYMENT_STATUSES,
} = {}) {
  let ordersQuery = supabase
    .from("production_orders")
    .select(
      "production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (paymentStatuses?.length) {
    ordersQuery = ordersQuery.in("payment_status", paymentStatuses);
  }

  const orders = throwIfError(
    await ordersQuery,
    "No fue posible cargar las ordenes de venta",
  );

  if (!orders.length) {
    return [];
  }

  const quotationIds = [
    ...new Set(orders.map((order) => order.quotation_id).filter(Boolean)),
  ];

  const quotations = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, user_id, quotation_number, total, created_at",
      )
      .in("quotation_id", quotationIds),
    "No fue posible cargar las cotizaciones asociadas",
  );

  const quotationsById = indexRowsByKey(quotations, "quotation_id");

  const businessIds = [
    ...new Set(quotations.map((quotation) => quotation.business_id).filter(Boolean)),
  ];

  const branchIds = [
    ...new Set(quotations.map((quotation) => quotation.branch_id).filter(Boolean)),
  ];

  const sellerUserIds = [
    ...new Set(quotations.map((quotation) => quotation.user_id).filter(Boolean)),
  ];

  const [businesses, branches, sellerProfiles] = await Promise.all([
    businessIds.length
      ? throwIfError(
          await supabase
            .from("businesses")
            .select("business_id, business_name, legal_name")
            .in("business_id", businessIds),
          "No fue posible cargar los clientes",
        )
      : [],
    branchIds.length
      ? throwIfError(
          await supabase
            .from("branches")
            .select("branch_id, province, district")
            .in("branch_id", branchIds),
          "No fue posible cargar las sucursales",
        )
      : [],
    sellerUserIds.length
      ? throwIfError(
          await supabase
            .from("profiles")
            .select("user_id, name, surname, email")
            .in("user_id", sellerUserIds),
          "No fue posible cargar los vendedores",
        )
      : [],
  ]);

  const businessesById = indexRowsByKey(businesses, "business_id");
  const branchesById = indexRowsByKey(branches, "branch_id");
  const sellerProfilesById = indexRowsByKey(sellerProfiles, "user_id");

  return orders.map((order) => {
    const quotation = quotationsById[order.quotation_id] || null;
    const business = quotation ? businessesById[quotation.business_id] : null;
    const branch = quotation ? branchesById[quotation.branch_id] : null;
    const sellerProfile = quotation
      ? sellerProfilesById[quotation.user_id]
      : null;

    const clientName =
      business?.business_name || business?.legal_name || "Cliente sin nombre";

    const branchLabel = branch
      ? [branch.district, branch.province].filter(Boolean).join(", ")
      : null;

    const sellerName =
      [sellerProfile?.name, sellerProfile?.surname].filter(Boolean).join(" ") ||
      sellerProfile?.email ||
      "Sin asignar";

    const paymentStatus = String(order.payment_status || "pendiente").toLowerCase();
    const productionStatus = String(
      order.production_order_status || "pendiente",
    ).toLowerCase();

    return {
      id: order.production_order_id,
      productionOrderId: order.production_order_id,
      code: order.production_order_code || "Sin codigo",
      quotationId: order.quotation_id,
      quotationNumber: quotation?.quotation_number || "Sin cotizacion",
      client: clientName,
      branchLabel,
      agent: sellerName,
      avatar: getInitials(sellerName),
      total: getNumber(quotation?.total, 0),
      balance: getNumber(order.balance, 0),
      paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
      productionStatus,
      productionStatusLabel:
        PRODUCTION_STATUS_LABELS[productionStatus] || productionStatus,
      committedDeliveryDate: order.committed_delivery_date,
      unexpectedDeliveryDate: order.unexpected_delivery_date,
      nextPaymentDate: order.next_payment_date,
      overdueDays: getNumber(order.overdue_days, 0),
      penaltyAmount: getNumber(order.penalty_amount, 0),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  });
}
