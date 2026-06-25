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
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiEditFill,
  RiEyeFill,
  RiShoppingBagFill,
  RiMoneyDollarCircleFill,
  RiStackFill,
  RiArchiveFill,
  RiImageFill,
  RiBarcodeFill,
  RiClipboardFill,
} from "react-icons/ri";

/* ─── MOCK DATA: PRODUCTOS ─────────────────────────────────────────── */
const MOCK_PRODUCTS = [
  { id: 1, name: "Alimento Premium Perro Adulto", description: "Croquetas balanceadas para perros adultos de razas medianas y grandes", price: 28500, stock: 156, category: "Alimentos", status: "Activo", sku: "PF-001", image: null },
  { id: 2, name: "Alimento Premium Gato Adulto", description: "Croquetas balanceadas para gatos adultos, sabor pollo y pescado", price: 24800, stock: 89, category: "Alimentos", status: "Activo", sku: "PF-002", image: null },
  { id: 3, name: "Snacks Dental Perro", description: "Snacks para higiene dental, reduce placa y sarro", price: 7200, stock: 234, category: "Snacks", status: "Activo", sku: "PF-003", image: null },
  { id: 4, name: "Arena Sanitaria Gato", description: "Arena aglomerante, 5kg, control de olores", price: 12900, stock: 312, category: "Higiene", status: "Activo", sku: "PF-004", image: null },
  { id: 5, name: "Juguete Masticable Resistente", description: "Juguete de goma reforzada para masticación intensa", price: 5800, stock: 67, category: "Juguetes", status: "Activo", sku: "PF-005", image: null },
  { id: 6, name: "Collar Ajustable Reflectivo", description: "Collar con banda reflectiva, tallas S a XL", price: 4500, stock: 0, category: "Accesorios", status: "Inactivo", sku: "PF-006", image: null },
  { id: 7, name: "Shampoo Antipulgas", description: "Shampoo con ingredientes naturales, repelente de pulgas y garrapatas", price: 8900, stock: 45, category: "Higiene", status: "Activo", sku: "PF-007", image: null },
  { id: 8, name: "Correa Retráctil 5m", description: "Correa automática con freno de seguridad, capacidad 25kg", price: 11500, stock: 78, category: "Accesorios", status: "Activo", sku: "PF-008", image: null },
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
export default function Catalog() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create"); // "create" | "edit" | "view"
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category: "", status: "Activo", sku: "" });

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditProduct(null);
    setViewProduct(null);
    setForm({ name: "", description: "", price: "", stock: "", category: "", status: "Activo", sku: "" });
    setDrawerOpen(true);
  };

  const openEditDrawer = (p) => {
    setDrawerMode("edit");
    setEditProduct(p);
    setViewProduct(null);
    setForm({ name: p.name, description: p.description, price: String(p.price), stock: String(p.stock), category: p.category, status: p.status, sku: p.sku });
    setDrawerOpen(true);
  };

  const openViewDrawer = (p) => {
    setDrawerMode("view");
    setViewProduct(p);
    setEditProduct(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => { setDrawerMode("create"); setEditProduct(null); setViewProduct(null); }, 300);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCategory = categoryFilter === "Todas" || p.category === categoryFilter;
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  /* Metrics */
  const metrics = [
    { label: "Productos Totales", value: "124", icon: <RiArchiveFill size={20} />, color: "bg-[#1e3a5f]", iconColor: "text-[#60a5fa]", growth: "+8", growthColor: "text-green-400" },
    { label: "Activos", value: "118", icon: <RiCheckboxCircleFill size={20} />, color: "bg-[#14301a]", iconColor: "text-[#4ade80]", growth: "+5", growthColor: "text-green-400" },
    { label: "Inactivos", value: "6", icon: <RiCloseCircleFill size={20} />, color: "bg-[#3b1a1a]", iconColor: "text-[#f87171]", growth: "-1", growthColor: "text-red-400" },
    { label: "Inventario Total", value: "1,248", icon: <RiStackFill size={20} />, color: "bg-[#2d200a]", iconColor: "text-[#fbbf24]", growth: "+12%", growthColor: "text-green-400" },
  ];

  const CATEGORIES = ["Todas", "Alimentos", "Snacks", "Higiene", "Juguetes", "Accesorios"];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(price);
  };

  const getStockColor = (stock) => {
    if (stock === 0) return "text-red-400";
    if (stock < 20) return "text-yellow-400";
    return "text-green-400";
  };

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
            <span>Ventas</span>
            <RiArrowRightSLine size={14} />
            <span className="text-gray-300">Catálogo</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Catálogo</h1>
              <p className="text-sm text-gray-400 mt-1">Administra los productos del catálogo corporativo.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={openCreateDrawer}
                className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <RiAddFill size={18} />
                Nuevo producto
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

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
            <div className="relative">
              <RiFilterLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#2563eb] transition-colors appearance-none cursor-pointer min-w-[160px]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c === "Todas" ? "Todas las categorías" : c}</option>)}
              </select>
              <RiArrowDownSFill size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
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
                  {["PRODUCTO", "CATEGORÍA", "PRECIO", "STOCK", "SKU", "ESTADO", "ACCIONES"].map((col) => (
                    <th key={col} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[#1f2a40] last:border-0 hover:bg-[#141a2a] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1f2a40] flex items-center justify-center text-gray-500 flex-shrink-0">
                          <RiImageFill size={18} />
                        </div>
                        <div>
                          <span className="font-medium text-white text-sm">{p.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#1e3a5f] text-[#60a5fa]">{p.category}</span>
                    </td>
                    <td className="px-5 py-3 text-white font-semibold text-sm">{formatPrice(p.price)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold ${getStockColor(p.stock)}`}>{p.stock}</span>
                      {p.stock === 0 && <span className="text-xs text-red-400 ml-1">(Agotado)</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">{p.sku}</td>
                    <td className="px-5 py-3">
                      {p.status === "Activo"
                        ? <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit"><RiCheckboxCircleFill size={12} /> Activo</span>
                        : <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit"><RiCloseCircleFill size={12} /> Inactivo</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openViewDrawer(p)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Ver producto">
                          <RiEyeFill size={14} />
                        </button>
                        <button onClick={() => openEditDrawer(p)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors" title="Editar">
                          <RiEditFill size={14} />
                        </button>
                        <button onClick={() => setDeactivateModal(p)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors" title="Desactivar">
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
                  <RiShoppingBagFill size={28} />
                </div>
                <p className="text-sm text-gray-500">No se encontraron productos</p>
                <button onClick={() => { setSearch(""); setCategoryFilter("Todas"); setStatusFilter("Todos"); }} className="text-xs text-[#60a5fa] hover:underline">Limpiar filtros</button>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1f2a40]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 124 productos</span>
              <div className="flex items-center gap-1">
                <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                {[1,2,3,4,5].map((n) => <PagBtn key={n} label={n} active={n===1} />)}
                <PagBtn icon={<RiArrowRightSFill size={14} />} />
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 mb-6">
            {filtered.map((p) => (
              <div key={p.id} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1f2a40] flex items-center justify-center text-gray-500 flex-shrink-0">
                      <RiImageFill size={18} />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category}</div>
                    </div>
                  </div>
                  {p.status === "Activo"
                    ? <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><RiCheckboxCircleFill size={11} /> Activo</span>
                    : <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><RiCloseCircleFill size={11} /> Inactivo</span>
                  }
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-semibold">{formatPrice(p.price)}</span>
                  <span className={`text-sm font-semibold ${getStockColor(p.stock)}`}>Stock: {p.stock}</span>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#1f2a40]">
                  <button onClick={() => openViewDrawer(p)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiEyeFill size={13} /></button>
                  <button onClick={() => openEditDrawer(p)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"><RiEditFill size={13} /></button>
                  <button onClick={() => setDeactivateModal(p)} className="w-7 h-7 rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors"><RiUserSharedFill size={13} /></button>
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
              {drawerMode === "create" && <><RiAddFill size={20} className="text-[#2563eb]" />Nuevo Producto</>}
              {drawerMode === "edit" && <><RiEditFill size={20} className="text-[#2563eb]" />Editar Producto</>}
              {drawerMode === "view" && <><RiEyeFill size={20} className="text-[#60a5fa]" />Detalle del Producto</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" ? "Completa la información del nuevo producto." : drawerMode === "edit" ? "Modifica la información del producto." : "Información completa del producto."}
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
              <FormField label="Nombre del Producto" placeholder="Ej. Alimento Premium Perro Adulto" value={form.name} onChange={(v) => setForm({ ...form, name: v })} icon={<RiShoppingBagFill size={14} />} />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  placeholder="Descripción del producto..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <FormField label="Precio (₡)" placeholder="Ej. 28500" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" icon={<RiMoneyDollarCircleFill size={14} />} />
                </div>
                <div className="flex-1">
                  <FormField label="Stock" placeholder="Ej. 100" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} type="number" icon={<RiStackFill size={14} />} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Categoría</label>
                <div className="relative">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors appearance-none cursor-pointer">
                    <option value="">Seleccionar categoría</option>
                    <option>Alimentos</option>
                    <option>Snacks</option>
                    <option>Higiene</option>
                    <option>Juguetes</option>
                    <option>Accesorios</option>
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <FormField label="SKU" placeholder="Ej. PF-009" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} icon={<RiBarcodeFill size={14} />} />
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
            </div>
          )}

          {drawerMode === "view" && viewProduct && (
            <div className="space-y-5">
              {/* Product header */}
              <div className="flex items-center gap-4 pb-5 border-b border-[#1f2a40]">
                <div className="w-16 h-16 rounded-xl bg-[#1f2a40] flex items-center justify-center text-gray-500 flex-shrink-0">
                  <RiImageFill size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewProduct.name}</h3>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit mt-1">
                    <RiCheckboxCircleFill size={11} /> {viewProduct.status}
                  </span>
                </div>
              </div>

              {/* Detalles */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalles del Producto</p>
                <div className="space-y-3">
                  {[
                    { label: "Descripción", value: viewProduct.description, icon: <RiClipboardFill size={12} /> },
                    { label: "Precio", value: formatPrice(viewProduct.price), icon: <RiMoneyDollarCircleFill size={12} /> },
                    { label: "Stock", value: viewProduct.stock, icon: <RiStackFill size={12} /> },
                    { label: "Categoría", value: viewProduct.category, icon: <RiArchiveFill size={12} /> },
                    { label: "SKU", value: viewProduct.sku, icon: <RiBarcodeFill size={12} /> },
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
              {drawerMode === "create" ? "Guardar Producto" : "Guardar Cambios"}
            </button>
          </div>
        )}
        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#1f2a40] flex-shrink-0">
            <button onClick={() => { closeDrawer(); setTimeout(() => openEditDrawer(viewProduct), 350); }} className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a5f] text-[#60a5fa] hover:bg-[#2563eb] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              <RiEditFill size={15} /> Editar Producto
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
              <h3 className="text-center text-base font-bold text-white mb-1">Desactivar producto</h3>
              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Desactivar <span className="text-white font-medium">{deactivateModal.name}</span>? El producto no aparecerá en el catálogo.
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
