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

function groupRowsByKey(rows = [], keyName) {
  return rows.reduce((groupedRows, row) => {
    const key = row?.[keyName];

    if (!key) {
      return groupedRows;
    }

    if (!groupedRows[key]) {
      groupedRows[key] = [];
    }

    groupedRows[key].push(row);

    return groupedRows;
  }, {});
}

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
 * Loads real sales: production orders whose payment has been fully settled
 * (payment_status === "pagado" and balance <= 0), cross-checked against the
 * actual payments registered for that order to avoid showing sales that are
 * only partially paid (advance payments) or in an inconsistent state.
 */
export async function getPaidSales() {
  const orders = throwIfError(
    await supabase
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, production_order_status, payment_status, balance, committed_delivery_date, unexpected_delivery_date, is_active, created_at, updated_at",
      )
      .eq("is_active", true)
      .eq("payment_status", "pagado")
      .lte("balance", 0)
      .order("updated_at", { ascending: false }),
    "No fue posible cargar las ventas",
  );

  if (!orders.length) {
    return [];
  }

  const productionOrderIds = orders.map((order) => order.production_order_id);

  const quotationIds = [
    ...new Set(orders.map((order) => order.quotation_id).filter(Boolean)),
  ];

  const [quotations, payments] = await Promise.all([
    quotationIds.length
      ? throwIfError(
          await supabase
            .from("quotations")
            .select(
              "quotation_id, quotation_number, business_id, branch_id, representative_id, user_id, subtotal, iva_amount, total, advance_payment, method_id, state, status, created_at",
            )
            .in("quotation_id", quotationIds),
          "No fue posible cargar las cotizaciones asociadas",
        )
      : [],
    throwIfError(
      await supabase
        .from("payments")
        .select(
          "payment_id, production_order_id, method_id, amount, payment_date, reference_number, notes, is_valid, created_at",
        )
        .in("production_order_id", productionOrderIds)
        .eq("is_valid", true),
      "No fue posible cargar los pagos registrados",
    ),
  ]);

  const quotationsById = indexRowsByKey(quotations, "quotation_id");
  const paymentsByOrderId = groupRowsByKey(payments, "production_order_id");

  const businessIds = [
    ...new Set(quotations.map((quotation) => quotation.business_id).filter(Boolean)),
  ];

  const branchIds = [
    ...new Set(quotations.map((quotation) => quotation.branch_id).filter(Boolean)),
  ];

  const representativeIds = [
    ...new Set(
      quotations.map((quotation) => quotation.representative_id).filter(Boolean),
    ),
  ];

  const sellerUserIds = [
    ...new Set(quotations.map((quotation) => quotation.user_id).filter(Boolean)),
  ];

  const methodIds = [
    ...new Set(
      [
        ...quotations.map((quotation) => quotation.method_id),
        ...payments.map((payment) => payment.method_id),
      ].filter(Boolean),
    ),
  ];

  const [businesses, branches, representatives, sellerProfiles, paymentMethods] =
    await Promise.all([
      businessIds.length
        ? throwIfError(
            await supabase
              .from("businesses")
              .select("business_id, business_name, legal_name, legal_id")
              .in("business_id", businessIds),
            "No fue posible cargar los clientes",
          )
        : [],
      branchIds.length
        ? throwIfError(
            await supabase
              .from("branches")
              .select("branch_id, province, district, address")
              .in("branch_id", branchIds),
            "No fue posible cargar las sucursales",
          )
        : [],
      representativeIds.length
        ? throwIfError(
            await supabase
              .from("representatives")
              .select("representative_id, name, email")
              .in("representative_id", representativeIds),
            "No fue posible cargar los representantes",
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
      methodIds.length
        ? throwIfError(
            await supabase
              .from("payment_methods")
              .select("method_id, method_name")
              .in("method_id", methodIds),
            "No fue posible cargar los metodos de pago",
          )
        : [],
    ]);

  const businessesById = indexRowsByKey(businesses, "business_id");
  const branchesById = indexRowsByKey(branches, "branch_id");
  const representativesById = indexRowsByKey(representatives, "representative_id");
  const sellerProfilesById = indexRowsByKey(sellerProfiles, "user_id");
  const paymentMethodsById = indexRowsByKey(paymentMethods, "method_id");

  const sales = [];

  for (const order of orders) {
    const quotation = quotationsById[order.quotation_id] || null;

    if (!quotation) {
      continue;
    }

    const orderPayments = (paymentsByOrderId[order.production_order_id] || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.payment_date || b.created_at).getTime() -
          new Date(a.payment_date || a.created_at).getTime(),
      );

    const amountPaid = orderPayments.reduce(
      (sum, payment) => sum + getNumber(payment.amount, 0),
      0,
    );

    const totalSale = getNumber(quotation.total, 0);
    const balance = getNumber(order.balance, 0);

    const hasNoPaymentsFallback =
      orderPayments.length === 0 &&
      order.payment_status === "pagado" &&
      balance <= 0;

    const isFullyPaid = amountPaid >= totalSale || hasNoPaymentsFallback;

    if (!isFullyPaid) {
      continue;
    }

    if (
      order.payment_status === "pendiente" ||
      order.payment_status === "parcial" ||
      order.payment_status === "vencido" ||
      order.payment_status === "cancelado"
    ) {
      continue;
    }

    if (balance > 0) {
      continue;
    }

    const business = businessesById[quotation.business_id] || null;
    const branch = branchesById[quotation.branch_id] || null;
    const representative =
      representativesById[quotation.representative_id] || null;
    const sellerProfile = sellerProfilesById[quotation.user_id] || null;

    const lastPayment = orderPayments[0] || null;

    const saleMethod = lastPayment
      ? paymentMethodsById[lastPayment.method_id]
      : paymentMethodsById[quotation.method_id];

    const saleDate =
      lastPayment?.payment_date || order.updated_at || order.created_at;

    const clientName =
      business?.business_name || business?.legal_name || "Cliente sin nombre";

    const branchLabel = branch
      ? [branch.district, branch.province].filter(Boolean).join(", ")
      : null;

    const sellerName =
      [sellerProfile?.name, sellerProfile?.surname].filter(Boolean).join(" ") ||
      sellerProfile?.email ||
      "Sin asignar";

    const paymentStatus = String(order.payment_status || "pagado").toLowerCase();
    const productionStatus = String(
      order.production_order_status || "pendiente",
    ).toLowerCase();

    sales.push({
      id: order.production_order_id,
      productionOrderId: order.production_order_id,
      code: order.production_order_code || "Sin codigo",
      quotationId: order.quotation_id,
      quotationNumber: quotation.quotation_number || "Sin cotizacion",
      client: clientName,
      legalId: business?.legal_id || null,
      branchLabel,
      representative: sellerName,
      clientRepresentative: representative?.name || "Sin asignar",
      avatar: getInitials(sellerName),
      saleDate,
      total: totalSale,
      amountPaid,
      balance,
      paymentMethod: saleMethod?.method_name || "Sin metodo",
      paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
      productionStatus,
      productionStatusLabel:
        PRODUCTION_STATUS_LABELS[productionStatus] || productionStatus,
      committedDeliveryDate: order.committed_delivery_date,
      unexpectedDeliveryDate: order.unexpected_delivery_date,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    });
  }

  return sales;
}
