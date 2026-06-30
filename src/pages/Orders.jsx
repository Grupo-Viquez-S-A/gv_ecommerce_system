import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import {
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
  RiArrowDownSFill,
  RiSearchLine,
  RiAddFill,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiEyeFill,
  RiEditFill,
  RiDownloadFill,
  RiCalendarLine,
  RiExportFill,
  RiUserFill,
  RiMoneyDollarCircleFill,
  RiStoreFill,
} from "react-icons/ri";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* ─── MOCK DATA: PEDIDOS ────────────────────────────────────────────────────────────────────────────── */
const MOCK_ORDERS = [
  { id: 1, number: "PED-000247", client: "María Fernández", date: "30/06/2024 14:30", total: "€45.200.000", status: "En proceso", payment: "Pagado", agent: "Ana Gómez", avatar: "AG" },
  { id: 2, number: "PED-000246", client: "Constructora Solís", date: "30/06/2024 11:12", total: "€28.750.000", status: "Pendiente", payment: "Pendiente", agent: "Manuel Rojas", avatar: "MR" },
  { id: 3, number: "PED-000245", client: "Hotel Los Laureles", date: "29/06/2024 16:45", total: "€15.600.000", status: "Enviado", payment: "Pagado", agent: "Laura Gómez", avatar: "LG" },
  { id: 4, number: "PED-000244", client: "Pacific Pet Food", date: "27/06/2024 09:20", total: "€37.100.000", status: "Enviado", payment: "Pagado", agent: "Ana Gómez", avatar: "AG" },
  { id: 5, number: "PED-000243", client: "Distribuidora del Norte", date: "28/06/2024 10:35", total: "€9.850.000", status: "Entregado", payment: "Pagado", agent: "Manuel Rojas", avatar: "MR" },
  { id: 6, number: "PED-000242", client: "Farmacia La Salud", date: "27/06/2024 15:18", total: "€6.450.000", status: "Cancelado", payment: "Reembolsado", agent: "Laura Gómez", avatar: "LG" },
  { id: 7, number: "PED-000241", client: "Grupo Alimenticio S.A.", date: "27/06/2024 12:54", total: "€18.500.000", status: "Entregado", payment: "Pagado", agent: "Ana Gómez", avatar: "AG" },
];

/* ─── STATUS CONFIG ──────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  Pendiente:   { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
  "En proceso": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  Enviado:     { bg: "bg-[#C9A227]/10",   text: "text-[#C9A227]",   border: "border-[#C9A227]/20" },
  Entregado:   { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
  Cancelado:   { bg: "bg-gray-500/10",   text: "text-gray-400",   border: "border-gray-500/20" },
};

const PAYMENT_CONFIG = {
  Pagado:      { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
  Pendiente:   { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  Reembolsado: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
};

/* ─── CHART DATA ─────────────────────────────────────────────────────────────── */
const dailyOrdersData = [
  { name: "01 Jun", value: 8 }, { name: "03 Jun", value: 12 }, { name: "05 Jun", value: 15 },
  { name: "07 Jun", value: 18 }, { name: "09 Jun", value: 22 }, { name: "11 Jun", value: 25 },
  { name: "13 Jun", value: 20 }, { name: "15 Jun", value: 28 }, { name: "17 Jun", value: 32 },
  { name: "19 Jun", value: 38 }, { name: "21 Jun", value: 28 }, { name: "23 Jun", value: 25 },
  { name: "25 Jun", value: 18 }, { name: "27 Jun", value: 15 }, { name: "29 Jun", value: 10 },
  { name: "30 Jun", value: 8 },
];

/* ─── HELPERS ──────────────────────────────────────────────────── */
function PagBtn({ icon, label, active }) {
  return (
    <button className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${active ? "bg-[#C9A227] text-white" : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"} cursor-pointer`}>
      {icon || label}
    </button>
  );
}

function StatusBadge({ status, config }) {
  const cfg = config[status] || config.Pendiente;
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status}
    </span>
  );
}

function Field({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3 text-gray-500">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-[#222e44] border border-[#2a3550] rounded-lg ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors`}
        />
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────────── */
export default function Orders() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

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

  const [form, setForm] = useState({ client: "", date: "", total: "", status: "Pendiente", payment: "Pagado", agent: "" });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setViewOrder(null);
    setEditOrder(null);
    setForm({ client: "", date: "", total: "", status: "Pendiente", payment: "Pagado", agent: "" });
    setDrawerOpen(true);
  };
  const openEditDrawer = (o) => {
    setDrawerMode("edit");
    setEditOrder(o);
    setViewOrder(null);
    setForm({ client: o.client, date: o.date, total: o.total, status: o.status, payment: o.payment, agent: o.agent });
    setDrawerOpen(true);
  };
  const openViewDrawer = (o) => { setDrawerMode("view"); setViewOrder(o); setEditOrder(null); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => { setDrawerMode("create"); setViewOrder(null); setEditOrder(null); }, 300); };

  const handleSaveOrder = () => {
    if (drawerMode === "create") {
      const newNumber = `PED-${String(nextId).padStart(6, "0")}`;
      const avatar = form.agent.split(" ").map((n) => n[0]).join("").toUpperCase();
      const newOrder = {
        id: nextId,
        number: newNumber,
        client: form.client,
        date: form.date,
        total: form.total,
        status: form.status,
        payment: form.payment,
        agent: form.agent,
        avatar: avatar || "NA",
      };
      setOrders((prev) => [newOrder, ...prev]);
      setNextId((prev) => prev + 1);
    } else if (drawerMode === "edit" && editOrder) {
      const avatar = form.agent.split(" ").map((n) => n[0]).join("").toUpperCase();
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, client: form.client, date: form.date, total: form.total, status: form.status, payment: form.payment, agent: form.agent, avatar: avatar || "NA" } : o));
    }
    closeDrawer();
  };

  const filtered = orders.filter((o) => {
    const sq = search.toLowerCase();
    const matchSearch = o.number.toLowerCase().includes(sq) || o.client.toLowerCase().includes(sq);
    const matchStatus = statusFilter === "Todos" || o.status === statusFilter;
    const matchPayment = paymentFilter === "Todos" || o.payment === paymentFilter;
    const matchAgent = agentFilter === "Todos" || o.agent === agentFilter;
    return matchSearch && matchStatus && matchPayment && matchAgent;
  });

  const agents = ["Todos", "Ana Gómez", "Manuel Rojas", "Laura Gómez"];
  const companies = ["Todas", "Grupo Víquez", "Textiles de Occidente", "Constructora Víquez", "Pacific Pet Food", "Occidente Lab", "Agro Occidente Group"];

  const metrics = [
    { label: "PEDIDOS TOTALES", value: "247", growth: "+12%", growthColor: "text-green-400", color: "#C9A227", iconColor: "text-[#C9A227]", bg: "bg-[#C9A227]/10" },
    { label: "VENTAS TOTALES", value: "€185 M", growth: "+14%", growthColor: "text-green-400", color: "#22c55e", iconColor: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
    { label: "PEDIDOS PENDIENTES", value: "38", growth: "+8%", growthColor: "text-green-400", color: "#f59e0b", iconColor: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
    { label: "EN PROCESO", value: "45", growth: "+15%", growthColor: "text-green-400", color: "#f97316", iconColor: "text-[#f97316]", bg: "bg-[#f97316]/10" },
    { label: "ENVIADOS", value: "112", growth: "-10%", growthColor: "text-red-400", color: "#C9A227", iconColor: "text-[#C9A227]", bg: "bg-[#C9A227]/10" },
    { label: "ENTREGADOS", value: "47", growth: "+17%", growthColor: "text-green-400", color: "#ef4444", iconColor: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
  ];

  return (
    <div className="w-full h-screen bg-[#0B1120] text-white flex overflow-hidden">
      <DashSideBar
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        currentCompany={currentCompany}
        toggleCollapse={toggleCollapse}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-[#2a3550] flex items-center justify-between px-5 flex-shrink-0 bg-[#0B1120]">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white cursor-pointer">
              <RiMenuFill size={20} />
            </button>
            <span className="text-xs text-gray-500">Comercial</span>
            <span className="text-gray-600">/</span>
            <span className="text-xs text-white font-medium">Pedidos</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setCompanyDropdown(!companyDropdown)} className="flex items-center gap-2 text-sm text-white hover:bg-[#1c2538] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.color }} />
                <span className="hidden sm:inline">{currentCompany.name}</span>
                <RiArrowDownSFill size={14} className="text-gray-500" />
              </button>
              {companyDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#141d2e] border border-[#2a3550] rounded-xl shadow-xl z-50 py-1">
                  {companies.slice(1).map((c) => (
                    <button key={c} onClick={() => { setCurrentCompany({ name: c, color: "#c9a227" }); setCompanyDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer">{c}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="relative text-gray-400 hover:text-white transition-colors cursor-pointer">
              <RiNotification3Fill size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors cursor-pointer"><RiSettings4Fill size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">Pedidos</h1>
              <p className="text-sm text-gray-400 mt-0.5">Consulta y gestiona todos los pedidos realizados.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-[#1c2538] border border-[#2a3550] hover:bg-[#C9A227]/15 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
                <RiExportFill size={15} /> Exportar
              </button>
              <button onClick={openCreateDrawer} className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20 cursor-pointer">
                <RiAddFill size={16} /> Nuevo Pedido
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center ${m.iconColor}`}>
                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: m.color }} />
                  </div>
                </div>
                <div className="text-xl font-bold text-white">{m.value}</div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">{m.label}</div>
                <div className={`text-xs font-medium mt-1 ${m.growthColor}`}>{m.growth} vs. mes anterior</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Pedidos por día</h3>
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
                Este mes <RiArrowDownSFill size={12} />
              </button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyOrdersData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#141d2e", border: "1px solid #2a3550", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(v) => [`${v} pedidos`, "Pedidos"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#C9A227" strokeWidth={2} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="relative lg:col-span-2">
                <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Buscar por número, cliente o producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors" />
              </div>
              <div>
                <div className="relative">
                  <RiCalendarLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <RiCalendarLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option>Todos los estados</option>
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>Enviado</option>
                    <option>Entregado</option>
                    <option>Cancelado</option>
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option>Todos los pagos</option>
                    <option>Pagado</option>
                    <option>Pendiente</option>
                    <option>Reembolsado</option>
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    {agents.map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-2 lg:col-span-2 lg:col-start-5">
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setPaymentFilter("Todos"); setAgentFilter("Todos"); }} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">
                  Limpiar filtros
                </button>
                <button className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550]">
              <h3 className="text-sm font-semibold text-white">Listado de Pedidos</h3>
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
                <RiExportFill size={13} /> Exportar <RiArrowDownSFill size={12} />
              </button>
            </div>
            <table className="w-full text-left hidden md:table">
              <thead>
                <tr className="border-b border-[#2a3550]">
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pago</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3550]">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-[#1c2538]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{o.number}</td>
                    <td className="px-4 py-3 text-sm text-white">{o.client}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{o.date}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">{o.total}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} config={STATUS_CONFIG} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.payment} config={PAYMENT_CONFIG} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">{o.avatar}</div>
                        <span className="text-sm text-gray-300">{o.agent}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openViewDrawer(o)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Ver"><RiEyeFill size={13} /></button>
                        <button onClick={() => openEditDrawer(o)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Editar"><RiEditFill size={13} /></button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Descargar"><RiDownloadFill size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <RiSearchLine size={28} className="text-gray-600" />
                <p className="text-sm text-gray-500">No se encontraron pedidos</p>
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setPaymentFilter("Todos"); setAgentFilter("Todos"); }} className="text-xs text-[#C9A227] hover:underline cursor-pointer">Limpiar filtros</button>
              </div>
            )}
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 247 pedidos</span>
              <div className="flex items-center gap-1">
                <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                {[1,2,3].map((n) => <PagBtn key={n} label={n} active={n===1} />)}
                <span className="text-gray-600 px-1">...</span>
                <PagBtn label={25} />
                <PagBtn icon={<RiArrowRightSFill size={14} />} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Drawer */}
      {drawerOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer" onClick={closeDrawer} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && <><RiAddFill size={20} className="text-[#C9A227]" />Nuevo Pedido</>}
              {drawerMode === "edit" && <><RiEditFill size={20} className="text-[#C9A227]" />Editar Pedido</>}
              {drawerMode === "view" && <><RiEyeFill size={20} className="text-[#C9A227]" />Detalle del Pedido</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" ? "Registra un nuevo pedido." : drawerMode === "edit" ? "Modifica los datos del pedido." : "Información completa del pedido."}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-4">
              <Field icon={<RiUserFill size={14} />} label="Cliente" placeholder="Nombre del cliente" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
              <Field icon={<RiCalendarLine size={14} />} label="Fecha" placeholder="DD/MM/YYYY HH:mm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Field icon={<RiMoneyDollarCircleFill size={14} />} label="Total" placeholder="€0.000.000" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Estado</label>
                <div className="relative">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>Enviado</option>
                    <option>Entregado</option>
                    <option>Cancelado</option>
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Pago</label>
                <div className="relative">
                  <select value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option>Pagado</option>
                    <option>Pendiente</option>
                    <option>Reembolsado</option>
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Vendedor</label>
                <div className="relative">
                  <select value={form.agent} onChange={(e) => setForm({ ...form, agent: e.target.value })} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option value="">Seleccionar vendedor</option>
                    {agents.filter((a) => a !== "Todos").map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {drawerMode === "view" && viewOrder && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">{viewOrder.number.slice(-3)}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewOrder.number}</h3>
                  <StatusBadge status={viewOrder.status} config={STATUS_CONFIG} />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Cliente", value: viewOrder.client },
                  { label: "Fecha", value: viewOrder.date },
                  { label: "Total", value: viewOrder.total },
                  { label: "Estado", value: <StatusBadge status={viewOrder.status} config={STATUS_CONFIG} /> },
                  { label: "Pago", value: <StatusBadge status={viewOrder.payment} config={PAYMENT_CONFIG} /> },
                  { label: "Vendedor", value: viewOrder.agent },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        {drawerMode !== "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button onClick={closeDrawer} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              Cancelar
            </button>
            <button onClick={handleSaveOrder} className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              {drawerMode === "create" ? "Guardar Pedido" : "Guardar Cambios"}
            </button>
          </div>
        )}
        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button onClick={() => { closeDrawer(); setTimeout(() => openEditDrawer(viewOrder), 350); }} className="flex-1 flex items-center justify-center gap-2 bg-[#C9A227]/15 text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              <RiEditFill size={15} /> Editar Pedido
            </button>
            <button onClick={closeDrawer} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
