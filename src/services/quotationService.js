import { supabase } from "./primarySupabaseClient.js";
import {
  addBusinessDaysCRDateString,
  getTodayCRDateString,
} from "../utils/dateUtils.js";
import { normalizeQuotationPayload } from "../utils/quotationPayload.js";

const QUOTATION_VALIDITY_BUSINESS_DAYS = 15;

function getText(value) {
  const normalizedValue = String(value || "").trim();

  return normalizedValue || null;
}

function getNumber(value, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getDatePlusDays(days = QUOTATION_VALIDITY_BUSINESS_DAYS) {
  return addBusinessDaysCRDateString(days);
}

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data;
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

function createQuotationNumber(prefix = "COT") {
  const now = new Date();
  const date = getTodayCRDateString().replaceAll("-", "");
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(now)
    .replaceAll(":", "");

  return `${prefix}-${date}-${time}`;
}

const QUOTATION_STATUS_TO_DB = {
  Pendiente: "pending",
  pendiente: "pending",
  pending: "pending",
  "En revision": "review",
  "En revisión": "review",
  review: "review",
  Aprobada: "approved",
  aprobada: "approved",
  approved: "approved",
  Rechazada: "rejected",
  rechazada: "rejected",
  rejected: "rejected",
  Vencida: "expired",
  vencida: "expired",
  expired: "expired",
  Convertida: "converted",
  convertida: "converted",
  converted: "converted",
};

const QUOTATION_STATUS_TO_LABEL = {
  pending: "Pendiente",
  review: "En revision",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
  converted: "Convertida",
  Pendiente: "Pendiente",
  "En revision": "En revision",
  "En revisión": "En revision",
  Aprobada: "Aprobada",
  Rechazada: "Rechazada",
  Vencida: "Vencida",
  Convertida: "Convertida",
};

function getDbQuotationStatus(status) {
  return QUOTATION_STATUS_TO_DB[status] || "pending";
}

function getQuotationStatusLabel(status) {
  return QUOTATION_STATUS_TO_LABEL[status] || "Pendiente";
}

function formatProfileName(profile) {
  const fullName = [profile?.name, profile?.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile?.email || "Sin vendedor";
}

function getInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);

  return (
    words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "NA"
  );
}

function indexById(rows = [], keyName) {
  return rows.reduce((indexedRows, row) => {
    const key = row?.[keyName];

    if (key) {
      indexedRows[key] = row;
    }

    return indexedRows;
  }, {});
}

function groupById(rows = [], keyName) {
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

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

function getValidityDate(createdAt) {
  const date = normalizeDate(createdAt);

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return addBusinessDaysCRDateString(QUOTATION_VALIDITY_BUSINESS_DAYS, date);
}

function getQuotationTotal(items = []) {
  return items.reduce((total, item) => total + getNumber(item.total, 0), 0);
}

function getFileUrl(file) {
  return file?.public_url || file?.url || file?.file_url || null;
}

function normalizeFileText(value) {
  return String(value || "").toLowerCase();
}

function isImageFile(file) {
  const fileText = normalizeFileText(
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
  const fileText = normalizeFileText(
    [
      file?.file_type,
      file?.type,
      file?.file_name,
      file?.file_path,
      getFileUrl(file),
    ]
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
  const imageFile = files.find(
    (file) => isImageFile(file) && !isTechnicalSheetFile(file),
  );

  return getFileUrl(imageFile);
}

function getPrimaryValue(rows = [], valueKey) {
  const primaryRow = rows.find((row) => row.is_primary) || rows[0];

  return primaryRow?.[valueKey] || "";
}

function normalizeQuotation({
  quotation,
  business,
  branch,
  representative,
  seller,
  products,
  groupCompany,
}) {
  const sellerName = formatProfileName(seller);

  const items = products.map((item) => ({
    id: item.quote_product_id,
    quoteProductId: item.quote_product_id,
    productId: item.variant?.product_id || item.product?.product_id || null,
    variantId: item.variant_id || null,
    gtin: item.variant?.gtin || null,
    sku: item.variant?.sku || "Sin SKU",
    name: item.product?.product_name || "Producto sin nombre",
    description: item.product?.description || "",
    imageUrl:
      item.product?.image_url ||
      item.product?.main_image_url ||
      item.product?.cover_image_url ||
      getProductImageUrl(item.productFiles || []),
    sizeName: item.size?.size_name || null,
    color: null,
    quantity: getNumber(item.quantity, 0),
    unitPrice: getNumber(item.unit_price, 0),
    taxRate: getNumber(item.variant?.tax_rate, getNumber(item.product?.iva, 0)),
    ivaAmount: getNumber(item.iva_amount, 0),
    subtotal: getNumber(item.unit_price, 0) * getNumber(item.quantity, 0),
    total:
      getNumber(item.unit_price, 0) * getNumber(item.quantity, 0) +
      getNumber(item.iva_amount, 0),
    hasSublimation: item.has_sublimation === true,
    hasEmbroidery: item.has_embroidery === true,
    sublimationPrice:
      item.has_sublimation === true
        ? getNumber(item.product?.sublimation_price, 0)
        : 0,
    sublimationUnitPrice:
      item.has_sublimation === true
        ? getNumber(item.product?.sublimation_price, 0)
        : 0,
    embroideryPrice:
      item.has_embroidery === true
        ? getNumber(item.product?.embroidery_price, 0)
        : 0,
    embroideryUnitPrice:
      item.has_embroidery === true
        ? getNumber(item.product?.embroidery_price, 0)
        : 0,
  }));

  const itemsTotal = getQuotationTotal(items);
  const subtotal = getNumber(quotation.subtotal, null);
  const ivaAmount = getNumber(quotation.iva_amount, null);
  const total = getNumber(quotation.total, null);
  const embroideryAmount = getNumber(
    quotation.embroidery_amount,
    items.reduce(
      (sum, item) =>
        sum +
        (item.hasEmbroidery
          ? getNumber(item.embroideryUnitPrice, 0) * getNumber(item.quantity, 0)
          : 0),
      0,
    ),
  );
  const sublimationAmount = getNumber(
    quotation.sublimation_amount,
    items.reduce(
      (sum, item) =>
        sum +
        (item.hasSublimation
          ? getNumber(item.sublimationUnitPrice, 0) * getNumber(item.quantity, 0)
          : 0),
      0,
    ),
  );

  return {
    id: quotation.quotation_id,
    quotationId: quotation.quotation_id,
    number: quotation.quotation_number || "Sin numero",

    client: representative?.name || business?.business_name || "Sin cliente",
    company: business?.business_name || business?.legal_name || "Sin empresa",
    legalName: business?.legal_name || "",
    legalId: business?.legal_id || "",
    activityCode: business?.activity_code || "",

    date: quotation.created_at,
    validity: quotation.valid_until || getValidityDate(quotation.created_at),
    validUntil: quotation.valid_until,
    committedDeliveryDate: quotation.committed_delivery_date || null,
    unexpectedDeliveryDate: quotation.unexpected_delivery_date || null,

    earlyDelivery: quotation.early_delivery === true,
    earlyDeliveryDate: quotation.early_delivery_date || null,
    earlyDeliveryPrice: getNumber(quotation.early_delivery_price, 0),

    subtotal: subtotal !== null ? subtotal : itemsTotal,
    ivaAmount:
      ivaAmount !== null
        ? ivaAmount
        : items.reduce((sum, item) => sum + getNumber(item.ivaAmount, 0), 0),
    total: total !== null ? total : itemsTotal,
    discountPercentage: getNumber(quotation.discount_percentage, 0),
    discountAmount: getNumber(quotation.discount_amount, 0),
    embroideryAmount,
    sublimationAmount,
    advancePayment:
      getNumber(quotation.advance_payment, null) !== null
        ? getNumber(quotation.advance_payment, 0)
        : (total !== null ? total : itemsTotal) / 2,
    advancePercentage:
      getNumber(quotation.advance_percentage, null) !== null
        ? getNumber(quotation.advance_percentage, 0)
        : (total !== null ? total : itemsTotal) > 0
          ? (getNumber(quotation.advance_payment, 0) / (total !== null ? total : itemsTotal)) * 100
          : 0,
    methodId: quotation.method_id || null,
    paymentMethod: quotation.payment_methods?.method_name || null,
    status: getQuotationStatusLabel(quotation.state || quotation.status),
    dbStatus: quotation.state || quotation.status || "pending",

    agent: sellerName,
    avatar: getInitials(sellerName),
    notes: quotation.notes || "",

    business,
    groupCompany: groupCompany
      ? {
          id: groupCompany.company_id,
          legalId: groupCompany.legal_id || "",
          name: groupCompany.company_name || "",
          commercialName: groupCompany.commercial_name || "",
          email: groupCompany.email || "",
          address: groupCompany.address || "",
          phones: Array.isArray(groupCompany.phones) ? groupCompany.phones : [],
        }
      : null,
    branch,
    representative,
    seller,
    items,
  };
}

async function insertPhone(phonePayload, createdPhoneIds) {
  if (!phonePayload.phone) {
    return;
  }

  const response = await supabase
    .from("phones")
    .insert(phonePayload)
    .select("phone_id")
    .single();

  const phone = throwIfError(response, "No fue posible guardar un telefono");

  createdPhoneIds.push(phone.phone_id);
}

async function rollbackQuotation({
  quotationId,
  businessId,
  phoneIds,
}) {
  try {
    if (quotationId) {
      await supabase
        .from("quote_products")
        .delete()
        .eq("quotation_id", quotationId);

      await supabase
        .from("quotations")
        .delete()
        .eq("quotation_id", quotationId);
    }

    if (phoneIds.length > 0) {
      await supabase.from("phones").delete().in("phone_id", phoneIds);
    }

    if (businessId) {
      await supabase.from("emails").delete().eq("customer_id", businessId);

      await supabase
        .from("customers")
        .delete()
        .eq("customer_id", businessId);
    }
  } catch (rollbackError) {
    console.error(
      "No fue posible revertir la cotizacion parcial:",
      rollbackError,
    );
  }
}

export async function getPaymentMethods() {
  const paymentMethods = throwIfError(
    await supabase
      .from("payment_methods")
      .select("method_id, method_name, description, is_active")
      .eq("is_active", true)
      .order("method_name", { ascending: true }),
    "No fue posible cargar los metodos de pago",
  );

  return paymentMethods || [];
}

export async function reportPayment({
  quotationId,
  methodId,
  amount,
  paymentDate,
  referenceNumber,
  notes,
  receiptFile,
}) {
  const refreshResult = await supabase.auth.refreshSession();
  console.log("[reportPayment] refreshSession:", {
    refreshError: refreshResult.error?.message || null,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const authUserId = session?.user?.id || null;

  console.log("[reportPayment] session info:", {
    hasSession: !!session,
    authUserId,
    userEmail: session?.user?.email || null,
  });

  if (!authUserId) {
    throw new Error("Debes iniciar sesion para reportar un pago.");
  }

  const orders = throwIfError(
    await supabase
      .from("production_orders")
      .select("production_order_id")
      .eq("quotation_id", quotationId)
      .eq("is_active", true)
      .limit(1),
    "No fue posible encontrar la orden de produccion",
  );

  if (!orders?.length) {
    throw new Error(
      "No existe una orden de produccion activa para esta cotizacion",
    );
  }

  const productionOrderId = orders[0].production_order_id;

  const paymentResult = throwIfError(
    await supabase.rpc("insert_payment", {
      p_production_order_id: productionOrderId,
      p_method_id: methodId,
      p_amount: Number(amount),
      p_payment_date: paymentDate,
      p_reference_number: referenceNumber || null,
      p_notes: notes || null,
      p_created_by: authUserId,
    }),
    "No fue posible registrar el pago",
  );

  const paymentId = paymentResult;

  if (receiptFile) {
    const fileExt = receiptFile.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `Comprobantes/${fileName}`;

    const uploadResult = await supabase.storage
      .from("Ecommerce")
      .upload(filePath, receiptFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(
        `No fue posible subir el comprobante: ${uploadResult.error.message}`,
      );
    }

    throwIfError(
      await supabase.rpc("insert_payment_receipt", {
        p_payment_id: paymentId,
        p_bucket_name: "Ecommerce",
        p_folder_name: "Comprobantes",
        p_object_path: uploadResult.data.path,
        p_file_name: receiptFile.name,
        p_mime_type: receiptFile.type,
        p_file_size: receiptFile.size,
        p_created_by: authUserId,
      }),
      "No fue posible registrar el comprobante",
    );
  }

  return { paymentId, productionOrderId };
}

export async function getQuotationCompanies() {
  const response = await supabase
    .from("companies")
    .select("company_id, company_name, commercial_name, is_active")
    .eq("is_active", true)
    .order("company_name", { ascending: true });

  return throwIfError(response, "No fue posible cargar las empresas del grupo");
}

export async function getQuotationClientByLegalId(legalId) {
  const normalizedLegalId = getText(legalId);

  if (!normalizedLegalId) {
    return null;
  }

  const customer = throwIfError(
    await supabase
      .from("customers")
      .select(
        "customer_id, company_id, identification_type, legal_id, company_name, owner_name, commercial_name, activity_code, province, city, district, address, latitude, longitude, location_accuracy_meters, is_active",
      )
      .eq("legal_id", normalizedLegalId)
      .maybeSingle(),
    "No fue posible buscar el cliente por identificación",
  );

  if (!customer) {
    return null;
  }

  const [emails, customerPhones] = await Promise.all([
    throwIfError(
      await supabase
        .from("emails")
        .select("email_id, customer_id, email, type, is_primary, created_at")
        .eq("customer_id", customer.customer_id),
      "No fue posible cargar los correos del cliente",
    ),

    throwIfError(
      await supabase
        .from("phones")
        .select("phone_id, customer_id, phone, type, is_primary, created_at")
        .eq("customer_id", customer.customer_id),
      "No fue posible cargar los telefonos del cliente",
    ),
  ]);

  return {
    businessId: customer.customer_id,
    branchId: "",
    representativeId: "",

    companyId: customer.company_id || "",
    identificationType:
      customer.identification_type === "personal" ? "personal" : "legal",
    legalId: customer.legal_id || normalizedLegalId,
    legalName: customer.company_name || "",
    ownerName: customer.owner_name || "",
    businessName: customer.commercial_name || customer.company_name || "",
    activityCode: customer.activity_code || "",

    businessEmail: getPrimaryValue(emails, "email"),
    businessPhone: getPrimaryValue(customerPhones, "phone"),

    branchProvince: customer.province || "",
    branchCity: customer.city || "",
    branchDistrict: customer.district || "",
    branchAddress: customer.address || "",
    branchPhone: getPrimaryValue(customerPhones, "phone"),
    branchLatitude: customer.latitude ?? "",
    branchLongitude: customer.longitude ?? "",
    branchLocationAccuracy: customer.location_accuracy_meters ?? "",

    representativeName: "",
    representativeEmail: "",
    representativeUserId: null,

    allBranches: [],
  };
}

export async function getQuotations({ ownerUserId } = {}) {
  let quotationsQuery = supabase
    .from("quotations")
    .select(
      `
        quotation_id,
        company_id,
        customer_id,
        quotation_number,
        status,
        state,
        notes,
        is_active,
        created_at,
        updated_at,
        user_id,
        early_delivery,
        early_delivery_date,
        early_delivery_price,
        valid_until,
        committed_delivery_date,
        unexpected_delivery_date,
        embroidery_amount,
        sublimation_amount,
        iva_amount,
        subtotal,
        total,
        advance_payment,
        advance_percentage,
        discount_percentage,
        discount_amount,
        method_id,
        payment_methods:method_id (
          method_id,
          method_name
        )
      `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (ownerUserId) {
    quotationsQuery = quotationsQuery.eq("user_id", ownerUserId);
  }

  const quotations = throwIfError(
    await quotationsQuery,
    "No fue posible cargar las cotizaciones",
  );

  if (!quotations.length) {
    return [];
  }

  const customerIds = [
    ...new Set(quotations.map((item) => item.customer_id).filter(Boolean)),
  ];

  const sellerIds = [
    ...new Set(quotations.map((item) => item.user_id).filter(Boolean)),
  ];

  const quotationIds = quotations.map((item) => item.quotation_id);

  const [customers, sellers, quoteProducts] =
    await Promise.all([
      customerIds.length
        ? throwIfError(
            await supabase
              .from("customers")
              .select(
                "customer_id, company_id, legal_id, company_name, commercial_name, activity_code, province, city, district, address, latitude, longitude, location_accuracy_meters, is_active",
              )
              .in("customer_id", customerIds),
            "No fue posible cargar los clientes de las cotizaciones",
          )
        : [],

      sellerIds.length
        ? throwIfError(
            await supabase
              .from("profiles")
              .select("user_id, name, surname, email, phone, is_active")
              .in("user_id", sellerIds),
            "No fue posible cargar los vendedores de las cotizaciones",
          )
        : [],

      throwIfError(
        await supabase
          .from("quote_products")
          .select(
            "quote_product_id, quotation_id, variant_id, quantity, unit_price, iva_amount, has_sublimation, has_embroidery",
          )
          .in("quotation_id", quotationIds),
        "No fue posible cargar los productos de las cotizaciones",
      ),
    ]);

  const variantIds = [
    ...new Set(quoteProducts.map((item) => item.variant_id).filter(Boolean)),
  ];

  const variants = variantIds.length
    ? throwIfError(
        await supabase
          .from("textiles_inventory")
          .select("variant_id, product_id, sku, gtin, size_id, price, tax_rate:iva, stock:stock_quantity, minimum_stock, is_active")
          .in("variant_id", variantIds),
        "No fue posible cargar las variantes cotizadas",
      )
    : [];

  const productIds = [
    ...new Set(variants.map((item) => item.product_id).filter(Boolean)),
  ];

  const sizeIds = [
    ...new Set(variants.map((item) => item.size_id).filter(Boolean)),
  ];

  const [products, productFiles, sizes] = await Promise.all([
    productIds.length
      ? throwIfError(
          await supabase
            .from("textile_products")
            .select(
              "product_id, product_name, description, iva, sublimation_price, embroidery_price",
            )
            .in("product_id", productIds),
          "No fue posible cargar el catalogo de productos cotizados",
        )
      : [],

    productIds.length
      ? throwIfError(
          await supabase
            .from("textile_product_files")
            .select("*")
            .in("product_id", productIds)
            .order("created_at", { ascending: true }),
          "No fue posible cargar las imagenes de productos cotizados",
        )
      : [],

    sizeIds.length
      ? throwIfError(
          await supabase
            .from("sizes")
            .select("size_id, size_name")
            .in("size_id", sizeIds),
          "No fue posible cargar las tallas de los productos cotizados",
        )
      : [],
  ]);

  const customersById = indexById(customers, "customer_id");
  const companyIds = [
    ...new Set(
      [
        ...quotations.map((item) => item.company_id),
        ...customers.map((item) => item.company_id),
      ].filter(Boolean),
    ),
  ];
  const [companies, companyPhones] = await Promise.all([
    companyIds.length
      ? throwIfError(
          await supabase
            .from("companies")
            .select(
              "company_id, legal_id, company_name, commercial_name, email, address, is_active",
            )
            .in("company_id", companyIds),
          "No fue posible cargar las empresas emisoras de las cotizaciones",
        )
      : [],

    companyIds.length
      ? throwIfError(
          await supabase
            .from("phones")
            .select("phone_id, company_id, phone, type, is_primary")
            .in("company_id", companyIds),
          "No fue posible cargar los telefonos de las empresas emisoras",
        )
      : [],
  ]);
  const phonesByCompanyId = groupById(companyPhones, "company_id");
  companies.forEach((company) => {
    company.phones = phonesByCompanyId[company.company_id] || [];
  });
  const companiesById = indexById(companies, "company_id");
  const sellersById = indexById(sellers, "user_id");
  const productsById = indexById(products, "product_id");
  const variantsById = indexById(variants, "variant_id");
  const productFilesById = groupById(productFiles, "product_id");
  const sizesById = indexById(sizes, "size_id");
  const quoteProductsByQuotationId = groupById(quoteProducts, "quotation_id");

  return quotations.map((quotation) => {
    const customer = customersById[quotation.customer_id];
    const quotationProducts = (
      quoteProductsByQuotationId[quotation.quotation_id] || []
    ).map((item) => ({
      ...item,
      product: productsById[variantsById[item.variant_id]?.product_id] || null,
      variant: variantsById[item.variant_id] || null,
      productFiles: productFilesById[variantsById[item.variant_id]?.product_id] || [],
      size: sizesById[variantsById[item.variant_id]?.size_id] || null,
    }));

    return normalizeQuotation({
      quotation,
      business: customer
        ? {
            ...customer,
            business_id: customer.customer_id,
            legal_name: customer.company_name,
            business_name: customer.commercial_name,
          }
        : null,
      groupCompany:
        companiesById[quotation.company_id] || companiesById[customer?.company_id],
      branch: customer
        ? {
            province: customer.province || "",
            city: customer.city || "",
            district: customer.district || "",
            address: customer.address || "",
            latitude: customer.latitude,
            longitude: customer.longitude,
            location_accuracy_meters: customer.location_accuracy_meters,
          }
        : null,
      representative: null,
      seller: sellersById[quotation.user_id],
      products: quotationProducts,
    });
  });
}

export async function updateQuotationStatus(quotationId, status) {
  if (!quotationId) {
    throw new Error("No se encontro la cotizacion a actualizar.");
  }

  return throwIfError(
    await supabase
      .from("quotations")
      .update({
        state: getDbQuotationStatus(status),
        updated_at: new Date().toISOString(),
      })
      .eq("quotation_id", quotationId)
      .select("quotation_id, state")
      .single(),
    "No fue posible actualizar el estado de la cotizacion",
  );
}

export async function createBusinessQuotation(payload) {
  const normalizedPayload = normalizeQuotationPayload(payload, {
    getDbQuotationStatus,
  });
  const { client, items, status } = normalizedPayload;

  let businessId = client.businessId || null;

  let quotationId = null;
  let createdBusinessId = null;

  if (client.earlyDelivery && !client.earlyDeliveryDate) {
    throw new Error("Selecciona la fecha solicitada para la entrega anticipada.");
  }

  const earlyDeliveryDate = client.earlyDelivery ? client.earlyDeliveryDate : null;

  const validUntil = client.validUntil || getDatePlusDays();

  const createdPhoneIds = [];

  try {
    if (!businessId && client.legalId) {
      const existingClient = await getQuotationClientByLegalId(client.legalId);

      if (existingClient?.businessId) {
        businessId = existingClient.businessId;
      }
    }

    if (!businessId) {
      const businessResponse = await supabase
        .from("customers")
        .insert({
          company_id: client.companyId,
          identification_type: client.identificationType,
          legal_id: client.legalId,
          company_name: client.legalName,
          owner_name: client.ownerName,
          commercial_name: client.businessName,
          activity_code: client.activityCode,
          regime: "general",
          province: client.branchProvince || "",
          city: client.branchCity || "",
          district: client.branchDistrict || "",
          address: client.branchAddress,
          latitude: client.branchLatitude,
          longitude: client.branchLongitude,
          location_accuracy_meters: client.branchLocationAccuracy,
          "isValidForCredit": "pending",
          is_active: true,
        })
        .select("customer_id")
        .single();

      const customer = throwIfError(
        businessResponse,
        "No fue posible crear el cliente",
      );

      businessId = customer.customer_id;
      createdBusinessId = businessId;

      if (client.businessEmail) {
        throwIfError(
          await supabase.from("emails").insert({
            customer_id: businessId,
            email: client.businessEmail,
            type: "Principal",
            is_primary: true,
          }),
          "No fue posible guardar el correo del cliente",
        );
      }

      await insertPhone(
        {
          customer_id: businessId,
          company_id: null,
          phone: client.businessPhone,
          type: "Principal",
          is_primary: true,
        },
        createdPhoneIds,
      );
    } else {
      throwIfError(
        await supabase
          .from("customers")
          .update({
            company_id: client.companyId,
            identification_type: client.identificationType,
            company_name: client.legalName,
            owner_name: client.ownerName,
            commercial_name: client.businessName,
            activity_code: client.activityCode,
            province: client.branchProvince || "",
            city: client.branchCity || "",
            district: client.branchDistrict || "",
            address: client.branchAddress,
            latitude: client.branchLatitude,
            longitude: client.branchLongitude,
            location_accuracy_meters: client.branchLocationAccuracy,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("customer_id", businessId),
        "No fue posible actualizar la empresa del grupo del cliente",
      );
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const ivaAmount = items.reduce((sum, item) => sum + item.iva_amount, 0);
    const total = subtotal + ivaAmount;
    const advancePercentage = Math.min(
      100,
      Math.max(0, getNumber(client.advancePercentage, 50)),
    );
    const advancePayment = total * (advancePercentage / 100);

    const quotationResponse = await supabase
      .from("quotations")
      .insert({
        company_id: client.companyId,
        customer_id: businessId,
        quotation_number: createQuotationNumber("COT"),
        state: status,
        notes: client.notes,
        is_active: true,
        early_delivery: client.earlyDelivery,
        early_delivery_date: earlyDeliveryDate,
        valid_until: validUntil,
        subtotal,
        iva_amount: ivaAmount,
        total,
        advance_payment: advancePayment,
        advance_percentage: advancePercentage,
        method_id: client.methodId || null,
      })
      .select(
        `
        quotation_id,
        company_id,
        quotation_number,
        early_delivery,
        early_delivery_date,
        valid_until,
        subtotal,
        iva_amount,
        total,
        advance_payment,
        advance_percentage,
        method_id
      `,
      )
      .single();

    const quotation = throwIfError(
      quotationResponse,
      "No fue posible crear la cotizacion",
    );

    quotationId = quotation.quotation_id;

    throwIfError(
      await supabase.from("quote_products").insert(
        items.map((item) => ({
          quotation_id: quotationId,
          ...item,
        })),
      ),
      "No fue posible guardar los productos cotizados",
    );

    return {
      businessId,
      branchId: "",
      representativeId: "",
      quotationId,
      quotationNumber: quotation.quotation_number,
      earlyDelivery: quotation.early_delivery,
      earlyDeliveryDate: quotation.early_delivery_date,
      validUntil: quotation.valid_until,
      methodId: quotation.method_id,
      advancePercentage: getNumber(quotation.advance_percentage, advancePercentage),
      accessError: null,
      representativeAccessMessage: null,
    };
  } catch (error) {
    await rollbackQuotation({
      quotationId,
      businessId: createdBusinessId,
      phoneIds: createdPhoneIds,
    });

    throw error;
  }
}
