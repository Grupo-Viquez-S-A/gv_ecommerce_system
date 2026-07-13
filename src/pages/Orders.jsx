import { useEffect, useMemo, useState } from "react";

import {
  getSalesOrders,
  updateProductionOrderPenaltyPercentage,
} from "../services/orderService.js";
import {
  getOrderPayments,
  importOrderPayments,
} from "../services/paymentService.js";
import { useAuth } from "../context/AuthContext.js";
import { hasSystemAccess } from "../utils/roles.js";
import {
  buildDailyOrdersData,
  formatOrderCurrency as formatCurrency,
} from "../components/orders/OrdersViewHelpers.jsx";
import OrdersPageHeader from "../components/orders/OrdersPageHeader.jsx";
import OrdersChart from "../components/orders/OrdersChart.jsx";
import OrdersFilters from "../components/orders/OrdersFilters.jsx";
import OrdersList from "../components/orders/OrdersList.jsx";
import OrderDetailsDrawer from "../components/orders/OrderDetailsDrawer.jsx";
import OrderPaymentsDrawer from "../components/orders/OrderPaymentsDrawer.jsx";
import OperationalMetrics from "../components/shared/OperationalMetrics.jsx";

/* --- PÁGINA PRINCIPAL --- */
export default function Orders() {
  const { user } = useAuth();
  const canManagePenalty = hasSystemAccess(user);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [agentFilter, setAgentFilter] = useState("Todos");
  const [nextPaymentFrom, setNextPaymentFrom] = useState("");
  const [nextPaymentTo, setNextPaymentTo] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const [paymentsDrawerOpen, setPaymentsDrawerOpen] = useState(false);
  const [orderPayments, setOrderPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [penaltyPercentageInput, setPenaltyPercentageInput] = useState("");
  const [penaltySaving, setPenaltySaving] = useState(false);
  const [penaltyError, setPenaltyError] = useState(null);
  const [penaltySuccess, setPenaltySuccess] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const salesOrders = await getSalesOrders();
      setOrders(salesOrders);
    } catch (error) {
      setLoadError(
        error?.message ||
          "No fue posible cargar las ordenes de venta pendientes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const agents = useMemo(() => {
    const uniqueAgents = [
      ...new Set(orders.map((order) => order.agent).filter(Boolean)),
    ];

    return ["Todos", ...uniqueAgents];
  }, [orders]);

  const dailyOrdersData = useMemo(() => buildDailyOrdersData(orders), [orders]);

  const paymentSummary = useMemo(() => {
    const amountReported = orderPayments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0,
    );
    const amountValidated = orderPayments
      .filter((payment) => payment.isValid)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const pendingPayments = orderPayments.filter(
      (payment) => !payment.isValid,
    ).length;
    const receiptCount = orderPayments.reduce(
      (sum, payment) => sum + (payment.receipts?.length || 0),
      0,
    );

    return {
      amountReported,
      amountValidated,
      pendingPayments,
      receiptCount,
    };
  }, [orderPayments]);

  const metrics = useMemo(() => {
    const totalVentas = orders.reduce((sum, order) => sum + order.total, 0);
    const pendientesDePago = orders.filter(
      (order) => order.paymentStatus === "pendiente",
    ).length;
    const pagoAdelantado = orders.filter(
      (order) => order.paymentStatus === "parcial",
    ).length;
    const enProceso = orders.filter(
      (order) => order.productionStatus === "en_proceso",
    ).length;
    const saldoPendiente = orders.reduce(
      (sum, order) => sum + order.balance,
      0,
    );

    return [
      {
        label: "ORDENES PENDIENTES DE PAGO",
        value: String(pendientesDePago),
        color: "#ef4444",
        bg: "bg-red-500/10",
        iconColor: "text-red-400",
      },
      {
        label: "ORDENES CON PAGO ADELANTADO",
        value: String(pagoAdelantado),
        color: "#f59e0b",
        bg: "bg-[#f59e0b]/10",
        iconColor: "text-[#f59e0b]",
      },
      {
        label: "TOTAL DE ORDENES",
        value: String(orders.length),
        color: "#C9A227",
        bg: "bg-[#C9A227]/10",
        iconColor: "text-[#C9A227]",
      },
      {
        label: "EN PROCESO DE PRODUCCION",
        value: String(enProceso),
        color: "#f97316",
        bg: "bg-[#f97316]/10",
        iconColor: "text-[#f97316]",
      },
      {
        label: "VENTAS EN ESTAS ORDENES",
        value: formatCurrency(totalVentas),
        color: "#22c55e",
        bg: "bg-[#22c55e]/10",
        iconColor: "text-[#22c55e]",
      },
      {
        label: "SALDO PENDIENTE",
        value: formatCurrency(saldoPendiente),
        color: "#6366f1",
        bg: "bg-[#6366f1]/10",
        iconColor: "text-[#6366f1]",
      },
    ];
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = search.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      order.code.toLowerCase().includes(normalizedSearch) ||
      order.quotationNumber.toLowerCase().includes(normalizedSearch) ||
      order.client.toLowerCase().includes(normalizedSearch);

    const matchesPayment =
      paymentFilter === "Todos" || order.paymentStatus === paymentFilter;

    const matchesAgent = agentFilter === "Todos" || order.agent === agentFilter;

    const nextPaymentTime = order.nextPaymentDate
      ? new Date(order.nextPaymentDate).getTime()
      : null;

    const matchesNextPaymentFrom =
      !nextPaymentFrom ||
      (nextPaymentTime !== null &&
        !Number.isNaN(nextPaymentTime) &&
        nextPaymentTime >= new Date(`${nextPaymentFrom}T00:00:00`).getTime());

    const matchesNextPaymentTo =
      !nextPaymentTo ||
      (nextPaymentTime !== null &&
        !Number.isNaN(nextPaymentTime) &&
        nextPaymentTime <= new Date(`${nextPaymentTo}T23:59:59`).getTime());

    return (
      matchesSearch &&
      matchesPayment &&
      matchesAgent &&
      matchesNextPaymentFrom &&
      matchesNextPaymentTo
    );
  });

  const openViewDrawer = (order) => {
    setViewOrder(order);
    setPenaltyPercentageInput(String(order.penaltyPercentage ?? 0));
    setPenaltyError(null);
    setPenaltySuccess(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPaymentsDrawerOpen(false);

    window.setTimeout(() => {
      setViewOrder(null);
      setOrderPayments([]);
      setPaymentsError(null);
      setImportResult(null);
      setPenaltyError(null);
      setPenaltySuccess(null);
    }, 300);
  };

  const handleSavePenaltyPercentage = async () => {
    if (!viewOrder) {
      return;
    }

    setPenaltyError(null);
    setPenaltySuccess(null);
    setPenaltySaving(true);

    try {
      const updatedPercentage = await updateProductionOrderPenaltyPercentage(
        viewOrder.productionOrderId,
        penaltyPercentageInput,
      );

      setViewOrder((current) =>
        current
          ? { ...current, penaltyPercentage: updatedPercentage }
          : current,
      );
      setPenaltySuccess("Porcentaje de penalizacion actualizado.");
      await loadOrders();
    } catch (error) {
      setPenaltyError(
        error?.message ||
          "No fue posible actualizar el porcentaje de penalizacion.",
      );
    } finally {
      setPenaltySaving(false);
    }
  };

  const openPaymentsDrawer = async (order) => {
    setImportResult(null);
    setPaymentsError(null);
    setPaymentsDrawerOpen(true);
    setPaymentsLoading(true);

    try {
      const payments = await getOrderPayments(order.productionOrderId);
      setOrderPayments(payments);
      setExpandedPaymentId(
        payments.length > 0 ? payments[0].paymentId : null,
      );
    } catch (error) {
      setPaymentsError(
        error?.message || "No fue posible cargar los pagos de la orden.",
      );
    } finally {
      setPaymentsLoading(false);
    }
  };

  const closePaymentsDrawer = () => {
    setPaymentsDrawerOpen(false);

    window.setTimeout(() => {
      setOrderPayments([]);
      setPaymentsError(null);
      setImportResult(null);
      setExpandedPaymentId(null);
    }, 300);
  };

  const handleImportPayments = async () => {
    if (!viewOrder) {
      return;
    }

    setImporting(true);
    setPaymentsError(null);

    try {
      const result = await importOrderPayments(viewOrder.productionOrderId);
      setImportResult(result);

      const payments = await getOrderPayments(viewOrder.productionOrderId);
      setOrderPayments(payments);

      await loadOrders();
    } catch (error) {
      setPaymentsError(
        error?.message || "No fue posible importar los comprobantes de pago.",
      );
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("Todos");
    setAgentFilter("Todos");
    setNextPaymentFrom("");
    setNextPaymentTo("");
  };

  return (
    <>
      <div className="p-4 lg:p-6">
        {/* Encabezado */}
        <OrdersPageHeader onRefresh={loadOrders} />

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {loadError}
          </div>
        )}

        {/* Métricas */}
        <OperationalMetrics metrics={metrics} />

        {/* Gráfico */}
        <OrdersChart data={dailyOrdersData} />

        {/* Filtros */}
        <OrdersFilters
          search={search}
          payment={paymentFilter}
          agent={agentFilter}
          agents={agents}
          dateFrom={nextPaymentFrom}
          dateTo={nextPaymentTo}
          onSearch={setSearch}
          onPayment={setPaymentFilter}
          onAgent={setAgentFilter}
          onDateFrom={setNextPaymentFrom}
          onDateTo={setNextPaymentTo}
          onClear={clearFilters}
        />

        <OrdersList
          orders={orders}
          filteredOrders={filteredOrders}
          loading={loading}
          onView={openViewDrawer}
          onClear={clearFilters}
        />
      </div>

      <OrderDetailsDrawer
        drawerOpen={drawerOpen}
        paymentsDrawerOpen={paymentsDrawerOpen}
        closeDrawer={closeDrawer}
        viewOrder={viewOrder}
        canManagePenalty={canManagePenalty}
        penaltyPercentageInput={penaltyPercentageInput}
        setPenaltyPercentageInput={setPenaltyPercentageInput}
        handleSavePenaltyPercentage={handleSavePenaltyPercentage}
        penaltySaving={penaltySaving}
        penaltyError={penaltyError}
        penaltySuccess={penaltySuccess}
        openPaymentsDrawer={openPaymentsDrawer}
      />

      <OrderPaymentsDrawer
        paymentsDrawerOpen={paymentsDrawerOpen}
        closePaymentsDrawer={closePaymentsDrawer}
        viewOrder={viewOrder}
        paymentSummary={paymentSummary}
        paymentsLoading={paymentsLoading}
        paymentsError={paymentsError}
        orderPayments={orderPayments}
        expandedPaymentId={expandedPaymentId}
        setExpandedPaymentId={setExpandedPaymentId}
        setPreviewReceipt={setPreviewReceipt}
        importing={importing}
        importResult={importResult}
        handleImportPayments={handleImportPayments}
        previewReceipt={previewReceipt}
      />
    </>
  );
}
