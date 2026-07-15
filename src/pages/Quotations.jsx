import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext.js";
import { hasSystemAccess } from "../utils/roles.js";
import {
  getQuotations,
} from "../services/quotationService.js";
import {
  createSalesProductionOrderFromQuotation,
  getSalesOrderDetail,
  getSalesOrders,
} from "../services/orderService.js";
import {
  QUOTATION_STATUSES,
  normalizeQuotationSearch as normalizeSearchText,
} from "../components/quotations/QuotationsViewHelpers.jsx";
import QuotationsPageHeader from "../components/quotations/QuotationsPageHeader.jsx";
import QuotationsFilters from "../components/quotations/QuotationsFilters.jsx";
import QuotationsProductionLists from "../components/quotations/QuotationsProductionLists.jsx";
import QuotationsCharts from "../components/quotations/QuotationsCharts.jsx";
import QuotationsDetails from "../components/quotations/QuotationsDetails.jsx";
import OperationalMetrics from "../components/shared/OperationalMetrics.jsx";

/* --- PÁGINA PRINCIPAL --- */
export default function Quotations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [companyFilter, setCompanyFilter] = useState("Todas");
  const [agentFilter, setAgentFilter] = useState("Todos");
  const [clientFilter, setClientFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quotations, setQuotations] = useState([]);
  const [productionOrders, setProductionOrders] = useState([]);
  const [activeProductionTab, setActiveProductionTab] = useState("quotations");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState(null);
  const [productionOrderDetail, setProductionOrderDetail] = useState(null);
  const [productionOrderDetailLoading, setProductionOrderDetailLoading] = useState(false);
  const [productionOrderDetailError, setProductionOrderDetailError] = useState("");
  const [creatingProductionOrderId, setCreatingProductionOrderId] = useState(null);
  const { user } = useAuth();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setQuotations(
        await getQuotations({
          ownerUserId: hasSystemAccess(user) ? null : user?.id,
        }),
      );
    } catch (loadError) {
      console.error("Quotations loading error:", loadError);
      setError(
        loadError?.message || "No fue posible cargar las cotizaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);


  const loadProductionOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");
      setProductionOrders(await getSalesOrders({ paymentStatuses: [] }));
    } catch (loadError) {
      console.error("Production orders loading error:", loadError);
      setOrdersError(
        loadError?.message || "No fue posible cargar las órdenes de producción.",
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() => {
      loadQuotations();
      loadProductionOrders();
    });
  }, [user, loadQuotations, loadProductionOrders]);

  useEffect(() => {
    let mounted = true;

    async function loadProductionOrderDetail() {
      if (!selectedProductionOrder?.productionOrderId) {
        setProductionOrderDetail(null);
        setProductionOrderDetailError("");
        setProductionOrderDetailLoading(false);
        return;
      }

      try {
        setProductionOrderDetailLoading(true);
        setProductionOrderDetailError("");
        const detail = await getSalesOrderDetail(selectedProductionOrder.productionOrderId);

        if (mounted) {
          setProductionOrderDetail(detail);
        }
      } catch (detailError) {
        if (mounted) {
          console.error("Production order detail loading error:", detailError);
          setProductionOrderDetail(null);
          setProductionOrderDetailError(
            detailError?.message || "No fue posible cargar el detalle de la orden.",
          );
        }
      } finally {
        if (mounted) {
          setProductionOrderDetailLoading(false);
        }
      }
    }

    loadProductionOrderDetail();

    return () => {
      mounted = false;
    };
  }, [selectedProductionOrder]);

  const companyOptions = useMemo(
    () => [
      "Todas",
      ...new Set(quotations.map((quotation) => quotation.company).filter(Boolean)),
    ],
    [quotations],
  );

  const agentOptions = useMemo(
    () => [
      "Todos",
      ...new Set(quotations.map((quotation) => quotation.agent).filter(Boolean)),
    ],
    [quotations],
  );

  const clientOptions = useMemo(
    () => [
      "Todos",
      ...new Set(quotations.map((quotation) => quotation.client).filter(Boolean)),
    ],
    [quotations],
  );

  const statusCounts = useMemo(
    () =>
      quotations.reduce((counts, quotation) => {
        const status = quotation.status || "Pendiente";

        counts[status] = (counts[status] || 0) + 1;

        return counts;
      }, {}),
    [quotations],
  );

  const totalQuotedValue = useMemo(
    () =>
      quotations.reduce(
        (total, quotation) => total + (Number(quotation.total) || 0),
        0,
      ),
    [quotations],
  );

  const companies = [
    "Todas",
    "Textiles de Occidente",
    "Constructora Solís S.A.",
    "Hotel Los Laureles",
    "Pacific Pet Food",
    "Distribuidora del Norte S.A.",
    "Farmacia La Salud",
    "Grupo Alimenticio S.A.",
    "Constructora Víquez",
    "Agro Occidente Group",
    "Occidente Lab",
  ];

  const agents = [
    "Todos",
    "Ana Gómez",
    "Manuel Rojas",
    "Carlos Pérez",
    "Sofía Gómez",
    "Diego Hernández",
    "Laura Gómez",
  ];

  const clients = [
    "Todos",
    "María Fernández",
    "Constructora Solís",
    "Hotel Los Laureles",
    "Pacific Pet Food",
    "Distribuidora del Norte",
    "Farmacia La Salud",
    "Grupo Alimenticio S.A.",
    "Constructora Víquez",
    "Agro Occidente",
    "Occidente Lab",
  ];
  void companies;
  void agents;
  void clients;

  const metrics = [
    {
      label: "COTIZACIONES TOTALES",
      value: String(quotations.length),
      growth: "Base real",
      growthColor: "text-green-400",
      color: "#8b5cf6",
      iconColor: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
    },
    {
      label: "PENDIENTES",
      value: String(statusCounts.Pendiente || 0),
      growth: "Por revisar",
      growthColor: "text-red-400",
      color: "#f59e0b",
      iconColor: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10",
    },
    {
      label: "EN REVISIÓN",
      value: String(statusCounts["En revision"] || statusCounts["En revisión"] || 0),
      growth: "En seguimiento",
      growthColor: "text-green-400",
      color: "#C9A227",
      iconColor: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
    },
    {
      label: "APROBADAS",
      value: String(statusCounts.Aprobada || 0),
      growth: "Confirmadas",
      growthColor: "text-green-400",
      color: "#22c55e",
      iconColor: "text-[#22c55e]",
      bg: "bg-[#22c55e]/10",
    },
    {
      label: "RECHAZADAS",
      value: String(statusCounts.Rechazada || 0),
      growth: "No aceptadas",
      growthColor: "text-red-400",
      color: "#ef4444",
      iconColor: "text-[#ef4444]",
      bg: "bg-[#ef4444]/10",
    },
    {
      label: "VENCIDAS",
      value: String(statusCounts.Vencida || 0),
      growth: "Fuera de vigencia",
      growthColor: "text-green-400",
      color: "#ec4899",
      iconColor: "text-[#ec4899]",
      bg: "bg-[#ec4899]/10",
    },
  ];

  const filtered = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return quotations.filter((quotation) => {
      const quotationDate = quotation.date ? new Date(quotation.date) : null;

      const matchesSearch =
        !normalizedSearch ||
        normalizeSearchText(quotation.number).includes(normalizedSearch) ||
        normalizeSearchText(quotation.client).includes(normalizedSearch) ||
        normalizeSearchText(quotation.company).includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "Todos" || quotation.status === statusFilter;

      const matchesCompany =
        companyFilter === "Todas" || quotation.company === companyFilter;

      const matchesAgent =
        agentFilter === "Todos" || quotation.agent === agentFilter;

      const matchesClient =
        clientFilter === "Todos" || quotation.client === clientFilter;

      const matchesFrom =
        !fromDate ||
        (quotationDate &&
          !Number.isNaN(quotationDate.getTime()) &&
          quotationDate >= fromDate);

      const matchesTo =
        !toDate ||
        (quotationDate &&
          !Number.isNaN(quotationDate.getTime()) &&
          quotationDate <= toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCompany &&
        matchesAgent &&
        matchesClient &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    agentFilter,
    clientFilter,
    companyFilter,
    dateFrom,
    dateTo,
    quotations,
    search,
    statusFilter,
  ]);


  const filteredProductionOrders = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);

    if (!normalizedSearch) return productionOrders;

    return productionOrders.filter((order) =>
      [order.code, order.quotationNumber, order.client, order.agent]
        .some((value) => normalizeSearchText(value).includes(normalizedSearch)),
    );
  }, [productionOrders, search]);
  const openQuotationModal = (quotation) => {
    setSelectedQuotation(quotation);
  };

  const closeQuotationModal = () => {
    setSelectedQuotation(null);
  };

  const closeProductionOrderModal = () => {
    setSelectedProductionOrder(null);
    setProductionOrderDetail(null);
    setProductionOrderDetailError("");
    setShowPaymentForm(false);
    setPaymentError("");
    setPaymentSuccess("");
  };

  const handleCreateProductionOrder = async (quotation) => {
    const quotationId = quotation?.quotationId || quotation?.id;

    if (!quotationId) {
      window.alert("No se encontro la cotizacion para crear la orden de produccion.");
      return;
    }

    const confirmed = window.confirm(
      `Deseas crear una orden de produccion para la cotizacion ${quotation.number}?`,
    );

    if (!confirmed) return;

    try {
      setCreatingProductionOrderId(quotationId);
      await createSalesProductionOrderFromQuotation(quotationId);
      await Promise.all([loadQuotations(), loadProductionOrders()]);
      setActiveProductionTab("orders");
      window.alert("Orden de produccion creada correctamente.");
    } catch (createError) {
      console.error("Production order creation error:", createError);
      window.alert(
        createError?.message || "No fue posible crear la orden de produccion.",
      );
    } finally {
      setCreatingProductionOrderId(null);
    }
  };


  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setCompanyFilter("Todas");
    setAgentFilter("Todos");
    setClientFilter("Todos");
    setDateFrom("");
    setDateTo("");
  };

  const dynamicDonutData = QUOTATION_STATUSES.map((status) => ({
    name: status,
    value: statusCounts[status] || 0,
    count: statusCounts[status] || 0,
  }));
  const drawerOpen = false;
  const drawerMode = "view";
  const viewQuote = selectedQuotation;
  const closeDrawer = closeQuotationModal;

  return (
    <>
      <div className="p-4 lg:p-6">
        {/* Encabezado de la página */}
        <QuotationsPageHeader
          onRefresh={() => {
            loadQuotations();
            loadProductionOrders();
          }}
        />

        {/* Métricas */}
        <OperationalMetrics metrics={metrics} showGrowth />

        <QuotationsFilters
          search={search} setSearch={setSearch}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          companyFilter={companyFilter} setCompanyFilter={setCompanyFilter}
          agentFilter={agentFilter} setAgentFilter={setAgentFilter}
          clientFilter={clientFilter} setClientFilter={setClientFilter}
          dateFrom={dateFrom} setDateFrom={setDateFrom}
          dateTo={dateTo} setDateTo={setDateTo}
          clearFilters={clearFilters}
          error={error} ordersError={ordersError}
          companyOptions={companyOptions}
          agentOptions={agentOptions}
          clientOptions={clientOptions}
        />

        <QuotationsProductionLists
          activeProductionTab={activeProductionTab}
          setActiveProductionTab={setActiveProductionTab}
          filtered={filtered}
          filteredProductionOrders={filteredProductionOrders}
          quotations={quotations}
          productionOrders={productionOrders}
          loading={loading}
          ordersLoading={ordersLoading}
          openQuotationModal={openQuotationModal}
          setSelectedProductionOrder={setSelectedProductionOrder}
          onCreateProductionOrder={handleCreateProductionOrder}
          creatingProductionOrderId={creatingProductionOrderId}
          clearFilters={clearFilters}
        />

        <QuotationsCharts
          dynamicDonutData={dynamicDonutData}
          quotations={quotations}
          totalQuotedValue={totalQuotedValue}
        />
      </div>

      <QuotationsDetails
        drawerOpen={drawerOpen} closeDrawer={closeDrawer}
        drawerMode={drawerMode} viewQuote={viewQuote}
        selectedProductionOrder={selectedProductionOrder}
        closeProductionOrderModal={closeProductionOrderModal}
        productionOrderDetail={productionOrderDetail}
        productionOrderDetailLoading={productionOrderDetailLoading}
        productionOrderDetailError={productionOrderDetailError}
        showPaymentForm={showPaymentForm} setShowPaymentForm={setShowPaymentForm}
        paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods}
        paymentLoading={paymentLoading} setPaymentLoading={setPaymentLoading}
        paymentError={paymentError} setPaymentError={setPaymentError}
        paymentSuccess={paymentSuccess} setPaymentSuccess={setPaymentSuccess}
        selectedQuotation={selectedQuotation}
        closeQuotationModal={closeQuotationModal}
      />
    </>
  );
}
