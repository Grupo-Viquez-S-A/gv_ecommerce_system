import { useEffect, useMemo, useState } from "react";

import {
  RiArrowDownSFill,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCheckboxCircleFill,
  RiDownloadFill,
  RiExportFill,
  RiEyeFill,
  RiFileTextLine,
  RiRefreshLine,
  RiSearchLine,
} from "react-icons/ri";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getSalesOrders,
  updateProductionOrderPenaltyPercentage,
} from "../services/orderService.js";
import {
  getOrderPayments,
  importOrderPayments,
} from "../services/paymentService.js";
import {
  formatDateShortCR,
  formatDateTimeCR,
} from "../utils/dateUtils.js";
import { useAuth } from "../context/AuthContext.js";
import { hasSystemAccess } from "../utils/roles.js";

/* --- CONFIGURACIÓN DE ESTADOS --- */
const STATUS_CONFIG = {
  pendiente: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  en_proceso: {
    bg: "bg-[#C9A227]/10",
    text: "text-[#C9A227]",
    border: "border-[#C9A227]/20",
  },
  pausada: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  finalizada: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  cancelada: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
  },
};

const PAYMENT_CONFIG = {
  pendiente: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  parcial: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  pagado: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  vencido: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  cancelado: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
  },
};

function formatCurrency(amount) {
  const numericAmount = Number(amount) || 0;

  return `₡${numericAmount.toLocaleString("es-CR", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return formatDateTimeCR(date) || "Sin fecha";
}

function formatFileSize(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Tamano no disponible";
  }

  if (numericValue < 1024 * 1024) {
    return `${Math.round(numericValue / 1024)} KB`;
  }

  return `${(numericValue / (1024 * 1024)).toFixed(1)} MB`;
}

function DetailRow({ label, value, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#2a3550]">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm text-white font-medium text-right">
        {children || value || "No indicado"}
      </div>
    </div>
  );
}

function buildDailyOrdersData(orders) {
  const countsByDay = orders.reduce((acc, order) => {
    const date = order.createdAt ? new Date(order.createdAt) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return acc;
    }

    const key = formatDateShortCR(date);

    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {});

  return Object.entries(countsByDay).map(([name, value]) => ({
    name,
    value,
  }));
}

/* --- COMPONENTES AUXILIARES --- */
function PagBtn({ icon, label, active = false }) {
  return (
    <button
      type="button"
      className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors cursor-pointer ${
        active
          ? "bg-[#C9A227] text-white"
          : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"
      }`}
    >
      {icon || label}
    </button>
  );
}

function StatusBadge({ status, label, config }) {
  const selectedConfig = config[status] || config.pendiente;

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${selectedConfig.bg} ${selectedConfig.text} ${selectedConfig.border}`}
    >
      {label || status}
    </span>
  );
}

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>Comercial</span>
              <span>/</span>
              <span className="text-gray-300">Ordenes de venta</span>
            </div>

            <h1 className="text-xl font-bold text-white">
              Ordenes de venta
            </h1>

            <p className="text-sm text-gray-400 mt-0.5">
              Ordenes de produccion pendientes de pago o con pago adelantado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadOrders}
              className="flex items-center gap-2 bg-[#1c2538] border border-[#2a3550] hover:bg-[#C9A227]/15 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RiRefreshLine size={15} />
              Actualizar
            </button>

            <button
              type="button"
              className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20 cursor-pointer"
            >
              <RiExportFill size={16} />
              Exportar
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {loadError}
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center ${metric.iconColor}`}
                >
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: metric.color }}
                  />
                </div>
              </div>

              <div className="text-xl font-bold text-white">
                {metric.value}
              </div>

              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Ordenes de venta por dia de creacion
            </h3>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyOrdersData}>
                <defs>
                  <linearGradient
                    id="colorOrders"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#C9A227"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#C9A227"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a3550"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141d2e",
                    border: "1px solid #2a3550",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} ordenes`, "Ordenes"]}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#C9A227"
                  strokeWidth={2}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Buscar
              </label>
              <div className="relative">
                <RiSearchLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Buscar por codigo, cotizacion o cliente..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Estado de pago
              </label>
              <div className="relative">
                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  <option value="Todos">Todos los pagos</option>
                  <option value="pendiente">Pendiente de pago</option>
                  <option value="parcial">Pago adelantado</option>
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Vendedor
              </label>
              <div className="relative">
                <select
                  value={agentFilter}
                  onChange={(event) => setAgentFilter(event.target.value)}
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {agents.map((agent) => (
                    <option key={agent}>{agent}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Proxima fecha de pago (desde)
              </label>
              <input
                type="date"
                value={nextPaymentFrom}
                onChange={(event) => setNextPaymentFrom(event.target.value)}
                className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Proxima fecha de pago (hasta)
              </label>
              <input
                type="date"
                value={nextPaymentTo}
                onChange={(event) => setNextPaymentTo(event.target.value)}
                className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors [color-scheme:dark]"
              />
            </div>

            <div className="flex items-end lg:col-span-6">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full sm:w-auto sm:px-6 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550]">
            <h3 className="text-sm font-semibold text-white">
              Listado de ordenes de venta
            </h3>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RiExportFill size={13} />
              Exportar
              <RiArrowDownSFill size={12} />
            </button>
          </div>

          <table className="hidden w-full text-left lg:table">
            <thead>
              <tr className="border-b border-[#2a3550]">
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Proxima fecha de pago
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Produccion
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2a3550]">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-[#1c2538]/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {order.code}
                  </td>

                  <td className="px-4 py-3 text-sm text-white">
                    {order.client}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(order.createdAt)}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(order.nextPaymentDate)}
                  </td>

                  <td className="px-4 py-3 text-sm text-white font-semibold">
                    {formatCurrency(order.total)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={order.productionStatus}
                      label={order.productionStatusLabel}
                      config={STATUS_CONFIG}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={order.paymentStatus}
                      label={order.paymentStatusLabel}
                      config={PAYMENT_CONFIG}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                        {order.avatar}
                      </div>

                      <span className="text-sm text-gray-300">
                        {order.agent}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => openViewDrawer(order)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Ver"
                      >
                        <RiEyeFill size={13} />
                      </button>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Descargar"
                      >
                        <RiDownloadFill size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredOrders.length > 0 && (
            <div className="divide-y divide-[#2a3550] lg:hidden">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => openViewDrawer(order)}
                  className="block w-full p-4 text-left transition-colors hover:bg-[#1c2538]/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{order.client}</p>
                      <p className="mt-1 font-mono text-xs text-gray-400">{order.code}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-white">{formatCurrency(order.total)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-gray-500">Fecha</p><p className="mt-1 text-gray-300">{formatDate(order.createdAt)}</p></div>
                    <div><p className="text-gray-500">Próximo pago</p><p className="mt-1 text-gray-300">{formatDate(order.nextPaymentDate)}</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.productionStatus} label={order.productionStatusLabel} config={STATUS_CONFIG} />
                    <StatusBadge status={order.paymentStatus} label={order.paymentStatusLabel} config={PAYMENT_CONFIG} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <p className="text-sm text-gray-500">
                Cargando ordenes de venta...
              </p>
            </div>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <RiSearchLine size={28} className="text-gray-600" />

              <p className="text-sm text-gray-500">
                No se encontraron ordenes de venta pendientes de pago o con
                pago adelantado
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#C9A227] hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a3550] px-4 py-3 sm:px-5">
            <span className="text-xs text-gray-500">
              Mostrando {filteredOrders.length} de {orders.length} ordenes
            </span>

            <div className="flex items-center gap-1">
              <PagBtn icon={<RiArrowLeftSLine size={14} />} />
              <PagBtn label={1} active />
              <PagBtn icon={<RiArrowRightSFill size={14} />} />
            </div>
          </div>
        </div>
      </div>

      {/* Fondo del drawer */}
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel de orden"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen
            ? paymentsDrawerOpen
              ? "translate-x-0 xl:-translate-x-[32rem]"
              : "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RiEyeFill size={20} className="text-[#C9A227]" />
              Detalle de la orden
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Informacion completa de la orden de venta.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {viewOrder && (
            <div className="space-y-5">
              <div className="pb-5 border-b border-[#2a3550]">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">
                    {viewOrder.code}
                  </h3>

                  <StatusBadge
                    status={viewOrder.paymentStatus}
                    label={viewOrder.paymentStatusLabel}
                    config={PAYMENT_CONFIG}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Cliente</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.client}
                  </span>
                </div>

                {viewOrder.branchLabel && (
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">Sucursal</span>
                    <span className="text-sm text-white font-medium text-right">
                      {viewOrder.branchLabel}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Cotizacion</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.quotationNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Fecha</span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatDate(viewOrder.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatCurrency(viewOrder.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Saldo pendiente</span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatCurrency(viewOrder.balance)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Produccion</span>
                  <StatusBadge
                    status={viewOrder.productionStatus}
                    label={viewOrder.productionStatusLabel}
                    config={STATUS_CONFIG}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Pago</span>
                  <StatusBadge
                    status={viewOrder.paymentStatus}
                    label={viewOrder.paymentStatusLabel}
                    config={PAYMENT_CONFIG}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Vendedor</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.agent}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Fecha de entrega comprometida
                  </span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatDate(viewOrder.committedDeliveryDate)}
                  </span>
                </div>

                {viewOrder.unexpectedDeliveryDate && (
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">
                      Fecha de entrega inesperada
                    </span>
                    <span className="text-sm text-white font-medium text-right">
                      {formatDate(viewOrder.unexpectedDeliveryDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Proxima fecha de pago
                  </span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatDate(viewOrder.nextPaymentDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Dias de atraso
                  </span>
                  <span
                    className={`text-sm font-medium text-right ${
                      viewOrder.overdueDays > 0
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {viewOrder.overdueDays}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Estado de mora</span>
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${
                      viewOrder.overdueDays > 0
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                    }`}
                  >
                    {viewOrder.overdueDays > 0 ? "En mora" : "Al dia"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Porcentaje de penalizacion
                  </span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.penaltyPercentage}%
                  </span>
                </div>

                {canManagePenalty && (
                  <div className="flex flex-col gap-2 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">
                      Configurar porcentaje de penalizacion (solo interno)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={penaltyPercentageInput}
                        onChange={(event) =>
                          setPenaltyPercentageInput(event.target.value)
                        }
                        className="w-full bg-[#0f1626] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227]"
                      />
                      <button
                        type="button"
                        onClick={handleSavePenaltyPercentage}
                        disabled={penaltySaving}
                        className="whitespace-nowrap bg-[#C9A227] hover:bg-[#B8921F] disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        {penaltySaving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                    {penaltyError && (
                      <p className="text-xs text-red-400">{penaltyError}</p>
                    )}
                    {penaltySuccess && (
                      <p className="text-xs text-green-400">
                        {penaltySuccess}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Monto de penalizacion
                  </span>
                  <span
                    className={`text-sm font-medium text-right ${
                      viewOrder.penaltyAmount > 0
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {formatCurrency(viewOrder.penaltyAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-xs text-gray-500 font-semibold">
                    Total adeudado (saldo + penalizacion)
                  </span>
                  <span className="text-sm text-white font-bold text-right">
                    {formatCurrency(viewOrder.totalOwed)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {viewOrder && (
            <button
              type="button"
              onClick={() => openPaymentsDrawer(viewOrder)}
              className="flex-1 bg-[#C9A227] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#b8931f] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RiFileTextLine size={16} />
              Comprobantes de pago
            </button>
          )}
        </div>
      </div>

      {/* Fondo del drawer de pagos */}
      {paymentsDrawerOpen && (
        <button
          type="button"
          onClick={closePaymentsDrawer}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default xl:hidden"
          aria-label="Cerrar panel de comprobantes"
        />
      )}

      {/* Drawer de comprobantes de pago */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[32rem] bg-[#141d2e] border-l border-[#2a3550] z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          paymentsDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RiFileTextLine size={20} className="text-[#C9A227]" />
              Comprobantes de pago
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Revision de pagos reportados para esta orden de venta.
            </p>
          </div>

          <button
            type="button"
            onClick={closePaymentsDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {viewOrder && (
            <div className="space-y-5">
              <div className="pb-5 border-b border-[#2a3550]">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {viewOrder.quotationNumber}
                  </h3>

                  <p className="text-sm text-gray-400">
                    {paymentSummary.receiptCount} archivo
                    {paymentSummary.receiptCount === 1 ? "" : "s"} adjunto
                    {paymentSummary.receiptCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <DetailRow label="Orden" value={viewOrder.code} />
                <DetailRow label="Cliente" value={viewOrder.client} />
                <DetailRow label="Total de la orden">
                  {formatCurrency(viewOrder.total)}
                </DetailRow>
                <DetailRow label="Saldo actual">
                  {formatCurrency(viewOrder.balance)}
                </DetailRow>
                <DetailRow label="Monto reportado">
                  {formatCurrency(paymentSummary.amountReported)}
                </DetailRow>
                <DetailRow label="Monto validado">
                  {formatCurrency(paymentSummary.amountValidated)}
                </DetailRow>
                <DetailRow label="Pendientes de validar">
                  {paymentSummary.pendingPayments}
                </DetailRow>
              </div>
            </div>
          )}

          {paymentsLoading && (
            <p className="text-sm text-gray-400">Cargando comprobantes...</p>
          )}

          {!paymentsLoading && paymentsError && (
            <p className="text-sm text-red-400">{paymentsError}</p>
          )}

          {!paymentsLoading && !paymentsError && orderPayments.length === 0 && (
            <p className="text-sm text-gray-400">
              Esta orden no tiene pagos reportados todavia.
            </p>
          )}

          {importResult && (
            <div className="rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-3 space-y-1">
              <p className="text-sm text-white font-medium flex items-center gap-2">
                <RiCheckboxCircleFill className="text-[#C9A227]" size={16} />
                Comprobantes importados correctamente
              </p>

              <p className="text-xs text-gray-300">
                Pagado: {formatCurrency(importResult.amountPaid)} de{" "}
                {formatCurrency(importResult.total)}
              </p>

              <p className="text-xs text-gray-300">
                {importResult.movedToSales
                  ? "El pago cubre el total, la orden se movio a Ventas."
                  : "Pago parcial registrado, la orden quedo en Pago adelantado."}
              </p>

              {importResult.emailNotification?.sent ? (
                <p className="text-xs text-green-300">
                  Correo enviado a {importResult.emailNotification.recipient}.
                </p>
              ) : (
                <p className="text-xs text-yellow-300">
                  El pago se importo, pero no se pudo enviar el correo:{" "}
                  {importResult.emailNotification?.error || "error no indicado"}
                </p>
              )}
            </div>
          )}

          {!paymentsLoading &&
            orderPayments.map((payment) => {
              const isExpanded = expandedPaymentId === payment.paymentId;

              return (
                <div
                  key={payment.paymentId}
                  className="rounded-xl border border-[#2a3550] bg-[#1c2538] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPaymentId(
                        isExpanded ? null : payment.paymentId,
                      )
                    }
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-[#22304a] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <RiArrowDownSFill
                        size={20}
                        className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />

                      <div className="min-w-0">
                        <span className="block text-xs text-gray-500">
                          Pago reportado
                        </span>
                        <span className="text-xl font-semibold text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-md border ${
                        payment.isValid
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {payment.isValid ? "Validado" : "Pendiente de validar"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#2a3550]">
                      <div className="space-y-3 pt-4">
                        <DetailRow label="Metodo" value={payment.methodName} />
                        <DetailRow label="Fecha reportada">
                          {formatDate(payment.paymentDate)}
                        </DetailRow>

                        {payment.referenceNumber && (
                          <DetailRow label="Referencia">
                            {payment.referenceNumber}
                          </DetailRow>
                        )}

                        <DetailRow label="Archivos adjuntos">
                          {payment.receipts.length}
                        </DetailRow>

                        {payment.notes && (
                          <div className="rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-2">
                            <span className="block text-xs text-gray-500 mb-1">
                              Notas del pago
                            </span>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {payment.receipts.length > 0 && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <span className="text-xs font-medium uppercase tracking-widest text-[#C9A227]/80">
                              Comprobantes
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Puedes abrir una imagen para revisarla en
                              pantalla completa o descargar el archivo
                              original.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {payment.receipts.map((receipt) => {
                              const isImage = (
                                receipt.mimeType || ""
                              ).startsWith("image/");

                              if (isImage && receipt.signedUrl) {
                                return (
                                  <button
                                    key={receipt.receiptId}
                                    type="button"
                                    onClick={() => setPreviewReceipt(receipt)}
                                    className="group relative aspect-[4/3] min-h-36 rounded-lg overflow-hidden border border-[#2a3550] hover:border-[#C9A227] transition-colors cursor-pointer bg-black/20"
                                    title={receipt.fileName || "Comprobante"}
                                  >
                                    <img
                                      src={receipt.signedUrl}
                                      alt={
                                        receipt.fileName ||
                                        "Comprobante de pago"
                                      }
                                      className="w-full h-full object-contain"
                                    />

                                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-left text-[11px] text-white truncate">
                                      {receipt.fileName || "Comprobante"}
                                    </span>
                                  </button>
                                );
                              }

                              return (
                                <a
                                  key={receipt.receiptId}
                                  href={receipt.signedUrl || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="min-h-24 rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-2 text-xs text-[#C9A227] hover:border-[#C9A227] transition-colors flex flex-col justify-between"
                                >
                                  <span className="inline-flex items-center gap-1">
                                    <RiDownloadFill size={12} />
                                    Descargar archivo
                                  </span>
                                  <span className="text-gray-300 break-all">
                                    {receipt.fileName || "Comprobante"}
                                  </span>
                                  <span className="text-gray-500">
                                    {formatFileSize(receipt.fileSize)}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={closePaymentsDrawer}
            className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            disabled={
              importing ||
              paymentsLoading ||
              !orderPayments.some((payment) => !payment.isValid)
            }
            onClick={handleImportPayments}
            className="flex-1 bg-[#C9A227] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#b8931f] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importando..." : "Importar comprobantes"}
          </button>
        </div>
      </div>

      {/* Lightbox de previsualizacion del comprobante */}
      {previewReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-3 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setPreviewReceipt(null)}
            className="fixed inset-0 cursor-default"
            aria-label="Cerrar previsualizacion"
          />

          <div className="relative z-[71] max-w-2xl w-full max-h-[85vh] bg-[#141d2e] border border-[#2a3550] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550] flex-shrink-0">
              <p className="text-sm text-white font-medium truncate pr-3">
                {previewReceipt.fileName || "Comprobante de pago"}
              </p>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={previewReceipt.signedUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-[#C9A227] transition-colors"
                  title="Descargar"
                >
                  <RiDownloadFill size={18} />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-black/30 flex items-center justify-center p-4">
              <img
                src={previewReceipt.signedUrl}
                alt={previewReceipt.fileName || "Comprobante de pago"}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
