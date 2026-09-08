import { supabase } from "./primarySupabaseClient.js";
import {
  addBusinessDaysCRDateString,
  getTodayCRDateString,
} from "../utils/dateUtils.js";
import { normalizeQuotationPayload } from "../utils/quotationPayload.js";
import { getCurrentCustomerRouteAssignment } from "./customerRouteAssignmentService.js";
import { getQuotationAdvancePercentageForItems } from "../utils/quotationAdvanceRules.js";
import {
  getPrimaryClientLocation,
  saveBusinessClientPrimaryLocation,
} from "./clientService.js";
import {
  createPaymentReceiptPngBlob,
  downloadPaymentReceiptBlob,
} from "../utils/paymentReceiptImage.js";

const QUOTATION_VALIDITY_BUSINESS_DAYS = 15;
const PAYMENT_FILES_BUCKET = "Ecommerce";
const PAYMENT_PROOF_FOLDER = "Comprobantes/Pagos";
const PAYMENT_RECEIPT_FOLDER = "Comprobantes/RecibosDinero";
const CUSTOMER_LOCATION_RELATION_SELECT = `
  locations!locations_customer_id_fkey(
    location_id,
    business_id:customer_id,
    country_id,
    province_id,
    canton_id,
    district_id,
    location,
    latitude,
    longitude,
    location_accuracy_meters,
    is_primary,
    is_active,
    created_at,
    updated_at,
    country:countries!locations_country_id_fkey(country_id, country_code, country_name),
    province:provinces!locations_province_id_fkey(province_id, province_code, province_name),
    canton:cantons!locations_canton_id_fkey(canton_id, canton_code, canton_name),
    district:districts!locations_district_id_fkey(district_id, district_code, district_name)
  )
`;

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

function normalizeDateInput(value) {
  const text = String(value || "").trim();

  return text || null;
}

function sanitizeFileSegment(value, fallback = "archivo") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || fallback;
}

function getFileExtension(fileName = "", fallback = "bin") {
  const extension = String(fileName).split(".").pop();

  return sanitizeFileSegment(extension || fallback, fallback).toLowerCase();
}

function getPublicStorageUrl(bucketName, filePath) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data?.publicUrl || "";
}

async function uploadPaymentFile({
  file,
  folder,
  fileType,
  paymentId,
  paymentReceiptId = null,
  contentType = file?.type || "application/octet-stream",
  fileName = file?.name,
}) {
  const originalName = sanitizeFileSegment(fileName || "archivo");
  const extension = getFileExtension(originalName, "bin");
  const storedName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${originalName}`;
  const filePath = [
    folder,
    sanitizeFileSegment(paymentId, "payment"),
    paymentReceiptId ? sanitizeFileSegment(paymentReceiptId, "receipt") : null,
    storedName,
  ]
    .filter(Boolean)
    .join("/");

  const uploadResult = await supabase.storage
    .from(PAYMENT_FILES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });

  if (uploadResult.error) {
    throw new Error(
      `No fue posible subir ${fileType.toLowerCase()}: ${uploadResult.error.message}`,
    );
  }

  const publicUrl = getPublicStorageUrl(PAYMENT_FILES_BUCKET, uploadResult.data.path);

  return throwIfError(
    await supabase
      .from("files")
      .insert({
        payment_id: paymentId,
        payment_receipt_id: paymentReceiptId,
        file_type: fileType,
        file_name: fileName || storedName,
        file_path: uploadResult.data.path,
        public_url: publicUrl,
        file_format: contentType || extension,
        file_size: file?.size ?? null,
      })
      .select("file_id, file_path, public_url")
      .single(),
    `No fue posible registrar ${fileType.toLowerCase()}`,
  );
}

function formatReceiptAddress(location) {
  if (!location) {
    return "No registrada";
  }

  return [
    location.province,
    location.city,
    location.district,
    location.address,
  ]
    .filter(Boolean)
    .join(", ") || "No registrada";
}

async function getPaymentReceiptContext({ quotationId, amount }) {
  const order = throwIfError(
    await supabase
      .from("production_orders")
      .select("production_order_id, quotation_id, production_order_code, balance")
      .eq("quotation_id", quotationId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    "No fue posible encontrar la orden de produccion",
  );

  if (!order?.production_order_id) {
    throw new Error(
      "No existe una orden de produccion activa para esta cotizacion",
    );
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select("quotation_id, customer_id, total")
      .eq("quotation_id", quotationId)
      .maybeSingle(),
    "No fue posible cargar la cotizacion del pago",
  );

  if (!quotation?.customer_id) {
    throw new Error("La cotizacion no tiene un cliente asociado.");
  }

  const customer = throwIfError(
    await supabase
      .from("customers")
      .select(
        `customer_id, identification_type, legal_id, company_name, commercial_name, owner_name, ${CUSTOMER_LOCATION_RELATION_SELECT}`,
      )
      .eq("customer_id", quotation.customer_id)
      .maybeSingle(),
    "No fue posible cargar los datos del cliente para el recibo",
  );

  const previousBalance = getNumber(order.balance, getNumber(quotation.total, 0));
  const receivedAmount = getNumber(amount, 0);
  const primaryLocation = getPrimaryClientLocation(customer);

  return {
    productionOrderId: order.production_order_id,
    orderCode: order.production_order_code || "Sin codigo",
    customerId: quotation.customer_id,
    customerName:
      customer?.commercial_name ||
      customer?.company_name ||
      customer?.owner_name ||
      "Cliente sin nombre",
    customerLegalId: customer?.legal_id || "No registrada",
    customerIdentificationType: customer?.identification_type || "No indicado",
    customerAddress: formatReceiptAddress(primaryLocation),
    previousBalance,
    pendingAmount: Math.max(
      Math.round((previousBalance - receivedAmount) * 100) / 100,
      0,
    ),
  };
}

async function getPaymentMethodName(methodId) {
  if (!methodId) {
    return "No indicado";
  }

  const method = throwIfError(
    await supabase
      .from("payment_methods")
      .select("method_name")
      .eq("method_id", methodId)
      .maybeSingle(),
    "No fue posible cargar el metodo de pago para el recibo",
  );

  return method?.method_name || "No indicado";
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function clampNumber(value, min, max) {
  const numberValue = getNumber(value, min);
  return Math.min(max, Math.max(min, numberValue));
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
  const productUnits = items.reduce(
    (sum, item) => sum + getNumber(item.quantity, 0),
    0,
  );
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

    client: business?.business_name || business?.legal_name || "Sin cliente",
    company: business?.business_name || business?.legal_name || "Sin cliente",
    issuerCompany:
      groupCompany?.commercial_name ||
      groupCompany?.company_name ||
      business?.business_name ||
      business?.legal_name ||
      "Sin empresa",
    legalName: business?.legal_name || "",
    legalId: business?.legal_id || "",
    activityCode: business?.activity_code || "",
    email: business?.email || "",
    phone: business?.phone || "",
    province: branch?.province || business?.province || "",
    city: branch?.city || business?.city || "",
    district: branch?.district || business?.district || "",
    address: branch?.address || business?.address || "",

    date: quotation.created_at,
    validity: quotation.valid_until || getValidityDate(quotation.created_at),
    validUntil: quotation.valid_until,
    committedDeliveryDate: quotation.committed_delivery_date || null,
    unexpectedDeliveryDate: quotation.unexpected_delivery_date || null,

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
    conditionId: quotation.condition_id || null,
    paymentCondition: quotation.payment_conditions?.condition_name || null,

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
    productCount: productUnits,
    productUnits,
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

export async function getPaymentConditions() {
  const paymentConditions = throwIfError(
    await supabase
      .from("payment_conditions")
      .select("condition_id, condition_name, description, is_active")
      .eq("is_active", true)
      .order("condition_name", { ascending: true }),
    "No fue posible cargar las condiciones de pago",
  );

  return paymentConditions || [];
}

export async function reportPayment({
  quotationId,
  methodId,
  amount,
  paymentDate,
  invoiceNumber,
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

  const normalizedInvoiceNumber = String(invoiceNumber || "").trim();

  if (!normalizedInvoiceNumber) {
    throw new Error("Debes ingresar el numero de factura asociado.");
  }

  const receiptContext = await getPaymentReceiptContext({
    quotationId,
    amount,
  });
  const paymentMethodName = await getPaymentMethodName(methodId);

  const paymentResult = throwIfError(
    await supabase
      .from("payments")
      .insert({
        production_order_id: receiptContext.productionOrderId,
        method_id: methodId || null,
        amount: Number(amount),
        payment_date: paymentDate,
        invoice_number: normalizedInvoiceNumber,
        reference_number: referenceNumber || null,
        notes: notes || null,
        is_valid: false,
        created_by: authUserId,
      })
      .select("payment_id")
      .single(),
    "No fue posible registrar el pago",
  );

  const paymentId = paymentResult.payment_id;

  if (receiptFile) {
    await uploadPaymentFile({
      file: receiptFile,
      folder: PAYMENT_PROOF_FOLDER,
      fileType: "Comprobante de pago",
      paymentId,
    });
  }

  const paymentReceipt = throwIfError(
    await supabase
      .from("payment_receipts")
      .insert({
        payment_id: paymentId,
        customer_id: receiptContext.customerId,
        production_order_id: receiptContext.productionOrderId,
        created_by: authUserId,
      })
      .select("payment_receipt_id")
      .single(),
    "No fue posible registrar el recibo de dinero",
  );

  const receiptFileName = `recibo-dinero-${sanitizeFileSegment(
    receiptContext.orderCode,
    "orden",
  )}.png`;
  const receiptBlob = await createPaymentReceiptPngBlob({
    orderCode: receiptContext.orderCode,
    clientName: receiptContext.customerName,
    clientLegalId: receiptContext.customerLegalId,
    clientIdentificationType: receiptContext.customerIdentificationType,
    clientAddress: receiptContext.customerAddress,
    amount,
    previousBalance: receiptContext.previousBalance,
    pendingAmount: receiptContext.pendingAmount,
    paymentDate,
    invoiceNumber: normalizedInvoiceNumber,
    referenceNumber,
    paymentMethod: paymentMethodName,
  });

  await uploadPaymentFile({
    file: receiptBlob,
    folder: PAYMENT_RECEIPT_FOLDER,
    fileType: "Recibo de dinero",
    paymentId,
    paymentReceiptId: paymentReceipt.payment_receipt_id,
    contentType: "image/png",
    fileName: receiptFileName,
  });

  downloadPaymentReceiptBlob(receiptBlob, receiptFileName);

  return {
    paymentId,
    paymentReceiptId: paymentReceipt.payment_receipt_id,
    productionOrderId: receiptContext.productionOrderId,
  };
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
        `customer_id, company_id, identification_type, legal_id, company_name, owner_name, commercial_name, activity_code, tax_status, is_active, ${CUSTOMER_LOCATION_RELATION_SELECT}`,
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
    taxStatus: customer.tax_status || "",

    businessEmail: getPrimaryValue(emails, "email"),
    businessPhone: getPrimaryValue(customerPhones, "phone"),

    branchProvince: getPrimaryClientLocation(customer)?.province || "",
    branchCity: getPrimaryClientLocation(customer)?.city || "",
    branchDistrict: getPrimaryClientLocation(customer)?.district || "",
    branchAddress: getPrimaryClientLocation(customer)?.address || "",
    branchPhone: getPrimaryValue(customerPhones, "phone"),
    branchLatitude: getPrimaryClientLocation(customer)?.latitude ?? "",
    branchLongitude: getPrimaryClientLocation(customer)?.longitude ?? "",
    branchLocationAccuracy:
      getPrimaryClientLocation(customer)?.location_accuracy_meters ?? "",

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
        notes,
        is_active,
        created_at,
        updated_at,
        user_id,
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
        condition_id,
        payment_methods:method_id (
          method_id,
          method_name
        ),
        payment_conditions:condition_id (
          condition_id,
          condition_name
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

  const [customers, customerEmails, customerPhones, sellers, quoteProducts] =
    await Promise.all([
      customerIds.length
        ? throwIfError(
            await supabase
              .from("customers")
              .select(
                `customer_id, company_id, legal_id, company_name, commercial_name, activity_code, is_active, ${CUSTOMER_LOCATION_RELATION_SELECT}`,
              )
              .in("customer_id", customerIds),
            "No fue posible cargar los clientes de las cotizaciones",
          )
        : [],

      customerIds.length
        ? throwIfError(
            await supabase
              .from("emails")
              .select("email_id, customer_id, email, type, is_primary")
              .in("customer_id", customerIds),
            "No fue posible cargar los correos de los clientes",
          )
        : [],

      customerIds.length
        ? throwIfError(
            await supabase
              .from("phones")
              .select("phone_id, customer_id, phone, type, is_primary")
              .in("customer_id", customerIds),
            "No fue posible cargar los telefonos de los clientes",
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
  const emailsByCustomerId = groupById(customerEmails, "customer_id");
  const phonesByCustomerId = groupById(customerPhones, "customer_id");
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
    const customerEmail = getPrimaryValue(
      emailsByCustomerId[quotation.customer_id] || [],
      "email",
    );
    const customerPhone = getPrimaryValue(
      phonesByCustomerId[quotation.customer_id] || [],
      "phone",
    );
    const customerLocation = getPrimaryClientLocation(customer);
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
            email: customerEmail,
            phone: customerPhone,
          }
        : null,
      groupCompany:
        companiesById[quotation.company_id] || companiesById[customer?.company_id],
      branch: customer
        ? {
            province: customerLocation?.province || "",
            city: customerLocation?.city || "",
            district: customerLocation?.district || "",
            address: customerLocation?.address || "",
            latitude: customerLocation?.latitude,
            longitude: customerLocation?.longitude,
            location_accuracy_meters: customerLocation?.location_accuracy_meters,
          }
        : null,
      representative: null,
      seller: sellersById[quotation.user_id],
      products: quotationProducts,
    });
  });
}

export async function createBusinessQuotation(payload) {
  const normalizedPayload = normalizeQuotationPayload(payload);
  const { client, items } = normalizedPayload;

  let businessId = client.businessId || null;

  let quotationId = null;
  let createdBusinessId = null;

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
      const routeAssignment = await getCurrentCustomerRouteAssignment();
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
          tax_status: client.taxStatus,
          regime: "general",
          "isValidForCredit": "pending",
          ...routeAssignment,
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

      await saveBusinessClientPrimaryLocation(businessId, {
        province: client.branchProvince,
        city: client.branchCity,
        district: client.branchDistrict,
        address: client.branchAddress,
        latitude: client.branchLatitude,
        longitude: client.branchLongitude,
        locationAccuracy: client.branchLocationAccuracy,
      });

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
            tax_status: client.taxStatus,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("customer_id", businessId),
        "No fue posible actualizar la empresa del grupo del cliente",
      );

      await saveBusinessClientPrimaryLocation(businessId, {
        province: client.branchProvince,
        city: client.branchCity,
        district: client.branchDistrict,
        address: client.branchAddress,
        latitude: client.branchLatitude,
        longitude: client.branchLongitude,
        locationAccuracy: client.branchLocationAccuracy,
      });
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const ivaAmount = items.reduce((sum, item) => sum + item.iva_amount, 0);
    const total = subtotal + ivaAmount;
    const advancePercentage = getQuotationAdvancePercentageForItems(items);
    const advancePayment = total * (advancePercentage / 100);

    const quotationResponse = await supabase
      .from("quotations")
      .insert({
        company_id: client.companyId,
        customer_id: businessId,
        quotation_number: createQuotationNumber("COT"),
        notes: client.notes,
        is_active: true,
        valid_until: validUntil,
        subtotal,
        iva_amount: ivaAmount,
        total,
        advance_payment: advancePayment,
        advance_percentage: advancePercentage,
        method_id: client.methodId || null,
        condition_id: client.conditionId || null,
      })
      .select(
        `
        quotation_id,
        company_id,
        quotation_number,
        valid_until,
        subtotal,
        iva_amount,
        total,
        advance_payment,
        advance_percentage,
        method_id,
        condition_id
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
        items.map((item) => {
          const quoteProductItem = { ...item };
          delete quoteProductItem.category_name;

          return {
            quotation_id: quotationId,
            ...quoteProductItem,
          };
        }),
      ),
      "No fue posible guardar los productos cotizados",
    );

    return {
      businessId,
      branchId: "",
      representativeId: "",
      quotationId,
      quotationNumber: quotation.quotation_number,
      validUntil: quotation.valid_until,
      methodId: quotation.method_id,
      conditionId: quotation.condition_id,
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

export async function updateQuotationDeliveryDates(
  quotationId,
  values = {},
) {
  const {
    committedDeliveryDate,
    unexpectedDeliveryDate,
  } = values;

  if (!quotationId) {
    throw new Error("No se encontro la cotizacion a actualizar.");
  }

  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(values, "committedDeliveryDate")) {
    updates.committed_delivery_date = normalizeDateInput(committedDeliveryDate);
  }

  if (Object.prototype.hasOwnProperty.call(values, "unexpectedDeliveryDate")) {
    updates.unexpected_delivery_date = normalizeDateInput(unexpectedDeliveryDate);
  }

  return throwIfError(
    await supabase
      .from("quotations")
      .update(updates)
      .eq("quotation_id", quotationId)
      .select(
        "quotation_id, committed_delivery_date, unexpected_delivery_date, updated_at",
      )
      .single(),
    "No fue posible actualizar las fechas de entrega de la cotizacion",
  );
}

export async function updateQuotationDiscount(
  quotationId,
  values = {},
) {
  if (!quotationId) {
    throw new Error("No se encontro la cotizacion a actualizar.");
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select("quotation_id, subtotal, iva_amount, total, advance_percentage")
      .eq("quotation_id", quotationId)
      .single(),
    "No fue posible cargar la cotizacion para calcular el descuento",
  );

  const subtotal = Math.max(0, getNumber(quotation.subtotal, 0));
  const currentIva = Math.max(0, getNumber(quotation.iva_amount, 0));
  const currentDiscountedSubtotal = Math.max(
    0,
    getNumber(quotation.total, subtotal + currentIva) - currentIva,
  );
  const effectiveTaxRate =
    currentDiscountedSubtotal > 0 ? currentIva / currentDiscountedSubtotal : 0;
  const discountPercentage = clampNumber(values.discountPercentage, 0, 100);
  const discountAmount = roundCurrency(
    Math.min(subtotal, subtotal * (discountPercentage / 100)),
  );
  const subtotalAfterDiscount = roundCurrency(
    Math.max(0, subtotal - discountAmount),
  );
  const ivaAmount = roundCurrency(subtotalAfterDiscount * effectiveTaxRate);
  const total = roundCurrency(subtotalAfterDiscount + ivaAmount);
  const advancePercentage = clampNumber(quotation.advance_percentage, 0, 100);
  const advancePayment = roundCurrency(total * (advancePercentage / 100));

  return throwIfError(
    await supabase
      .from("quotations")
      .update({
        discount_percentage: roundCurrency(discountPercentage),
        discount_amount: discountAmount,
        iva_amount: ivaAmount,
        total,
        advance_payment: advancePayment,
        updated_at: new Date().toISOString(),
      })
      .eq("quotation_id", quotationId)
      .select(
        "quotation_id, discount_percentage, discount_amount, iva_amount, total, advance_payment, updated_at",
      )
      .single(),
    "No fue posible actualizar el descuento de la cotizacion",
  );
}

export async function deleteQuotation(quotationId) {
  if (!quotationId) {
    throw new Error("No se encontro la cotizacion a eliminar.");
  }

  const updatedAt = new Date().toISOString();

  throwIfError(
    await supabase
      .from("production_orders")
      .update({
        is_active: false,
        updated_at: updatedAt,
      })
      .eq("quotation_id", quotationId)
      .eq("is_active", true),
    "No fue posible desactivar las ordenes relacionadas a la cotizacion",
  );

  const deactivatedQuotation = throwIfError(
    await supabase
      .from("quotations")
      .update({
        is_active: false,
        updated_at: updatedAt,
      })
      .eq("quotation_id", quotationId)
      .eq("is_active", true)
      .select("quotation_id")
      .maybeSingle(),
    "No fue posible eliminar la cotizacion",
  );

  if (!deactivatedQuotation?.quotation_id) {
    throw new Error("La cotizacion ya no estaba activa o no se pudo eliminar.");
  }

  return deactivatedQuotation;
}
