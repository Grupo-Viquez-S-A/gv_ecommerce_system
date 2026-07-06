import { useState } from "react";

import {
  RiAddFill,
  RiArrowDownSFill,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCalendarLine,
  RiDownloadFill,
  RiEditFill,
  RiExportFill,
  RiEyeFill,
  RiMoneyDollarCircleFill,
  RiSearchLine,
  RiUserFill,
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

/* ─── MOCK DATA: PEDIDOS ─────────────────────────────────── */
const MOCK_ORDERS = [
  {
    id: 1,
    number: "PED-000247",
    client: "María Fernández",
    date: "30/06/2024 14:30",
    total: "€45.200.000",
    status: "En proceso",
    payment: "Pagado",
    agent: "Ana Gómez",
    avatar: "AG",
  },
  {
    id: 2,
    number: "PED-000246",
    client: "Constructora Solís",
    date: "30/06/2024 11:12",
    total: "€28.750.000",
    status: "Pendiente",
    payment: "Pendiente",
    agent: "Manuel Rojas",
    avatar: "MR",
  },
  {
    id: 3,
    number: "PED-000245",
    client: "Hotel Los Laureles",
    date: "29/06/2024 16:45",
    total: "€15.600.000",
    status: "Enviado",
    payment: "Pagado",
    agent: "Laura Gómez",
    avatar: "LG",
  },
  {
    id: 4,
    number: "PED-000244",
    client: "Pacific Pet Food",
    date: "27/06/2024 09:20",
    total: "€37.100.000",
    status: "Enviado",
    payment: "Pagado",
    agent: "Ana Gómez",
    avatar: "AG",
  },
  {
    id: 5,
    number: "PED-000243",
    client: "Distribuidora del Norte",
    date: "28/06/2024 10:35",
    total: "€9.850.000",
    status: "Entregado",
    payment: "Pagado",
    agent: "Manuel Rojas",
    avatar: "MR",
  },
  {
    id: 6,
    number: "PED-000242",
    client: "Farmacia La Salud",
    date: "27/06/2024 15:18",
    total: "€6.450.000",
    status: "Cancelado",
    payment: "Reembolsado",
    agent: "Laura Gómez",
    avatar: "LG",
  },
  {
    id: 7,
    number: "PED-000241",
    client: "Grupo Alimenticio S.A.",
    date: "27/06/2024 12:54",
    total: "€18.500.000",
    status: "Entregado",
    payment: "Pagado",
    agent: "Ana Gómez",
    avatar: "AG",
  },
];

/* ─── CONFIGURACIÓN DE ESTADOS ───────────────────────────── */
const STATUS_CONFIG = {
  Pendiente: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  "En proceso": {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  Enviado: {
    bg: "bg-[#C9A227]/10",
    text: "text-[#C9A227]",
    border: "border-[#C9A227]/20",
  },
  Entregado: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  Cancelado: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
  },
};

const PAYMENT_CONFIG = {
  Pagado: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  Pendiente: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  Reembolsado: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
};

/* ─── DATOS DEL GRÁFICO ──────────────────────────────────── */
const dailyOrdersData = [
  { name: "01 Jun", value: 8 },
  { name: "03 Jun", value: 12 },
  { name: "05 Jun", value: 15 },
  { name: "07 Jun", value: 18 },
  { name: "09 Jun", value: 22 },
  { name: "11 Jun", value: 25 },
  { name: "13 Jun", value: 20 },
  { name: "15 Jun", value: 28 },
  { name: "17 Jun", value: 32 },
  { name: "19 Jun", value: 38 },
  { name: "21 Jun", value: 28 },
  { name: "23 Jun", value: 25 },
  { name: "25 Jun", value: 18 },
  { name: "27 Jun", value: 15 },
  { name: "29 Jun", value: 10 },
  { name: "30 Jun", value: 8 },
];

/* ─── COMPONENTES AUXILIARES ─────────────────────────────── */
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

function StatusBadge({ status, config }) {
  const selectedConfig = config[status] || config.Pendiente;

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${selectedConfig.bg} ${selectedConfig.text} ${selectedConfig.border}`}
    >
      {status}
    </span>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-3 text-gray-500">
            {icon}
          </span>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-[#222e44] border border-[#2a3550] rounded-lg ${
            icon ? "pl-9" : "pl-3"
          } pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors`}
        />
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ───────────────────────────────────── */
export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [agentFilter, setAgentFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("01/06/2024");
  const [dateTo, setDateTo] = useState("30/06/2024");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [viewOrder, setViewOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);

  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [nextId, setNextId] = useState(248);

  const [form, setForm] = useState({
    client: "",
    date: "",
    total: "",
    status: "Pendiente",
    payment: "Pagado",
    agent: "",
  });

  const agents = [
    "Todos",
    "Ana Gómez",
    "Manuel Rojas",
    "Laura Gómez",
  ];

  const metrics = [
    {
      label: "PEDIDOS TOTALES",
      value: "247",
      growth: "+12%",
      growthColor: "text-green-400",
      color: "#C9A227",
      iconColor: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
    },
    {
      label: "VENTAS TOTALES",
      value: "€185 M",
      growth: "+14%",
      growthColor: "text-green-400",
      color: "#22c55e",
      iconColor: "text-[#22c55e]",
      bg: "bg-[#22c55e]/10",
    },
    {
      label: "PEDIDOS PENDIENTES",
      value: "38",
      growth: "+8%",
      growthColor: "text-green-400",
      color: "#f59e0b",
      iconColor: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10",
    },
    {
      label: "EN PROCESO",
      value: "45",
      growth: "+15%",
      growthColor: "text-green-400",
      color: "#f97316",
      iconColor: "text-[#f97316]",
      bg: "bg-[#f97316]/10",
    },
    {
      label: "ENVIADOS",
      value: "112",
      growth: "-10%",
      growthColor: "text-red-400",
      color: "#C9A227",
      iconColor: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
    },
    {
      label: "ENTREGADOS",
      value: "47",
      growth: "+17%",
      growthColor: "text-green-400",
      color: "#ef4444",
      iconColor: "text-[#ef4444]",
      bg: "bg-[#ef4444]/10",
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = search.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      order.number.toLowerCase().includes(normalizedSearch) ||
      order.client.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "Todos" || order.status === statusFilter;

    const matchesPayment =
      paymentFilter === "Todos" || order.payment === paymentFilter;

    const matchesAgent =
      agentFilter === "Todos" || order.agent === agentFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesAgent
    );
  });

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setViewOrder(null);
    setEditOrder(null);

    setForm({
      client: "",
      date: "",
      total: "",
      status: "Pendiente",
      payment: "Pagado",
      agent: "",
    });

    setDrawerOpen(true);
  };

  const openEditDrawer = (order) => {
    setDrawerMode("edit");
    setEditOrder(order);
    setViewOrder(null);

    setForm({
      client: order.client,
      date: order.date,
      total: order.total,
      status: order.status,
      payment: order.payment,
      agent: order.agent,
    });

    setDrawerOpen(true);
  };

  const openViewDrawer = (order) => {
    setDrawerMode("view");
    setViewOrder(order);
    setEditOrder(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);

    window.setTimeout(() => {
      setDrawerMode("create");
      setViewOrder(null);
      setEditOrder(null);
    }, 300);
  };

  const handleSaveOrder = () => {
    if (!form.client.trim()) {
      window.alert("Ingresa el nombre del cliente.");
      return;
    }

    if (!form.agent.trim()) {
      window.alert("Selecciona un vendedor.");
      return;
    }

    const avatar =
      form.agent
        .split(" ")
        .filter(Boolean)
        .map((name) => name[0])
        .join("")
        .toUpperCase() || "NA";

    if (drawerMode === "create") {
      const newOrder = {
        id: nextId,
        number: `PED-${String(nextId).padStart(6, "0")}`,
        client: form.client.trim(),
        date: form.date.trim(),
        total: form.total.trim(),
        status: form.status,
        payment: form.payment,
        agent: form.agent,
        avatar,
      };

      setOrders((previousOrders) => [
        newOrder,
        ...previousOrders,
      ]);

      setNextId((previousId) => previousId + 1);
    }

    if (drawerMode === "edit" && editOrder) {
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === editOrder.id
            ? {
                ...order,
                client: form.client.trim(),
                date: form.date.trim(),
                total: form.total.trim(),
                status: form.status,
                payment: form.payment,
                agent: form.agent,
                avatar,
              }
            : order,
        ),
      );
    }

    closeDrawer();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setPaymentFilter("Todos");
    setAgentFilter("Todos");
    setDateFrom("01/06/2024");
    setDateTo("30/06/2024");
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
              <span className="text-gray-300">Pedidos</span>
            </div>

            <h1 className="text-xl font-bold text-white">Pedidos</h1>

            <p className="text-sm text-gray-400 mt-0.5">
              Consulta y gestiona todos los pedidos realizados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 bg-[#1c2538] border border-[#2a3550] hover:bg-[#C9A227]/15 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RiExportFill size={15} />
              Exportar
            </button>

            <button
              type="button"
              onClick={openCreateDrawer}
              className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20 cursor-pointer"
            >
              <RiAddFill size={16} />
              Nuevo Pedido
            </button>
          </div>
        </div>

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

              <div
                className={`text-xs font-medium mt-1 ${metric.growthColor}`}
              >
                {metric.growth} vs. mes anterior
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Pedidos por día
            </h3>

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Este mes
              <RiArrowDownSFill size={12} />
            </button>
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
                  formatter={(value) => [`${value} pedidos`, "Pedidos"]}
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
            <div className="relative lg:col-span-2">
              <RiSearchLine
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
              />
            </div>

            <div>
              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
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
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  <option value="Todos">Todos los pagos</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Reembolsado">Reembolsado</option>
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

            <div className="flex items-center gap-2 lg:col-span-2 lg:col-start-5">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>

              <button
                type="button"
                className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550]">
            <h3 className="text-sm font-semibold text-white">
              Listado de Pedidos
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
                  #
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
                  Estado
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
                    {order.number}
                  </td>

                  <td className="px-4 py-3 text-sm text-white">
                    {order.client}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-400">
                    {order.date}
                  </td>

                  <td className="px-4 py-3 text-sm text-white font-semibold">
                    {order.total}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={order.status}
                      config={STATUS_CONFIG}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={order.payment}
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
                        onClick={() => openEditDrawer(order)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <RiEditFill size={13} />
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

          {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <RiSearchLine size={28} className="text-gray-600" />

              <p className="text-sm text-gray-500">
                No se encontraron pedidos
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
              Mostrando 1 a {filteredOrders.length} de 247 pedidos
            </span>

            <div className="flex items-center gap-1">
              <PagBtn icon={<RiArrowLeftSLine size={14} />} />

              {[1, 2, 3].map((page) => (
                <PagBtn
                  key={page}
                  label={page}
                  active={page === 1}
                />
              ))}

              <span className="text-gray-600 px-1">...</span>

              <PagBtn label={25} />

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
          aria-label="Cerrar panel de pedido"
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
              {drawerMode === "create" && (
                <>
                  <RiAddFill size={20} className="text-[#C9A227]" />
                  Nuevo Pedido
                </>
              )}

              {drawerMode === "edit" && (
                <>
                  <RiEditFill size={20} className="text-[#C9A227]" />
                  Editar Pedido
                </>
              )}

              {drawerMode === "view" && (
                <>
                  <RiEyeFill size={20} className="text-[#C9A227]" />
                  Detalle del Pedido
                </>
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create"
                ? "Registra un nuevo pedido."
                : drawerMode === "edit"
                  ? "Modifica los datos del pedido."
                  : "Información completa del pedido."}
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
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-4">
              <Field
                icon={<RiUserFill size={14} />}
                label="Cliente"
                placeholder="Nombre del cliente"
                value={form.client}
                onChange={(event) =>
                  setForm({
                    ...form,
                    client: event.target.value,
                  })
                }
              />

              <Field
                icon={<RiCalendarLine size={14} />}
                label="Fecha"
                placeholder="DD/MM/YYYY HH:mm"
                value={form.date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    date: event.target.value,
                  })
                }
              />

              <Field
                icon={<RiMoneyDollarCircleFill size={14} />}
                label="Total"
                placeholder="€0.000.000"
                value={form.total}
                onChange={(event) =>
                  setForm({
                    ...form,
                    total: event.target.value,
                  })
                }
              />

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Estado
                </label>

                <div className="relative">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                      })
                    }
                    className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                  >
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>Enviado</option>
                    <option>Entregado</option>
                    <option>Cancelado</option>
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Pago
                </label>

                <div className="relative">
                  <select
                    value={form.payment}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        payment: event.target.value,
                      })
                    }
                    className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                  >
                    <option>Pagado</option>
                    <option>Pendiente</option>
                    <option>Reembolsado</option>
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Vendedor
                </label>

                <div className="relative">
                  <select
                    value={form.agent}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        agent: event.target.value,
                      })
                    }
                    className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                  >
                    <option value="">Seleccionar vendedor</option>

                    {agents
                      .filter((agent) => agent !== "Todos")
                      .map((agent) => (
                        <option key={agent}>{agent}</option>
                      ))}
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          )}

          {drawerMode === "view" && viewOrder && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">
                  {viewOrder.number.slice(-3)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {viewOrder.number}
                  </h3>

                  <StatusBadge
                    status={viewOrder.status}
                    config={STATUS_CONFIG}
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

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Fecha</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.date}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.total}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Estado</span>
                  <StatusBadge
                    status={viewOrder.status}
                    config={STATUS_CONFIG}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Pago</span>
                  <StatusBadge
                    status={viewOrder.payment}
                    config={PAYMENT_CONFIG}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Vendedor</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.agent}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {(drawerMode === "create" || drawerMode === "edit") && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveOrder}
              className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {drawerMode === "create"
                ? "Guardar Pedido"
                : "Guardar Cambios"}
            </button>
          </div>
        )}

        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                const orderToEdit = viewOrder;

                closeDrawer();

                window.setTimeout(() => {
                  if (orderToEdit) {
                    openEditDrawer(orderToEdit);
                  }
                }, 350);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C9A227]/15 text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RiEditFill size={15} />
              Editar Pedido
            </button>

            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>
  );
}