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

function normalizeDateInput(value) {
  if (!value) {
    return null;
  }

  return String(value).slice(0, 10);
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

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function getFileUrl(file) {
  return file?.public_url || file?.url || file?.file_url || null;
}

function isImageFile(file) {
  const fileText = normalizeText(
    [file?.mime_type, file?.file_name, file?.file_path, getFileUrl(file)]
      .filter(Boolean)
      .join(" "),
  );

  return (
    fileText.includes("image/") ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(fileText)
  );
}

function isTechnicalSheetFile(file) {
  const fileText = normalizeText(
    [file?.file_type, file?.type, file?.file_name, file?.file_path, getFileUrl(file)]
      .filter(Boolean)
      .join(" "),
  );

  return (
    fileText.includes("ficha") ||
    fileText.includes("technical") ||
    fileText.includes("datasheet") ||
    fileText.includes("especificacion") ||
    fileText.includes("specification")
  );
}

function getProductImageUrl(files = []) {
  const imageFile = files.find((file) => isImageFile(file) && !isTechnicalSheetFile(file));

  return getFileUrl(imageFile);
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

export async function createSalesProductionOrderFromQuotation(quotationId) {
  if (!quotationId) {
    throw new Error("No se encontro la cotizacion para crear la orden de produccion.");
  }

  const productionOrderResult = throwIfError(
    await supabase.rpc("secure_create_production_order_from_quotation", {
      p_quotation_id: quotationId,
    }),
    "No fue posible crear la orden de produccion",
  );

  if (
    productionOrderResult &&
    typeof productionOrderResult === "object" &&
    !Array.isArray(productionOrderResult)
  ) {
    return {
      created: Boolean(productionOrderResult.created),
      alreadyExisted: Boolean(productionOrderResult.alreadyExisted),
      productionOrderId: productionOrderResult.productionOrderId || null,
      productionOrderCode: productionOrderResult.productionOrderCode || null,
      raw: productionOrderResult,
    };
  }

  const productionOrder = Array.isArray(productionOrderResult)
    ? productionOrderResult[0]
    : productionOrderResult;

  return {
    created: true,
    alreadyExisted: false,
    productionOrderId: productionOrder?.production_order_id || null,
    productionOrderCode: productionOrder?.production_order_code || null,
    raw: productionOrder,
  };
}

/**
 * Loads real production orders that are pending payment or with an
 * advance payment made ("Pendientes de pago" o "Pago adelantado"),
 * joined with their quotation, business, branch and representative data.
 */
export async function getSalesOrders({
  paymentStatuses = PENDING_PAYMENT_STATUSES,
  ownerUserId = null,
} = {}) {
  let ordersQuery = supabase
    .from("production_orders")
    .select(
      "production_order_id, quotation_id, production_order_code, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount, penalty_percentage, paid_at",
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

  const [quotations, payments] = await Promise.all([
    throwIfError(
      await supabase
        .from("quotations")
        .select(
          "quotation_id, business_id:customer_id, user_id, quotation_number, total, committed_delivery_date, unexpected_delivery_date, created_at",
        )
        .in("quotation_id", quotationIds),
      "No fue posible cargar las cotizaciones asociadas",
    ),
    throwIfError(
      await supabase
        .from("payments")
        .select("production_order_id, amount, is_valid")
        .in(
          "production_order_id",
          orders.map((order) => order.production_order_id),
        )
        .eq("is_valid", true),
      "No fue posible cargar los pagos de las ordenes",
    ),
  ]);

  const visibleQuotations = ownerUserId
    ? quotations.filter((quotation) => quotation.user_id === ownerUserId)
    : quotations;

  if (!visibleQuotations.length) {
    return [];
  }

  const visibleQuotationIds = new Set(
    visibleQuotations.map((quotation) => quotation.quotation_id),
  );
  const visibleOrders = orders.filter((order) =>
    visibleQuotationIds.has(order.quotation_id),
  );
  const quotationsById = indexRowsByKey(visibleQuotations, "quotation_id");
  const validPaymentsByOrderId = groupRowsByKey(payments, "production_order_id");

  const businessIds = [
    ...new Set(
      visibleQuotations.map((quotation) => quotation.business_id).filter(Boolean),
    ),
  ];

  const sellerUserIds = [
    ...new Set(
      visibleQuotations.map((quotation) => quotation.user_id).filter(Boolean),
    ),
  ];

  const [businesses, sellerProfiles] = await Promise.all([
    businessIds.length
      ? throwIfError(
          await supabase
            .from("customers")
            .select("business_id:customer_id, business_name:commercial_name, legal_name:company_name, province, district")
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
  ]);

  const businessesById = indexRowsByKey(businesses, "business_id");
  const sellerProfilesById = indexRowsByKey(sellerProfiles, "user_id");

  return visibleOrders.map((order) => {
    const quotation = quotationsById[order.quotation_id] || null;
    const business = quotation ? businessesById[quotation.business_id] : null;
    const sellerProfile = quotation
      ? sellerProfilesById[quotation.user_id]
      : null;

    const clientName =
      business?.business_name || business?.legal_name || "Cliente sin nombre";

    const branchLabel = business
      ? [business.district, business.province].filter(Boolean).join(", ")
      : null;

    const sellerName =
      [sellerProfile?.name, sellerProfile?.surname].filter(Boolean).join(" ") ||
      sellerProfile?.email ||
      "Sin asignar";

    const total = getNumber(quotation?.total, 0);
    const amountPaid = (validPaymentsByOrderId[order.production_order_id] || []).reduce(
      (sum, payment) => sum + getNumber(payment.amount, 0),
      0,
    );
    const { balance, paymentStatus } = buildDerivedPaymentState(
      total,
      amountPaid,
      order.payment_status,
    );
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
      total,
      balance,
      amountPaid,
      paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
      productionStatus,
      productionStatusLabel:
        PRODUCTION_STATUS_LABELS[productionStatus] || productionStatus,
      committedDeliveryDate: quotation?.committed_delivery_date || null,
      unexpectedDeliveryDate: quotation?.unexpected_delivery_date || null,
      nextPaymentDate: order.next_payment_date,
      overdueDays: getNumber(order.overdue_days, 0),
      penaltyAmount: getNumber(order.penalty_amount, 0),
      penaltyPercentage: getNumber(order.penalty_percentage, 0),
      totalOwed: balance + getNumber(order.penalty_amount, 0),
      paidAt: order.paid_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  });
}

export async function getSalesOrderDetail(productionOrderId) {
  if (!productionOrderId) {
    throw new Error("No se encontro la orden seleccionada.");
  }

  const order = throwIfError(
    await supabase
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, production_order_status, payment_status, next_payment_date, status_change_note, status_changed_at, status_changed_by, is_active, created_at, updated_at, balance, overdue_days, penalty_amount, penalty_percentage, paid_at",
      )
      .eq("production_order_id", productionOrderId)
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible cargar el detalle de la orden",
  );

  if (!order?.quotation_id) {
    throw new Error("No se encontro la orden seleccionada.");
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id:customer_id, user_id, quotation_number, notes, is_active, created_at, updated_at, total, committed_delivery_date, unexpected_delivery_date, embroidery_amount, sublimation_amount, method_id, condition_id, payment_methods:method_id ( method_id, method_name ), payment_conditions:condition_id ( condition_id, condition_name )",
      )
      .eq("quotation_id", order.quotation_id)
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible cargar la cotizacion relacionada",
  );

  if (!quotation) {
    throw new Error("No se encontro la cotizacion relacionada a la orden.");
  }

  const quoteProducts = throwIfError(
    await supabase
      .from("quote_products")
      .select(
        "quote_product_id, quotation_id, variant_id, quantity, unit_price, iva_amount, has_sublimation, has_embroidery",
      )
      .eq("quotation_id", quotation.quotation_id),
    "No fue posible cargar los productos de la orden",
  );

  const variantIds = [...new Set(quoteProducts.map((item) => item.variant_id).filter(Boolean))];

  const variants = variantIds.length
      ? throwIfError(
          await supabase
            .from("textiles_inventory")
            .select(
              "variant_id, product_id, sku, gtin, size_id, price, tax_rate:iva, stock:stock_quantity, minimum_stock",
            )
            .in("variant_id", variantIds),
          "No fue posible cargar las variantes de la orden",
        )
      : [];

  const productIds = [...new Set(variants.map((item) => item.product_id).filter(Boolean))];
  const sizeIds = [...new Set(variants.map((item) => item.size_id).filter(Boolean))];

  const [products, productFiles, sizes, payments, statusHistory] = await Promise.all([
    productIds.length
      ? throwIfError(
          await supabase
            .from("textile_products")
            .select("product_id, product_name, description, iva, sublimation_price, embroidery_price")
            .in("product_id", productIds),
          "No fue posible cargar el catalogo de productos",
        )
      : [],
    productIds.length
      ? throwIfError(
          await supabase
            .from("textile_product_files")
            .select("*")
            .in("product_id", productIds)
            .order("created_at", { ascending: true }),
          "No fue posible cargar las imagenes de productos",
        )
      : [],
    sizeIds.length
      ? throwIfError(
          await supabase
            .from("sizes")
            .select("size_id, size_name")
            .in("size_id", sizeIds),
          "No fue posible cargar las tallas de los productos",
        )
      : [],
    throwIfError(
      await supabase
        .from("payments")
        .select("amount")
        .eq("production_order_id", order.production_order_id)
        .eq("is_valid", true),
      "No fue posible cargar los pagos de la orden",
    ),
    throwIfError(
      await supabase
        .from("production_order_status_history")
        .select(
          "history_id, previous_status, new_status, note, changed_by, created_at",
        )
        .eq("production_order_id", order.production_order_id)
        .order("created_at", { ascending: false }),
      "No fue posible cargar el historial de estados",
    ),
  ]);

  const productsById = indexRowsByKey(products, "product_id");
  const variantsById = indexRowsByKey(variants, "variant_id");
  const filesByProductId = groupRowsByKey(productFiles, "product_id");
  const sizesById = indexRowsByKey(sizes, "size_id");
  const amountPaid = payments.reduce((sum, payment) => sum + getNumber(payment.amount, 0), 0);
  const quotationEmbroideryAmount = getNumber(quotation.embroidery_amount, 0);
  const quotationSublimationAmount = getNumber(quotation.sublimation_amount, 0);

  const items = quoteProducts.map((item) => {
    const variant = variantsById[item.variant_id] || null;
    const product = variant ? productsById[variant.product_id] : null;
    const hasSublimation = item.has_sublimation === true;
    const hasEmbroidery = item.has_embroidery === true;
    const unitPrice = getNumber(item.unit_price, 0);
    const quantity = getNumber(item.quantity, 0);
    const ivaAmount = getNumber(item.iva_amount, 0);

    return {
      id: item.quote_product_id,
      quoteProductId: item.quote_product_id,
      quotationId: item.quotation_id,
      productId: variant?.product_id || product?.product_id || null,
      variantId: item.variant_id || null,
      gtin: variant?.gtin || null,
      name: product?.product_name || "Producto sin nombre",
      sku: variant?.sku || product?.sku || variant?.product_id || "Sin codigo",
      color: null,
      description: product?.description || "",
      imageUrl: getProductImageUrl(filesByProductId[variant?.product_id] || []),
      sizeName: sizesById[variant?.size_id]?.size_name || null,
      quantity,
      unitPrice,
      taxRate: getNumber(variant?.tax_rate, getNumber(product?.iva, 0)),
      ivaAmount,
      subtotal: unitPrice * quantity,
      total: unitPrice * quantity + ivaAmount,
      hasSublimation,
      hasEmbroidery,
      sublimationPrice: hasSublimation ? quotationSublimationAmount : 0,
      embroideryPrice: hasEmbroidery ? quotationEmbroideryAmount : 0,
    };
  });

  const total = getNumber(quotation.total, 0);
  const { balance, paymentStatus } = buildDerivedPaymentState(
    total,
    amountPaid,
    order.payment_status,
  );

  return {
    id: order.production_order_id,
    productionOrderId: order.production_order_id,
    code: order.production_order_code || "Sin codigo",
    quotationId: order.quotation_id,
    quotationNumber: quotation.quotation_number || "Sin cotizacion",
    productionStatus: order.production_order_status || "pendiente",
    paymentStatus,
    paymentMethod: quotation.payment_methods?.method_name || "No definido",
    paymentCondition: quotation.payment_conditions?.condition_name || "No definida",
    committedDeliveryDate: quotation.committed_delivery_date || null,
    unexpectedDeliveryDate: quotation.unexpected_delivery_date || null,
    nextPaymentDate: order.next_payment_date,
    statusChangeNote: order.status_change_note || "",
    statusChangedAt: order.status_changed_at,
    balance,
    amountPaid,
    overdueDays: getNumber(order.overdue_days, 0),
    penaltyAmount: getNumber(order.penalty_amount, 0),
    penaltyPercentage: getNumber(order.penalty_percentage, 0),
    totalOwed: balance + getNumber(order.penalty_amount, 0),
    paidAt: order.paid_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    total,
    embroideryAmount: quotationEmbroideryAmount,
    sublimationAmount: quotationSublimationAmount,
    itemsCount: items.length,
    notes: quotation.notes || "",
    statusHistory: (statusHistory || []).map((entry) => ({
      id: entry.history_id,
      previousStatus: entry.previous_status,
      newStatus: entry.new_status,
      note: entry.note,
      changedBy: entry.changed_by,
      createdAt: entry.created_at,
    })),
    items,
  };
}

/**
 * Actualiza el porcentaje de penalizacion de una orden de produccion.
 * Solo debe invocarse desde pantallas restringidas a usuarios internos
 * autorizados (ver src/utils/roles.js -> hasSystemAccess). La base de datos
 * tambien protege esta columna mediante un trigger que rechaza el cambio
 * si quien ejecuta la actualizacion es una cuenta de cliente.
 */
export async function updateProductionOrderPenaltyPercentage(
  productionOrderId,
  penaltyPercentage,
) {
  if (!productionOrderId) {
    throw new Error("Se requiere el identificador de la orden de produccion");
  }

  const numericPercentage = Number(penaltyPercentage);

  if (!Number.isFinite(numericPercentage)) {
    throw new Error("Ingrese un porcentaje valido.");
  }

  if (numericPercentage < 0) {
    throw new Error("El porcentaje no puede ser negativo.");
  }

  if (numericPercentage > 100) {
    throw new Error("El porcentaje no puede ser mayor a 100.");
  }

  const rounded = Math.round(numericPercentage * 100) / 100;

  await updateProductionOrderDetails(productionOrderId, {
    penaltyPercentage: rounded,
  });

  return rounded;
}

export async function updateProductionOrderDetails(productionOrderId, values = {}) {
  if (!productionOrderId) {
    throw new Error("Se requiere el identificador de la orden de produccion");
  }

  const updates = {};
  const quotationUpdates = {};
  let requiresQuotationUpdate = false;

  if (Object.prototype.hasOwnProperty.call(values, "committedDeliveryDate")) {
    quotationUpdates.committed_delivery_date = normalizeDateInput(values.committedDeliveryDate);
    requiresQuotationUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(values, "unexpectedDeliveryDate")) {
    quotationUpdates.unexpected_delivery_date = normalizeDateInput(values.unexpectedDeliveryDate);
    requiresQuotationUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(values, "nextPaymentDate")) {
    updates.next_payment_date = normalizeDateInput(values.nextPaymentDate);
  }

  if (Object.prototype.hasOwnProperty.call(values, "productionStatus")) {
    const status = String(values.productionStatus || "").trim().toLowerCase();

    if (!status) {
      throw new Error("Seleccione un estado de produccion valido.");
    }

    updates.production_order_status = status;
  }

  if (Object.prototype.hasOwnProperty.call(values, "statusChangeNote")) {
    updates.status_change_note = String(values.statusChangeNote || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(values, "penaltyPercentage")) {
    const numericPercentage = Number(values.penaltyPercentage);

    if (!Number.isFinite(numericPercentage)) {
      throw new Error("Ingrese un porcentaje de penalizacion valido.");
    }

    if (numericPercentage < 0) {
      throw new Error("El porcentaje de penalizacion no puede ser negativo.");
    }

    if (numericPercentage > 100) {
      throw new Error("El porcentaje de penalizacion no puede ser mayor a 100.");
    }

    updates.penalty_percentage = Math.round(numericPercentage * 100) / 100;
  }

  if (!Object.keys(updates).length && !requiresQuotationUpdate) {
    throw new Error("No hay cambios para guardar.");
  }

  updates.updated_at = new Date().toISOString();

  const shouldUpdateProductionOrder =
    Object.keys(updates).some((key) => key !== "updated_at") || !requiresQuotationUpdate;

  const updatedOrder = throwIfError(
    await (shouldUpdateProductionOrder
      ? supabase
          .from("production_orders")
          .update(updates)
          .eq("production_order_id", productionOrderId)
          .select(
            "production_order_id, quotation_id, production_order_status, payment_status, next_payment_date, status_change_note, status_changed_at, updated_at, penalty_percentage",
          )
          .maybeSingle()
      : supabase
          .from("production_orders")
          .select(
            "production_order_id, quotation_id, production_order_status, payment_status, next_payment_date, status_change_note, status_changed_at, updated_at, penalty_percentage",
          )
          .eq("production_order_id", productionOrderId)
          .maybeSingle()),
    shouldUpdateProductionOrder
      ? "No fue posible actualizar la orden de produccion"
      : "No fue posible cargar la orden de produccion",
  );

  let updatedQuotation = null;

  if (requiresQuotationUpdate) {
    if (!updatedOrder?.quotation_id) {
      throw new Error("No se encontro la cotizacion asociada a la orden de produccion.");
    }

    quotationUpdates.updated_at = new Date().toISOString();

    updatedQuotation = throwIfError(
      await supabase
        .from("quotations")
        .update(quotationUpdates)
        .eq("quotation_id", updatedOrder.quotation_id)
        .select("quotation_id, committed_delivery_date, unexpected_delivery_date")
        .maybeSingle(),
      "No fue posible actualizar las fechas de entrega de la cotizacion",
    );
  }

  const productionStatus = String(
    updatedOrder.production_order_status || "pendiente",
  ).toLowerCase();
  const paymentStatus = String(updatedOrder.payment_status || "pendiente").toLowerCase();

  return {
    productionOrderId: updatedOrder.production_order_id,
    committedDeliveryDate: updatedQuotation?.committed_delivery_date ?? null,
    unexpectedDeliveryDate: updatedQuotation?.unexpected_delivery_date ?? null,
    nextPaymentDate: updatedOrder.next_payment_date,
    statusChangeNote: updatedOrder.status_change_note || "",
    statusChangedAt: updatedOrder.status_changed_at,
    productionStatus,
    productionStatusLabel:
      PRODUCTION_STATUS_LABELS[productionStatus] || productionStatus,
    paymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
    penaltyPercentage: getNumber(updatedOrder.penalty_percentage, 0),
    updatedAt: updatedOrder.updated_at,
  };
}

export async function deleteProductionOrder(productionOrderId) {
  if (!productionOrderId) {
    throw new Error("No se encontro la orden de produccion a eliminar.");
  }

  const deactivatedOrder = throwIfError(
    await supabase
      .from("production_orders")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("production_order_id", productionOrderId)
      .eq("is_active", true)
      .select("production_order_id")
      .maybeSingle(),
    "No fue posible eliminar la orden de produccion",
  );

  if (!deactivatedOrder?.production_order_id) {
    throw new Error(
      "La orden de produccion ya no estaba activa o no se pudo eliminar.",
    );
  }

  return deactivatedOrder;
}
