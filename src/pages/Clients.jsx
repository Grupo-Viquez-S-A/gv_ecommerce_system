import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import {
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
  RiLogoutBoxLine,
  RiArrowDownSFill,
  RiArrowRightSLine,
  RiSearchLine,
  RiFilterLine,
  RiAddFill,
  RiCloseLine,
  RiDeleteBinFill,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiEditFill,
  RiMoreFill,
  RiEyeFill,
  RiBuilding2Fill,
  RiPhoneFill,
  RiMailFill,
  RiMapPinFill,
  RiUserFill,
  RiBriefcaseFill,
  RiTimeLine,
  RiBarChartFill,
  RiMoneyDollarCircleFill,
} from "react-icons/ri";

/* ─── MOCK DATA: CLIENTES ─────────────────────────────────────────── */
const MOCK_CLIENTS = [
  { id: 1, initials: "HL", color: "#3b82f6", name: "Hotel Los Laureles", company: "Textiles de Occidente", sales: "18.5 M", lastPurchase: "Hace 3 días", status: "Activo", email: "contacto@loslaureles.com", phone: "+506 2222 1111", address: "Puntarenas, Costa Rica", totalOrders: 47, totalQuotes: 23, notes: "" },
  { id: 2, initials: "VG", color: "#22c55e", name: "Veterinaria Grecia", company: "Pacific Pet Food", sales: "12.7 M", lastPurchase: "Hoy", status: "Activo", email: "info@veterinariagrecia.com", phone: "+506 2494 2222", address: "Grecia, Alajuela", totalOrders: 62, totalQuotes: 18, notes: "" },
  { id: 3, initials: "CS", color: "#f59e0b", name: "Constructora San Carlos", company: "Constructora Víquez", sales: "9.3 M", lastPurchase: "Hace 2 días", status: "Activo", email: "ventas@csan.carlos.com", phone: "+506 2401 3333", address: "San Carlos, Alajuela", totalOrders: 31, totalQuotes: 15, notes: "" },
  { id: 4, initials: "RT", color: "#ec4899", name: "Restaurante El Trapiche", company: "Occidente Lab", sales: "6.8 M", lastPurchase: "Hace 1 semana", status: "Activo", email: "eltrapiche@grupoviquez.com", phone: "+506 2645 4444", address: "Naranjo, Alajuela", totalOrders: 22, totalQuotes: 8, notes: "" },
  { id: 5, initials: "HV", color: "#6366f1", name: "Hotel Vista Real", company: "Textiles de Occidente", sales: "5.4 M", lastPurchase: "Ayer", status: "Activo", email: "reservas@vistareal.com", phone: "+506 2637 5555", address: "San Ramón, Alajuela", totalOrders: 19, totalQuotes: 12, notes: "" },
  { id: 6, initials: "LE", color: "#14b8a6", name: "Lavandería El Sol", company: "Occidente Lab", sales: "4.1 M", lastPurchase: "Hace 4 días", status: "Activo", email: "elsol@lavanderia.com", phone: "+506 2443 6666", address: "Palmares, Alajuela", totalOrders: 28, totalQuotes: 5, notes: "" },
  { id: 7, initials: "PS", color: "#a855f7", name: "Pet Shop San Rafael", company: "Pacific Pet Food", sales: "3.2 M", lastPurchase: "Hace 5 días", status: "Activo", email: "sanrafael@petshop.com", phone: "+506 2277 7777", address: "San Rafael, Heredia", totalOrders: 15, totalQuotes: 7, notes: "" },
  { id: 8, initials: "AE", color: "#ef4444", name: "Agropecuaria La Esperanza", company: "Agro Occidente Group", sales: "2.9 M", lastPurchase: "Hace 1 semana", status: "Activo", email: "laesperanza@agro.com", phone: "+506 2456 8888", address: "San Carlos, Alajuela", totalOrders: 11, totalQuotes: 4, notes: "" },
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

function FormField({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors`}
        />
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────────── */
export default function Clients() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create"); // "create" | "edit" | "view"
  const [editClient, setEditClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", status: "Activo", notes: "" });

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditClient(null);
    setViewClient(null);
    setForm({ name: "", email: "", phone: "", company: "", address: "", status: "Activo", notes: "" });
    setDrawerOpen(true);
  };

  const openEditDrawer = (c) => {
    setDrawerMode("edit");
    setEditClient(c);
    setViewClient(null);
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, address: c.address, status: c.status, notes: c.notes || "" });
    setDrawerOpen(true);
  };

  const openViewDrawer = (c) => {
    setDrawerMode("view");
    setViewClient(c);
    setEditClient(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => { setDrawerMode("create"); setEditClient(null); setViewClient(null); }, 300);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const filtered = MOCK_CLIENTS.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q);
    const matchStatus = statusFilter === "Todos" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* Metrics */
  const metrics = [
    { label: "Clientes Totales", value: "42", icon: <RiUserFill size={20} />, color: "bg-[#1e3a5f]", iconColor: "text-[#60a5fa]", growth: "+5", growthColor: "text-green-400" },
    { label: "Activos", value: "38", icon: <RiCheckboxCircleFill size={20} />, color: "bg-[#14301a]", iconColor: "text-[#4ade80]", growth: "+3", growthColor: "text-green-400" },
    { label: "Inactivos", value: "4", icon: <RiCloseCircleFill size={20} />, color: "bg-[#3b1a1a]", iconColor: "text-[#f87171]", growth: "-1", growthColor: "text-red-400" },
    { label: "Ventas Acumuladas", value: "₡62.9 M", icon: <RiMoneyDollarCircleFill size={20} />, color: "bg-[#2d200a]", iconColor: "text-[#fbbf24]", growth: "+12%", growthColor: "text-green-400" },
  ];

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-14 bg-[#0f1623] border-b border-[#1f2a40] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
              <RiMenuFill size={22} />
            </button>
            <div className="relative">
              <button
                onClick={() => setCompanyDropdown(!companyDropdown)}
                className="flex items-center gap-2 text-sm font-medium text-white hover:bg-[#141a2a] px-3 py-1.5 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.color || "#c9a227" }} />
                {currentCompany.name}
                <RiArrowDownSFill size={16} className="text-gray-400" />
              </button>
              {companyDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#141a2a] border border-[#1f2a40] rounded-lg shadow-xl z-50 py-1">
                  {(user?.companies || [{ name: "Grupo Víquez S.A", color: "#c9a227" }]).map((c, i) => (
                    <button
                      key={c.id || i}
                      onClick={() => { setCurrentCompany({ ...c, color: c.color || avatarColors[i % avatarColors.length] }); setCompanyDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1e3a5f] transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || avatarColors[i % avatarColors.length] }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors">
              <RiNotification3Fill size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors">
              <RiSettings4Fill size={16} />
            </button>
            <button onClick={signOut} className="w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors">
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        </header>

        {/* Main scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
            <span>Comercial</span>
            <RiArrowRightSLine size={14} />
            <span className="text-gray-300">Clientes</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Clientes</h1>
              <p className="text-sm text-gray-400 mt-1">Administra todos los clientes del grupo.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={openCreateDrawer}
                className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <RiAddFill size={18} />
                Nuevo cliente
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4 hover:border-[#2563eb]/40 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center ${m.iconColor} mb-2`}>
                  {m.icon}
                </div>
                <div className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">{m.label}</div>
                <div className="text-2xl font-bold text-white">{m.value}</div>
                <div className="flex items-center gap-1 text-xs mt-0.5">
                  <span className={`font-medium ${m.growthColor}`}>{m.growth}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filters + actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
            <div className="relative">
              <RiFilterLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#2563eb] transition-colors appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <RiArrowDownSFill size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 bg-[#111827] hover:bg-[#1e3a5f] border border-[#1f2a40] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <RiFilterLine size={15} /> Filtros
            </button>
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-[#111827] border border-[#1f2a40] rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2a40]">
                  {["CLIENTE", "EMPRESA", "VENTAS ACUMULADAS", "ÚLTIMA COMPRA", "ESTADO", "ACCIONES"].map((col) => (
                    <th key={col} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#1f2a40] last:border-0 hover:bg-[#141a2a] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: c.color }}>
                          {c.initials}
                        </div>
                        <span className="font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-sm">{c.company}</td>
                    <td className="px-5 py-3 text-white font-semibold text-sm">{c.sales}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.lastPurchase}</td>
                    <td className="px-5 py-3">
                      {c.status === "Activo"
                        ? <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit"><RiCheckboxCircleFill size={12} /> Activo</span>
                        : <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit"><RiCloseCircleFill size={12} /> Inactivo</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openViewDrawer(c)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Ver cliente">
                          <RiEyeFill size={14} />
                        </button>
                        <button onClick={() => openEditDrawer(c)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Editar">
                          <RiEditFill size={14} />
                        </button>
                        <button onClick={() => setDeleteModal(c)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Eliminar">
                          <RiDeleteBinFill size={14} />
                        </button>
                        <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Más opciones">
                          <RiMoreFill size={14} />
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
                <p className="text-sm text-gray-500">No se encontraron clientes</p>
                <button onClick={() => { setSearch(""); setStatusFilter("Todos"); }} className="text-xs text-[#60a5fa] hover:underline">Limpiar filtros</button>
              </div>
            )}
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1f2a40]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 42 clientes</span>
              <div className="flex items-center gap-1">
                <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                {[1,2,3,4,5].map((n) => <PagBtn key={n} label={n} active={n===1} />)}
                <PagBtn icon={<RiArrowRightSFill size={14} />} />
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 mb-6">
            {filtered.map((c) => (
              <div key={c.id} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: c.color }}>
                      {c.initials}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.company}</div>
                    </div>
                  </div>
                  {c.status === "Activo"
                    ? <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><RiCheckboxCircleFill size={11} /> Activo</span>
                    : <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><RiCloseCircleFill size={11} /> Inactivo</span>
                  }
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-semibold">{c.sales}</span>
                  <span className="text-gray-500 text-xs">{c.lastPurchase}</span>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#1f2a40]">
                  <button onClick={() => openViewDrawer(c)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiEyeFill size={13} /></button>
                  <button onClick={() => openEditDrawer(c)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiEditFill size={13} /></button>
                  <button onClick={() => setDeleteModal(c)} className="w-7 h-7 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors"><RiDeleteBinFill size={13} /></button>
                  <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiMoreFill size={13} /></button>
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
              {drawerMode === "create" && <><RiAddFill size={20} className="text-[#2563eb]" />Nuevo Cliente</>}
              {drawerMode === "edit" && <><RiEditFill size={20} className="text-[#2563eb]" />Editar Cliente</>}
              {drawerMode === "view" && <><RiEyeFill size={20} className="text-[#60a5fa]" />Detalle del Cliente</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" ? "Completa la información del nuevo cliente." : drawerMode === "edit" ? "Modifica la información del cliente." : "Información completa del cliente."}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-5">
              <FormField label="Nombre del Cliente" placeholder="Ej. Hotel Los Laureles" value={form.name} onChange={(v) => setForm({ ...form, name: v })} icon={<RiBuilding2Fill size={14} />} />
              <FormField label="Correo Electrónico" placeholder="Ej. contacto@empresa.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" icon={<RiMailFill size={14} />} />
              <FormField label="Teléfono" placeholder="Ej. +506 8888 8888" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" icon={<RiPhoneFill size={14} />} />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Empresa Grupo</label>
                <div className="relative">
                  <select value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors appearance-none cursor-pointer">
                    <option value="">Seleccionar empresa del grupo</option>
                    <option>Grupo Víquez S.A</option>
                    <option>Textiles de Occidente</option>
                    <option>Pacific Pet Food</option>
                    <option>Constructora Víquez</option>
                    <option>Occidente Lab</option>
                    <option>Agro Occidente Group</option>
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Dirección</label>
                <div className="relative">
                  <RiMapPinFill size={14} className="absolute left-3 top-3 text-gray-500" />
                  <textarea
                    placeholder="Ej. San Ramón, Alajuela, Costa Rica"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
                  />
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
                <textarea
                  placeholder="Notas internas sobre el cliente..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {drawerMode === "view" && viewClient && (
            <div className="space-y-5">
              {/* Avatar header */}
              <div className="flex items-center gap-4 pb-5 border-b border-[#1f2a40]">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: viewClient.color }}>
                  {viewClient.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewClient.name}</h3>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit mt-1">
                    <RiCheckboxCircleFill size={11} /> {viewClient.status}
                  </span>
                </div>
              </div>

              {/* Datos de contacto */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos de Contacto</p>
                <div className="space-y-3">
                  {[
                    { label: "Correo", value: viewClient.email, icon: <RiMailFill size={12} /> },
                    { label: "Teléfono", value: viewClient.phone, icon: <RiPhoneFill size={12} /> },
                    { label: "Dirección", value: viewClient.address, icon: <RiMapPinFill size={12} /> },
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
                    { label: "Empresa del Grupo", value: viewClient.company, icon: <RiBriefcaseFill size={12} /> },
                    { label: "Ventas Acumuladas", value: viewClient.sales, icon: <RiMoneyDollarCircleFill size={12} /> },
                    { label: "Última Compra", value: viewClient.lastPurchase, icon: <RiTimeLine size={12} /> },
                    { label: "Total de Órdenes", value: viewClient.totalOrders, icon: <RiBarChartFill size={12} /> },
                    { label: "Cotizaciones", value: viewClient.totalQuotes, icon: <RiClipboardFill size={12} /> },
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
              {drawerMode === "create" ? "Guardar Cliente" : "Guardar Cambios"}
            </button>
          </div>
        )}
        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#1f2a40] flex-shrink-0">
            <button onClick={() => { closeDrawer(); setTimeout(() => openEditDrawer(viewClient), 350); }} className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a5f] text-[#60a5fa] hover:bg-[#2563eb] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              <RiEditFill size={15} /> Editar Cliente
            </button>
            <button onClick={closeDrawer} className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setDeleteModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#111827] border border-[#1f2a40] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <RiDeleteBinFill size={24} className="text-red-400" />
              </div>
              <h3 className="text-center text-base font-bold text-white mb-1">Eliminar cliente</h3>
              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Estás seguro de que deseas eliminar a <span className="text-white font-medium">{deleteModal.name}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
