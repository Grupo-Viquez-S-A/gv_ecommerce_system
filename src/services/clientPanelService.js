import { supabase } from "./primarySupabaseClient.js";

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

function indexRowsByKey(rows = [], keyName) {
  return rows.reduce((indexedRows, row) => {
    const key = row?.[keyName];

    if (key) {
      indexedRows[key] = row;
    }

    return indexedRows;
  }, {});
}

function getQuotationStatus(quotation) {
  return quotation?.state || quotation?.status || "pending";
}

function getItemTotal(items = []) {
  return items.reduce((total, item) => total + getNumber(item.total), 0);
}

export async function getAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`No fue posible validar la sesion: ${error.message}`);
  }

  if (!user?.id) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user.id;
}

export async function getMyQuotations() {
  const userId = await getAuthenticatedUserId();

  const quotations = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, user_id",
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    "No fue posible cargar tus cotizaciones",
  );

  if (!quotations.length) {
    return [];
  }

  const quotationIds = quotations.map((quotation) => quotation.quotation_id);

  const quoteProducts = throwIfError(
    await supabase
      .from("quote_products")
      .select(
        "quote_product_id, quotation_id, product_id, quantity, unit_price, iva_amount, subtotal, total, created_at, updated_at",
      )
      .in("quotation_id", quotationIds),
    "No fue posible cargar los productos cotizados",
  );

  const productsByQuotationId = groupRowsByKey(quoteProducts, "quotation_id");

  return quotations.map((quotation) => {
    const items = productsByQuotationId[quotation.quotation_id] || [];

    return {
      id: quotation.quotation_id,
      quotationId: quotation.quotation_id,
      number: quotation.quotation_number || "Sin numero",
      status: getQuotationStatus(quotation),
      notes: quotation.notes || "",
      createdAt: quotation.created_at,
      updatedAt: quotation.updated_at,
      itemsCount: items.length,
      total: getItemTotal(items),
      items,
    };
  });
}

export async function getMyProductionOrders() {
  const myQuotations = await getMyQuotations();

  if (!myQuotations.length) {
    return [];
  }

  const quotationIds = myQuotations.map((quotation) => quotation.quotationId);

  const productionOrders = throwIfError(
    await supabase
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, payment_method, next_payment_date, is_active, created_at, updated_at",
      )
      .in("quotation_id", quotationIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    "No fue posible cargar tus pedidos",
  );

  const quotationsById = indexRowsByKey(myQuotations, "quotationId");

  return productionOrders.map((order) => ({
    id: order.production_order_id,
    productionOrderId: order.production_order_id,
    code: order.production_order_code || "Sin codigo",
    quotationId: order.quotation_id,
    quotationNumber: quotationsById[order.quotation_id]?.number || "Sin cotizacion",
    productionStatus: order.production_order_status || "pending",
    paymentStatus: order.payment_status || "pending",
    paymentMethod: order.payment_method || "No definido",
    committedDeliveryDate: order.committed_delivery_date,
    unexpectedDeliveryDate: order.unexpected_delivery_date,
    nextPaymentDate: order.next_payment_date,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  }));
}
