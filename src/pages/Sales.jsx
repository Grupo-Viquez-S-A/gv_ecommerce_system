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
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiEyeFill,
  RiEditFill,
  RiDownloadFill,
  RiMoreFill,
  RiCalendarLine,
  RiExportFill,
  RiUserFill,
  RiStoreFill,
  RiMoneyDollarCircleFill,
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

/* ─── MOCK DATA: VENTAS ──────────────────────────────────────── */
const MOCK_SALES = [
  { id: 1, number: "VEN-000247", client: "María Fernández", date: "30/06/2024 14:30", products: 3, total: "€45.200.000", status: "Completada", agent: "Ana Gómez", avatar: "AG" },
  { id: 2, number: "VEN-000246", client: "Constructora Solís", date: "30/06/2024 11:12", products: 7, total: "€28.750.000", status: "Completada", agent: "Manuel Rojas", avatar: "MR" },
  { id: 3, number: "VEN-000245", client: "Hotel Los Laureles", date: "29/06/2024 16:45", products: 2, total: "€15.600.000", status: "En proceso", agent: "Laura Gómez", avatar: "LG" },
  { id: 4, number: "VEN-000244", client: "Pacific Pet Food", date: "27/06/2024 09:20", products: 5, total: "€9.850.000", status: "Completada", agent: "Ana Gómez", avatar: "AG" },
  { id: 5, number: "VEN-000243", client: "Distribuidora del Norte", date: "28/06/2024 10:35", products: 4, total: "€6.450.000", status: "Completada", agent: "Manuel Rojas", avatar: "MR" },
  { id: 6, number: "VEN-000242", client: "Farmacia La Salud", date: "27/06/2024 15:18", products: 2, total: "€3.200.000", status: "Cancelada", agent: "Laura Gómez", avatar: "LG" },
  { id: 7, number: "VEN-000241", client: "Grupo Alimenticio S.A.", date: "27/06/2024 12:54", products: 6, total: "€18.500.000", status: "Completada", agent: "Ana Gómez", avatar: "AG" },
];

/* ─── STATUS CONFIG ───────────────────────────────────────── */
const STATUS_CONFIG = {
  Completada:  { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  "En proceso": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  Cancelada:   { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
};

/* ─── CHART DATA ──────────────────────────────────────────── */
const dailySalesData = [
  { name: "01 Jun", value: 4.2 }, { name: "03 Jun", value: 5.1 }, { name: "05 Jun", value: 7.8 },
  { name: "07 Jun", value: 5.5 }, { name: "09 Jun", value: 6.0 }, { name: "11 Jun", value: 8.2 },
  { name: "13 Jun", value: 5.8 }, { name: "15 Jun", value: 7.0 }, { name: "17 Jun", value: 9.5 },
  { name: "19 Jun", value: 12.0 }, { name: "21 Jun", value: 14.5 }, { name: "23 Jun", value: 10.0 },
  { name: "25 Jun", value: 8.5 }, { name: "27 Jun", value: 6.2 }, { name: "29 Jun", value: 5.0 },
  { name: "30 Jun", value: 4.5 },
];

/* ─── HELPERS ────────────────────────────────────────────── */
function PagBtn({ icon, label, active }) {
  return (
    <button className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${active ? "bg-[#C9A227] text-white" : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"} cursor-pointer`}>
      {icon || label}
    </button>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["En proceso"];
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

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function Sales() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [agentFilter, setAgentFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("01/06/2024");
  const [dateTo, setDateTo] = useState("30/06/2024");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [viewSale, setViewSale] = useState(null);
  const [editSale, setEditSale] = useState(null);
  const [sales, setSales] = useState(MOCK_SALES);
  const [nextId, setNextId] = useState(248);

  const [form, setForm] = useState({ client: "", date: "", products: "", total: "", status: "Completada", agent: "" });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setViewSale(null);
    setEditSale(null);
    setForm({ client: "", date: "", products: "", total: "", status: "Completada", agent: "" });
    setDrawerOpen(true);
  };
  const openEditDrawer = (s) => {
    setDrawerMode("edit");
    setEditSale(s);
    setViewSale(null);
    setForm({ client: s.client, date: s.date, products: s.products, total: s.total, status: s.status, agent: s.agent });
    setDrawerOpen(true);
  };
  const openViewDrawer = (s) => { setDrawerMode("view"); setViewSale(s); setEditSale(null); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => { setDrawerMode("create"); setViewSale(null); setEditSale(null); }, 300); };

  const handleSaveSale = () => {
    if (drawerMode === "create") {
      const newNumber = `VEN-${String(nextId).padStart(6, "0")}`;
      const avatar = form.agent.split(" ").map((n) => n[0]).join("").toUpperCase();
      const newSale = {
        id: nextId,
        number: newNumber,
        client: form.client,
        date: form.date,
        products: Number(form.products) || 0,
        total: form.total,
        status: form.status,
        agent: form.agent,
        avatar: avatar || "NA",
      };
      setSales((prev) => [newSale, ...prev]);
      setNextId((prev) => prev + 1);
    } else if (drawerMode === "edit" && editSale) {
      const avatar = form.agent.split(" ").map((n) => n[0]).join("").toUpperCase();
      setSales((prev) => prev.map((s) => s.id === editSale.id ? { ...s, client: form.client, date: form.date, products: Number(form.products) || 0, total: form.total, status: form.status, agent: form.agent, avatar: avatar || "NA" } : s));
    }
    closeDrawer();
  };

  const filtered = sales.filter((s) => {
    const sq = search.toLowerCase();
    const matchSearch = s.number.toLowerCase().includes(sq) || s.client.toLowerCase().includes(sq);
    const matchStatus = statusFilter === "Todos" || s.status === statusFilter;
    const matchAgent = agentFilter === "Todos" || s.agent === agentFilter;
    return matchSearch && matchStatus && matchAgent;
  });

  const agents = ["Todos", "Ana Gómez", "Manuel Rojas", "Laura Gómez"];
  const companies = ["Todas", "Grupo Víquez", "Textiles de Occidente", "Constructora Víquez", "Pacific Pet Food", "Occidente Lab", "Agro Occidente Group"];

  const metrics = [
    { label: "VENTAS TOTALES", value: "€185 M", growth: "+14%", growthColor: "text-green-400", color: "#C9A227", iconColor: "text-[#C9A227]", bg: "bg-[#C9A227]/10" },
    { label: "ÓRDENES REALIZADAS", value: "247", growth: "+12%", growthColor: "text-green-400", color: "#22c55e", iconColor: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
    { label: "TICKET PROMEDIO", value: "€748.000", growth: "+7%", growthColor: "text-green-400", color: "#8b5cf6", iconColor: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
    { label: "PRODUCTOS VENDIDOS", value: "1.532", growth: "+5%", growthColor: "text-green-400", color: "#f59e0b", iconColor: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
    { label: "DEVOLUCIONES", value: "€3.2 M", growth: "-8%", growthColor: "text-red-400", color: "#ef4444", iconColor: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
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
            <span className="text-xs text-white font-medium">Ventas</span>
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
              <h1 className="text-xl font-bold text-white">Ventas</h1>
              <p className="text-sm text-gray-400 mt-0.5">Consulta y gestiona todas las ventas realizadas en el grupo.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-[#1c2538] border border-[#2a3550] hover:bg-[#C9A227]/15 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
                <RiExportFill size={15} /> Exportar
              </button>
              <button onClick={openCreateDrawer} className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20 cursor-pointer">
                <RiAddFill size={16} /> Nueva Venta
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center ${m.iconColor}`}>
                    {i === 1 ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 12 L6 8 L9 11 L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: m.color }} />
                    )}
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
              <h3 className="text-sm font-semibold text-white">Ventas por día</h3>
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
                Este mes <RiArrowDownSFill size={12} />
              </button>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v} M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#141d2e", border: "1px solid #2a3550", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(v) => [`€${v} M`, "Ventas"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#C9A227" strokeWidth={2} fill="url(#colorSales)" />
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
                    <option>Completada</option>
                    <option>En proceso</option>
                    <option>Cancelada</option>
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
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setAgentFilter("Todos"); }} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">
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
              <h3 className="text-sm font-semibold text-white">Listado de Ventas</h3>
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
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Productos</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3550]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#1c2538]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{s.number}</td>
                    <td className="px-4 py-3 text-sm text-white">{s.client}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{s.date}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold text-center">{s.products}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">{s.total}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">{s.avatar}</div>
                        <span className="text-sm text-gray-300">{s.agent}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openViewDrawer(s)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Ver"><RiEyeFill size={13} /></button>
                        <button onClick={() => openEditDrawer(s)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Editar"><RiEditFill size={13} /></button>
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
                <p className="text-sm text-gray-500">No se encontraron ventas</p>
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setAgentFilter("Todos"); }} className="text-xs text-[#C9A227] hover:underline cursor-pointer">Limpiar filtros</button>
              </div>
            )}
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 247 ventas</span>
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
              {drawerMode === "create" && <><RiAddFill size={20} className="text-[#C9A227]" />Nueva Venta</>}
              {drawerMode === "edit" && <><RiEditFill size={20} className="text-[#C9A227]" />Editar Venta</>}
              {drawerMode === "view" && <><RiEyeFill size={20} className="text-[#C9A227]" />Detalle de Venta</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" ? "Registra una nueva venta." : drawerMode === "edit" ? "Modifica los datos de la venta." : "Información completa de la venta."}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 cursor-pointer">
            <RiCloseLine size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-4">
              <Field icon={<RiUserFill size={14} />} label="Cliente" placeholder="Nombre del cliente" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
              <Field icon={<RiCalendarLine size={14} />} label="Fecha" placeholder="DD/MM/YYYY HH:mm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<RiStoreFill size={14} />} label="Productos" placeholder="Cantidad" type="number" value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} />
                <Field icon={<RiMoneyDollarCircleFill size={14} />} label="Total" placeholder="€0.000.000" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Estado</label>
                <div className="relative">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option>Completada</option>
                    <option>En proceso</option>
                    <option>Cancelada</option>
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

          {drawerMode === "view" && viewSale && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">{viewSale.number.slice(-3)}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewSale.number}</h3>
                  <StatusBadge status={viewSale.status} />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Cliente", value: viewSale.client },
                  { label: "Fecha", value: viewSale.date },
                  { label: "Productos", value: viewSale.products },
                  { label: "Total", value: viewSale.total },
                  { label: "Vendedor", value: viewSale.agent },
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
            <button onClick={handleSaveSale} className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              {drawerMode === "create" ? "Guardar Venta" : "Guardar Cambios"}
            </button>
          </div>
        )}
        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button onClick={() => { closeDrawer(); setTimeout(() => openEditDrawer(viewSale), 350); }} className="flex-1 flex items-center justify-center gap-2 bg-[#C9A227]/15 text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              <RiEditFill size={15} /> Editar Venta
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
