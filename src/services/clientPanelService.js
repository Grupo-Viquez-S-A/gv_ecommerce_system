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

function getFileUrl(file) {
  return file?.public_url || file?.url || file?.file_url || null;
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
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

function normalizeProductItem(item, product, variant, files = [], sizeName = null) {
  const hasSublimation = item.has_sublimation === true;
  const hasEmbroidery = item.has_embroidery === true;

  return {
    id: item.quote_product_id,
    quoteProductId: item.quote_product_id,
    quotationId: item.quotation_id,
    productId: item.product_id,
    variantId: item.variant_id || null,
    gtin: item.snapshot_gtin || null,
    name: product?.product_name || product?.fabric_name || "Producto sin nombre",
    sku: item.snapshot_sku || variant?.sku || product?.sku || product?.fabric_code || item.product_id || "Sin codigo",
    color: item.snapshot_color || null,
    description: item.snapshot_description || product?.description || "",
    imageUrl: product?.image_url || product?.main_image_url || product?.cover_image_url || getProductImageUrl(files),
    sizeName: item.snapshot_size_name || sizeName,
    quantity: getNumber(item.quantity, 0),
    unitPrice: getNumber(item.snapshot_price, getNumber(item.unit_price, 0)),
    taxRate: getNumber(item.snapshot_tax_rate, 0),
    ivaAmount: getNumber(item.iva_amount, 0),
    subtotal: getNumber(item.subtotal, 0),
    total: getNumber(item.total, 0),
    hasSublimation,
    hasEmbroidery,
    sublimationPrice: hasSublimation ? getNumber(product?.sublimation_price, 0) : 0,
    embroideryPrice: hasEmbroidery ? getNumber(product?.embroidery_price, 0) : 0,
  };
}

async function getQuotationProducts(quotationIds = []) {
  if (!quotationIds.length) {
    return [];
  }

  const quoteProducts = throwIfError(
    await supabase
      .from("quote_products")
      .select(
        "quote_product_id, quotation_id, product_id, variant_id, size_id, snapshot_sku, snapshot_gtin, snapshot_size_id, snapshot_size_name, snapshot_color, snapshot_description, snapshot_price, snapshot_tax_rate, quantity, unit_price, iva_amount, subtotal, total, has_sublimation, has_embroidery, created_at, updated_at",
      )
      .in("quotation_id", quotationIds),
    "No fue posible cargar los productos cotizados",
  );

  const productIds = [...new Set(quoteProducts.map((item) => item.product_id).filter(Boolean))];
  const sizeIds = [...new Set(quoteProducts.map((item) => item.size_id).filter(Boolean))];
  const variantIds = [...new Set(quoteProducts.map((item) => item.variant_id).filter(Boolean))];

  const [products, variants, productFiles, sizes] = await Promise.all([
    productIds.length
      ? throwIfError(
          await supabase
            .from("textile_products")
            .select(
              "product_id, sku, product_name, description, price, iva, sublimation_price, embroidery_price",
            )
            .in("product_id", productIds),
          "No fue posible cargar el catalogo de productos",
        )
      : [],

    variantIds.length
      ? throwIfError(
          await supabase
            .from("textile_product_variants")
            .select("variant_id, sku, gtin, price, tax_rate:iva, stock:stock_quantity, minimum_stock")
            .in("variant_id", variantIds),
          "No fue posible cargar las variantes cotizadas",
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
  ]);

  const productsById = indexRowsByKey(products, "product_id");
  const variantsById = indexRowsByKey(variants, "variant_id");
  const filesByProductId = groupRowsByKey(productFiles, "product_id");
  const sizesById = indexRowsByKey(sizes, "size_id");

  return quoteProducts.map((item) =>
    normalizeProductItem(
      item,
      productsById[item.product_id],
      variantsById[item.variant_id],
      filesByProductId[item.product_id] || [],
      sizesById[item.size_id]?.size_name || null,
    ),
  );
}

async function getQuotationRelations(quotation) {
  const [business, branch, representative] = await Promise.all([
    quotation.business_id
      ? throwIfError(
          await supabase
            .from("businesses")
            .select("business_id, legal_id, legal_name, business_name, activity_code")
            .eq("business_id", quotation.business_id)
            .maybeSingle(),
          "No fue posible cargar el cliente",
        )
      : null,
    quotation.branch_id
      ? throwIfError(
          await supabase
            .from("branches")
            .select("branch_id, business_id, province, district, address")
            .eq("branch_id", quotation.branch_id)
            .maybeSingle(),
          "No fue posible cargar la sucursal",
        )
      : null,
    quotation.representative_id
      ? throwIfError(
          await supabase
            .from("representatives")
            .select("representative_id, business_id, branch_id, name, email")
            .eq("representative_id", quotation.representative_id)
            .maybeSingle(),
          "No fue posible cargar el representante",
        )
      : null,
  ]);

  return { business, branch, representative };
}

function normalizeQuotationDetail({ quotation, business, branch, representative, items }) {
  return {
    id: quotation.quotation_id,
    quotationId: quotation.quotation_id,
    number: quotation.quotation_number || "Sin numero",
    status: getQuotationStatus(quotation),
    notes: quotation.notes || "",
    createdAt: quotation.created_at,
    updatedAt: quotation.updated_at,
    validUntil: quotation.valid_until || null,
    itemsCount: items.length,
    subtotal: getNumber(quotation.subtotal, null) ?? getItemTotal(items),
    ivaAmount:
      getNumber(quotation.iva_amount, null) ??
      items.reduce((sum, item) => sum + getNumber(item.ivaAmount, 0), 0),
    total: getNumber(quotation.total, null) ?? getItemTotal(items),
    advancePayment:
      getNumber(quotation.advance_payment, null) ??
      (getNumber(quotation.total, null) ?? getItemTotal(items)) / 2,
    methodId: quotation.method_id || null,
    paymentMethod: quotation.payment_methods?.method_name || null,
    business: business
      ? {
          id: business.business_id,
          name: business.business_name || business.legal_name || "Cliente sin nombre",
          legalName: business.legal_name || "",
          legalId: business.legal_id || "",
          activityCode: business.activity_code || "",
        }
      : null,
    branch: branch
      ? {
          id: branch.branch_id,
          province: branch.province || "",
          district: branch.district || "",
          address: branch.address || "",
        }
      : null,
    representative: representative
      ? {
          id: representative.representative_id,
          name: representative.name || "Representante sin nombre",
          email: representative.email || "",
        }
      : null,
    items,
  };
}

export async function getAuthenticatedUser() {
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

  return {
    id: user.id,
    email: user.email || "",
  };
}

export async function getAuthenticatedUserId() {
  const user = await getAuthenticatedUser();

  return user.id;
}

const APPROVED_QUOTATION_STATES = ["approved", "Aprobada", "aprobada"];

async function getMyRepresentativeIds({ userId, email }) {
  const ownerFilters = [`user_id.eq.${userId}`];

  if (email) {
    ownerFilters.push(`email.ilike.${email}`);
  }

  const representatives = throwIfError(
    await supabase
      .from("representatives")
      .select("representative_id")
      .or(ownerFilters.join(","))
      .eq("is_active", true),
    "No fue posible cargar tu perfil de representante",
  );

  return representatives.map((representative) => representative.representative_id);
}


export async function acceptMyQuotation(quotationId) {
  const currentUser = await getAuthenticatedUser();
  const representativeIds = await getMyRepresentativeIds({
    userId: currentUser.id,
    email: currentUser.email,
  });

  if (!quotationId) {
    throw new Error("No se encontro la cotizacion seleccionada.");
  }

  const ownerFilters = [`user_id.eq.${currentUser.id}`];

  if (representativeIds.length) {
    ownerFilters.push(`representative_id.in.(${representativeIds.join(",")})`);
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select("quotation_id, state, is_active")
      .eq("quotation_id", quotationId)
      .or(ownerFilters.join(","))
      .in("state", APPROVED_QUOTATION_STATES)
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible validar la cotizacion",
  );

  if (!quotation) {
    throw new Error("No se encontro la cotizacion aprobada o no pertenece a tu usuario.");
  }

  const productionOrder = throwIfError(
    await supabase
      .from("production_orders")
      .select("production_order_id, production_order_code")
      .eq("quotation_id", quotationId)
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible validar la orden de produccion asociada",
  );

  if (!productionOrder) {
    throw new Error("La orden de produccion aun no ha sido generada por el area comercial.");
  }

  return {
    quotationId,
    productionOrderId: productionOrder.production_order_id,
    productionOrderCode: productionOrder.production_order_code,
  };
}

async function fetchOwnedQuotations({ statesFilter = null } = {}) {
  const currentUser = await getAuthenticatedUser();
  const representativeIds = await getMyRepresentativeIds({
    userId: currentUser.id,
    email: currentUser.email,
  });

  const ownerFilters = [`user_id.eq.${currentUser.id}`];

  if (representativeIds.length) {
    ownerFilters.push(`representative_id.in.(${representativeIds.join(",")})`);
  }

  let query = supabase
    .from("quotations")
    .select(
      "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, valid_until, user_id, iva_amount, subtotal, total, advance_payment, method_id, payment_methods:method_id ( method_id, method_name )",
    )
    .or(ownerFilters.join(","))
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (statesFilter) {
    query = query.in("state", statesFilter);
  }

  const quotations = throwIfError(await query, "No fue posible cargar tus cotizaciones");

  if (!quotations.length) {
    return [];
  }

  const quotationIds = quotations.map((quotation) => quotation.quotation_id);

  const quoteProducts = await getQuotationProducts(quotationIds);

  const productsByQuotationId = groupRowsByKey(quoteProducts, "quotationId");

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
      validUntil: quotation.valid_until || null,
      itemsCount: items.length,
      subtotal: getNumber(quotation.subtotal, null) ?? getItemTotal(items),
      ivaAmount:
        getNumber(quotation.iva_amount, null) ??
        items.reduce((sum, item) => sum + getNumber(item.ivaAmount, 0), 0),
      total: getNumber(quotation.total, null) ?? getItemTotal(items),
      advancePayment:
        getNumber(quotation.advance_payment, null) ??
        (getNumber(quotation.total, null) ?? getItemTotal(items)) / 2,
      methodId: quotation.method_id || null,
      paymentMethod: quotation.payment_methods?.method_name || null,
      items,
    };
  });
}

export async function getMyQuotations() {
  return fetchOwnedQuotations();
}

export async function getMyProductionOrders() {
  const myQuotations = await fetchOwnedQuotations();

  if (!myQuotations.length) {
    return [];
  }

  const quotationIds = myQuotations.map((quotation) => quotation.quotationId);

  const productionOrders = throwIfError(
    await supabase
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount, penalty_percentage, paid_at",
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
    paymentMethod: quotationsById[order.quotation_id]?.paymentMethod || "No definido",
    committedDeliveryDate: order.committed_delivery_date,
    unexpectedDeliveryDate: order.unexpected_delivery_date,
    nextPaymentDate: order.next_payment_date,
    balance: getNumber(order.balance, 0),
    overdueDays: getNumber(order.overdue_days, 0),
    penaltyAmount: getNumber(order.penalty_amount, 0),
    penaltyPercentage: getNumber(order.penalty_percentage, 0),
    totalOwed: getNumber(order.balance, 0) + getNumber(order.penalty_amount, 0),
    paidAt: order.paid_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  }));
}

export async function getMyQuotationDetail(quotationId) {
  const currentUser = await getAuthenticatedUser();
  const representativeIds = await getMyRepresentativeIds({
    userId: currentUser.id,
    email: currentUser.email,
  });

  if (!quotationId) {
    throw new Error("No se encontro la cotizacion seleccionada.");
  }

  const ownerFilters = [`user_id.eq.${currentUser.id}`];

  if (representativeIds.length) {
    ownerFilters.push(`representative_id.in.(${representativeIds.join(",")})`);
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, valid_until, user_id, iva_amount, subtotal, total, advance_payment, method_id, payment_methods:method_id ( method_id, method_name )",
      )
      .eq("quotation_id", quotationId)
      .or(ownerFilters.join(","))
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible cargar el detalle de la cotizacion",
  );

  if (!quotation) {
    throw new Error("No se encontro la cotizacion o no pertenece a tu usuario.");
  }

  const [{ business, branch, representative }, items] = await Promise.all([
    getQuotationRelations(quotation),
    getQuotationProducts([quotation.quotation_id]),
  ]);

  return normalizeQuotationDetail({
    quotation,
    business,
    branch,
    representative,
    items,
  });
}

export async function getMyOrderDetail(productionOrderId) {
  const currentUser = await getAuthenticatedUser();
  const representativeIds = await getMyRepresentativeIds({
    userId: currentUser.id,
    email: currentUser.email,
  });

  if (!productionOrderId) {
    throw new Error("No se encontro el pedido seleccionado.");
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
    "No fue posible cargar el detalle del pedido",
  );

  if (!order || !order.quotation_id) {
    throw new Error("No se encontro el pedido seleccionado.");
  }

  const ownerFilters = [`user_id.eq.${currentUser.id}`];

  if (representativeIds.length) {
    ownerFilters.push(`representative_id.in.(${representativeIds.join(",")})`);
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, user_id, method_id, payment_methods:method_id ( method_id, method_name )",
      )
      .eq("quotation_id", order.quotation_id)
      .or(ownerFilters.join(","))
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible validar la cotizacion relacionada",
  );

  if (!quotation) {
    throw new Error("El pedido no pertenece a una cotizacion de tu usuario.");
  }

  const [{ business, branch, representative }, items, payments] = await Promise.all([
    getQuotationRelations(quotation),
    getQuotationProducts([quotation.quotation_id]),
    throwIfError(
      await supabase
        .from("payments")
        .select("amount")
        .eq("production_order_id", order.production_order_id)
        .eq("is_valid", true),
      "No fue posible cargar los pagos del pedido",
    ),
  ]);

  const quotationDetail = normalizeQuotationDetail({
    quotation,
    business,
    branch,
    representative,
    items,
  });

  const amountPaid = payments.reduce(
    (sum, payment) => sum + getNumber(payment.amount, 0),
    0,
  );

  return {
    id: order.production_order_id,
    productionOrderId: order.production_order_id,
    code: order.production_order_code || "Sin codigo",
    quotationId: order.quotation_id,
    quotationNumber: quotationDetail.number,
    productionStatus: order.production_order_status || "pending",
    paymentStatus: order.payment_status || "pending",
    paymentMethod: quotationDetail.paymentMethod || "No definido",
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
    total: quotationDetail.total,
    itemsCount: quotationDetail.itemsCount,
    notes: quotationDetail.notes,
    business: quotationDetail.business,
    branch: quotationDetail.branch,
    representative: quotationDetail.representative,
    items: quotationDetail.items,
  };
}
