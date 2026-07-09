import { supabase } from "./primarySupabaseClient.js";
import { deleteRepresentativeUsers } from "./representativeUserService.js";

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
  business_id,
  company_id,
  legal_id,
  legal_name,
  business_name,
  activity_code,
  is_active,
  created_at,
  updated_at
`;

const COMPANY_COLUMNS = `
  company_id,
  company_name,
  commercial_name,
  is_active
`;

const EMAIL_COLUMNS = `
  email_id,
  business_id,
  email,
  type,
  is_primary,
  created_at
`;

const PHONE_COLUMNS = `
  phone_id,
  business_id,
  company_id,
  branch_id,
  phone,
  type,
  is_primary,
  created_at
`;

const BRANCH_COLUMNS = `
  branch_id,
  business_id,
  province,
  district,
  address,
  is_active,
  created_at,
  updated_at
`;

const REPRESENTATIVE_COLUMNS = `
  representative_id,
  business_id,
  branch_id,
  user_id,
  name,
  email,
  is_active,
  created_at,
  updated_at
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
    .select("quotation_id, business_id, branch_id, total")
    .in("business_id", businessIds)
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

      if (quotation.branch_id) {
        result.byBranchId[quotation.branch_id] =
          (result.byBranchId[quotation.branch_id] || 0) + amount;
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
    databaseError.message?.includes("businesses_legal_id_key")
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
      district: asNullableText(branch.district),
      address: asNullableText(branch.address),
      isActive: normalizeIsActive(branch.status),
      phones: normalizePhones(branch.phones || []),
      representatives: normalizeRepresentatives(
        branch.representatives || [],
      ),
    }))
    .filter((branch) => {
      return (
        branch.province ||
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

    if (!branch.province || !branch.district || !branch.address) {
      throw new Error(
        `Completa provincia, distrito y dirección de la sucursal ${
          index + 1
        }.`,
      );
    }

    const representativeWithoutName = branch.representatives.find(
      (representative) => !representative.name,
    );

    if (representativeWithoutName) {
      throw new Error(
        `Completa el nombre de todos los representantes de la sucursal ${
          index + 1
        }.`,
      );
    }
  }

  return {
    businessId: client.businessId || client.business_id || client.id || null,
    name,
    legalId: asNullableText(client.legalId || client.legal_id),
    legalName: asNullableText(client.legalName || client.legal_name),
    activityCode: asNullableText(
      client.activityCode || client.activity_code,
    ),
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

function createBranchItem(
  branch,
  phones = [],
  representatives = [],
  salesByBranchId = {},
) {
  const branchName =
    [branch.province, branch.district].filter(Boolean).join(", ") ||
    "Sucursal";

  const branchPhones = phones
    .filter((phone) => phone.branch_id === branch.branch_id)
    .map(toClientPhone);

  const branchRepresentatives = representatives
    .filter(
      (representative) =>
        representative.branch_id === branch.branch_id,
    )
    .map((representative) => ({
      ...representative,
      id: representative.representative_id,
      representative_id: representative.representative_id,
      status: normalizeStatus(representative.is_active),
    }));

  return {
    id: branch.branch_id,
    branchId: branch.branch_id,
    branch_id: branch.branch_id,
    name: branchName,
    province: branch.province || "",
    district: branch.district || "",
    address: branch.address || "",
    phone: getPrimaryValue(branchPhones, "phone"),
    phones: branchPhones,
    sales: formatSalesAmount(salesByBranchId[branch.branch_id]),
    lastPurchase: "Sin compras",
    status: normalizeStatus(branch.is_active),
    representatives: branchRepresentatives,
  };
}

function createClientItem({
  business,
  company,
  emails,
  phones,
  branches,
  representatives,
  index,
  salesByBusinessId = {},
  salesByBranchId = {},
}) {
  const name =
    business.business_name ||
    business.legal_name ||
    "Cliente sin nombre";

  const clientPhones = phones
    .filter(
      (phone) =>
        phone.business_id === business.business_id &&
        !phone.branch_id,
    )
    .map(toClientPhone);

  const clientBranches = branches.map((branch) =>
    createBranchItem(
      branch,
      phones,
      representatives,
      salesByBranchId,
    ),
  );

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
    activityCode: business.activity_code || "",

    email: getPrimaryValue(emails, "email"),
    phone: getPrimaryValue(clientPhones, "phone"),
    clientPhones,

    sales: formatSalesAmount(salesByBusinessId[business.business_id]),
    lastPurchase: "Sin compras",
    totalOrders: 0,
    totalQuotes: 0,

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
    branchesResponse,
    representativesResponse,
    businessPhonesResponse,
  ] = await Promise.all([
    supabase
      .from("emails")
      .select(EMAIL_COLUMNS)
      .in("business_id", businessIds),

    supabase
      .from("branches")
      .select(BRANCH_COLUMNS)
      .in("business_id", businessIds),

    supabase
      .from("representatives")
      .select(REPRESENTATIVE_COLUMNS)
      .in("business_id", businessIds),

    supabase
      .from("phones")
      .select(PHONE_COLUMNS)
      .in("business_id", businessIds),
  ]);

  throwIfError(
    emailsResponse,
    "No fue posible cargar los correos de los clientes",
  );

  throwIfError(
    branchesResponse,
    "No fue posible cargar las sucursales de los clientes",
  );

  throwIfError(
    representativesResponse,
    "No fue posible cargar los representantes de los clientes",
  );

  throwIfError(
    businessPhonesResponse,
    "No fue posible cargar los teléfonos generales de los clientes",
  );

  const branchIds = (branchesResponse.data || []).map(
    (branch) => branch.branch_id,
  );

  const branchPhonesResponse =
    branchIds.length > 0
      ? await supabase
          .from("phones")
          .select(PHONE_COLUMNS)
          .in("branch_id", branchIds)
      : { data: [], error: null };

  throwIfError(
    branchPhonesResponse,
    "No fue posible cargar los teléfonos de las sucursales",
  );

  const phonesById = new Map();

  [
    ...(businessPhonesResponse.data || []),
    ...(branchPhonesResponse.data || []),
  ].forEach((phone) => {
    phonesById.set(phone.phone_id, phone);
  });

  return {
    emails: emailsResponse.data || [],
    phones: [...phonesById.values()],
    branches: branchesResponse.data || [],
    representatives: representativesResponse.data || [],
  };
}

export async function getBusinessClients() {
  const businessesResponse = await supabase
    .from("businesses")
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
      business_id: businessId,
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
  branchId = null,
  phone,
}) {
  return {
    business_id: ownerType === "business" ? businessId : null,
    company_id: null,
    branch_id: ownerType === "branch" ? branchId : null,
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
    branchId,
  },
) {
  if (ownerType === "business") {
    return (
      phone.business_id === businessId &&
      !phone.branch_id
    );
  }

  if (ownerType === "branch") {
    return phone.branch_id === branchId;
  }

  return false;
}

async function syncPhoneGroup({
  ownerType,
  businessId = null,
  branchId = null,
  phones = [],
  existingPhones = [],
}) {
  const phonesInCurrentGroup = existingPhones.filter((phone) =>
    isPhoneInOwnerGroup(phone, {
      ownerType,
      businessId,
      branchId,
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
      branchId,
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

function buildRepresentativePayload({
  businessId,
  branchId,
  representative,
}) {
  return {
    business_id: businessId,
    branch_id: branchId,
    name: representative.name,
    email: representative.email,
    is_active: representative.isActive,
  };
}

async function syncRepresentativesForBranch({
  businessId,
  branchId,
  representatives = [],
  existingRepresentatives = [],
}) {
  const existingRepresentativesById = indexRowsByKey(
    existingRepresentatives,
    "representative_id",
  );

  const usedExistingRepresentativeIds = new Set();

  for (const representative of representatives) {
    const representativeId =
      representative.representative_id ||
      representative.representativeId ||
      representative.id ||
      null;

    const representativePayload = buildRepresentativePayload({
      businessId,
      branchId,
      representative,
    });

    if (
      representativeId &&
      existingRepresentativesById[representativeId]
    ) {
      const response = await supabase
        .from("representatives")
        .update(representativePayload)
        .eq("representative_id", representativeId);

      throwIfError(
        response,
        "No fue posible actualizar un representante",
      );

      usedExistingRepresentativeIds.add(representativeId);
    } else {
      const response = await supabase
        .from("representatives")
        .insert(representativePayload)
        .select("representative_id")
        .single();

      const insertedRepresentative = throwIfError(
        response,
        "No fue posible guardar un representante",
      );

      usedExistingRepresentativeIds.add(
        insertedRepresentative.representative_id,
      );
    }
  }

  return {
    representativeIds: usedExistingRepresentativeIds,
  };
}

function buildBusinessPayload(client) {
  return {
    company_id: client.companyId,
    legal_id: client.legalId,
    legal_name: client.legalName,
    business_name: client.name,
    activity_code: client.activityCode,
    is_active: client.isActive,
  };
}

function buildBranchPayload({
  businessId,
  branch,
}) {
  return {
    business_id: businessId,
    province: branch.province,
    district: branch.district,
    address: branch.address,
    is_active: branch.isActive,
  };
}

async function createClientDependencies({
  businessId,
  client,
}) {
  await syncMainEmail({
    businessId,
    email: client.email,
    existingEmails: [],
  });

  await syncPhoneGroup({
    ownerType: "business",
    businessId,
    phones: client.clientPhones,
    existingPhones: [],
  });

  for (const branch of client.branches) {
    const branchResponse = await supabase
      .from("branches")
      .insert(
        buildBranchPayload({
          businessId,
          branch,
        }),
      )
      .select("branch_id")
      .single();

    const createdBranch = throwIfError(
      branchResponse,
      "No fue posible guardar una sucursal",
    );

    const branchId = createdBranch.branch_id;

    await syncPhoneGroup({
      ownerType: "branch",
      branchId,
      phones: branch.phones,
      existingPhones: [],
    });

    await syncRepresentativesForBranch({
      businessId,
      branchId,
      representatives: branch.representatives,
      existingRepresentatives: [],
    });
  }
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

    await deleteRepresentativeUsers(existingRelations.representatives);

    await deleteRowsByIds(
      "representatives",
      "representative_id",
      existingRelations.representatives.map(
        (representative) => representative.representative_id,
      ),
    );

    await deleteRowsByIds(
      "branches",
      "branch_id",
      existingRelations.branches.map((branch) => branch.branch_id),
    );

    const response = await supabase
      .from("businesses")
      .delete()
      .eq("business_id", businessId);

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
    const businessResponse = await supabase
      .from("businesses")
      .insert(buildBusinessPayload(client))
      .select("business_id")
      .single();

    const createdBusiness = throwIfError(
      businessResponse,
      "No fue posible crear el cliente",
    );

    createdBusinessId = createdBusiness.business_id;

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

  const existingBranchesById = indexRowsByKey(
    existingRelations.branches,
    "branch_id",
  );

  const businessResponse = await supabase
    .from("businesses")
    .update(buildBusinessPayload(client))
    .eq("business_id", businessId)
    .select("business_id")
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
  const usedExistingRepresentativeIds = new Set();
  const usedExistingBranchIds = new Set();

  const usedGlobalPhoneIds = await syncPhoneGroup({
    ownerType: "business",
    businessId,
    phones: client.clientPhones,
    existingPhones: existingRelations.phones,
  });

  usedGlobalPhoneIds.forEach((phoneId) =>
    usedExistingPhoneIds.add(phoneId),
  );

  for (const branch of client.branches) {
    const sourceBranchId =
      branch.branch_id ||
      branch.branchId ||
      branch.id ||
      null;

    let persistedBranchId = sourceBranchId;

    if (
      sourceBranchId &&
      existingBranchesById[sourceBranchId]
    ) {
      const branchResponse = await supabase
        .from("branches")
        .update(
          buildBranchPayload({
            businessId,
            branch,
          }),
        )
        .eq("branch_id", sourceBranchId);

      throwIfError(
        branchResponse,
        "No fue posible actualizar una sucursal",
      );

      usedExistingBranchIds.add(sourceBranchId);
    } else {
      const branchResponse = await supabase
        .from("branches")
        .insert(
          buildBranchPayload({
            businessId,
            branch,
          }),
        )
        .select("branch_id")
        .single();

      const createdBranch = throwIfError(
        branchResponse,
        "No fue posible crear una sucursal",
      );

      persistedBranchId = createdBranch.branch_id;
    }

    const usedBranchPhoneIds = await syncPhoneGroup({
      ownerType: "branch",
      branchId: persistedBranchId,
      phones: branch.phones,
      existingPhones: existingRelations.phones,
    });

    usedBranchPhoneIds.forEach((phoneId) =>
      usedExistingPhoneIds.add(phoneId),
    );

    const syncedRepresentatives =
      await syncRepresentativesForBranch({
        businessId,
        branchId: persistedBranchId,
        representatives: branch.representatives,
        existingRepresentatives:
          existingRelations.representatives,
      });

    syncedRepresentatives.representativeIds.forEach(
      (representativeId) =>
        usedExistingRepresentativeIds.add(representativeId),
    );
  }

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

  const representativeIdsToDelete =
    existingRelations.representatives
      .filter((representative) => {
        if (!representative.branch_id) {
          return false;
        }

        return !usedExistingRepresentativeIds.has(
          representative.representative_id,
        );
      })
      .map(
        (representative) => representative.representative_id,
      );

  await deleteRepresentativeUsers(
    existingRelations.representatives.filter((representative) =>
      representativeIdsToDelete.includes(representative.representative_id),
    ),
  );

  await deleteRowsByIds(
    "representatives",
    "representative_id",
    representativeIdsToDelete,
  );

  const branchIdsToDelete = existingRelations.branches
    .filter(
      (branch) =>
        !usedExistingBranchIds.has(branch.branch_id),
    )
    .map((branch) => branch.branch_id);

  await deleteRowsByIds(
    "branches",
    "branch_id",
    branchIdsToDelete,
  );

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
    .from("businesses")
    .update({
      is_active: isActive === true,
    })
    .eq("business_id", businessId)
    .select("business_id, is_active")
    .single();

  return throwIfError(
    response,
    "No fue posible actualizar el estado del cliente",
  );
}
