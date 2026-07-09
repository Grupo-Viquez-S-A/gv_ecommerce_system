import { useEffect, useMemo, useState } from "react";

import {
  RiArrowDownSFill,
  RiCalendarLine,
  RiEyeFill,
  RiExportFill,
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

import { getPaidSales } from "../services/salesService.js";

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
  pagado: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
};

function StatusBadge({ status, label, config }) {
  const resolvedConfig = config[status] || {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
  };

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${resolvedConfig.bg} ${resolvedConfig.text} ${resolvedConfig.border}`}
    >
      {label}
    </span>
  );
}

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

function buildDailySalesData(sales) {
  const totalsByDay = sales.reduce((totals, sale) => {
    const date = sale.saleDate ? new Date(sale.saleDate) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return totals;
    }

    const label = date.toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
    });

    totals[label] = (totals[label] || 0) + sale.total;

    return totals;
  }, {});

  return Object.entries(totalsByDay)
    .map(([name, value]) => ({ name, value }))
    .slice(-16);
}

/* --- PÁGINA PRINCIPAL --- */
export default function Sales() {
  const [search, setSearch] = useState("");
  const [representativeFilter, setRepresentativeFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewSale, setViewSale] = useState(null);

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const paidSales = await getPaidSales();
      setSales(paidSales);
    } catch (error) {
      setLoadError(
        error?.message || "No fue posible cargar las ventas pagadas.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const representatives = useMemo(() => {
    const uniqueRepresentatives = [
      ...new Set(sales.map((sale) => sale.representative).filter(Boolean)),
    ];

    return ["Todos", ...uniqueRepresentatives];
  }, [sales]);

  const dailySalesData = useMemo(() => buildDailySalesData(sales), [sales]);

  const metrics = useMemo(() => {
    const totalVentas = sales.reduce((sum, sale) => sum + sale.total, 0);
    const cantidadVentas = sales.length;
    const ticketPromedio = cantidadVentas ? totalVentas / cantidadVentas : 0;

    const ultimaVenta = sales.reduce((latest, sale) => {
      if (!sale.saleDate) {
        return latest;
      }

      if (!latest) {
        return sale;
      }

      return new Date(sale.saleDate) > new Date(latest.saleDate)
        ? sale
        : latest;
    }, null);

    return [
      {
        label: "TOTAL VENDIDO",
        value: formatCurrency(totalVentas),
        color: "#C9A227",
        bg: "bg-[#C9A227]/10",
        iconColor: "text-[#C9A227]",
      },
      {
        label: "CANTIDAD DE VENTAS",
        value: String(cantidadVentas),
        color: "#22c55e",
        bg: "bg-[#22c55e]/10",
        iconColor: "text-[#22c55e]",
      },
      {
        label: "TICKET PROMEDIO",
        value: formatCurrency(ticketPromedio),
        color: "#8b5cf6",
        bg: "bg-[#8b5cf6]/10",
        iconColor: "text-[#8b5cf6]",
      },
      {
        label: "ULTIMA VENTA PAGADA",
        value: ultimaVenta ? formatDate(ultimaVenta.saleDate) : "Sin ventas",
        color: "#f59e0b",
        bg: "bg-[#f59e0b]/10",
        iconColor: "text-[#f59e0b]",
      },
    ];
  }, [sales]);

  const filteredSales = sales.filter((sale) => {
    const normalizedSearch = search.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      sale.code.toLowerCase().includes(normalizedSearch) ||
      sale.quotationNumber.toLowerCase().includes(normalizedSearch) ||
      sale.client.toLowerCase().includes(normalizedSearch);

    const matchesRepresentative =
      representativeFilter === "Todos" ||
      sale.representative === representativeFilter;

    const saleTime = sale.saleDate ? new Date(sale.saleDate).getTime() : null;

    const matchesDateFrom =
      !dateFrom ||
      (saleTime !== null &&
        !Number.isNaN(saleTime) &&
        saleTime >= new Date(`${dateFrom}T00:00:00`).getTime());

    const matchesDateTo =
      !dateTo ||
      (saleTime !== null &&
        !Number.isNaN(saleTime) &&
        saleTime <= new Date(`${dateTo}T23:59:59`).getTime());

    return (
      matchesSearch && matchesRepresentative && matchesDateFrom && matchesDateTo
    );
  });

  const openViewDrawer = (sale) => {
    setViewSale(sale);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);

    window.setTimeout(() => {
      setViewSale(null);
    }, 300);
  };

  const clearFilters = () => {
    setSearch("");
    setRepresentativeFilter("Todos");
    setDateFrom("");
    setDateTo("");
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
              <span className="text-gray-300">Ventas</span>
            </div>

            <h1 className="text-xl font-bold text-white">Ventas</h1>

            <p className="text-sm text-gray-400 mt-0.5">
              Ordenes de produccion pagadas al 100%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadSales}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
              Ventas pagadas por dia
            </h3>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient
                    id="colorSales"
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
                  formatter={(value) => [formatCurrency(value), "Ventas"]}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#C9A227"
                  strokeWidth={2}
                  fill="url(#colorSales)"
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
                Fecha de venta (desde)
              </label>
              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Fecha de venta (hasta)
              </label>
              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Representante
              </label>
              <div className="relative">
                <select
                  value={representativeFilter}
                  onChange={(event) =>
                    setRepresentativeFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {representatives.map((representative) => (
                    <option key={representative}>{representative}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
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
              Listado de Ventas
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
                  Fecha de venta
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Metodo de pago
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Produccion
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Representante
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2a3550]">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-[#1c2538]/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {sale.code}
                  </td>

                  <td className="px-4 py-3 text-sm text-white">
                    {sale.client}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(sale.saleDate)}
                  </td>

                  <td className="px-4 py-3 text-sm text-white font-semibold">
                    {formatCurrency(sale.total)}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-300">
                    {sale.paymentMethod}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={sale.productionStatus}
                      label={sale.productionStatusLabel}
                      config={STATUS_CONFIG}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={sale.paymentStatus}
                      label={sale.paymentStatusLabel}
                      config={PAYMENT_CONFIG}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                        {sale.avatar}
                      </div>

                      <span className="text-sm text-gray-300">
                        {sale.representative}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => openViewDrawer(sale)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Ver"
                      >
                        <RiEyeFill size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <p className="text-sm text-gray-500">Cargando ventas...</p>
            </div>
          )}

          {!loading && filteredSales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <RiSearchLine size={28} className="text-gray-600" />

              <p className="text-sm text-gray-500">
                No se encontraron ventas pagadas al 100%.
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
              Mostrando {filteredSales.length} de {sales.length} ventas
            </span>
          </div>
        </div>
      </div>

      {/* Fondo del drawer */}
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel de venta"
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
              Detalle de Venta
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Informacion completa de la venta.
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
          {viewSale && (
            <div className="space-y-5">
              <div className="pb-5 border-b border-[#2a3550]">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">
                    {viewSale.code}
                  </h3>

                  <StatusBadge
                    status={viewSale.paymentStatus}
                    label={viewSale.paymentStatusLabel}
                    config={PAYMENT_CONFIG}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Cliente", value: viewSale.client },
                  { label: "Cedula juridica", value: viewSale.legalId || "N/D" },
                  { label: "Sucursal", value: viewSale.branchLabel || "N/D" },
                  { label: "Cotizacion", value: viewSale.quotationNumber },
                  { label: "Fecha de venta", value: formatDate(viewSale.saleDate) },
                  { label: "Total vendido", value: formatCurrency(viewSale.total) },
                  { label: "Monto pagado", value: formatCurrency(viewSale.amountPaid) },
                  { label: "Saldo", value: formatCurrency(viewSale.balance) },
                  { label: "Metodo de pago", value: viewSale.paymentMethod },
                  {
                    label: "Estado de produccion",
                    value: viewSale.productionStatusLabel,
                  },
                  { label: "Representante", value: viewSale.representative },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]"
                  >
                    <span className="text-xs text-gray-500">{label}</span>

                    <span className="text-sm text-white font-medium text-right">
                      {value}
                    </span>
                  </div>
                ))}
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
