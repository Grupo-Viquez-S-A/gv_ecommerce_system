import { supabase } from "./primarySupabaseClient.js";
import { getPaidSales } from "./salesService.js";
import { formatRelativeDateTimeCR } from "../utils/dateUtils.js";

const COMPANY_COLORS = [
  "#6366f1",
  "#22c55e",
  "#ec4899",
  "#C9A227",
  "#f59e0b",
  "#14b8a6",
  "#a855f7",
  "#ef4444",
];

const CANCELLED_ORDER_STATUSES = ["cancelada", "cancelado"];
const FINISHED_ORDER_STATUSES = ["finalizada", ...CANCELLED_ORDER_STATUSES];
const INACTIVE_QUOTATION_STATES = [
  "converted",
  "rejected",
  "expired",
  "cancelled",
  "cancelada",
];

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

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

function formatMillions(amount) {
  return Math.round(((Number(amount) || 0) / 1_000_000) * 1000) / 1000;
}

function formatCurrency(amount) {
  const millions = (Number(amount) || 0) / 1_000_000;

  if (millions >= 1) {
    return `₡${millions.toFixed(millions >= 10 ? 0 : 1)} M`;
  }

  return `₡${Math.round(Number(amount) || 0).toLocaleString("es-CR")}`;
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

/**
 * Loads the `companies` catalog and assigns a deterministic display color to
 * each one. Today only one company will typically have data, but the shape
 * supports several without any code changes once more companies get sales.
 */
export async function getCompanies() {
  const companies = throwIfError(
    await supabase
      .from("companies")
      .select("company_id, company_name, commercial_name, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    "No fue posible cargar las empresas",
  );

  return companies.map((company, index) => ({
    id: company.company_id,
    name: company.commercial_name || company.company_name || "Sin nombre",
    color: COMPANY_COLORS[index % COMPANY_COLORS.length],
  }));
}

async function getBusinessesCompanyMap() {
  const businesses = throwIfError(
    await supabase.from("customers").select("business_id:customer_id, company_id"),
    "No fue posible cargar los clientes para calcular las ventas por empresa",
  );

  return indexRowsByKey(businesses, "business_id");
}

/**
 * Attaches a company_id/company name to each paid sale by resolving the
 * sale's customer_id -> customers.company_id -> companies.
 */
async function getPaidSalesWithCompany() {
  const [sales, businessesById, companies] = await Promise.all([
    getPaidSales(),
    getBusinessesCompanyMap(),
    getCompanies(),
  ]);

  const companiesById = indexRowsByKey(companies, "id");

  const salesWithCompany = sales.map((sale) => {
    const business = businessesById[sale.businessId] || null;
    const company = business ? companiesById[business.company_id] : null;

    return {
      ...sale,
      companyId: business?.company_id || null,
      companyName: company?.name || "Sin empresa asignada",
      companyColor: company?.color || COMPANY_COLORS[0],
    };
  });

  return { sales: salesWithCompany, companies };
}

/**
 * DashboardStats: totals for active clients, consolidated paid sales,
 * active quotations and active production orders.
 */
export async function getDashboardStats() {
  const [
    { count: clientsCount, error: clientsError },
    { data: quotations, error: quotationsError },
    { data: orders, error: ordersError },
    sales,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("customer_id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("quotations")
      .select("quotation_id, state, status")
      .eq("is_active", true),
    supabase
      .from("production_orders")
      .select("production_order_id, production_order_status")
      .eq("is_active", true),
    getPaidSales(),
  ]);

  if (clientsError) {
    throw new Error(`No fue posible cargar los clientes: ${clientsError.message}`);
  }

  if (quotationsError) {
    throw new Error(
      `No fue posible cargar las cotizaciones: ${quotationsError.message}`,
    );
  }

  if (ordersError) {
    throw new Error(`No fue posible cargar las órdenes: ${ordersError.message}`);
  }

  const activeQuotations = (quotations || []).filter((quotation) => {
    const state = String(quotation.state || quotation.status || "").toLowerCase();

    return !INACTIVE_QUOTATION_STATES.includes(state);
  }).length;

  const activeOrders = (orders || []).filter((order) => {
    const status = String(order.production_order_status || "").toLowerCase();

    return !FINISHED_ORDER_STATUSES.includes(status);
  }).length;

  const totalSalesAmount = sales.reduce(
    (sum, sale) => sum + getNumber(sale.total, 0),
    0,
  );

  return {
    totalClients: clientsCount || 0,
    totalSalesAmount,
    totalSalesLabel: formatCurrency(totalSalesAmount),
    activeQuotations,
    activeOrders,
  };
}

/**
 * ConsolidatedSalesChart: paid sales grouped by month (last 6 months with
 * data) and broken down by company. If there is a single company, only one
 * series will contain values, which keeps the stacked bar chart working
 * unchanged.
 */
export async function getConsolidatedSalesByMonth() {
  const { sales, companies } = await getPaidSalesWithCompany();

  const monthBuckets = new Map();

  sales.forEach((sale) => {
    const saleDate = sale.saleDate ? new Date(sale.saleDate) : null;

    if (!saleDate || Number.isNaN(saleDate.getTime())) {
      return;
    }

    const monthKey = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;

    if (!monthBuckets.has(monthKey)) {
      monthBuckets.set(monthKey, {
        key: monthKey,
        year: saleDate.getFullYear(),
        month: saleDate.getMonth(),
        name: MONTH_LABELS[saleDate.getMonth()],
        totalsByCompany: {},
      });
    }

    const bucket = monthBuckets.get(monthKey);
    const companyId = sale.companyId || "sin-empresa";

    bucket.totalsByCompany[companyId] =
      (bucket.totalsByCompany[companyId] || 0) + getNumber(sale.total, 0);
  });

  const orderedBuckets = [...monthBuckets.values()]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-6);

  const data = orderedBuckets.map((bucket) => {
    const row = { name: bucket.name };

    companies.forEach((company) => {
      row[company.id] = formatMillions(bucket.totalsByCompany[company.id] || 0);
    });

    return row;
  });

  const legendItems = companies.map((company) => ({
    id: company.id,
    name: company.name,
    color: company.color,
  }));

  const totalSales = sales.reduce((sum, sale) => sum + getNumber(sale.total, 0), 0);

  return {
    data,
    legendItems,
    totalLabel: formatCurrency(totalSales),
  };
}

/**
 * SalesDistributionChart: donut with paid sales distributed by company.
 */
export async function getSalesDistributionByCompany() {
  const { sales, companies } = await getPaidSalesWithCompany();

  const totalsByCompany = {};

  sales.forEach((sale) => {
    const companyId = sale.companyId || "sin-empresa";

    totalsByCompany[companyId] =
      (totalsByCompany[companyId] || 0) + getNumber(sale.total, 0);
  });

  const data = companies
    .map((company) => ({
      id: company.id,
      name: company.name,
      value: formatMillions(totalsByCompany[company.id] || 0),
      color: company.color,
    }))
    .filter((item) => item.value > 0);

  const totalSales = sales.reduce((sum, sale) => sum + getNumber(sale.total, 0), 0);

  return {
    data,
    totalLabel: formatCurrency(totalSales),
  };
}

/**
 * TopClients: top customers ranked by paid sales amount.
 */
export async function getTopClients(limit = 5) {
  const { sales } = await getPaidSalesWithCompany();

  const totalsByClient = new Map();

  sales.forEach((sale) => {
    const key = sale.client || "Cliente sin nombre";
    const existing = totalsByClient.get(key) || {
      name: key,
      company: sale.companyName,
      amount: 0,
    };

    existing.amount += getNumber(sale.total, 0);
    totalsByClient.set(key, existing);
  });

  return [...totalsByClient.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((client, index) => ({
      id: `${client.name}-${index}`,
      rank: index + 1,
      name: client.name,
      company: client.company,
      amount: formatCurrency(client.amount),
    }));
}

/**
 * AdvisorRanking: internal sellers/representatives ranked by paid sales
 * amount. `percentage` is relative to the top performer of the list since
 * there is no sales-goal table to compare against.
 */
export async function getAdvisorRanking(limit = 5) {
  const { sales } = await getPaidSalesWithCompany();

  const totalsByAdvisor = new Map();

  sales.forEach((sale) => {
    const key = sale.representative || "Sin asignar";
    const existing = totalsByAdvisor.get(key) || {
      name: key,
      role: "Vendedor",
      company: sale.companyName,
      amount: 0,
    };

    existing.amount += getNumber(sale.total, 0);
    totalsByAdvisor.set(key, existing);
  });

  const ranked = [...totalsByAdvisor.values()].sort(
    (a, b) => b.amount - a.amount,
  );

  const topAmount = ranked[0]?.amount || 0;

  return ranked.slice(0, limit).map((advisor, index) => ({
    id: `${advisor.name}-${index}`,
    name: advisor.name,
    role: advisor.role,
    company: advisor.company,
    amount: formatCurrency(advisor.amount),
    percentage:
      topAmount > 0 ? Math.round((advisor.amount / topAmount) * 100) : 0,
  }));
}

/**
 * CompanyPerformance: paid sales grouped by company. `percentage` is
 * relative to the best-performing company in the list.
 */
export async function getCompanyPerformance() {
  const { sales, companies } = await getPaidSalesWithCompany();

  const totalsByCompany = {};

  sales.forEach((sale) => {
    const companyId = sale.companyId || "sin-empresa";

    totalsByCompany[companyId] =
      (totalsByCompany[companyId] || 0) + getNumber(sale.total, 0);
  });

  const performance = companies.map((company) => ({
    id: company.id,
    name: company.name,
    color: company.color,
    amountRaw: totalsByCompany[company.id] || 0,
  }));

  const topAmount = Math.max(...performance.map((item) => item.amountRaw), 0);

  return performance
    .filter((item) => item.amountRaw > 0)
    .sort((a, b) => b.amountRaw - a.amountRaw)
    .map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      amount: formatCurrency(item.amountRaw),
      percentage:
        topAmount > 0 ? Math.round((item.amountRaw / topAmount) * 100) : 0,
    }));
}

/**
 * RecentActivity: latest quotations, confirmed orders and new clients,
 * merged and sorted by date.
 */
export async function getRecentActivity(limit = 6) {
  const [
    { data: quotations, error: quotationsError },
    { data: orders, error: ordersError },
    { data: businesses, error: businessesError },
  ] = await Promise.all([
    supabase
      .from("quotations")
      .select("quotation_id, quotation_number, business_id:customer_id, user_id, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("production_orders")
      .select(
        "production_order_id, production_order_code, quotation_id, production_order_status, created_at",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("customers")
      .select("business_id:customer_id, business_name:commercial_name, legal_name:company_name, company_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (quotationsError || ordersError || businessesError) {
    throw new Error(
      `No fue posible cargar la actividad reciente: ${
        (quotationsError || ordersError || businessesError).message
      }`,
    );
  }

  const businessIds = [
    ...new Set(
      [
        ...(quotations || []).map((quotation) => quotation.business_id),
        ...(businesses || []).map((business) => business.business_id),
      ].filter(Boolean),
    ),
  ];

  const quotationIds = [
    ...new Set((orders || []).map((order) => order.quotation_id).filter(Boolean)),
  ];

  const sellerIds = [
    ...new Set((quotations || []).map((quotation) => quotation.user_id).filter(Boolean)),
  ];

  const [businessesResponse, quotationsForOrdersResponse, sellersResponse] =
    await Promise.all([
      businessIds.length
        ? supabase
            .from("customers")
            .select("business_id:customer_id, business_name:commercial_name, legal_name:company_name")
            .in("customer_id", businessIds)
        : Promise.resolve({ data: [], error: null }),
      quotationIds.length
        ? supabase
            .from("quotations")
            .select("quotation_id, business_id:customer_id, quotation_number")
            .in("quotation_id", quotationIds)
        : Promise.resolve({ data: [], error: null }),
      sellerIds.length
        ? supabase
            .from("profiles")
            .select("user_id, name, surname, email")
            .in("user_id", sellerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const businessesById = indexRowsByKey(businessesResponse.data || [], "business_id");
  const quotationsById = indexRowsByKey(
    quotationsForOrdersResponse.data || [],
    "quotation_id",
  );
  const sellersById = indexRowsByKey(sellersResponse.data || [], "user_id");

  function clientNameFor(businessId) {
    const business = businessesById[businessId];

    return business?.business_name || business?.legal_name || "Cliente";
  }

  function sellerNameFor(userId) {
    const seller = sellersById[userId];

    return (
      [seller?.name, seller?.surname].filter(Boolean).join(" ") ||
      seller?.email ||
      "El equipo"
    );
  }

  const activities = [
    ...(quotations || []).map((quotation) => ({
      id: `quotation-${quotation.quotation_id}`,
      user: sellerNameFor(quotation.user_id),
      action: "generó una cotización para",
      target: clientNameFor(quotation.business_id),
      time: quotation.created_at,
      icon: "file",
    })),
    ...(orders || []).map((order) => ({
      id: `order-${order.production_order_id}`,
      user: "Producción",
      action:
        order.production_order_status === "cancelada"
          ? "canceló el pedido"
          : "confirmó el pedido",
      target: quotationsById[order.quotation_id]
        ? clientNameFor(quotationsById[order.quotation_id].business_id)
        : order.production_order_code || "una orden",
      time: order.created_at,
      icon: "cart",
    })),
    ...(businesses || []).map((business) => ({
      id: `business-${business.business_id}`,
      user: "Sistema",
      action: "agregó un nuevo cliente",
      target: business.business_name || business.legal_name || "Cliente",
      time: business.created_at,
      icon: "user",
    })),
  ];

  return activities
    .filter((activity) => activity.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)
    .map((activity) => ({
      ...activity,
      time: formatRelativeTime(activity.time),
    }));
}

function formatRelativeTime(isoDate) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatRelativeDateTimeCR(date);
}

/**
 * Loads every dataset the dashboard needs in parallel. Individual sections
 * still get their own error since Promise.allSettled is used.
 */
export async function getDashboardOverview() {
  const [
    statsResult,
    salesChartResult,
    distributionResult,
    topClientsResult,
    advisorRankingResult,
    companyPerformanceResult,
    recentActivityResult,
  ] = await Promise.allSettled([
    getDashboardStats(),
    getConsolidatedSalesByMonth(),
    getSalesDistributionByCompany(),
    getTopClients(),
    getAdvisorRanking(),
    getCompanyPerformance(),
    getRecentActivity(),
  ]);

  function unwrap(result) {
    if (result.status === "fulfilled") {
      return { data: result.value, error: null };
    }

    return { data: null, error: result.reason?.message || "Error desconocido" };
  }

  return {
    stats: unwrap(statsResult),
    salesChart: unwrap(salesChartResult),
    distribution: unwrap(distributionResult),
    topClients: unwrap(topClientsResult),
    advisorRanking: unwrap(advisorRankingResult),
    companyPerformance: unwrap(companyPerformanceResult),
    recentActivity: unwrap(recentActivityResult),
  };
}
