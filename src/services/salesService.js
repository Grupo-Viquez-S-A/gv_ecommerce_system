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

function buildDerivedPaymentState(total, amountPaid, currentStatus = "") {
  const normalizedTotal = getNumber(total, 0);
  const normalizedAmountPaid = getNumber(amountPaid, 0);
  const balance = Math.max(
    Math.round((normalizedTotal - normalizedAmountPaid) * 100) / 100,
    0,
  );
  const normalizedStatus = String(currentStatus || "").toLowerCase();

  if (["cancelado", "anulado", "rechazado"].includes(normalizedStatus)) {
    return {
      balance,
      paymentStatus: normalizedStatus,
    };
  }

  return {
    balance,
    paymentStatus:
      normalizedAmountPaid <= 0
        ? "pendiente"
        : balance <= 0
          ? "pagado"
          : "parcial",
  };
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
 * Loads registered sales from active production orders. Per current business
 * rules, each production order becomes a sale as soon as it is created, even
 * if the payment is still pending or partial.
 */
export async function getPaidSales() {
  const orders = throwIfError(
    await supabase
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, production_order_status, payment_status, balance, is_active, created_at, updated_at",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
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
              "quotation_id, quotation_number, business_id:customer_id, user_id, subtotal, iva_amount, total, advance_payment, method_id, condition_id, created_at, committed_delivery_date, unexpected_delivery_date",
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

  const conditionIds = [
    ...new Set(quotations.map((quotation) => quotation.condition_id).filter(Boolean)),
  ];

  const [businesses, sellerProfiles, paymentMethods, paymentConditions] =
    await Promise.all([
      businessIds.length
        ? throwIfError(
            await supabase
              .from("customers")
              .select("business_id:customer_id, business_name:commercial_name, legal_name:company_name, legal_id, province, district")
              .in("customer_id", businessIds),
            "No fue posible cargar los clientes",
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
      conditionIds.length
        ? throwIfError(
            await supabase
              .from("payment_conditions")
              .select("condition_id, condition_name")
              .in("condition_id", conditionIds),
            "No fue posible cargar las condiciones de pago",
          )
        : [],
    ]);

  const businessesById = indexRowsByKey(businesses, "business_id");
  const sellerProfilesById = indexRowsByKey(sellerProfiles, "user_id");
  const paymentMethodsById = indexRowsByKey(paymentMethods, "method_id");
  const paymentConditionsById = indexRowsByKey(
    paymentConditions,
    "condition_id",
  );

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

    const business = businessesById[quotation.business_id] || null;
    const sellerProfile = sellerProfilesById[quotation.user_id] || null;

    const lastPayment = orderPayments[0] || null;

    const saleMethod = lastPayment
      ? paymentMethodsById[lastPayment.method_id]
      : paymentMethodsById[quotation.method_id];
    const saleCondition = paymentConditionsById[quotation.condition_id] || null;

    const saleDate = order.created_at || order.updated_at || lastPayment?.payment_date;

    const clientName =
      business?.business_name || business?.legal_name || "Cliente sin nombre";

    const branchLabel = business
      ? [business.district, business.province].filter(Boolean).join(", ")
      : null;

    const sellerName =
      [sellerProfile?.name, sellerProfile?.surname].filter(Boolean).join(" ") ||
      sellerProfile?.email ||
      "Sin asignar";

    const { balance, paymentStatus } = buildDerivedPaymentState(
      totalSale,
      amountPaid,
      order.payment_status,
    );
    const productionStatus = String(
      order.production_order_status || "pendiente",
    ).toLowerCase();

    sales.push({
      id: order.production_order_id,
      productionOrderId: order.production_order_id,
      code: order.production_order_code || "Sin codigo",
      quotationId: order.quotation_id,
      quotationNumber: quotation.quotation_number || "Sin cotizacion",
      businessId: quotation.business_id || null,
      client: clientName,
      legalId: business?.legal_id || null,
      branchLabel,
      representative: sellerName,
      clientRepresentative: "Sin representante",
      avatar: getInitials(sellerName),
      saleDate,
      total: totalSale,
      amountPaid,
      balance,
      paymentMethod: saleMethod?.method_name || "Sin metodo",
      paymentCondition: saleCondition?.condition_name || "Sin condicion",
      paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
      productionStatus,
      productionStatusLabel:
        PRODUCTION_STATUS_LABELS[productionStatus] || productionStatus,
      committedDeliveryDate: quotation?.committed_delivery_date || null,
      unexpectedDeliveryDate: quotation?.unexpected_delivery_date || null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    });
  }

  return sales;
}
