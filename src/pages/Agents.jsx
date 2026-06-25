import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import {
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
  RiLogoutBoxLine,
  RiArrowDownSFill,
  RiSearchLine,
  RiFilterLine,
  RiAddFill,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiEditFill,
  RiUserSharedFill,
  RiEyeFill,
  RiPhoneFill,
  RiMailFill,
  RiMapPinFill,
  RiUserFill,
  RiBriefcaseFill,
  RiMoneyDollarCircleFill,
  RiStoreFill,
  RiTeamFill,
  RiBarChartFill,
  RiStarFill,
} from "react-icons/ri";

/* ─── MOCK DATA: AGENTES ─────────────────────────────────────────── */
const MOCK_AGENTS = [
  { id: 1, initials: "JC", color: "#3b82f6", name: "Jean Carlo Víquez", company: "Grupo Víquez", sales: "24.8 M", clientsCount: 18, status: "Activo", email: "jeancarlo@grupoviquez.com", phone: "+506 8888 1111", territory: "Occidente", totalQuotes: 67, totalOrders: 142, commission: "2.5%", notes: "" },
  { id: 2, initials: "MR", color: "#22c55e", name: "María Rodríguez", company: "Textiles de Occidente", sales: "19.3 M", clientsCount: 14, status: "Activo", email: "maria@textilesoccidente.com", phone: "+506 8888 2222", territory: "Centro", totalQuotes: 45, totalOrders: 98, commission: "2.0%", notes: "" },
  { id: 3, initials: "CP", color: "#f59e0b", name: "Carlos Pérez", company: "Constructora Víquez", sales: "15.7 M", clientsCount: 11, status: "Activo", email: "carlos@constructoraviquez.com", phone: "+506 8888 3333", territory: "Occidente", totalQuotes: 38, totalOrders: 76, commission: "2.0%", notes: "" },
  { id: 4, initials: "AL", color: "#ec4899", name: "Ana López", company: "Pacific Pet Food", sales: "12.1 M", clientsCount: 9, status: "Activo", email: "ana@pacificpetfood.com", phone: "+506 8888 4444", territory: "Nacional", totalQuotes: 32, totalOrders: 65, commission: "2.5%", notes: "" },
  { id: 5, initials: "DH", color: "#6366f1", name: "Diego Hernández", company: "Occidente Lab", sales: "10.4 M", clientsCount: 8, status: "Activo", email: "diego@occidentelab.com", phone: "+506 8888 5555", territory: "Occidente", totalQuotes: 28, totalOrders: 54, commission: "2.0%", notes: "" },
  { id: 6, initials: "SG", color: "#14b8a6", name: "Sofía Gómez", company: "Agro Occidente Group", sales: "8.9 M", clientsCount: 7, status: "Activo", email: "sofia@agrooccidente.com", phone: "+506 8888 6666", territory: "Norte", totalQuotes: 24, totalOrders: 48, commission: "2.0%", notes: "" },
  { id: 7, initials: "RM", color: "#a855f7", name: "Roberto Méndez", company: "Grupo Víquez", sales: "7.2 M", clientsCount: 6, status: "Inactivo", email: "roberto@grupoviquez.com", phone: "+506 8888 7777", territory: "Centro", totalQuotes: 15, totalOrders: 32, commission: "2.5%", notes: "" },
  { id: 8, initials: "LF", color: "#ef4444", name: "Laura Fernández", company: "Textiles de Occidente", sales: "5.6 M", clientsCount: 5, status: "Activo", email: "laura@textilesoccidente.com", phone: "+506 8888 8888", territory: "Sur", totalQuotes: 18, totalOrders: 41, commission: "2.0%", notes: "" },
];

const avatarColors = ["#6366f1", "#ec4899", "#3b82f6", "#f59e0b", "#22c55e", "#14b8a6", "#a855f7", "#ef4444"];

/* ─── HELPERS ──────────────────────────────────────────────────── */
function PagBtn({ icon, label, active }) {
  return (
    <button className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${active ? "bg-[#2563eb] text-white" : "text-gray-500 hover:text-white hover:bg-[#1e3a5f]"}`}>
      {icon || label}
    </button>
  );
}

function Field({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3 text-gray-500">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors`}
        />
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────────── */
export default function Agents() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [companyFilter, setCompanyFilter] = useState("Todas");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create"); // "create" | "edit" | "view"
  const [editAgent, setEditAgent] = useState(null);
  const [viewAgent, setViewAgent] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", territory: "", commission: "", status: "Activo", notes: "" });

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditAgent(null);
    setViewAgent(null);
    setForm({ name: "", email: "", phone: "", company: "", territory: "", commission: "", status: "Activo", notes: "" });
    setDrawerOpen(true);
  };

  const openEditDrawer = (a) => {
    setDrawerMode("edit");
    setEditAgent(a);
    setViewAgent(null);
    setForm({ name: a.name, email: a.email, phone: a.phone, company: a.company, territory: a.territory, commission: a.commission, status: a.status, notes: a.notes || "" });
    setDrawerOpen(true);
  };

  const openViewDrawer = (a) => {
    setDrawerMode("view");
    setViewAgent(a);
    setEditAgent(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => { setDrawerMode("create"); setEditAgent(null); setViewAgent(null); }, 300);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const filtered = MOCK_AGENTS.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.company.toLowerCase().includes(q);
    const matchStatus = statusFilter === "Todos" || a.status === statusFilter;
    const matchCompany = companyFilter === "Todas" || a.company === companyFilter;
    return matchSearch && matchStatus && matchCompany;
  });

  /* Metrics */
  const metrics = [
    { label: "Agentes Totales", value: "42", icon: <RiUserFill size={20} />, color: "bg-[#1e3a5f]", iconColor: "text-[#60a5fa]", growth: "+8", growthColor: "text-green-400" },
    { label: "Activos", value: "38", icon: <RiCheckboxCircleFill size={20} />, color: "bg-[#14301a]", iconColor: "text-[#4ade80]", growth: "+5", growthColor: "text-green-400" },
    { label: "Inactivos", value: "4", icon: <RiCloseCircleFill size={20} />, color: "bg-[#3b1a1a]", iconColor: "text-[#f87171]", growth: "-1", growthColor: "text-red-400" },
    { label: "Ventas Acumuladas", value: "₡104.0 M", icon: <RiMoneyDollarCircleFill size={20} />, color: "bg-[#2d200a]", iconColor: "text-[#fbbf24]", growth: "+18%", growthColor: "text-green-400" },
  ];

  const companies = ["Todas", "Grupo Víquez", "Textiles de Occidente", "Constructora Víquez", "Pacific Pet Food", "Occidente Lab", "Agro Occidente Group"];

  return (
    <div className="w-full h-screen bg-[#0a0e1a] text-white flex overflow-hidden">
      <DashSideBar
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        currentCompany={currentCompany}
        toggleCollapse={toggleCollapse}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-[#1f2a40] flex items-center justify-between px-5 flex-shrink-0 bg-[#0a0e1a]">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
              <RiMenuFill size={20} />
            </button>
            <span className="text-xs text-gray-500">Comercial</span>
            <span className="text-gray-600">/</span>
            <span className="text-xs text-white font-medium">Agentes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setCompanyDropdown(!companyDropdown)} className="flex items-center gap-2 text-sm text-white hover:bg-[#141a2a] px-3 py-1.5 rounded-lg transition-colors">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.color }} />
                <span className="hidden sm:inline">{currentCompany.name}</span>
                <RiArrowDownSFill size={14} className="text-gray-500" />
              </button>
              {companyDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-[#1f2a40] rounded-xl shadow-xl z-50 py-1">
                  {companies.slice(1).map((c) => (
                    <button key={c} onClick={() => { setCurrentCompany({ name: c, color: "#c9a227" }); setCompanyDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1e3a5f] transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <RiNotification3Fill size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <RiSettings4Fill size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {/* Title + button */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">Agentes</h1>
              <p className="text-sm text-gray-400 mt-0.5">Administra todos los agentes comerciales del grupo.</p>
            </div>
            <button onClick={openCreateDrawer} className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
              <RiAddFill size={16} /> Nuevo agente
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4 hover:border-[#2563eb]/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center ${m.iconColor}`}>{m.icon}</div>
                  <span className={`text-xs font-medium ${m.growthColor}`}>{m.growth}</span>
                </div>
                <div className="text-xl font-bold text-white">{m.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar agente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111827] border border-[#1f2a40] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-[#111827] border border-[#1f2a40] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors cursor-pointer"
                >
                  <option>Todos los estados</option>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
                <RiArrowDownSFill size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="appearance-none bg-[#111827] border border-[#1f2a40] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors cursor-pointer"
                >
                  {companies.map((c) => <option key={c}>{c}</option>)}
                </select>
                <RiArrowDownSFill size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <button className="flex items-center gap-1.5 bg-[#111827] border border-[#1f2a40] text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors">
                <RiFilterLine size={14} /> Filtros
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111827] border border-[#1f2a40] rounded-xl overflow-hidden">
            <table className="w-full text-left hidden md:table">
              <thead>
                <tr className="border-b border-[#1f2a40]">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Agente</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Territorio</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Clientes</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2a40]">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-[#0f1623]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: a.color }}>
                          {a.initials}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{a.name}</div>
                          <div className="text-xs text-gray-500">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-sm">{a.company}</td>
                    <td className="px-5 py-3 text-gray-300 text-sm">{a.territory}</td>
                    <td className="px-5 py-3 text-white font-semibold text-sm">{a.clientsCount}</td>
                    <td className="px-5 py-3 text-white font-semibold text-sm">{a.sales}</td>
                    <td className="px-5 py-3">
                      {a.status === "Activo"
                        ? <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit"><RiCheckboxCircleFill size={12} /> Activo</span>
                        : <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit"><RiCloseCircleFill size={12} /> Inactivo</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openViewDrawer(a)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Ver agente">
                          <RiEyeFill size={14} />
                        </button>
                        <button onClick={() => openEditDrawer(a)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Editar">
                          <RiEditFill size={14} />
                        </button>
                        <button onClick={() => setDeactivateModal(a)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors" title="Desactivar">
                          <RiUserSharedFill size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-14 h-14 rounded-full bg-[#1f2a40] flex items-center justify-center text-gray-600">
                  <RiUserFill size={28} />
                </div>
                <p className="text-sm text-gray-500">No se encontraron agentes</p>
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); setCompanyFilter("Todas"); }} className="text-xs text-[#60a5fa] hover:underline">Limpiar filtros</button>
              </div>
            )}
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1f2a40]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 42 agentes</span>
              <div className="flex items-center gap-1">
                <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                {[1,2,3,4,5].map((n) => <PagBtn key={n} label={n} active={n===1} />)}
                <PagBtn icon={<RiArrowRightSFill size={14} />} />
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 mb-6">
            {filtered.map((a) => (
              <div key={a.id} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: a.color }}>
                      {a.initials}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.company}</div>
                    </div>
                  </div>
                  {a.status === "Activo"
                    ? <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><RiCheckboxCircleFill size={11} /> Activo</span>
                    : <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><RiCloseCircleFill size={11} /> Inactivo</span>
                  }
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-semibold">{a.sales}</span>
                  <span className="text-gray-500 text-xs">{a.clientsCount} clientes</span>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#1f2a40]">
                  <button onClick={() => openViewDrawer(a)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiEyeFill size={13} /></button>
                  <button onClick={() => openEditDrawer(a)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiEditFill size={13} /></button>
                  <button onClick={() => setDeactivateModal(a)} className="w-7 h-7 rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors"><RiUserSharedFill size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeDrawer} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#111827] border-l border-[#1f2a40] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#1f2a40] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && <><RiAddFill size={20} className="text-[#2563eb]" />Nuevo Agente</>}
              {drawerMode === "edit" && <><RiEditFill size={20} className="text-[#2563eb]" />Editar Agente</>}
              {drawerMode === "view" && <><RiEyeFill size={20} className="text-[#60a5fa]" />Detalle del Agente</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" ? "Completa la información del nuevo agente." : drawerMode === "edit" ? "Modifica la información del agente." : "Información completa del agente."}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-4">
              <Field icon={<RiUserFill size={14} />} label="Nombre completo" placeholder="Ej. Juan Pérez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Field icon={<RiMailFill size={14} />} label="Correo electrónico" placeholder="agente@empresa.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Field icon={<RiPhoneFill size={14} />} label="Teléfono" placeholder="+506 0000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Empresa</label>
                <div className="relative">
                  <RiBriefcaseFill size={14} className="absolute left-3 top-3 text-gray-500" />
                  <select value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="appearance-none w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors cursor-pointer">
                    <option value="">Seleccionar empresa</option>
                    {companies.slice(1).map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <Field icon={<RiMapPinFill size={14} />} label="Territorio" placeholder="Ej. Occidente, Centro, Nacional..." value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Comisión</label>
                <div className="relative">
                  <RiStarFill size={14} className="absolute left-3 top-3 text-gray-500" />
                  <input type="text" placeholder="Ej. 2.5%" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Estado</label>
                <div className="flex gap-5">
                  {["Activo", "Inactivo"].map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setForm({ ...form, status: s })} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${form.status === s ? s === "Activo" ? "border-green-400" : "border-red-400" : "border-gray-600"}`}>
                        {form.status === s && <div className={`w-2 h-2 rounded-full ${s === "Activo" ? "bg-green-400" : "bg-red-400"}`} />}
                      </div>
                      <span className={`text-sm ${form.status === s ? "text-white" : "text-gray-400"}`}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notas</label>
                <textarea placeholder="Notas internas sobre el agente..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors resize-none" />
              </div>
            </div>
          )}

          {drawerMode === "view" && viewAgent && (
            <div className="space-y-5">
              {/* Avatar header */}
              <div className="flex items-center gap-4 pb-5 border-b border-[#1f2a40]">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: viewAgent.color }}>
                  {viewAgent.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewAgent.name}</h3>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit mt-1">
                    <RiCheckboxCircleFill size={11} /> {viewAgent.status}
                  </span>
                </div>
              </div>

              {/* Datos de contacto */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos de Contacto</p>
                <div className="space-y-3">
                  {[
                    { label: "Correo", value: viewAgent.email, icon: <RiMailFill size={12} /> },
                    { label: "Teléfono", value: viewAgent.phone, icon: <RiPhoneFill size={12} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center gap-3 py-2 border-b border-[#1f2a40]">
                      <span className="text-gray-500">{icon}</span>
                      <div>
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-sm text-white">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información comercial */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Información Comercial</p>
                <div className="space-y-3">
                  {[
                    { label: "Empresa", value: viewAgent.company, icon: <RiBriefcaseFill size={12} /> },
                    { label: "Territorio", value: viewAgent.territory, icon: <RiMapPinFill size={12} /> },
                    { label: "Ventas Acumuladas", value: viewAgent.sales, icon: <RiMoneyDollarCircleFill size={12} /> },
                    { label: "Clientes Asignados", value: viewAgent.clientsCount, icon: <RiTeamFill size={12} /> },
                    { label: "Cotizaciones", value: viewAgent.totalQuotes, icon: <RiClipboardFill size={12} /> },
                    { label: "Pedidos", value: viewAgent.totalOrders, icon: <RiStoreFill size={12} /> },
                    { label: "Comisión", value: viewAgent.commission, icon: <RiStarFill size={12} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center gap-3 py-2 border-b border-[#1f2a40]">
                      <span className="text-gray-500">{icon}</span>
                      <div>
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-sm text-white">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        {drawerMode !== "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#1f2a40] flex-shrink-0">
            <button onClick={closeDrawer} className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Cancelar
            </button>
            <button className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              {drawerMode === "create" ? "Guardar Agente" : "Guardar Cambios"}
            </button>
          </div>
        )}
        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#1f2a40] flex-shrink-0">
            <button onClick={() => { closeDrawer(); setTimeout(() => openEditDrawer(viewAgent), 350); }} className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a5f] text-[#60a5fa] hover:bg-[#2563eb] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              <RiEditFill size={15} /> Editar Agente
            </button>
            <button onClick={closeDrawer} className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {deactivateModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setDeactivateModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#111827] border border-[#1f2a40] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <RiUserSharedFill size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-center text-base font-bold text-white mb-1">Desactivar agente</h3>
              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Desactivar a <span className="text-white font-medium">{deactivateModal.name}</span>? El agente pasará a estado inactivo y no podrá realizar ventas.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeactivateModal(null)} className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={() => setDeactivateModal(null)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
