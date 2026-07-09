import { useEffect, useMemo, useState } from "react";

import {
  RiArrowDownSFill,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCalendarLine,
  RiDownloadFill,
  RiExportFill,
  RiEyeFill,
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

import { getSalesOrders } from "../services/orderService.js";

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

  return date.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDailyOrdersData(orders) {
  const countsByDay = orders.reduce((acc, order) => {
    const date = order.createdAt ? new Date(order.createdAt) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return acc;
    }

    const key = date.toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
    });

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
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [agentFilter, setAgentFilter] = useState("Todos");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
    loadOrders();
  }, []);

  const agents = useMemo(() => {
    const uniqueAgents = [
      ...new Set(orders.map((order) => order.agent).filter(Boolean)),
    ];

    return ["Todos", ...uniqueAgents];
  }, [orders]);

  const dailyOrdersData = useMemo(() => buildDailyOrdersData(orders), [orders]);

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

    return matchesSearch && matchesPayment && matchesAgent;
  });

  const openViewDrawer = (order) => {
    setViewOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);

    window.setTimeout(() => {
      setViewOrder(null);
    }, 300);
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("Todos");
    setAgentFilter("Todos");
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
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

            <div>
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

            <div className="flex items-center gap-2 lg:col-span-4">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 sm:flex-none sm:px-6 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
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

          <table className="w-full text-left hidden md:table">
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

          <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
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
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {viewOrder && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">
                  {viewOrder.code.slice(-3)}
                </div>

                <div>
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

                {viewOrder.overdueDays > 0 && (
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">
                      Dias de atraso
                    </span>
                    <span className="text-sm text-red-400 font-medium text-right">
                      {viewOrder.overdueDays}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
