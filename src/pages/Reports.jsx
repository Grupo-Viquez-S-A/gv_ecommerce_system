import { useState } from "react";

import {
  RiAddFill,
  RiArrowDownSFill,
  RiBarChartFill,
  RiCalendarLine,
  RiCheckFill,
  RiDownloadFill,
  RiExportFill,
  RiEyeFill,
  RiFileListFill,
  RiFilter3Fill,
  RiGroupFill,
  RiMoneyDollarCircleFill,
  RiMoreFill,
  RiShoppingBagFill,
  RiStarLine,
  RiStoreFill,
  RiTimeFill,
} from "react-icons/ri";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* --- MOCK DATA: REPORTES --- */
const MOCK_REPORTS = [
  {
    id: 1,
    number: "REP-00056",
    name: "Reporte de ventas mensual",
    type: "Ventas",
    period: "01/06/2024 - 30/06/2024",
    generatedBy: "Ana Gómez",
    date: "30/06/2024 08:30",
    status: "Completado",
  },
  {
    id: 2,
    number: "REP-00055",
    name: "Análisis de productos",
    type: "Productos",
    period: "01/06/2024 - 30/06/2024",
    generatedBy: "Manuel Rojas",
    date: "29/06/2024 18:15",
    status: "Completado",
  },
  {
    id: 3,
    number: "REP-00054",
    name: "Reporte de clientes",
    type: "Clientes",
    period: "01/06/2024 - 30/06/2024",
    generatedBy: "Laura Gómez",
    date: "29/06/2024 09:45",
    status: "Completado",
  },
  {
    id: 4,
    number: "REP-00053",
    name: "Ventas por vendedor",
    type: "Ventas",
    period: "01/06/2024 - 30/06/2024",
    generatedBy: "Ana Gómez",
    date: "28/06/2024 16:20",
    status: "Completado",
  },
  {
    id: 5,
    number: "REP-00052",
    name: "Margen de utilidad",
    type: "Financiero",
    period: "01/05/2024 - 31/05/2024",
    generatedBy: "Manuel Rojas",
    date: "01/06/2024 10:05",
    status: "Completado",
  },
  {
    id: 6,
    number: "REP-00051",
    name: "Inventario valorizado",
    type: "Inventario",
    period: "30/06/2024",
    generatedBy: "Laura Gómez",
    date: "30/06/2024 07:50",
    status: "En proceso",
  },
  {
    id: 7,
    number: "REP-00050",
    name: "Comparativo anual",
    type: "Ventas",
    period: "01/01/2024 - 30/06/2024",
    generatedBy: "Ana Gómez",
    date: "30/06/2024 07:30",
    status: "Completado",
  },
  {
    id: 8,
    number: "REP-00049",
    name: "Cartera vencida",
    type: "Financiero",
    period: "01/06/2024 - 30/06/2024",
    generatedBy: "Manuel Rojas",
    date: "29/06/2024 14:00",
    status: "Completado",
  },
];

const STATUS_CONFIG = {
  Completado: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  "En proceso": {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
};

/* --- KPI DATA --- */
const kpiData = [
  {
    label: "VENTAS TOTALES",
    value: "₡185 M",
    change: "+14% vs. mes anterior",
    icon: RiBarChartFill,
    color: "#3b82f6",
    bg: "bg-blue-500/10",
  },
  {
    label: "UTILIDAD TOTAL",
    value: "₡26.5 M",
    change: "+18% vs. mes anterior",
    icon: RiCheckFill,
    color: "#22c55e",
    bg: "bg-green-500/10",
  },
  {
    label: "MARGEN DE UTILIDAD",
    value: "14.3%",
    change: "+2.1 pp vs. mes anterior",
    icon: RiBarChartFill,
    color: "#a855f7",
    bg: "bg-purple-500/10",
  },
  {
    label: "CLIENTES NUEVOS",
    value: "248",
    change: "+12% vs. mes anterior",
    icon: RiGroupFill,
    color: "#f59e0b",
    bg: "bg-amber-500/10",
  },
  {
    label: "PEDIDOS TOTALES",
    value: "247",
    change: "+12% vs. mes anterior",
    icon: RiFileListFill,
    color: "#3b82f6",
    bg: "bg-blue-500/10",
  },
  {
    label: "TICKET PROMEDIO",
    value: "₡748.000",
    change: "+7% vs. mes anterior",
    icon: RiMoneyDollarCircleFill,
    color: "#ec4899",
    bg: "bg-pink-500/10",
  },
];

/* --- CHART DATA --- */
const trendData = [
  { name: "01 Jun", value: 4.2 },
  { name: "03 Jun", value: 5.1 },
  { name: "05 Jun", value: 7.8 },
  { name: "07 Jun", value: 5.5 },
  { name: "09 Jun", value: 6.0 },
  { name: "11 Jun", value: 8.2 },
  { name: "13 Jun", value: 5.8 },
  { name: "15 Jun", value: 7.0 },
  { name: "17 Jun", value: 9.5 },
  { name: "19 Jun", value: 12.0 },
  { name: "21 Jun", value: 14.5 },
  { name: "23 Jun", value: 10.0 },
  { name: "25 Jun", value: 8.5 },
  { name: "27 Jun", value: 6.2 },
  { name: "29 Jun", value: 5.0 },
  { name: "30 Jun", value: 4.5 },
];

const companySalesData = [
  {
    name: "Textiles de Occidente",
    value: 74,
    color: "#3b82f6",
  },
  {
    name: "Constructora Solís",
    value: 55,
    color: "#22c55e",
  },
  {
    name: "Pacific Pet Food",
    value: 31,
    color: "#ec4899",
  },
  {
    name: "Occidente Lab",
    value: 14,
    color: "#f59e0b",
  },
  {
    name: "Grupo Alimenticio",
    value: 9,
    color: "#a855f7",
  },
];

const categoryData = [
  {
    name: "Ropa y Textiles",
    value: 62,
    color: "#3b82f6",
  },
  {
    name: "Alimentos",
    value: 48,
    color: "#22c55e",
  },
  {
    name: "Construcción",
    value: 36,
    color: "#f59e0b",
  },
  {
    name: "Mascotas",
    value: 21,
    color: "#ec4899",
  },
  {
    name: "Laboratorio",
    value: 10,
    color: "#a855f7",
  },
  {
    name: "Otros",
    value: 8,
    color: "#6b7280",
  },
];

/* --- SAVED REPORTS --- */
const savedReports = [
  {
    id: 1,
    name: "Ventas semanales",
    icon: RiBarChartFill,
    color: "#C9A227",
  },
  {
    id: 2,
    name: "Clientes nuevos",
    icon: RiGroupFill,
    color: "#22c55e",
  },
  {
    id: 3,
    name: "Productos más vendidos",
    icon: RiShoppingBagFill,
    color: "#3b82f6",
  },
  {
    id: 4,
    name: "Rendimiento por sucursal",
    icon: RiStoreFill,
    color: "#f59e0b",
  },
];

/* --- PAGINATION --- */
function Pagination({ current, total, onChange }) {
  const pages = Array.from({ length: total }, (_, index) => index + 1);

  const visiblePages = pages.slice(
    Math.max(0, current - 3),
    Math.min(total, current + 2),
  );

  return (
    <div className="flex items-center gap-1 mt-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors disabled:opacity-30"
        aria-label="Página anterior"
      >
        <RiArrowDownSFill size={16} className="-rotate-90" />
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
            page === current
              ? "bg-[#C9A227] text-white"
              : "text-gray-400 hover:text-white hover:bg-[#1c2538]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors disabled:opacity-30"
        aria-label="Página siguiente"
      >
        <RiArrowDownSFill size={16} className="rotate-90" />
      </button>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-white">{payload[0].value}M</p>
    </div>
  );
}

export default function Reports() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [includeTax, setIncludeTax] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredReports = MOCK_REPORTS.filter((report) => {
    const normalizedSearch = search.toLowerCase();

    const matchesSearch =
      search === "" ||
      report.name.toLowerCase().includes(normalizedSearch) ||
      report.number.toLowerCase().includes(normalizedSearch) ||
      report.generatedBy.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "Todos" || report.status === statusFilter;

    const matchesType =
      typeFilter === "Todos" || report.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const clearReportFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setTypeFilter("Todos");
  };

  return (
    <>
      <div className="p-4 lg:p-6">
        {/* Breadcrumb + Title */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <span>Comercial</span>

              <RiArrowDownSFill
                size={14}
                className="-rotate-90 text-gray-500"
              />

              <span className="text-gray-300">Reportes</span>
            </div>

            <h1 className="text-2xl font-bold">Reportes</h1>

            <p className="text-sm text-gray-400 mt-0.5">
              Analiza el desempeño de tu negocio con reportes detallados y
              personalizados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 bg-[#141d2e] hover:bg-[#C9A227]/15 border border-[#2a3550] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RiExportFill size={14} />
              Exportar
            </button>

            <button
              type="button"
              className="flex items-center gap-2 bg-[#141d2e] hover:bg-[#C9A227]/15 border border-[#2a3550] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RiCalendarLine size={14} />
              Programar reporte
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20"
            >
              <RiAddFill size={14} />
              Nuevo reporte
              <RiArrowDownSFill size={14} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {kpiData.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <div
                key={kpi.label}
                className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}
                  >
                    <Icon size={16} style={{ color: kpi.color }} />
                  </div>
                </div>

                <div className="text-2xl font-bold">{kpi.value}</div>

                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
                  {kpi.label}
                </div>

                <div className="text-xs text-green-400 mt-1.5">
                  {kpi.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Tendencia de ventas */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                Tendencia de ventas
              </h3>

              <button
                type="button"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-[#1c2538] px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Este mes
                <RiArrowDownSFill size={12} />
              </button>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorTrend"
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
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#C9A227"
                    strokeWidth={2}
                    fill="url(#colorTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ventas por empresa */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                Ventas por empresa
              </h3>

              <button
                type="button"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-[#1c2538] px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Este mes
                <RiArrowDownSFill size={12} />
              </button>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={companySalesData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3550"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141d2e",
                      border: "1px solid #2a3550",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  >
                    {companySalesData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ventas por categoría */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                Ventas por categoría
              </h3>

              <button
                type="button"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-[#1c2538] px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Este mes
                <RiArrowDownSFill size={12} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-40 w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141d2e",
                        border: "1px solid #2a3550",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2">
                {categoryData.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />

                    <span className="text-xs text-gray-300 flex-1 truncate">
                      {category.name}
                    </span>

                    <span className="text-xs font-semibold text-white">
                      ₡{category.value} M
                    </span>

                    <span className="text-xs text-gray-500 w-8 text-right">
                      {Math.round((category.value / 185) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table + Filters */}
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Table */}
          <div className="flex-1 min-w-0">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3550]">
                <h3 className="text-sm font-semibold">
                  Reportes recientes
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3550] text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-medium">#</th>
                      <th className="px-5 py-3 text-left font-medium">
                        Nombre del reporte
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Tipo de reporte
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Periodo
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Generado por
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Fecha de generación
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Estado
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map((report) => {
                      const status = STATUS_CONFIG[report.status];

                      return (
                        <tr
                          key={report.id}
                          className="border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors"
                        >
                          <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">
                            {report.number}
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="text-sm font-medium text-white">
                              {report.name}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-gray-300">
                            {report.type}
                          </td>

                          <td className="px-5 py-3.5 text-gray-300 text-xs">
                            {report.period}
                          </td>

                          <td className="px-5 py-3.5 text-gray-300">
                            {report.generatedBy}
                          </td>

                          <td className="px-5 py-3.5 text-gray-400 text-xs">
                            {report.date}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                            >
                              {report.status === "Completado" ? (
                                <RiCheckFill size={12} />
                              ) : (
                                <RiTimeFill size={12} />
                              )}

                              {report.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                                title="Descargar"
                              >
                                <RiDownloadFill size={13} />
                              </button>

                              <button
                                type="button"
                                className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                                title="Ver"
                              >
                                <RiEyeFill size={13} />
                              </button>

                              <button
                                type="button"
                                className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                                title="Más opciones"
                              >
                                <RiMoreFill size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-[#2a3550] flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Mostrando 1 a {filteredReports.length} de 56 resultados
                </span>

                <Pagination
                  current={currentPage}
                  total={7}
                  onChange={setCurrentPage}
                />
              </div>
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="w-full xl:w-72 flex-shrink-0 space-y-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <RiFilter3Fill size={14} className="text-[#C9A227]" />
                  Filtros
                </h3>

                <button
                  type="button"
                  onClick={clearReportFilters}
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Buscar
                  </label>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nombre, código o usuario..."
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Empresa
                  </label>

                  <select className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                    <option>Todas las empresas</option>
                    <option>Grupo Víquez S.A</option>
                    <option>Textiles de Occidente</option>
                    <option>Pacific Pet Food</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Sucursal
                  </label>

                  <select className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                    <option>Todas las sucursales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Vendedor
                  </label>

                  <select className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                    <option>Todos los vendedores</option>
                    <option>Ana Gómez</option>
                    <option>Manuel Rojas</option>
                    <option>Laura Gómez</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Fecha desde
                    </label>

                    <div className="relative">
                      <RiCalendarLine
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        type="text"
                        defaultValue="01/06/2024"
                        className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Fecha hasta
                    </label>

                    <div className="relative">
                      <RiCalendarLine
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        type="text"
                        defaultValue="30/06/2024"
                        className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Tipo de reporte
                  </label>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Todos">Todos los reportes</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Productos">Productos</option>
                    <option value="Clientes">Clientes</option>
                    <option value="Financiero">Financiero</option>
                    <option value="Inventario">Inventario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Estado
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="Completado">Completado</option>
                    <option value="En proceso">En proceso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Agrupar por
                  </label>

                  <select className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                    <option>Día</option>
                    <option>Semana</option>
                    <option>Mes</option>
                    <option>Año</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-300">
                    Incluir impuestos
                  </span>

                  <button
                    type="button"
                    onClick={() => setIncludeTax((value) => !value)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      includeTax ? "bg-[#C9A227]" : "bg-gray-600"
                    }`}
                    aria-pressed={includeTax}
                    aria-label="Incluir impuestos"
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        includeTax
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>

            {/* Saved Reports */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">
                Reportes guardados
              </h3>

              <div className="space-y-2">
                {savedReports.map((savedReport) => {
                  const Icon = savedReport.icon;

                  return (
                    <div
                      key={savedReport.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1c2538] transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center flex-shrink-0 group-hover:border-[#C9A227]/50">
                        <Icon
                          size={14}
                          style={{ color: savedReport.color }}
                        />
                      </div>

                      <span className="text-sm text-gray-300 flex-1">
                        {savedReport.name}
                      </span>

                      <RiStarLine
                        size={14}
                        className="text-gray-500 hover:text-[#C9A227] transition-colors"
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="w-full text-center text-xs text-[#C9A227] hover:text-white mt-3 py-2 transition-colors cursor-pointer"
              >
                Ver todos los reportes guardados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 cursor-default"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar panel de nuevo reporte"
          />

          <div className="relative h-full w-full max-w-lg overflow-y-auto border-l border-[#2a3550] bg-[#141d2e]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#2a3550] bg-[#141d2e] px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold">Nuevo reporte</h2>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Nombre del reporte
                </label>

                <input
                  type="text"
                  placeholder="Ej. Ventas mensual Q2"
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Tipo de reporte
                </label>

                <select className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                  <option>Ventas</option>
                  <option>Productos</option>
                  <option>Clientes</option>
                  <option>Financiero</option>
                  <option>Inventario</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Fecha desde
                  </label>

                  <input
                    type="date"
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Fecha hasta
                  </label>

                  <input
                    type="date"
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Empresa
                </label>

                <select className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                  <option>Todas las empresas</option>
                  <option>Grupo Víquez S.A</option>
                  <option>Textiles de Occidente</option>
                  <option>Pacific Pet Food</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Formato de exportación
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="bg-[#C9A227]/15 border border-[#C9A227]/30 text-[#C9A227] text-sm font-medium py-2 rounded-lg cursor-pointer"
                  >
                    PDF
                  </button>

                  <button
                    type="button"
                    className="bg-[#1c2538] border border-[#2a3550] text-gray-300 text-sm font-medium py-2 rounded-lg hover:text-white hover:bg-[#C9A227]/15 cursor-pointer"
                  >
                    Excel
                  </button>

                  <button
                    type="button"
                    className="bg-[#1c2538] border border-[#2a3550] text-gray-300 text-sm font-medium py-2 rounded-lg hover:text-white hover:bg-[#C9A227]/15 cursor-pointer"
                  >
                    CSV
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2a3550]">
                <button
                  type="button"
                  className="w-full bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Generar reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
