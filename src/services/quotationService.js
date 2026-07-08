import { supabase } from "./primarySupabaseClient.js";

function getText(value) {
  const normalizedValue = String(value || "").trim();

  return normalizedValue || null;
}

function getNumber(value, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getBoolean(value) {
  return value === true || value === "true";
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data;
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

function createQuotationNumber(prefix = "COT") {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now
    .toTimeString()
    .slice(0, 8)
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

function getStatusCandidates(status) {
  const dbStatus = getDbQuotationStatus(status);
  const fallbackByStatus = {
    pending: ["pending", "Pendiente", "draft", "created"],
    review: ["review", "En revision", "En revisión", "pending"],
    approved: ["approved", "Aprobada", "accepted"],
    rejected: ["rejected", "Rechazada", "declined"],
    expired: ["expired", "Vencida"],
    converted: ["converted", "Convertida"],
  };

  return [...new Set([dbStatus, ...(fallbackByStatus[dbStatus] || [])])];
}

void getStatusCandidates;

function formatProfileName(profile) {
  const fullName = [profile?.name, profile?.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile?.email || "Sin vendedor";
}

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "NA";
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

  date.setDate(date.getDate() + 15);

  return date.toISOString();
}

function getQuotationTotal(items = []) {
  return items.reduce((total, item) => total + getNumber(item.total, 0), 0);
}

<<<<<<< Updated upstream
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
=======
function getPrimaryValue(rows = [], valueKey) {
  const primaryRow = rows.find((row) => row.is_primary) || rows[0];

  return primaryRow?.[valueKey] || "";
>>>>>>> Stashed changes
}

function normalizeQuotation({
  quotation,
  business,
  branch,
  representative,
  seller,
  products,
}) {
  const sellerName = formatProfileName(seller);
  const items = products.map((item) => ({
    id: item.quote_product_id,
    quoteProductId: item.quote_product_id,
    productId: item.product_id,
    sku: item.product?.sku || "Sin SKU",
    name: item.product?.product_name || "Producto sin nombre",
    description: item.product?.description || "",
    imageUrl:
      item.product?.image_url ||
      item.product?.main_image_url ||
      item.product?.cover_image_url ||
      getProductImageUrl(item.productFiles || []),
    quantity: getNumber(item.quantity, 0),
    unitPrice: getNumber(item.unit_price, 0),
    ivaAmount: getNumber(item.iva_amount, 0),
    subtotal: getNumber(item.subtotal, 0),
    total: getNumber(item.total, 0),
  }));

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
    validity: getValidityDate(quotation.created_at),
    total: getQuotationTotal(items),
    status: getQuotationStatusLabel(quotation.state || quotation.status),
    dbStatus: quotation.state || quotation.status || "pending",
    agent: sellerName,
    avatar: getInitials(sellerName),
    notes: quotation.notes || "",
    business,
    branch,
    representative,
    seller,
    items,
  };
}

function normalizeQuotationPayload({ client = {}, items = [], status }) {
  const companyId = getText(client.companyId);
  const businessName = getText(client.businessName);
  const legalName = getText(client.legalName) || businessName;
  const branchAddress = getText(client.branchAddress);
  const representativeName = getText(client.representativeName);

  if (!companyId) {
    throw new Error("Selecciona la empresa del grupo.");
  }

  if (!businessName) {
    throw new Error("Ingresa el nombre comercial del cliente.");
  }

  if (!legalName) {
    throw new Error("Ingresa la razon social del cliente.");
  }

  if (!branchAddress) {
    throw new Error("Ingresa la direccion de la sucursal.");
  }

  if (!representativeName) {
    throw new Error("Ingresa el nombre del representante.");
  }

  if (!items.length) {
    throw new Error("Agrega al menos un producto al carrito.");
  }

  return {
    client: {
      businessId: getText(client.businessId),
      branchId: getText(client.branchId),
      representativeId: getText(client.representativeId),
      companyId,
      legalId: getText(client.legalId),
      legalName,
      businessName,
      activityCode: getText(client.activityCode),
      businessEmail: getText(client.businessEmail),
      businessPhone: getText(client.businessPhone),
      branchProvince: getText(client.branchProvince),
      branchDistrict: getText(client.branchDistrict),
      branchAddress,
      branchPhone: getText(client.branchPhone),
      representativeName,
      representativeEmail: getText(client.representativeEmail),
      notes: getText(client.notes),
      earlyDelivery: getBoolean(client.earlyDelivery),
    },
    items: items.map((item) => {
      const productId = getText(item.productId || item.id);
      const quantity = Math.max(1, getNumber(item.quantity, 1));
      const unitPrice = getNumber(item.unitPrice, 0);
      const unitIva = getNumber(item.ivaAmount, 0);
      const ivaAmount = unitIva * quantity;

      if (!productId) {
        throw new Error("Uno de los productos no tiene identificador.");
      }

      return {
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        iva_amount: ivaAmount,
      };
    }),
    status: getDbQuotationStatus(status),
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
  branchId,
  representativeId,
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

    if (representativeId) {
      await supabase
        .from("representatives")
        .delete()
        .eq("representative_id", representativeId);
    }

    if (branchId) {
      await supabase.from("branches").delete().eq("branch_id", branchId);
    }

    if (businessId) {
      await supabase.from("emails").delete().eq("business_id", businessId);
      await supabase
        .from("businesses")
        .delete()
        .eq("business_id", businessId);
    }
  } catch (rollbackError) {
    console.error("No fue posible revertir la cotizacion parcial:", rollbackError);
  }
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

  const business = throwIfError(
    await supabase
      .from("businesses")
      .select(
        "business_id, company_id, legal_id, legal_name, business_name, activity_code, is_active",
      )
      .eq("legal_id", normalizedLegalId)
      .maybeSingle(),
    "No fue posible buscar el cliente por cedula juridica",
  );

  if (!business) {
    return null;
  }

  const [emails, businessPhones, branches] = await Promise.all([
    throwIfError(
      await supabase
        .from("emails")
        .select("email_id, business_id, email, type, is_primary, created_at")
        .eq("business_id", business.business_id),
      "No fue posible cargar los correos del cliente",
    ),
    throwIfError(
      await supabase
        .from("phones")
        .select("phone_id, business_id, branch_id, phone, type, is_primary, created_at")
        .eq("business_id", business.business_id)
        .is("branch_id", null),
      "No fue posible cargar los telefonos del cliente",
    ),
    throwIfError(
      await supabase
        .from("branches")
        .select("branch_id, business_id, province, district, address, is_active, created_at")
        .eq("business_id", business.business_id)
        .order("created_at", { ascending: true }),
      "No fue posible cargar las sucursales del cliente",
    ),
  ]);

  const activeBranch =
    branches.find((branch) => branch.is_active !== false) || branches[0] || null;

  const [branchPhones, representatives] = await Promise.all([
    activeBranch?.branch_id
      ? throwIfError(
          await supabase
            .from("phones")
            .select("phone_id, branch_id, phone, type, is_primary, created_at")
            .eq("branch_id", activeBranch.branch_id),
          "No fue posible cargar los telefonos de la sucursal",
        )
      : [],
    throwIfError(
      await supabase
        .from("representatives")
        .select(
          "representative_id, business_id, branch_id, name, email, is_active, created_at",
        )
        .eq("business_id", business.business_id)
        .order("created_at", { ascending: true }),
      "No fue posible cargar los representantes del cliente",
    ),
  ]);

  const activeRepresentative =
    representatives.find((representative) => {
      const belongsToBranch =
        !activeBranch?.branch_id ||
        representative.branch_id === activeBranch.branch_id;

      return representative.is_active !== false && belongsToBranch;
    }) ||
    representatives.find((representative) => representative.is_active !== false) ||
    representatives[0] ||
    null;

  return {
    businessId: business.business_id,
    branchId: activeBranch?.branch_id || "",
    representativeId: activeRepresentative?.representative_id || "",
    companyId: business.company_id || "",
    legalId: business.legal_id || normalizedLegalId,
    legalName: business.legal_name || "",
    businessName: business.business_name || business.legal_name || "",
    activityCode: business.activity_code || "",
    businessEmail: getPrimaryValue(emails, "email"),
    businessPhone: getPrimaryValue(businessPhones, "phone"),
    branchProvince: activeBranch?.province || "",
    branchDistrict: activeBranch?.district || "",
    branchAddress: activeBranch?.address || "",
    branchPhone: getPrimaryValue(branchPhones, "phone"),
    representativeName: activeRepresentative?.name || "",
    representativeEmail: activeRepresentative?.email || "",
  };
}

export async function getQuotations() {
  const quotations = throwIfError(
    await supabase
      .from("quotations")
      .select(
        "quotation_id, business_id, branch_id, representative_id, quotation_number, status, state, notes, is_active, created_at, updated_at, user_id",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    "No fue posible cargar las cotizaciones",
  );

  if (!quotations.length) {
    return [];
  }

  const businessIds = [...new Set(quotations.map((item) => item.business_id).filter(Boolean))];
  const branchIds = [...new Set(quotations.map((item) => item.branch_id).filter(Boolean))];
  const representativeIds = [
    ...new Set(quotations.map((item) => item.representative_id).filter(Boolean)),
  ];
  const sellerIds = [...new Set(quotations.map((item) => item.user_id).filter(Boolean))];
  const quotationIds = quotations.map((item) => item.quotation_id);

  const [businesses, branches, representatives, sellers, quoteProducts] =
    await Promise.all([
      businessIds.length
        ? throwIfError(
            await supabase
              .from("businesses")
              .select(
                "business_id, company_id, legal_id, legal_name, business_name, activity_code, is_active",
              )
              .in("business_id", businessIds),
            "No fue posible cargar los clientes de las cotizaciones",
          )
        : [],
      branchIds.length
        ? throwIfError(
            await supabase
              .from("branches")
              .select("branch_id, business_id, province, district, address, is_active")
              .in("branch_id", branchIds),
            "No fue posible cargar las sucursales de las cotizaciones",
          )
        : [],
      representativeIds.length
        ? throwIfError(
            await supabase
              .from("representatives")
              .select(
                "representative_id, business_id, branch_id, user_id, name, email, is_active",
              )
              .in("representative_id", representativeIds),
            "No fue posible cargar los representantes de las cotizaciones",
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
            "quote_product_id, quotation_id, product_id, quantity, unit_price, iva_amount, subtotal, total",
          )
          .in("quotation_id", quotationIds),
        "No fue posible cargar los productos de las cotizaciones",
      ),
    ]);

  const productIds = [
    ...new Set(quoteProducts.map((item) => item.product_id).filter(Boolean)),
  ];

  const products = productIds.length
    ? throwIfError(
        await supabase
          .from("textile_products")
          .select("product_id, sku, product_name, description, price, iva_amount")
          .in("product_id", productIds),
        "No fue posible cargar el catalogo de productos cotizados",
      )
    : [];

  const productFiles = productIds.length
    ? throwIfError(
        await supabase
          .from("textile_product_files")
          .select("*")
          .in("product_id", productIds)
          .order("created_at", { ascending: true }),
        "No fue posible cargar las imagenes de productos cotizados",
      )
    : [];

  const businessesById = indexById(businesses, "business_id");
  const branchesById = indexById(branches, "branch_id");
  const representativesById = indexById(representatives, "representative_id");
  const sellersById = indexById(sellers, "user_id");
  const productsById = indexById(products, "product_id");
  const productFilesById = groupById(productFiles, "product_id");
  const quoteProductsByQuotationId = groupById(quoteProducts, "quotation_id");

  return quotations.map((quotation) => {
    const quotationProducts = (
      quoteProductsByQuotationId[quotation.quotation_id] || []
    ).map((item) => ({
      ...item,
      product: productsById[item.product_id],
      productFiles: productFilesById[item.product_id] || [],
    }));

    return normalizeQuotation({
      quotation,
      business: businessesById[quotation.business_id],
      branch: branchesById[quotation.branch_id],
      representative: representativesById[quotation.representative_id],
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
  const normalizedPayload = normalizeQuotationPayload(payload);
  const { client, items, status } = normalizedPayload;

  let businessId = client.businessId || null;
  let branchId = client.branchId || null;
  let representativeId = client.representativeId || null;
  let quotationId = null;
  let createdBusinessId = null;
  let createdBranchId = null;
  let createdRepresentativeId = null;
  const earlyDeliveryDate = client.earlyDelivery ? getTodayDate() : null;
  const createdPhoneIds = [];

  try {
    if (!businessId && client.legalId) {
      const existingClient = await getQuotationClientByLegalId(client.legalId);

      if (existingClient?.businessId) {
        businessId = existingClient.businessId;
        branchId = branchId || existingClient.branchId || null;
        representativeId =
          representativeId || existingClient.representativeId || null;
      }
    }

    if (!businessId) {
      const businessResponse = await supabase
        .from("businesses")
        .insert({
          company_id: client.companyId,
          legal_id: client.legalId,
          legal_name: client.legalName,
          business_name: client.businessName,
          activity_code: client.activityCode,
          is_active: true,
        })
        .select("business_id")
        .single();

      const business = throwIfError(
        businessResponse,
        "No fue posible crear el cliente",
      );

      businessId = business.business_id;
      createdBusinessId = businessId;

      if (client.businessEmail) {
        throwIfError(
          await supabase.from("emails").insert({
            business_id: businessId,
            email: client.businessEmail,
            type: "Principal",
            is_primary: true,
          }),
          "No fue posible guardar el correo del cliente",
        );
      }

      await insertPhone(
        {
          business_id: businessId,
          company_id: null,
          branch_id: null,
          representative_id: null,
          phone: client.businessPhone,
          type: "Principal",
          is_primary: true,
        },
        createdPhoneIds,
      );
    }

    if (!branchId) {
      const branchResponse = await supabase
        .from("branches")
        .insert({
          business_id: businessId,
          province: client.branchProvince,
          district: client.branchDistrict,
          address: client.branchAddress,
          is_active: true,
        })
        .select("branch_id")
        .single();

      const branch = throwIfError(
        branchResponse,
        "No fue posible guardar la sucursal",
      );

      branchId = branch.branch_id;
      createdBranchId = branchId;
    }

    if (!representativeId) {
      const representativeResponse = await supabase
        .from("representatives")
        .insert({
          business_id: businessId,
          branch_id: branchId,
          user_id: null,
          name: client.representativeName,
          email: client.representativeEmail,
          is_active: true,
        })
        .select("representative_id")
        .single();

      const representative = throwIfError(
        representativeResponse,
        "No fue posible guardar el representante",
      );

      representativeId = representative.representative_id;
      createdRepresentativeId = representativeId;
    }

    const quotationResponse = await supabase
      .from("quotations")
      .insert({
        business_id: businessId,
        branch_id: branchId,
        representative_id: representativeId,
        quotation_number: createQuotationNumber("COT"),
        state: status,
        notes: client.notes,
        is_active: true,
        early_delivery: client.earlyDelivery,
        early_delivery_date: earlyDeliveryDate,
      })
      .select("quotation_id, quotation_number, early_delivery, early_delivery_date")
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
      branchId,
      representativeId,
      quotationId,
      quotationNumber: quotation.quotation_number,
      earlyDelivery: quotation.early_delivery,
      earlyDeliveryDate: quotation.early_delivery_date,
    };
  } catch (error) {
    await rollbackQuotation({
      quotationId,
      businessId: createdBusinessId,
      branchId: createdBranchId,
      representativeId: createdRepresentativeId,
      phoneIds: createdPhoneIds,
    });

    throw error;
  }
}
