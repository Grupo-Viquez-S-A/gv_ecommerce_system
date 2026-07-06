import { supabase } from "./primarySupabaseClient.js";

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

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeStatus(isActive) {
  return isActive === false ? "Inactivo" : "Activo";
}

function getPrimaryValue(rows = [], valueKey) {
  const primaryRow = rows.find((row) => row.is_primary) || rows[0];

  return primaryRow?.[valueKey] || "";
}

function createBranchItem(branch, branchPhones = [], representatives = []) {
  const branchName =
    [branch.province, branch.district].filter(Boolean).join(", ") ||
    "Sucursal";

  return {
    id: branch.branch_id,
    name: branchName,
    address: branch.address || "",
    phone: branch.main_phone || getPrimaryValue(branchPhones, "phone"),
    email: "",
    sales: "0 M",
    lastPurchase: "Sin compras",
    status: normalizeStatus(branch.is_active),
    representatives: representatives.map((representative) => ({
      id: representative.representative_id,
      name: representative.name || "Representante sin nombre",
      role: "Representante",
      phone: representative.phone || "",
      email: representative.email || "",
      status: normalizeStatus(representative.is_active),
    })),
  };
}

function createClientItem({
  business,
  company,
  legalEntity,
  emails,
  phones,
  branches,
  representatives,
  index,
}) {
  const name =
    business.business_name ||
    business.legal_name ||
    legalEntity?.trade_name ||
    legalEntity?.legal_name ||
    "Cliente sin nombre";

  const legalName =
    business.legal_name ||
    legalEntity?.legal_name ||
    name;

  const clientBranches = branches.map((branch) =>
    createBranchItem(
      branch,
      phones.filter((phone) => phone.branch_id === branch.branch_id),
      representatives.filter(
        (representative) =>
          representative.business_id === business.business_id,
      ),
    ),
  );

  return {
    id: business.business_id,
    initials: getInitials(name),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    name,
    company:
      company?.commercial_name ||
      company?.company_name ||
      "Sin empresa asignada",
    legalId: business.legal_id || legalEntity?.legal_id || "",
    legalName,
    email: getPrimaryValue(emails, "email"),
    phone: getPrimaryValue(
      phones.filter((phone) => !phone.branch_id),
      "phone",
    ),
    address: legalEntity?.address || clientBranches[0]?.address || "",
    sales: "0 M",
    lastPurchase: "Sin compras",
    status: normalizeStatus(business.is_active),
    totalOrders: 0,
    totalQuotes: 0,
    notes: business.activity_code
      ? `Actividad: ${business.activity_code}`
      : "",
    branches: clientBranches,
  };
}

export async function getBusinessClients() {
  const { data: businesses, error: businessesError } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (businessesError) {
    throw new Error(
      `No fue posible cargar los clientes: ${businessesError.message}`,
    );
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  const businessIds = businesses.map((business) => business.business_id);
  const companyIds = uniqueValues(
    businesses.map((business) => business.company_id),
  );
  const legalEntityIds = uniqueValues(
    businesses.map((business) => business.legal_entity_id),
  );

  const [
    companiesResponse,
    legalEntitiesResponse,
    emailsResponse,
    phonesResponse,
    branchesResponse,
    representativesResponse,
  ] = await Promise.all([
    companyIds.length > 0
      ? supabase
          .from("companies")
          .select("*")
          .in("company_id", companyIds)
      : Promise.resolve({ data: [], error: null }),

    legalEntityIds.length > 0
      ? supabase
          .from("legal_entities")
          .select("*")
          .in("legal_entity_id", legalEntityIds)
      : Promise.resolve({ data: [], error: null }),

    supabase
      .from("emails")
      .select("*")
      .in("business_id", businessIds),

    supabase
      .from("phones")
      .select("*")
      .in("business_id", businessIds),

    supabase
      .from("branches")
      .select("*")
      .in("business_id", businessIds),

    supabase
      .from("representatives")
      .select("*")
      .in("business_id", businessIds),
  ]);

  const errorResponse = [
    companiesResponse,
    legalEntitiesResponse,
    emailsResponse,
    phonesResponse,
    branchesResponse,
    representativesResponse,
  ].find((response) => response?.error);

  if (errorResponse?.error) {
    throw new Error(
      `No fue posible cargar los datos relacionados de clientes: ${errorResponse.error.message}`,
    );
  }

  const companiesById = indexRowsByKey(
    companiesResponse.data || [],
    "company_id",
  );
  const legalEntitiesById = indexRowsByKey(
    legalEntitiesResponse.data || [],
    "legal_entity_id",
  );
  const emailsByBusiness = groupRowsByKey(
    emailsResponse.data || [],
    "business_id",
  );
  const phonesByBusiness = groupRowsByKey(
    phonesResponse.data || [],
    "business_id",
  );
  const branchesByBusiness = groupRowsByKey(
    branchesResponse.data || [],
    "business_id",
  );
  const representativesByBusiness = groupRowsByKey(
    representativesResponse.data || [],
    "business_id",
  );

  return businesses.map((business, index) =>
    createClientItem({
      business,
      company: companiesById[business.company_id],
      legalEntity: legalEntitiesById[business.legal_entity_id],
      emails: emailsByBusiness[business.business_id] || [],
      phones: phonesByBusiness[business.business_id] || [],
      branches: branchesByBusiness[business.business_id] || [],
      representatives:
        representativesByBusiness[business.business_id] || [],
      index,
    }),
  );
}
