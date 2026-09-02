import { useEffect, useMemo, useState } from "react";

import SaleDetailsDrawer from "../components/sales/SaleDetailsDrawer.jsx";
import SalesChart from "../components/sales/SalesChart.jsx";
import SalesFilters from "../components/sales/SalesFilters.jsx";
import SalesList from "../components/sales/SalesList.jsx";
import SalesMetrics from "../components/sales/SalesMetrics.jsx";
import SalesPageHeader from "../components/sales/SalesPageHeader.jsx";
import { buildDailySalesData, formatSalesCurrency, formatSalesDate } from "../components/sales/salesViewConfig.js";
import { useAuth } from "../context/AuthContext.js";
import { getSalesAgentNames } from "../services/agentService.js";
import { getOrderPayments, importOrderPayments } from "../services/paymentService.js";
import { getPaidSales } from "../services/salesService.js";
import { hasPaymentApprovalAccess } from "../utils/roles.js";

const EMPTY_FILTERS = { search: "", representative: "Todos", dateFrom: "", dateTo: "" };

export default function Sales() {
  const { user } = useAuth();
  const canApprovePayments = hasPaymentApprovalAccess(user);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedSale, setSelectedSale] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sellerOptions, setSellerOptions] = useState(["Todos"]);
  const [salePayments, setSalePayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState(null);
  const [approvalSuccess, setApprovalSuccess] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSales(await getPaidSales());
    } catch (error) {
      setLoadError(error?.message || "No fue posible cargar las ventas registradas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadSales(), 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSellerOptions() {
      try {
        const names = await getSalesAgentNames();

        if (mounted) {
          setSellerOptions(["Todos", ...names]);
        }
      } catch (error) {
        console.error("Sales seller options loading error:", error);

        if (mounted) {
          setSellerOptions(["Todos"]);
        }
      }
    }

    loadSellerOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => buildDailySalesData(sales), [sales]);

  const metrics = useMemo(() => {
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const latestSale = sales.reduce((latest, sale) => !sale.saleDate ? latest : !latest || new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest, null);
    return [
      { label: "TOTAL VENDIDO", value: formatSalesCurrency(total), color: "#C9A227", bg: "bg-[#C9A227]/10" },
      { label: "CANTIDAD DE VENTAS", value: String(sales.length), color: "#22c55e", bg: "bg-[#22c55e]/10" },
      { label: "TICKET PROMEDIO", value: formatSalesCurrency(sales.length ? total / sales.length : 0), color: "#8b5cf6", bg: "bg-[#8b5cf6]/10" },
      { label: "ÚLTIMA VENTA REGISTRADA", value: latestSale ? formatSalesDate(latestSale.saleDate) : "Sin ventas", color: "#f59e0b", bg: "bg-[#f59e0b]/10" },
    ];
  }, [sales]);

  const filteredSales = useMemo(() => sales.filter((sale) => {
    const query = filters.search.trim().toLowerCase();
    const matchesSearch = !query || sale.code.toLowerCase().includes(query) || sale.quotationNumber.toLowerCase().includes(query) || sale.client.toLowerCase().includes(query);
    const matchesRepresentative = filters.representative === "Todos" || sale.representative === filters.representative;
    const saleTime = sale.saleDate ? new Date(sale.saleDate).getTime() : null;
    const matchesFrom = !filters.dateFrom || (saleTime !== null && saleTime >= new Date(`${filters.dateFrom}T00:00:00`).getTime());
    const matchesTo = !filters.dateTo || (saleTime !== null && saleTime <= new Date(`${filters.dateTo}T23:59:59`).getTime());
    return matchesSearch && matchesRepresentative && matchesFrom && matchesTo;
  }), [filters, sales]);

  const openDrawer = async (sale) => {
    setSelectedSale(sale);
    setDrawerOpen(true);
    setPaymentsLoading(true);
    setPaymentsError(null);
    setApprovalError(null);
    setApprovalSuccess(null);
    setSalePayments([]);

    try {
      const payments = await getOrderPayments(sale.productionOrderId);
      setSalePayments(payments);
      setExpandedPaymentId(payments.length > 0 ? payments[0].paymentId : null);
    } catch (error) {
      setPaymentsError(
        error?.message || "No fue posible cargar los pagos reportados de la venta.",
      );
    } finally {
      setPaymentsLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPreviewReceipt(null);

    window.setTimeout(() => {
      setSelectedSale(null);
      setSalePayments([]);
      setPaymentsError(null);
      setPaymentsLoading(false);
      setApprovalLoading(false);
      setApprovalError(null);
      setApprovalSuccess(null);
      setExpandedPaymentId(null);
    }, 300);
  };

  const handleApprovePayments = async () => {
    if (!selectedSale || !canApprovePayments) {
      return;
    }

    setApprovalLoading(true);
    setApprovalError(null);
    setApprovalSuccess(null);

    try {
      await importOrderPayments(selectedSale.productionOrderId);
      const [updatedSales, updatedPayments] = await Promise.all([
        getPaidSales(),
        getOrderPayments(selectedSale.productionOrderId),
      ]);

      setSales(updatedSales);
      setSalePayments(updatedPayments);
      setExpandedPaymentId(
        updatedPayments.length > 0 ? updatedPayments[0].paymentId : null,
      );

      const refreshedSale =
        updatedSales.find(
          (sale) => sale.productionOrderId === selectedSale.productionOrderId,
        ) || selectedSale;

      setSelectedSale(refreshedSale);
      setApprovalSuccess("Reporte de pago aprobado correctamente.");
    } catch (error) {
      setApprovalError(
        error?.message || "No fue posible aprobar el reporte de pago.",
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  return <>
    <div className="p-4 lg:p-6">
      <SalesPageHeader onRefresh={loadSales} />
      {loadError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadError}</div>}
      <SalesMetrics metrics={metrics} />
      <SalesChart data={chartData} />
      <SalesFilters filters={filters} representatives={sellerOptions} onChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))} onClear={() => setFilters(EMPTY_FILTERS)} />
      <SalesList sales={filteredSales} totalSales={sales.length} loading={loading} onClear={() => setFilters(EMPTY_FILTERS)} onView={openDrawer} />
    </div>
    <SaleDetailsDrawer
      open={drawerOpen}
      sale={selectedSale}
      payments={salePayments}
      paymentsLoading={paymentsLoading}
      paymentsError={paymentsError}
      previewReceipt={previewReceipt}
      setPreviewReceipt={setPreviewReceipt}
      canApprovePayments={canApprovePayments}
      approvalLoading={approvalLoading}
      approvalError={approvalError}
      approvalSuccess={approvalSuccess}
      expandedPaymentId={expandedPaymentId}
      setExpandedPaymentId={setExpandedPaymentId}
      onApprovePayments={handleApprovePayments}
      onClose={closeDrawer}
    />
  </>;
}
