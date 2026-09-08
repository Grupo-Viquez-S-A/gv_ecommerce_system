import { supabase } from "./primarySupabaseClient.js";
import { getCurrentCustomerRouteAssignment } from "./customerRouteAssignmentService.js";

const AVATAR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#C9A227",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#a855f7",
  "#ef4444",
];

const BUSINESS_COLUMNS = `
  business_id:customer_id,
  company_id,
  identification_type,
  legal_id,
  legal_name:company_name,
  owner_name,
  business_name:commercial_name,
  activity_code,
  assigned_sales_agent_user_id,
  visit_route_day,
  customer_code,
  tax_status,
  regime,
  isValidForCredit,
  is_active,
  created_at,
  updated_at
`;

const LOCATION_COLUMNS = `
  location_id,
  business_id:customer_id,
  supplier_id,
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
`;

const COMPANY_COLUMNS = `
  company_id,
  company_name,
  commercial_name,
  is_active
`;

const EMAIL_COLUMNS = `
  email_id,
  business_id:customer_id,
  email,
  type,
  is_primary,
  created_at
`;

const PHONE_COLUMNS = `
  phone_id,
  business_id:customer_id,
  company_id,
  phone,
  type,
  is_primary,
  created_at
`;

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "CL";
}

function normalizeStatus(isActive) {
  return isActive === false ? "Inactivo" : "Activo";
}

function normalizeIsActive(status) {
  return status !== "Inactivo";
}

function asNullableText(value) {
  const normalizedValue = String(value || "").trim();

  return normalizedValue || null;
}

function asNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const normalizedValue = Number(value);

  return Number.isFinite(normalizedValue) ? normalizedValue : null;
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
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

function getPrimaryValue(rows = [], valueKey) {
  const primaryRow = rows.find((row) => row.is_primary) || rows[0];

  return primaryRow?.[valueKey] || "";
}

function getFirstRelation(relation) {
  if (Array.isArray(relation)) {
    return relation[0] || null;
  }

  return relation || null;
}

function normalizeLookupText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+centro$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toClientBranch(location) {
  const province = getFirstRelation(location.province);
  const canton = getFirstRelation(location.canton);
  const district = getFirstRelation(location.district);

  return {
    ...location,
    id: location.location_id,
    branchId: location.location_id,
    branch_id: location.location_id,
    locationId: location.location_id,
    location_id: location.location_id,
    name:
      [province?.province_name, district?.district_name]
        .filter(Boolean)
        .join(", ") || "Dirección principal",
    province: province?.province_name || "",
    city: canton?.canton_name || "",
    district: district?.district_name || "",
    address: location.location || "",
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    locationAccuracy: location.location_accuracy_meters ?? null,
    location_accuracy_meters: location.location_accuracy_meters ?? null,
    phone: "",
    phones: [],
    sales: formatSalesAmount(0),
    lastPurchase: "Sin compras",
    status: normalizeStatus(location.is_active),
    representatives: [],
  };
}

const CANCELLED_ORDER_STATUSES = ["cancelado", "cancelada", "rechazado", "rechazada"];

function formatSalesAmount(amount) {
  const millions = (Number(amount) || 0) / 1_000_000;

  return `₡${millions.toFixed(1)} M`;
}

async function getConfirmedSalesByBusinessAndBranch(businessIds = []) {
  const emptyResult = { byBusinessId: {}, byBranchId: {} };

  if (!businessIds.length) {
    return emptyResult;
  }

  const quotationsResponse = await supabase
    .from("quotations")
    .select("quotation_id, business_id:customer_id, total")
    .in("customer_id", businessIds)
    .eq("is_active", true);

  const quotations = throwIfError(
    quotationsResponse,
    "No fue posible cargar las cotizaciones para calcular las ventas",
  );

  if (!quotations?.length) {
    return emptyResult;
  }

  const quotationsById = indexRowsByKey(quotations, "quotation_id");
  const quotationIds = quotations.map((quotation) => quotation.quotation_id);

  const productionOrdersResponse = await supabase
    .from("production_orders")
    .select("quotation_id, production_order_status, balance, is_active")
    .in("quotation_id", quotationIds)
    .eq("is_active", true);

  const productionOrders = throwIfError(
    productionOrdersResponse,
    "No fue posible cargar los pedidos confirmados para calcular las ventas",
  );

  return (productionOrders || []).reduce(
    (result, order) => {
      const status = String(order.production_order_status || "").trim().toLowerCase();

      if (CANCELLED_ORDER_STATUSES.includes(status)) {
        return result;
      }

      const quotation = quotationsById[order.quotation_id];

      if (!quotation) {
        return result;
      }

      const amount = Number(quotation.total) || 0;

      if (quotation.business_id) {
        result.byBusinessId[quotation.business_id] =
          (result.byBusinessId[quotation.business_id] || 0) + amount;
      }

      return result;
    },
    { byBusinessId: {}, byBranchId: {} },
  );
}

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data;
  }

  const databaseError = response.error;

  if (
    databaseError.code === "23505" &&
    (
      databaseError.message?.includes("businesses_legal_id_key") ||
      databaseError.message?.includes("customers_legal_id_key")
    )
  ) {
    throw new Error(
      "Ya existe un cliente registrado con esta cédula jurídica.",
    );
  }

  throw new Error(
    `${actionMessage}: ${databaseError.message}`,
  );
}

function normalizePhones(phones = []) {
  const normalizedPhones = phones
    .map((phoneItem) => ({
      ...phoneItem,
      phone: asNullableText(phoneItem.phone),
      type: asNullableText(phoneItem.type) || "General",
      isPrimary:
        phoneItem.isPrimary === true ||
        phoneItem.is_primary === true,
    }))
    .filter((phoneItem) => phoneItem.phone);

  const hasPrimaryPhone = normalizedPhones.some(
    (phoneItem) => phoneItem.isPrimary,
  );

  if (normalizedPhones.length > 0 && !hasPrimaryPhone) {
    normalizedPhones[0].isPrimary = true;
  }

  return normalizedPhones;
}

function normalizeRepresentatives(representatives = []) {
  return representatives
    .map((representative) => ({
      ...representative,
      name: asNullableText(representative.name),
      email: asNullableText(representative.email),
      isActive: normalizeIsActive(representative.status),
    }))
    .filter((representative) => representative.name || representative.email);
}

function normalizeBranches(branches = []) {
  return branches
    .map((branch) => ({
      ...branch,
      province: asNullableText(branch.province),
      city: asNullableText(branch.city),
      district: asNullableText(branch.district),
      address: asNullableText(branch.address),
      latitude: asNullableNumber(branch.latitude),
      longitude: asNullableNumber(branch.longitude),
      locationAccuracy: asNullableNumber(
        branch.locationAccuracy ?? branch.location_accuracy_meters,
      ),
      isActive: normalizeIsActive(branch.status),
      phones: normalizePhones(branch.phones || []),
      representatives: normalizeRepresentatives(
        branch.representatives || [],
      ),
    }))
    .filter((branch) => {
      return (
        branch.province ||
        branch.city ||
        branch.district ||
        branch.address ||
        branch.phones.length > 0 ||
        branch.representatives.length > 0
      );
    });
}

function normalizeClientPayload(client = {}) {
  const name = asNullableText(client.name);
  const companyId = client.companyId || client.company_id || null;

  if (!name) {
    throw new Error("El nombre comercial del cliente es obligatorio.");
  }

  if (!companyId) {
    throw new Error(
      "Debes seleccionar la empresa del grupo a la que pertenece el cliente.",
    );
  }

  const branches = normalizeBranches(client.branches || []);

  for (let index = 0; index < branches.length; index += 1) {
    const branch = branches[index];

    if (!branch.province || !branch.city || !branch.district || !branch.address) {
      throw new Error(
        "Completa provincia, cantón, distrito y dirección del cliente.",
      );
    }

  }

  return {
    businessId: client.businessId || client.business_id || client.id || null,
    name,
    identificationType:
      client.identificationType === "personal" ||
      client.identification_type === "personal"
        ? "personal"
        : "legal",
    legalId: asNullableText(client.legalId || client.legal_id),
    legalName: asNullableText(client.legalName || client.legal_name),
    ownerName: asNullableText(client.ownerName || client.owner_name),
    activityCode: asNullableText(
      client.activityCode || client.activity_code,
    ),
    taxStatus: asNullableText(client.taxStatus || client.tax_status),
    companyId,
    email: asNullableText(client.email),
    isActive: normalizeIsActive(client.status),
    clientPhones: normalizePhones(client.clientPhones || []),
    branches,
  };
}

function toClientPhone(phone) {
  return {
    ...phone,
    id: phone.phone_id,
    phone_id: phone.phone_id,
    isPrimary: phone.is_primary === true,
  };
}

function createClientItem({
  business,
  company,
  emails,
  phones,
  branches,
  index,
  salesByBusinessId = {},
}) {
  const name =
    business.business_name ||
    business.legal_name ||
    "Cliente sin nombre";

  const clientPhones = phones
    .filter(
      (phone) =>
        phone.business_id === business.business_id,
    )
    .map(toClientPhone);

  const clientBranches = (branches || []).map((branch) => ({
    ...branch,
    phone: getPrimaryValue(clientPhones, "phone"),
    phones: clientPhones,
  }));
  const primaryBranch =
    clientBranches.find((branch) => branch.is_primary === true) ||
    clientBranches[0] ||
    {};

  return {
    id: business.business_id,
    businessId: business.business_id,
    business_id: business.business_id,
    initials: getInitials(name),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],

    name,
    companyId: business.company_id || "",
    company:
      company?.commercial_name ||
      company?.company_name ||
      "Sin empresa asignada",

    legalId: business.legal_id || "",
    legalName: business.legal_name || "",
    identificationType:
      business.identification_type === "personal" ? "personal" : "legal",
    ownerName: business.owner_name || "",
    activityCode: business.activity_code || "",
    taxStatus: business.tax_status || "",
    province: primaryBranch.province || "",
    city: primaryBranch.city || "",
    district: primaryBranch.district || "",
    address: primaryBranch.address || "",
    latitude: primaryBranch.latitude ?? null,
    longitude: primaryBranch.longitude ?? null,
    locationAccuracy: primaryBranch.locationAccuracy ?? null,
    location_accuracy_meters: primaryBranch.location_accuracy_meters ?? null,

    email: getPrimaryValue(emails, "email"),
    phone: getPrimaryValue(clientPhones, "phone"),
    clientPhones,

    sales: formatSalesAmount(salesByBusinessId[business.business_id]),
    lastPurchase: "Sin compras",
    totalOrders: 0,
    totalQuotes: 0,
    createdAt: business.created_at,
    assignedSalesAgentUserId: business.assigned_sales_agent_user_id || null,
    visitRouteDay: business.visit_route_day || null,

    status: normalizeStatus(business.is_active),
    branches: clientBranches,
  };
}

async function getRelatedRowsByBusinessIds(businessIds = []) {
  if (businessIds.length === 0) {
    return {
      emails: [],
      phones: [],
      branches: [],
      representatives: [],
    };
  }

  const [
    emailsResponse,
    businessPhonesResponse,
    locationsResponse,
  ] = await Promise.all([
    supabase
      .from("emails")
      .select(EMAIL_COLUMNS)
      .in("customer_id", businessIds),

    supabase
      .from("phones")
      .select(PHONE_COLUMNS)
      .in("customer_id", businessIds),

    supabase
      .from("locations")
      .select(LOCATION_COLUMNS)
      .in("customer_id", businessIds)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  throwIfError(
    emailsResponse,
    "No fue posible cargar los correos de los clientes",
  );

  throwIfError(
    businessPhonesResponse,
    "No fue posible cargar los teléfonos generales de los clientes",
  );

  throwIfError(
    locationsResponse,
    "No fue posible cargar las ubicaciones de los clientes",
  );

  return {
    emails: emailsResponse.data || [],
    phones: businessPhonesResponse.data || [],
    branches: (locationsResponse.data || []).map(toClientBranch),
    representatives: [],
  };
}

export async function getBusinessClients() {
  const businessesResponse = await supabase
    .from("customers")
    .select(BUSINESS_COLUMNS)
    .order("created_at", { ascending: false });

  const businesses = throwIfError(
    businessesResponse,
    "No fue posible cargar los clientes",
  );

  if (!businesses?.length) {
    return [];
  }

  const businessIds = businesses.map(
    (business) => business.business_id,
  );

  const companyIds = uniqueValues(
    businesses.map((business) => business.company_id),
  );

  const [companiesResponse, relatedRows, salesTotals] = await Promise.all([
    companyIds.length > 0
      ? supabase
          .from("companies")
          .select(COMPANY_COLUMNS)
          .in("company_id", companyIds)
      : Promise.resolve({ data: [], error: null }),

    getRelatedRowsByBusinessIds(businessIds),
    getConfirmedSalesByBusinessAndBranch(businessIds),
  ]);

  const companies = throwIfError(
    companiesResponse,
    "No fue posible cargar las empresas relacionadas",
  );

  const companiesById = indexRowsByKey(
    companies || [],
    "company_id",
  );

  const emailsByBusiness = groupRowsByKey(
    relatedRows.emails,
    "business_id",
  );

  const branchesByBusiness = groupRowsByKey(
    relatedRows.branches,
    "business_id",
  );

  const representativesByBusiness = groupRowsByKey(
    relatedRows.representatives,
    "business_id",
  );

  return businesses.map((business, index) =>
    createClientItem({
      business,
      company: companiesById[business.company_id],
      emails: emailsByBusiness[business.business_id] || [],
      phones: relatedRows.phones,
      branches: branchesByBusiness[business.business_id] || [],
      representatives:
        representativesByBusiness[business.business_id] || [],
      index,
      salesByBusinessId: salesTotals.byBusinessId,
      salesByBranchId: salesTotals.byBranchId,
    }),
  );
}

async function getExistingClientRelations(businessId) {
  const relatedRows = await getRelatedRowsByBusinessIds([businessId]);

  return {
    emails: relatedRows.emails || [],
    phones: relatedRows.phones || [],
    branches: relatedRows.branches || [],
    representatives: relatedRows.representatives || [],
  };
}

async function deleteRowsByIds(tableName, idColumn, ids = []) {
  const validIds = uniqueValues(ids);

  if (validIds.length === 0) {
    return;
  }

  const response = await supabase
    .from(tableName)
    .delete()
    .in(idColumn, validIds);

  throwIfError(
    response,
    `No fue posible eliminar registros de ${tableName}`,
  );
}

let geographyLookupPromise = null;

function buildGeoKey(...parts) {
  return parts.map(normalizeLookupText).join("|");
}

async function getGeographyLookup() {
  if (!geographyLookupPromise) {
    geographyLookupPromise = (async () => {
      const [
        countriesResponse,
        provincesResponse,
        cantonsResponse,
        districtsResponse,
      ] = await Promise.all([
        supabase
          .from("countries")
          .select("country_id, country_code, country_name")
          .eq("is_active", true),
        supabase
          .from("provinces")
          .select("province_id, country_id, province_code, province_name"),
        supabase
          .from("cantons")
          .select("canton_id, province_id, canton_code, canton_name"),
        supabase
          .from("districts")
          .select("district_id, canton_id, district_code, district_name"),
      ]);

      const countries = throwIfError(
        countriesResponse,
        "No fue posible cargar el país para la ubicación",
      );
      const provinces = throwIfError(
        provincesResponse,
        "No fue posible cargar las provincias para la ubicación",
      );
      const cantons = throwIfError(
        cantonsResponse,
        "No fue posible cargar los cantones para la ubicación",
      );
      const districts = throwIfError(
        districtsResponse,
        "No fue posible cargar los distritos para la ubicación",
      );

      const country =
        (countries || []).find((currentCountry) =>
          ["cr", "506"].includes(normalizeLookupText(currentCountry.country_code)) ||
          normalizeLookupText(currentCountry.country_name) === "costa rica",
        ) ||
        countries?.[0] ||
        null;

      return {
        country,
        provincesByName: new Map(
          (provinces || []).map((province) => [
            buildGeoKey(province.province_name),
            province,
          ]),
        ),
        cantonsByProvinceAndName: new Map(
          (cantons || []).map((canton) => [
            buildGeoKey(canton.province_id, canton.canton_name),
            canton,
          ]),
        ),
        districtsByCantonAndName: new Map(
          (districts || []).map((district) => [
            buildGeoKey(district.canton_id, district.district_name),
            district,
          ]),
        ),
      };
    })();
  }

  return geographyLookupPromise;
}

async function resolveLocationGeoIds(branch = {}) {
  const lookup = await getGeographyLookup();

  if (!lookup.country) {
    throw new Error("No se encontró Costa Rica en la tabla de países.");
  }

  const province = lookup.provincesByName.get(
    buildGeoKey(branch.province),
  );

  if (!province) {
    throw new Error(`No se encontró la provincia "${branch.province}" en la tabla provinces.`);
  }

  const canton = lookup.cantonsByProvinceAndName.get(
    buildGeoKey(province.province_id, branch.city),
  );

  if (!canton) {
    throw new Error(`No se encontró el cantón "${branch.city}" para la provincia "${branch.province}".`);
  }

  const district =
    lookup.districtsByCantonAndName.get(
      buildGeoKey(canton.canton_id, branch.district),
    ) ||
    lookup.districtsByCantonAndName.get(
      buildGeoKey(canton.canton_id, String(branch.district || "").replace(/\s+centro$/i, "")),
    );

  if (!district) {
    throw new Error(`No se encontró el distrito "${branch.district}" para el cantón "${branch.city}".`);
  }

  return {
    country_id: lookup.country.country_id,
    province_id: province.province_id,
    canton_id: canton.canton_id,
    district_id: district.district_id,
  };
}

async function syncPrimaryLocation({
  businessId,
  branch,
  existingBranches = [],
}) {
  if (!branch) {
    return null;
  }

  const geoIds = await resolveLocationGeoIds(branch);
  const locationId =
    branch.location_id ||
    branch.locationId ||
    branch.branch_id ||
    branch.branchId ||
    existingBranches.find((existingBranch) => existingBranch.is_primary)?.location_id ||
    existingBranches[0]?.location_id ||
    null;

  const payload = {
    customer_id: businessId,
    supplier_id: null,
    ...geoIds,
    location: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    location_accuracy_meters: branch.locationAccuracy,
    is_primary: true,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (locationId) {
    const response = await supabase
      .from("locations")
      .update(payload)
      .eq("location_id", locationId)
      .select("location_id")
      .single();

    return throwIfError(
      response,
      "No fue posible actualizar la ubicación del cliente",
    );
  }

  const response = await supabase
    .from("locations")
    .insert(payload)
    .select("location_id")
    .single();

  return throwIfError(
    response,
    "No fue posible guardar la ubicación del cliente",
  );
}

export async function saveBusinessClientPrimaryLocation(
  businessId,
  branchForm,
) {
  if (!businessId) {
    throw new Error("No se recibió el identificador del cliente.");
  }

  const normalizedBranches = normalizeBranches([branchForm]);
  const primaryBranch = normalizedBranches[0];

  if (!primaryBranch) {
    return null;
  }

  const existingRelations = await getExistingClientRelations(businessId);

  return syncPrimaryLocation({
    businessId,
    branch: primaryBranch,
    existingBranches: existingRelations.branches,
  });
}

export function getPrimaryClientLocation(customer = {}) {
  const locations = Array.isArray(customer.locations)
    ? customer.locations
    : [];
  const location =
    locations.find((currentLocation) => (
      currentLocation.is_active !== false &&
      currentLocation.is_primary === true
    )) ||
    locations.find((currentLocation) => currentLocation.is_active !== false) ||
    locations[0] ||
    null;

  return location ? toClientBranch(location) : null;
}

async function syncMainEmail({
  businessId,
  email,
  existingEmails = [],
}) {
  const primaryEmail =
    existingEmails.find((currentEmail) => currentEmail.is_primary) ||
    existingEmails[0] ||
    null;

  let emailIdToKeep = null;

  if (email) {
    const emailPayload = {
      customer_id: businessId,
      email,
      type: "Principal",
      is_primary: true,
    };

    if (primaryEmail?.email_id) {
      const response = await supabase
        .from("emails")
        .update(emailPayload)
        .eq("email_id", primaryEmail.email_id);

      throwIfError(
        response,
        "No fue posible actualizar el correo principal",
      );

      emailIdToKeep = primaryEmail.email_id;
    } else {
      const response = await supabase
        .from("emails")
        .insert(emailPayload)
        .select("email_id")
        .single();

      const insertedEmail = throwIfError(
        response,
        "No fue posible guardar el correo principal",
      );

      emailIdToKeep = insertedEmail.email_id;
    }
  }

  const emailIdsToDelete = existingEmails
    .filter(
      (currentEmail) =>
        currentEmail.email_id !== emailIdToKeep,
    )
    .map((currentEmail) => currentEmail.email_id);

  await deleteRowsByIds("emails", "email_id", emailIdsToDelete);
}

function buildPhonePayload({
  ownerType,
  businessId = null,
  phone,
}) {
  return {
    customer_id: ownerType === "business" ? businessId : null,
    company_id: null,
    phone: phone.phone,
    type: phone.type || "General",
    is_primary: phone.isPrimary === true,
  };
}

function isPhoneInOwnerGroup(
  phone,
  {
    ownerType,
    businessId,
  },
) {
  if (ownerType === "business") {
    return phone.business_id === businessId;
  }

  return false;
}

async function syncPhoneGroup({
  ownerType,
  businessId = null,
  phones = [],
  existingPhones = [],
}) {
  const phonesInCurrentGroup = existingPhones.filter((phone) =>
    isPhoneInOwnerGroup(phone, {
      ownerType,
      businessId,
    }),
  );

  const existingPhonesById = indexRowsByKey(
    phonesInCurrentGroup,
    "phone_id",
  );

  const usedExistingPhoneIds = new Set();

  for (const phone of phones) {
    const phoneId =
      phone.phone_id ||
      phone.phoneId ||
      phone.id ||
      null;

    const phonePayload = buildPhonePayload({
      ownerType,
      businessId,
      phone,
    });

    if (phoneId && existingPhonesById[phoneId]) {
      const response = await supabase
        .from("phones")
        .update(phonePayload)
        .eq("phone_id", phoneId);

      throwIfError(
        response,
        "No fue posible actualizar un teléfono",
      );

      usedExistingPhoneIds.add(phoneId);
    } else {
      const response = await supabase
        .from("phones")
        .insert(phonePayload);

      throwIfError(
        response,
        "No fue posible guardar un teléfono",
      );
    }
  }

  return usedExistingPhoneIds;
}

function buildBusinessPayload(client) {
  return {
    company_id: client.companyId,
    identification_type: client.identificationType,
    legal_id: client.legalId,
    company_name: client.legalName,
    owner_name: client.ownerName,
    commercial_name: client.name,
    activity_code: client.activityCode,
    regime: client.regime || "general",
    tax_status: client.taxStatus || null,
    customer_code: client.customerCode || null,
    "isValidForCredit": client.isValidForCredit || "pending",
    is_active: client.isActive,
  };
}

async function createClientDependencies({
  businessId,
  client,
}) {
  const branchPhones = client.branches.flatMap((branch) => branch.phones || []);

  await syncMainEmail({
    businessId,
    email: client.email,
    existingEmails: [],
  });

  await syncPhoneGroup({
    ownerType: "business",
    businessId,
    phones: [...client.clientPhones, ...branchPhones],
    existingPhones: [],
  });

  await syncPrimaryLocation({
    businessId,
    branch: client.branches[0],
    existingBranches: [],
  });
}

async function rollbackCreatedClient(businessId) {
  try {
    const existingRelations = await getExistingClientRelations(
      businessId,
    );

    await deleteRowsByIds(
      "phones",
      "phone_id",
      existingRelations.phones.map((phone) => phone.phone_id),
    );

    await deleteRowsByIds(
      "emails",
      "email_id",
      existingRelations.emails.map((email) => email.email_id),
    );

    await deleteRowsByIds(
      "locations",
      "location_id",
      existingRelations.branches.map((branch) => branch.location_id),
    );

    const response = await supabase
      .from("customers")
      .delete()
      .eq("customer_id", businessId);

    throwIfError(
      response,
      "No fue posible revertir la creación del cliente",
    );
  } catch (rollbackError) {
    console.error(
      "No fue posible revertir la creación parcial del cliente:",
      rollbackError,
    );
  }
}

export async function createBusinessClient(clientForm) {
  const client = normalizeClientPayload(clientForm);

  let createdBusinessId = null;

  try {
    const routeAssignment = await getCurrentCustomerRouteAssignment();
    const businessResponse = await supabase
      .from("customers")
      .insert({
        ...buildBusinessPayload(client),
        ...routeAssignment,
      })
      .select("customer_id")
      .single();

    const createdBusiness = throwIfError(
      businessResponse,
      "No fue posible crear el cliente",
    );

    createdBusinessId = createdBusiness.customer_id;

    await createClientDependencies({
      businessId: createdBusinessId,
      client,
    });

    return {
      businessId: createdBusinessId,
    };
  } catch (error) {
    if (createdBusinessId) {
      await rollbackCreatedClient(createdBusinessId);
    }

    throw error;
  }
}

export async function updateBusinessClient(
  businessId,
  clientForm,
) {
  if (!businessId) {
    throw new Error("No se recibió el identificador del cliente.");
  }

  const client = normalizeClientPayload({
    ...clientForm,
    businessId,
  });

  const existingRelations = await getExistingClientRelations(
    businessId,
  );

  const businessResponse = await supabase
    .from("customers")
    .update(buildBusinessPayload(client))
    .eq("customer_id", businessId)
    .select("customer_id")
    .single();

  throwIfError(
    businessResponse,
    "No fue posible actualizar el cliente",
  );

  await syncMainEmail({
    businessId,
    email: client.email,
    existingEmails: existingRelations.emails,
  });

  const usedExistingPhoneIds = new Set();
  const branchPhones = client.branches.flatMap((branch) => branch.phones || []);

  const usedGlobalPhoneIds = await syncPhoneGroup({
    ownerType: "business",
    businessId,
    phones: [...client.clientPhones, ...branchPhones],
    existingPhones: existingRelations.phones,
  });

  usedGlobalPhoneIds.forEach((phoneId) =>
    usedExistingPhoneIds.add(phoneId),
  );

  const phoneIdsToDelete = existingRelations.phones
    .filter(
      (phone) =>
        !usedExistingPhoneIds.has(phone.phone_id),
    )
    .map((phone) => phone.phone_id);

  await deleteRowsByIds(
    "phones",
    "phone_id",
    phoneIdsToDelete,
  );

  await syncPrimaryLocation({
    businessId,
    branch: client.branches[0],
    existingBranches: existingRelations.branches,
  });

  return {
    businessId,
  };
}

export async function updateBusinessClientBranchLocations(
  businessId,
  branches = [],
) {
  if (!businessId) {
    throw new Error("No se recibió el identificador del cliente.");
  }

  const normalizedBranches = normalizeBranches(branches);
  const primaryBranch = normalizedBranches[0];

  if (primaryBranch) {
    const existingRelations = await getExistingClientRelations(businessId);

    await syncPrimaryLocation({
      businessId,
      branch: primaryBranch,
      existingBranches: existingRelations.branches,
    });
  }

  return {
    businessId,
  };
}

export async function updateBusinessClientStatus(
  businessId,
  isActive,
) {
  if (!businessId) {
    throw new Error("No se recibió el identificador del cliente.");
  }

  const response = await supabase
    .from("customers")
    .update({
      is_active: isActive === true,
    })
    .eq("customer_id", businessId)
    .select("customer_id, is_active")
    .single();

  return throwIfError(
    response,
    "No fue posible actualizar el estado del cliente",
  );
}

export async function saveCustomerRouteAssignments(assignments = []) {
  const normalizedAssignments = assignments
    .map((assignment) => ({
      customerId:
        assignment?.customerId ||
        assignment?.businessId ||
        assignment?.id ||
        null,
      targetAgentUserId:
        assignment?.targetAgentUserId ||
        assignment?.assignedSalesAgentUserId ||
        null,
    }))
    .filter(
      (assignment) =>
        assignment.customerId && assignment.targetAgentUserId,
    );

  if (!normalizedAssignments.length) {
    return [];
  }

  const customerIds = normalizedAssignments.map(
    (assignment) => assignment.customerId,
  );

  const existingCustomersResponse = await supabase
    .from("customers")
    .select("customer_id")
    .in("customer_id", customerIds);

  const existingCustomers = throwIfError(
    existingCustomersResponse,
    "No fue posible validar los clientes a reasignar",
  );

  const existingCustomerIds = new Set(
    (existingCustomers || []).map((customer) => customer.customer_id),
  );

  const missingCustomerIds = customerIds.filter(
    (customerId) => !existingCustomerIds.has(customerId),
  );

  if (missingCustomerIds.length > 0) {
    throw new Error(
      "Uno o más clientes seleccionados ya no existen o no están disponibles para reasignación.",
    );
  }

  const assignmentsByAgent = normalizedAssignments.reduce(
    (groupedAssignments, assignment) => {
      if (!groupedAssignments[assignment.targetAgentUserId]) {
        groupedAssignments[assignment.targetAgentUserId] = [];
      }

      groupedAssignments[assignment.targetAgentUserId].push(
        assignment.customerId,
      );

      return groupedAssignments;
    },
    {},
  );

  await Promise.all(
    Object.entries(assignmentsByAgent).map(
      async ([targetAgentUserId, groupedCustomerIds]) => {
        const response = await supabase
          .from("customers")
          .update({
            assigned_sales_agent_user_id: targetAgentUserId,
            updated_at: new Date().toISOString(),
          })
          .in("customer_id", groupedCustomerIds);

        throwIfError(
          response,
          "No fue posible guardar la reasignación de rutas",
        );
      },
    ),
  );

  return normalizedAssignments;
}

export async function deleteBusinessClient(
  businessId,
) {
  if (!businessId) {
    throw new Error("No se recibió el identificador del cliente.");
  }

  await deleteRowsByIds(
    "customer_visit_confirmations",
    "customer_id",
    [businessId],
  );

  const response = await supabase
    .from("customers")
    .update({
      is_active: false,
      assigned_sales_agent_user_id: null,
      visit_route_day: null,
      updated_at: new Date().toISOString(),
    })
    .eq("customer_id", businessId)
    .select("customer_id, is_active")
    .single();

  return throwIfError(
    response,
    "No fue posible eliminar el cliente",
  );
}
