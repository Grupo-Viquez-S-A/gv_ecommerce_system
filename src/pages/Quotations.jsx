import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext.js";
import {
  hasQuotationAdjustmentAccess,
  isBrandManager,
} from "../utils/roles.js";
import {
  getQuotations,
  deleteQuotation,
  updateQuotationDiscount,
  updateQuotationDeliveryDates,
} from "../services/quotationService.js";
import {
  createSalesProductionOrderFromQuotation,
  deleteProductionOrder,
  getSalesOrderDetail,
  getSalesOrders,
} from "../services/orderService.js";
import { getSalesAgentNames } from "../services/agentService.js";
import {
  normalizeQuotationSearch as normalizeSearchText,
} from "../components/quotations/QuotationsViewHelpers.jsx";
import QuotationsPageHeader from "../components/quotations/QuotationsPageHeader.jsx";
import QuotationsFilters from "../components/quotations/QuotationsFilters.jsx";
import QuotationsProductionLists from "../components/quotations/QuotationsProductionLists.jsx";
import QuotationsDetails from "../components/quotations/QuotationsDetails.jsx";
import OperationalMetrics from "../components/shared/OperationalMetrics.jsx";
import { downloadQuotationProforma } from "../utils/proformaPdf.js";
import { sendQuotationProformaEmail } from "../services/proformaEmailService.js";

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function formatDiscountInput(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "";
  }

  return String(Math.round(numberValue * 100) / 100);
}

/* --- PÁGINA PRINCIPAL --- */
export default function Quotations() {
  const { user } = useAuth();
  const canViewAllProduction = isBrandManager(user);
  const canManageQuotationDates = isBrandManager(user);
  const canManageQuotationDiscounts = hasQuotationAdjustmentAccess(user);
  const [search, setSearch] = useState("");
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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [downloadingQuotationId, setDownloadingQuotationId] = useState(null);
  const [sendingQuotationId, setSendingQuotationId] = useState(null);
  const [quotationDateForm, setQuotationDateForm] = useState({
    committedDeliveryDate: "",
    unexpectedDeliveryDate: "",
  });
  const [quotationDatesSaving, setQuotationDatesSaving] = useState(false);
  const [quotationDatesError, setQuotationDatesError] = useState("");
  const [quotationDatesSuccess, setQuotationDatesSuccess] = useState("");
  const [quotationDiscountForm, setQuotationDiscountForm] = useState({
    discountPercentage: "",
    discountAmount: "",
  });
  const [quotationDiscountSaving, setQuotationDiscountSaving] = useState(false);
  const [quotationDiscountError, setQuotationDiscountError] = useState("");
  const [quotationDiscountSuccess, setQuotationDiscountSuccess] = useState("");
  const [agentOptions, setAgentOptions] = useState(["Todos"]);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setQuotations(
        await getQuotations({
          ownerUserId: canViewAllProduction ? null : user?.id,
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
  }, [canViewAllProduction, user]);


  const loadProductionOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");
      setProductionOrders(
        await getSalesOrders({
          paymentStatuses: [],
          ownerUserId: canViewAllProduction ? null : user?.id,
        }),
      );
    } catch (loadError) {
      console.error("Production orders loading error:", loadError);
      setOrdersError(
        loadError?.message || "No fue posible cargar las órdenes de producción.",
      );
    } finally {
      setOrdersLoading(false);
    }
  }, [canViewAllProduction, user]);
  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() => {
      loadQuotations();
      loadProductionOrders();
    });
  }, [user, loadQuotations, loadProductionOrders]);

  useEffect(() => {
    let mounted = true;

    async function loadAgentOptions() {
      try {
        const names = await getSalesAgentNames();

        if (mounted) {
          setAgentOptions(["Todos", ...names]);
        }
      } catch (loadError) {
        console.error("Sales agents loading error:", loadError);

        if (mounted) {
          setAgentOptions(["Todos"]);
        }
      }
    }

    loadAgentOptions();

    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setQuotationDateForm({
        committedDeliveryDate: toDateInputValue(
          selectedQuotation?.committedDeliveryDate,
        ),
        unexpectedDeliveryDate: toDateInputValue(
          selectedQuotation?.unexpectedDeliveryDate,
        ),
      });
      setQuotationDatesError("");
      setQuotationDatesSuccess("");
      setQuotationDiscountForm({
        discountPercentage: formatDiscountInput(
          selectedQuotation?.discountPercentage || 0,
        ),
        discountAmount: formatDiscountInput(
          selectedQuotation?.discountAmount || 0,
        ),
      });
      setQuotationDiscountError("");
      setQuotationDiscountSuccess("");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedQuotation]);

  const companyOptions = useMemo(
    () => [
      "Todas",
      ...new Set(quotations.map((quotation) => quotation.company).filter(Boolean)),
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
      label: "VALOR COTIZADO",
      value: new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
      }).format(totalQuotedValue),
      growth: "Monto total",
      growthColor: "text-green-400",
      color: "#C9A227",
      iconColor: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
    },
    {
      label: "CLIENTES",
      value: String(new Set(quotations.map((quotation) => quotation.client).filter(Boolean)).size),
      growth: "Con cotizaciones",
      growthColor: "text-green-400",
      color: "#22c55e",
      iconColor: "text-[#22c55e]",
      bg: "bg-[#22c55e]/10",
    },
    {
      label: "ÓRDENES DE PRODUCCIÓN",
      value: String(productionOrders.length),
      growth: "Generadas desde cotizaciones",
      growthColor: "text-green-400",
      color: "#14b8a6",
      iconColor: "text-[#14b8a6]",
      bg: "bg-[#14b8a6]/10",
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

  const handleDownloadProforma = async (quotation) => {
    if (!quotation) return;

    const quotationId = quotation.quotationId || quotation.id;

    try {
      setDownloadingQuotationId(quotationId);
      await downloadQuotationProforma(quotation);
    } catch (downloadError) {
      console.error("Quotation proforma download error:", downloadError);
      window.alert("No fue posible generar la proforma. Intenta de nuevo.");
    } finally {
      setDownloadingQuotationId(null);
    }
  };

  const handleSendProforma = async (quotation) => {
    if (!quotation) return;

    const quotationId = quotation.quotationId || quotation.id;

    try {
      setSendingQuotationId(quotationId);
      const result = await sendQuotationProformaEmail(quotation);
      window.alert(result?.message || "La proforma fue enviada correctamente al cliente.");
    } catch (sendError) {
      console.error("Quotation proforma email error:", sendError);
      window.alert(sendError?.message || "No fue posible enviar la proforma por correo.");
    } finally {
      setSendingQuotationId(null);
    }
  };

  const closeProductionOrderModal = () => {
    setSelectedProductionOrder(null);
    setProductionOrderDetail(null);
    setProductionOrderDetailError("");
    setShowPaymentForm(false);
    setPaymentError("");
    setPaymentSuccess("");
  };

  const handleQuotationDateFieldChange = (field, value) => {
    setQuotationDateForm((current) => ({
      ...current,
      [field]: value,
    }));
    setQuotationDatesError("");
    setQuotationDatesSuccess("");
  };

  const handleSaveQuotationDates = async () => {
    const quotationId = selectedQuotation?.quotationId || selectedQuotation?.id;

    if (!quotationId) return;

    try {
      setQuotationDatesSaving(true);
      setQuotationDatesError("");
      setQuotationDatesSuccess("");

      const updatedQuotation = await updateQuotationDeliveryDates(
        quotationId,
        quotationDateForm,
      );

      setQuotations((current) =>
        current.map((quotation) =>
          (quotation.quotationId || quotation.id) === quotationId
            ? {
                ...quotation,
                committedDeliveryDate:
                  updatedQuotation.committed_delivery_date || null,
                unexpectedDeliveryDate:
                  updatedQuotation.unexpected_delivery_date || null,
              }
            : quotation,
        ),
      );

      setSelectedQuotation((current) =>
        current
          ? {
              ...current,
              committedDeliveryDate:
                updatedQuotation.committed_delivery_date || null,
              unexpectedDeliveryDate:
                updatedQuotation.unexpected_delivery_date || null,
            }
          : current,
      );

      if (
        selectedProductionOrder?.quotationId &&
        selectedProductionOrder.quotationId === quotationId
      ) {
        const refreshedDetail = await getSalesOrderDetail(
          selectedProductionOrder.productionOrderId,
        );
        setProductionOrderDetail(refreshedDetail);
      }

      setQuotationDatesSuccess("Fechas de entrega actualizadas correctamente.");
    } catch (saveError) {
      console.error("Quotation delivery dates update error:", saveError);
      setQuotationDatesError(
        saveError?.message ||
          "No fue posible guardar las fechas de entrega de la cotizacion.",
      );
    } finally {
      setQuotationDatesSaving(false);
    }
  };

  const handleQuotationDiscountFieldChange = (field, value) => {
    const subtotal = Math.max(0, Number(selectedQuotation?.subtotal) || 0);
    const numberValue = Number(value);

    setQuotationDiscountForm((current) => {
      if (field === "discountPercentage") {
        const safePercentage = Number.isFinite(numberValue)
          ? Math.min(100, Math.max(0, numberValue))
          : "";
        const nextAmount =
          subtotal > 0 && safePercentage !== ""
            ? formatDiscountInput(subtotal * (safePercentage / 100))
            : "";

        return {
          ...current,
          discountPercentage: value,
          discountAmount: nextAmount,
        };
      }

      const safeAmount = Number.isFinite(numberValue)
        ? Math.min(subtotal, Math.max(0, numberValue))
        : "";
      const nextPercentage =
        subtotal > 0 && safeAmount !== ""
          ? formatDiscountInput((safeAmount / subtotal) * 100)
          : "";

      return {
        ...current,
        discountAmount: value,
        discountPercentage: nextPercentage,
      };
    });
    setQuotationDiscountError("");
    setQuotationDiscountSuccess("");
  };

  const handleSaveQuotationDiscount = async () => {
    const quotationId = selectedQuotation?.quotationId || selectedQuotation?.id;

    if (!quotationId) return;

    try {
      setQuotationDiscountSaving(true);
      setQuotationDiscountError("");
      setQuotationDiscountSuccess("");

      const updatedQuotation = await updateQuotationDiscount(quotationId, {
        discountPercentage: quotationDiscountForm.discountPercentage,
      });

      const mappedUpdates = {
        discountPercentage:
          updatedQuotation.discount_percentage ?? 0,
        discountAmount: updatedQuotation.discount_amount ?? 0,
        ivaAmount: updatedQuotation.iva_amount ?? 0,
        total: updatedQuotation.total ?? 0,
        advancePayment: updatedQuotation.advance_payment ?? 0,
      };

      setQuotations((current) =>
        current.map((quotation) =>
          (quotation.quotationId || quotation.id) === quotationId
            ? { ...quotation, ...mappedUpdates }
            : quotation,
        ),
      );

      setSelectedQuotation((current) =>
        current ? { ...current, ...mappedUpdates } : current,
      );

      setQuotationDiscountForm({
        discountPercentage: formatDiscountInput(
          mappedUpdates.discountPercentage,
        ),
        discountAmount: formatDiscountInput(mappedUpdates.discountAmount),
      });
      setQuotationDiscountSuccess("Descuento actualizado correctamente.");
    } catch (saveError) {
      console.error("Quotation discount update error:", saveError);
      setQuotationDiscountError(
        saveError?.message ||
          "No fue posible guardar el descuento de la cotizacion.",
      );
    } finally {
      setQuotationDiscountSaving(false);
    }
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

  const handleDeleteQuotation = async (quotation) => {
    const quotationId = quotation?.quotationId || quotation?.id;

    if (!quotationId) {
      window.alert("No se encontro la cotizacion a eliminar.");
      return;
    }

    const confirmed = window.confirm(
      `Deseas eliminar la cotizacion ${quotation.number}? Si tiene una orden de produccion activa asociada, tambien sera desactivada.`,
    );

    if (!confirmed) return;

    try {
      await deleteQuotation(quotationId);
      if ((selectedQuotation?.quotationId || selectedQuotation?.id) === quotationId) {
        setSelectedQuotation(null);
      }
      if (selectedProductionOrder?.quotationId === quotationId) {
        closeProductionOrderModal();
      }
      await Promise.all([loadQuotations(), loadProductionOrders()]);
      window.alert("Cotizacion eliminada correctamente.");
    } catch (deleteError) {
      console.error("Quotation deletion error:", deleteError);
      window.alert(
        deleteError?.message || "No fue posible eliminar la cotizacion.",
      );
    }
  };

  const handleDeleteProductionOrder = async (order) => {
    const productionOrderId = order?.productionOrderId || order?.id;

    if (!productionOrderId) {
      window.alert("No se encontro la orden de produccion a eliminar.");
      return;
    }

    const confirmed = window.confirm(
      `Deseas eliminar la orden de produccion ${order.code}?`,
    );

    if (!confirmed) return;

    try {
      await deleteProductionOrder(productionOrderId);
      if (
        (selectedProductionOrder?.productionOrderId || selectedProductionOrder?.id) ===
        productionOrderId
      ) {
        closeProductionOrderModal();
      }
      await Promise.all([loadQuotations(), loadProductionOrders()]);
      window.alert("Orden de produccion eliminada correctamente.");
    } catch (deleteError) {
      console.error("Production order deletion error:", deleteError);
      window.alert(
        deleteError?.message || "No fue posible eliminar la orden de produccion.",
      );
    }
  };


  const clearFilters = () => {
    setSearch("");
    setCompanyFilter("Todas");
    setAgentFilter("Todos");
    setClientFilter("Todos");
    setDateFrom("");
    setDateTo("");
  };

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
          showAgentFilter={canViewAllProduction}
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
          onDownloadQuotation={handleDownloadProforma}
          downloadingQuotationId={downloadingQuotationId}
          onSendQuotation={handleSendProforma}
          sendingQuotationId={sendingQuotationId}
          onDeleteQuotation={handleDeleteQuotation}
          onDeleteProductionOrder={handleDeleteProductionOrder}
          clearFilters={clearFilters}
        />

      </div>

      <QuotationsDetails
        manageProduction={canManageQuotationDates}
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
        quotationDateForm={quotationDateForm}
        onQuotationDateFieldChange={handleQuotationDateFieldChange}
        onSaveQuotationDates={handleSaveQuotationDates}
        quotationDatesSaving={quotationDatesSaving}
        quotationDatesError={quotationDatesError}
        quotationDatesSuccess={quotationDatesSuccess}
        canManageQuotationDiscounts={canManageQuotationDiscounts}
        quotationDiscountForm={quotationDiscountForm}
        onQuotationDiscountFieldChange={handleQuotationDiscountFieldChange}
        onSaveQuotationDiscount={handleSaveQuotationDiscount}
        quotationDiscountSaving={quotationDiscountSaving}
        quotationDiscountError={quotationDiscountError}
        quotationDiscountSuccess={quotationDiscountSuccess}
        closeQuotationModal={closeQuotationModal}
        onDownloadQuotation={handleDownloadProforma}
        downloadingQuotationId={downloadingQuotationId}
        onSendQuotation={handleSendProforma}
        sendingQuotationId={sendingQuotationId}
      />
    </>
  );
}
