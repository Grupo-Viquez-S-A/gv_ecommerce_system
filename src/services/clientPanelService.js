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

function normalizeProductItem(item, product, files = [], sizeName = null) {
  const hasSublimation = item.has_sublimation === true;
  const hasEmbroidery = item.has_embroidery === true;

  return {
    id: item.quote_product_id,
    quoteProductId: item.quote_product_id,
    quotationId: item.quotation_id,
    productId: item.product_id,
    name: product?.product_name || product?.fabric_name || "Producto sin nombre",
    sku: product?.sku || product?.fabric_code || item.product_id || "Sin codigo",
    imageUrl: product?.image_url || product?.main_image_url || product?.cover_image_url || getProductImageUrl(files),
    sizeName,
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
}

async function getQuotationProducts(quotationIds = []) {
  if (!quotationIds.length) {
    return [];
  }

  const quoteProducts = throwIfError(
    await supabase
      .from("quote_products")
      .select(
        "quote_product_id, quotation_id, product_id, size_id, quantity, unit_price, iva_amount, subtotal, total, has_sublimation, has_embroidery, created_at, updated_at",
      )
      .in("quotation_id", quotationIds),
    "No fue posible cargar los productos cotizados",
  );

  const productIds = [...new Set(quoteProducts.map((item) => item.product_id).filter(Boolean))];
  const sizeIds = [...new Set(quoteProducts.map((item) => item.size_id).filter(Boolean))];

  const [products, productFiles, sizes] = await Promise.all([
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
  const filesByProductId = groupRowsByKey(productFiles, "product_id");
  const sizesById = indexRowsByKey(sizes, "size_id");

  return quoteProducts.map((item) =>
    normalizeProductItem(
      item,
      productsById[item.product_id],
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

const APPROVED_QUOTATION_STATES = ["approved", "Aprobada", "aprobada"];

async function getMyRepresentativeIds(userId) {
  const representatives = throwIfError(
    await supabase
      .from("representatives")
      .select("representative_id")
      .eq("user_id", userId)
      .eq("is_active", true),
    "No fue posible cargar tu perfil de representante",
  );

  return representatives.map((representative) => representative.representative_id);
}

export async function getMyQuotations() {
  const userId = await getAuthenticatedUserId();
  const representativeIds = await getMyRepresentativeIds(userId);

  const ownerFilters = [`user_id.eq.${userId}`];

  if (representativeIds.length) {
    ownerFilters.push(`representative_id.in.(${representativeIds.join(",")})`);
  }

  const quotations = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, valid_until, user_id, iva_amount, subtotal, total, advance_payment",
      )
      .or(ownerFilters.join(","))
      .in("state", APPROVED_QUOTATION_STATES)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    "No fue posible cargar tus cotizaciones",
  );

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

export async function getMyQuotationDetail(quotationId) {
  const userId = await getAuthenticatedUserId();
  const representativeIds = await getMyRepresentativeIds(userId);

  if (!quotationId) {
    throw new Error("No se encontro la cotizacion seleccionada.");
  }

  const ownerFilters = [`user_id.eq.${userId}`];

  if (representativeIds.length) {
    ownerFilters.push(`representative_id.in.(${representativeIds.join(",")})`);
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, valid_until, user_id, iva_amount, subtotal, total, advance_payment",
      )
      .eq("quotation_id", quotationId)
      .or(ownerFilters.join(","))
      .in("state", APPROVED_QUOTATION_STATES)
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
  const userId = await getAuthenticatedUserId();

  if (!productionOrderId) {
    throw new Error("No se encontro el pedido seleccionado.");
  }

  const order = throwIfError(
    await supabase
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, payment_method, next_payment_date, is_active, created_at, updated_at",
      )
      .eq("production_order_id", productionOrderId)
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible cargar el detalle del pedido",
  );

  if (!order) {
    throw new Error("No se encontro el pedido seleccionado.");
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, user_id",
      )
      .eq("quotation_id", order.quotation_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    "No fue posible validar la cotizacion relacionada",
  );

  if (!quotation) {
    throw new Error("El pedido no pertenece a una cotizacion de tu usuario.");
  }

  const [{ business, branch, representative }, items] = await Promise.all([
    getQuotationRelations(quotation),
    getQuotationProducts([quotation.quotation_id]),
  ]);

  const quotationDetail = normalizeQuotationDetail({
    quotation,
    business,
    branch,
    representative,
    items,
  });

  return {
    id: order.production_order_id,
    productionOrderId: order.production_order_id,
    code: order.production_order_code || "Sin codigo",
    quotationId: order.quotation_id,
    quotationNumber: quotationDetail.number,
    productionStatus: order.production_order_status || "pending",
    paymentStatus: order.payment_status || "pending",
    paymentMethod: order.payment_method || "No definido",
    committedDeliveryDate: order.committed_delivery_date,
    unexpectedDeliveryDate: order.unexpected_delivery_date,
    nextPaymentDate: order.next_payment_date,
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
