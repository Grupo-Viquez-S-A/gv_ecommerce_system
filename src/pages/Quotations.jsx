import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import {
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
  RiArrowDownSFill,
  RiSearchLine,
  RiFilterLine,
  RiAddFill,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiEyeFill,
  RiEditFill,
  RiDownloadFill,
  RiMailSendFill,
  RiFileCopyFill,
  RiMoreFill,
  RiCalendarLine,
  RiExportFill,
} from "react-icons/ri";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

/* ─── MOCK DATA: COTIZACIONES ─────────────────────────────────────────── */
const MOCK_QUOTATIONS = [
  { id: 1, number: "COT-000172", client: "María Fernández", company: "Textiles de Occidente", date: "30/06/2024", validity: "15/07/2024", total: "€45.200,000", status: "Pendiente", agent: "Ana Gómez", avatar: "AG" },
  { id: 2, number: "COT-000171", client: "Constructora Solís", company: "Constructora Solís S.A.", date: "29/06/2024", validity: "14/07/2024", total: "€28.750,000", status: "En revisión", agent: "Manuel Rojas", avatar: "MR" },
  { id: 3, number: "COT-000170", client: "Hotel Los Laureles", company: "Hotel Los Laureles", date: "28/06/2024", validity: "13/07/2024", total: "€32.100,000", status: "Aprobada", agent: "Ana Gómez", avatar: "AG" },
  { id: 4, number: "COT-000169", client: "Pacific Pet Food", company: "Pacific Pet Food", date: "27/06/2024", validity: "12/07/2024", total: "€15.600,000", status: "Aprobada", agent: "Ana Gómez", avatar: "AG" },
  { id: 5, number: "COT-000168", client: "Distribuidora del Norte", company: "Distribuidora del Norte S.A.", date: "26/06/2024", validity: "11/07/2024", total: "€9.850,000", status: "Rechazada", agent: "Laura Gómez", avatar: "LG" },
  { id: 6, number: "COT-000167", client: "Farmacia La Salud", company: "Farmacia La Salud", date: "25/06/2024", validity: "10/07/2024", total: "€6.450,000", status: "Vencida", agent: "Laura Gómez", avatar: "LG" },
  { id: 7, number: "COT-000166", client: "Grupo Alimenticio S.A.", company: "Grupo Alimenticio S.A.", date: "24/06/2024", validity: "09/07/2024", total: "€18.500,000", status: "Convertida", agent: "Ana Gómez", avatar: "AG" },
  { id: 8, number: "COT-000165", client: "Constructora Víquez", company: "Constructora Víquez", date: "23/06/2024", validity: "08/07/2024", total: "€22.300,000", status: "Pendiente", agent: "Carlos Pérez", avatar: "CP" },
  { id: 9, number: "COT-000164", client: "Agro Occidente", company: "Agro Occidente Group", date: "22/06/2024", validity: "07/07/2024", total: "€11.800,000", status: "En revisión", agent: "Sofía Gómez", avatar: "SG" },
  { id: 10, number: "COT-000163", client: "Occidente Lab", company: "Occidente Lab", date: "21/06/2024", validity: "06/07/2024", total: "€7.200,000", status: "Aprobada", agent: "Diego Hernández", avatar: "DH" },
];

/* ─── STATUS CONFIG ─────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  Pendiente:   { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  "En revisión": { bg: "bg-[#C9A227]/10",   text: "text-[#C9A227]",   border: "border-[#C9A227]/20" },
  Aprobada:    { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
  Rechazada:   { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
  Vencida:     { bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/20" },
  Convertida:  { bg: "bg-teal-500/10",   text: "text-teal-400",   border: "border-teal-500/20" },
};

const STATUS_COLORS = {
  Pendiente: "#f59e0b",
  "En revisión": "#C9A227",
  Aprobada: "#22c55e",
  Rechazada: "#ef4444",
  Vencida: "#ec4899",
  Convertida: "#14b8a6",
};

/* ─── CHART DATA ─────────────────────────────────────────────────────────────── */
const donutData = [
  { name: "Pendientes", value: 28, count: 28 },
  { name: "En revisión", value: 16, count: 16 },
  { name: "Aprobadas", value: 82, count: 82 },
  { name: "Rechazadas", value: 12, count: 12 },
  { name: "Vencidas", value: 22, count: 22 },
  { name: "Convertidas", value: 12, count: 12 },
];

const areaData = [
  { name: "Ene", value: 45 }, { name: "Feb", value: 52 }, { name: "Mar", value: 48 },
  { name: "Abr", value: 60 }, { name: "May", value: 55 }, { name: "Jun", value: 70 },
  { name: "Jul", value: 65 }, { name: "Ago", value: 80 }, { name: "Sep", value: 75 },
  { name: "Oct", value: 90 }, { name: "Nov", value: 85 }, { name: "Dic", value: 100 },
];

const lineData = [
  { name: "Ene", value: 35 }, { name: "Feb", value: 38 }, { name: "Mar", value: 42 },
  { name: "Abr", value: 40 }, { name: "May", value: 45 }, { name: "Jun", value: 43 },
  { name: "Jul", value: 48 }, { name: "Ago", value: 50 }, { name: "Sep", value: 47 },
  { name: "Oct", value: 52 }, { name: "Nov", value: 55 }, { name: "Dic", value: 58 },
];

/* ─── HELPERS ──────────────────────────────────────────────────── */
function PagBtn({ icon, label, active }) {
  return (
    <button className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${active ? "bg-[#C9A227] text-white" : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"}`}>
      {icon || label}
    </button>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pendiente;
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status}
    </span>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────────── */
export default function Quotations() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [companyFilter, setCompanyFilter] = useState("Todas");
  const [agentFilter, setAgentFilter] = useState("Todos");
  const [clientFilter, setClientFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("01/06/2024");
  const [dateTo, setDateTo] = useState("30/06/2024");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [viewQuote, setViewQuote] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const openCreateDrawer = () => { setDrawerMode("create"); setViewQuote(null); setDrawerOpen(true); };
  const openViewDrawer = (q) => { setDrawerMode("view"); setViewQuote(q); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => { setDrawerMode("create"); setViewQuote(null); }, 300); };

  const filtered = MOCK_QUOTATIONS.filter((q) => {
    const sq = search.toLowerCase();
    const matchSearch = q.number.toLowerCase().includes(sq) || q.client.toLowerCase().includes(sq);
    const matchStatus = statusFilter === "Todos" || q.status === statusFilter;
    const matchCompany = companyFilter === "Todas" || q.company === companyFilter;
    const matchAgent = agentFilter === "Todos" || q.agent === agentFilter;
    const matchClient = clientFilter === "Todos" || q.client === clientFilter;
    return matchSearch && matchStatus && matchCompany && matchAgent && matchClient;
  });

  const companies = ["Todas", "Textiles de Occidente", "Constructora Solís S.A.", "Hotel Los Laureles", "Pacific Pet Food", "Distribuidora del Norte S.A.", "Farmacia La Salud", "Grupo Alimenticio S.A.", "Constructora Víquez", "Agro Occidente Group", "Occidente Lab"];
  const agents = ["Todos", "Ana Gómez", "Manuel Rojas", "Carlos Pérez", "Sofía Gómez", "Diego Hernández", "Laura Gómez"];
  const clients = ["Todos", "María Fernández", "Constructora Solís", "Hotel Los Laureles", "Pacific Pet Food", "Distribuidora del Norte", "Farmacia La Salud", "Grupo Alimenticio S.A.", "Constructora Víquez", "Agro Occidente", "Occidente Lab"];

  const metrics = [
    { label: "COTIZACIONES TOTALES", value: "172", growth: "+15%", growthColor: "text-green-400", color: "#8b5cf6", iconColor: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
    { label: "PENDIENTES", value: "28", growth: "+12%", growthColor: "text-red-400", color: "#f59e0b", iconColor: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
    { label: "EN REVISIÓN", value: "16", growth: "+6%", growthColor: "text-green-400", color: "#C9A227", iconColor: "text-[#C9A227]", bg: "bg-[#C9A227]/10" },
    { label: "APROBADAS", value: "82", growth: "+18%", growthColor: "text-green-400", color: "#22c55e", iconColor: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
    { label: "RECHAZADAS", value: "12", growth: "-4%", growthColor: "text-red-400", color: "#ef4444", iconColor: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
    { label: "VENCIDAS", value: "22", growth: "+10%", growthColor: "text-green-400", color: "#ec4899", iconColor: "text-[#ec4899]", bg: "bg-[#ec4899]/10" },
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
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
              <RiMenuFill size={20} />
            </button>
            <span className="text-xs text-gray-500">Comercial</span>
            <span className="text-gray-600">/</span>
            <span className="text-xs text-white font-medium">Cotizaciones</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setCompanyDropdown(!companyDropdown)} className="flex items-center gap-2 text-sm text-white hover:bg-[#1c2538] px-3 py-1.5 rounded-lg transition-colors">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.color }} />
                <span className="hidden sm:inline">{currentCompany.name}</span>
                <RiArrowDownSFill size={14} className="text-gray-500" />
              </button>
              {companyDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#141d2e] border border-[#2a3550] rounded-xl shadow-xl z-50 py-1">
                  {companies.slice(1).map((c) => (
                    <button key={c} onClick={() => { setCurrentCompany({ name: c, color: "#c9a227" }); setCompanyDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#C9A227]/15 transition-colors">{c}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <RiNotification3Fill size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors"><RiSettings4Fill size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">Cotizaciones</h1>
              <p className="text-sm text-gray-400 mt-0.5">Gestiona y da seguimiento a todas las cotizaciones del grupo.</p>
            </div>
            <button onClick={openCreateDrawer} className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20">
              <RiAddFill size={16} /> Nueva Cotización
            </button>
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

          {/* Advanced filters */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Buscar por número o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Cliente</label>
                <div className="relative">
                  <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    {clients.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Empresa</label>
                <div className="relative">
                  <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    {companies.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Estado</label>
                <div className="relative">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    <option>Todos los estados</option>
                    <option>Pendiente</option>
                    <option>En revisión</option>
                    <option>Aprobada</option>
                    <option>Rechazada</option>
                    <option>Vencida</option>
                    <option>Convertida</option>
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Vendedor</label>
                <div className="relative">
                  <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer">
                    {agents.map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <RiArrowDownSFill size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Fecha desde</label>
                <div className="relative">
                  <RiCalendarLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Fecha hasta</label>
                <div className="relative">
                  <RiCalendarLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setCompanyFilter("Todas"); setAgentFilter("Todos"); setClientFilter("Todos"); }} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-1.5 rounded-lg transition-colors">
                  Limpiar filtros
                </button>
                <button className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-1.5 rounded-lg transition-colors">
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550]">
              <h3 className="text-sm font-semibold text-white">Listado de Cotizaciones</h3>
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                <RiExportFill size={13} /> Exportar <RiArrowDownSFill size={12} />
              </button>
            </div>
            <table className="w-full text-left hidden md:table">
              <thead>
                <tr className="border-b border-[#2a3550]">
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vigencia</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3550]">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-[#1c2538]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{q.number}</td>
                    <td className="px-4 py-3 text-sm text-white">{q.client}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{q.company}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{q.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{q.validity}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">{q.total}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">{q.avatar}</div>
                        <span className="text-sm text-gray-300">{q.agent}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openViewDrawer(q)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors" title="Ver"><RiEyeFill size={13} /></button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors" title="Editar"><RiEditFill size={13} /></button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors" title="Descargar"><RiDownloadFill size={13} /></button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors" title="Enviar"><RiMailSendFill size={13} /></button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors" title="Clonar"><RiFileCopyFill size={13} /></button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors" title="Más"><RiMoreFill size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <RiSearchLine size={28} className="text-gray-600" />
                <p className="text-sm text-gray-500">No se encontraron cotizaciones</p>
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setCompanyFilter("Todas"); setAgentFilter("Todos"); setClientFilter("Todos"); }} className="text-xs text-[#C9A227] hover:underline">Limpiar filtros</button>
              </div>
            )}
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 172 cotizaciones</span>
              <div className="flex items-center gap-1">
                <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                {[1,2,3,4,5].map((n) => <PagBtn key={n} label={n} active={n===1} />)}
                <PagBtn icon={<RiArrowRightSFill size={14} />} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Donut chart */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Cotizaciones por estado</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(STATUS_COLORS)[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">172</span>
                    <span className="text-[10px] text-gray-500">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {donutData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: Object.values(STATUS_COLORS)[i] }} />
                        <span className="text-gray-300">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{d.count}</span>
                        <span className="text-gray-500">({Math.round((d.count/172)*100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Area chart */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Valor total de cotizaciones</h3>
              </div>
              <div className="text-xl font-bold text-white mb-1">€156.800.000</div>
              <div className="text-xs text-green-400 mb-4">+14% vs. mes anterior</div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#141d2e", border: "1px solid #2a3550", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#C9A227" strokeWidth={2} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line chart */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Tasa de conversión</h3>
              </div>
              <div className="text-xl font-bold text-white mb-1">47.7%</div>
              <div className="text-xs text-green-400 mb-4">+6% vs. mes anterior</div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#141d2e", border: "1px solid #2a3550", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                      itemStyle={{ color: "#22c55e" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Drawer */}
      {drawerOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeDrawer} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && <><RiAddFill size={20} className="text-[#C9A227]" />Nueva Cotización</>}
              {drawerMode === "view" && <><RiEyeFill size={20} className="text-[#C9A227]" />Detalle de Cotización</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" ? "Completa los datos de la nueva cotización." : "Información completa de la cotización."}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
            <RiCloseLine size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {drawerMode === "view" && viewQuote && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">{viewQuote.number.slice(-3)}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewQuote.number}</h3>
                  <StatusBadge status={viewQuote.status} />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Cliente", value: viewQuote.client },
                  { label: "Empresa", value: viewQuote.company },
                  { label: "Fecha", value: viewQuote.date },
                  { label: "Vigencia", value: viewQuote.validity },
                  { label: "Total", value: viewQuote.total },
                  { label: "Vendedor", value: viewQuote.agent },
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
        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button onClick={closeDrawer} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
