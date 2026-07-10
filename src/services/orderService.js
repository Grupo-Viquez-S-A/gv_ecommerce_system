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
      "production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount, penalty_percentage, paid_at",
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
      penaltyPercentage: getNumber(order.penalty_percentage, 0),
      totalOwed: getNumber(order.balance, 0) + getNumber(order.penalty_amount, 0),
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
        "production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount, penalty_percentage, paid_at",
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
        "quotation_id, business_id, branch_id, representative_id, user_id, quotation_number, status, state, notes, is_active, created_at, updated_at, total, method_id, payment_methods:method_id ( method_id, method_name )",
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
        "quote_product_id, quotation_id, product_id, size_id, quantity, unit_price, iva_amount, subtotal, total, has_sublimation, has_embroidery",
      )
      .eq("quotation_id", quotation.quotation_id),
    "No fue posible cargar los productos de la orden",
  );

  const productIds = [...new Set(quoteProducts.map((item) => item.product_id).filter(Boolean))];
  const sizeIds = [...new Set(quoteProducts.map((item) => item.size_id).filter(Boolean))];

  const [products, productFiles, sizes, payments] = await Promise.all([
    productIds.length
      ? throwIfError(
          await supabase
            .from("textile_products")
            .select("product_id, sku, product_name, description, price, iva, sublimation_price, embroidery_price")
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
  ]);

  const productsById = indexRowsByKey(products, "product_id");
  const filesByProductId = groupRowsByKey(productFiles, "product_id");
  const sizesById = indexRowsByKey(sizes, "size_id");
  const amountPaid = payments.reduce((sum, payment) => sum + getNumber(payment.amount, 0), 0);

  const items = quoteProducts.map((item) => {
    const product = productsById[item.product_id];
    const hasSublimation = item.has_sublimation === true;
    const hasEmbroidery = item.has_embroidery === true;

    return {
      id: item.quote_product_id,
      quoteProductId: item.quote_product_id,
      quotationId: item.quotation_id,
      productId: item.product_id,
      name: product?.product_name || "Producto sin nombre",
      sku: product?.sku || item.product_id || "Sin codigo",
      description: product?.description || "",
      imageUrl: getProductImageUrl(filesByProductId[item.product_id] || []),
      sizeName: sizesById[item.size_id]?.size_name || null,
      quantity: getNumber(item.quantity, 0),
      unitPrice: getNumber(item.unit_price, 0),
      ivaAmount: getNumber(item.iva_amount, 0),
      subtotal: getNumber(item.subtotal, 0),
      total: getNumber(item.total, 0),
      hasSublimation,
      hasEmbroidery,
      sublimationPrice: hasSublimation ? getNumber(product?.sublimation_price, 0) : 0,
      embroideryPrice: hasEmbroidery ? getNumber(product?.embroidery_price, 0) : 0,
    };
  });

  return {
    id: order.production_order_id,
    productionOrderId: order.production_order_id,
    code: order.production_order_code || "Sin codigo",
    quotationId: order.quotation_id,
    quotationNumber: quotation.quotation_number || "Sin cotizacion",
    productionStatus: order.production_order_status || "pendiente",
    paymentStatus: order.payment_status || "pendiente",
    paymentMethod: quotation.payment_methods?.method_name || "No definido",
    committedDeliveryDate: order.committed_delivery_date,
    unexpectedDeliveryDate: order.unexpected_delivery_date,
    nextPaymentDate: order.next_payment_date,
    balance: getNumber(order.balance, 0),
    amountPaid,
    overdueDays: getNumber(order.overdue_days, 0),
    penaltyAmount: getNumber(order.penalty_amount, 0),
    penaltyPercentage: getNumber(order.penalty_percentage, 0),
    totalOwed: getNumber(order.balance, 0) + getNumber(order.penalty_amount, 0),
    paidAt: order.paid_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    total: getNumber(quotation.total, 0),
    itemsCount: items.length,
    notes: quotation.notes || "",
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

  throwIfError(
    await supabase
      .from("production_orders")
      .update({ penalty_percentage: rounded })
      .eq("production_order_id", productionOrderId),
    "No fue posible actualizar el porcentaje de penalizacion",
  );

  return rounded;
}
