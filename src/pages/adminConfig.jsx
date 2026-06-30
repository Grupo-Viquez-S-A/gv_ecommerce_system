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
  RiUserFill,
  RiUserAddFill,
  RiUserFollowFill,
  RiUserUnfollowFill,
  RiShieldUserFill,
  RiShieldStarFill,
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
  RiUserSharedFill,
  RiTimeLine,
  RiShieldCheckFill,
  RiEyeFill,
  RiCheckLine,
  RiLockPasswordFill,
  RiSmartphoneFill,
  RiGlobalLine,
  RiTimerLine,
  RiCalendarLine,
  RiBarChartFill,
  RiTeamFill,
  RiFileListFill,
  RiAlertFill,
  RiKey2Fill,
} from "react-icons/ri";

/* ─── MOCK DATA ─────────────────────────────────────────────── */
const MOCK_USERS = [
  { id: 1, initials: "JG", color: "#C9A227", name: "José González", email: "jose@grupoviquez.com", phone: "+506 8421 1234", role: "Administrador", roleColor: "bg-[#C9A227]/15 text-[#C9A227]", companies: ["Grupo Víquez S.A", "Constructora Víquez"], status: "Activo", lastAccess: "Hace 2 horas", created: "12 Ene 2024", department: "Tecnología", sales: 0, quotes: 14, clients: 8, orders: 21, has2fa: true },
  { id: 2, initials: "MC", color: "#ec4899", name: "María Castillo", email: "maria.castillo@grupoviquez.com", phone: "+506 8815 6789", role: "Supervisor", roleColor: "bg-[#2d1b4e] text-[#c084fc]", companies: ["Grupo Víquez S.A"], status: "Activo", lastAccess: "Hace 1 día", created: "03 Mar 2024", department: "Ventas", sales: 45, quotes: 62, clients: 23, orders: 58, has2fa: true },
  { id: 3, initials: "LP", color: "#6366f1", name: "Luis Pérez", email: "luis.perez@grupoviquez.com", phone: "+506 8350 2244", role: "Vendedor", roleColor: "bg-[#1a2e1a] text-[#4ade80]", companies: ["Textiles de Occidente"], status: "Activo", lastAccess: "Hace 3 horas", created: "18 Feb 2024", department: "Ventas", sales: 112, quotes: 88, clients: 41, orders: 130, has2fa: false },
  { id: 4, initials: "AC", color: "#f59e0b", name: "Ana Córdoba", email: "ana.cordoba@grupoviquez.com", phone: "+506 8560 3311", role: "Contabilidad", roleColor: "bg-[#2d200a] text-[#fbbf24]", companies: ["Grupo Víquez S.A", "Pacific Pet Food"], status: "Activo", lastAccess: "Hace 5 horas", created: "07 Abr 2024", department: "Finanzas", sales: 0, quotes: 0, clients: 12, orders: 0, has2fa: true },
  { id: 5, initials: "RS", color: "#ef4444", name: "Roberto Sánchez", email: "roberto.sanchez@grupoviquez.com", phone: "+506 8721 9900", role: "Vendedor", roleColor: "bg-[#1a2e1a] text-[#4ade80]", companies: ["Pacific Pet Food"], status: "Inactivo", lastAccess: "Hace 15 días", created: "22 May 2024", department: "Ventas", sales: 67, quotes: 45, clients: 29, orders: 72, has2fa: false },
  { id: 6, initials: "DC", color: "#22c55e", name: "Daniela Cruz", email: "daniela.cruz@grupoviquez.com", phone: "+506 8492 5567", role: "Supervisor", roleColor: "bg-[#2d1b4e] text-[#c084fc]", companies: ["Constructora Víquez"], status: "Inactivo", lastAccess: "Hace 20 días", created: "01 Jun 2024", department: "Operaciones", sales: 0, quotes: 30, clients: 18, orders: 44, has2fa: false },
];

const MOCK_ROLES = [
  { id: 1, name: "Administrador", badge: "bg-[#C9A227]/15 text-[#C9A227]", users: 2, permissions: 16, status: "Activo" },
  { id: 2, name: "Supervisor", badge: "bg-[#2d1b4e] text-[#c084fc]", users: 2, permissions: 12, status: "Activo" },
  { id: 3, name: "Vendedor", badge: "bg-[#1a2e1a] text-[#4ade80]", users: 2, permissions: 8, status: "Activo" },
  { id: 4, name: "Contabilidad", badge: "bg-[#2d200a] text-[#fbbf24]", users: 1, permissions: 6, status: "Activo" },
];

const MOCK_ACTIVITY = [
  { id: 1, group: "Hoy", items: [
    { user: "José González", initials: "JG", color: "#C9A227", action: "inició sesión", time: "Hace 10 minutos", icon: "login" },
    { user: "María Castillo", initials: "MC", color: "#ec4899", action: "creó una cotización", time: "Hace 35 minutos", icon: "quote" },
    { user: "Luis Pérez", initials: "LP", color: "#6366f1", action: "actualizó un cliente", time: "Hace 1 hora", icon: "client" },
    { user: "Ana Córdoba", initials: "AC", color: "#f59e0b", action: "generó un reporte financiero", time: "Hace 2 horas", icon: "report" },
  ]},
  { id: 2, group: "Ayer", items: [
    { user: "Ana Córdoba", initials: "AC", color: "#f59e0b", action: "modificó una venta", time: "23 Jun · 4:15 PM", icon: "sale" },
    { user: "Roberto Sánchez", initials: "RS", color: "#ef4444", action: "eliminó una cotización", time: "23 Jun · 2:30 PM", icon: "delete" },
    { user: "Daniela Cruz", initials: "DC", color: "#22c55e", action: "exportó lista de clientes", time: "23 Jun · 11:00 AM", icon: "export" },
  ]},
  { id: 3, group: "22 Jun", items: [
    { user: "José González", initials: "JG", color: "#C9A227", action: "creó un nuevo usuario", time: "22 Jun · 9:45 AM", icon: "create" },
    { user: "María Castillo", initials: "MC", color: "#ec4899", action: "aprobó una orden de compra", time: "22 Jun · 8:20 AM", icon: "approve" },
  ]},
];

const COMPANIES = ["Grupo Víquez S.A", "Textiles de Occidente", "Pacific Pet Food", "Constructora Víquez"];

const PERMISSION_SECTIONS = [
  { key: "clients", label: "Clientes", icon: <RiTeamFill size={14} />, perms: ["Ver clientes", "Crear clientes", "Editar clientes", "Eliminar clientes"] },
  { key: "sales", label: "Ventas", icon: <RiBarChartFill size={14} />, perms: ["Ver ventas", "Crear ventas", "Editar ventas", "Aprobar ventas"] },
  { key: "quotes", label: "Cotizaciones", icon: <RiFileListFill size={14} />, perms: ["Ver cotizaciones", "Crear cotizaciones", "Aprobar cotizaciones"] },
  { key: "config", label: "Configuración", icon: <RiSettings4Fill size={14} />, perms: ["Gestión de usuarios", "Gestión de roles", "Configuración general"] },
  { key: "companies", label: "Empresas", icon: <RiGlobalLine size={14} />, perms: COMPANIES },
];

const DEFAULT_ROLE_PERMISSIONS = {
  Administrador: { clients: [0,1,2,3], sales: [0,1,2,3], quotes: [0,1,2], config: [0,1,2], companies: [0,1,2,3] },
  Supervisor:    { clients: [0,1,2], sales: [0,1,2,3], quotes: [0,1,2], config: [], companies: [0,1] },
  Vendedor:      { clients: [0,1,2], sales: [0,1], quotes: [0,1], config: [], companies: [0] },
  Contabilidad:  { clients: [0], sales: [0], quotes: [0], config: [], companies: [0,1,2,3] },
};

const avatarColors = ["#6366f1", "#ec4899", "#C9A227", "#f59e0b", "#22c55e"];

/* ─── SMALL HELPERS ─────────────────────────────────────────── */
function PagBtn({ icon, label, active }) {
  return (
    <button className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${active ? "bg-[#C9A227] text-white" : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"} cursor-pointer`}>
      {icon || label}
    </button>
  );
}

function FormField({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[#222e44] border border-[#2a3550] rounded-lg ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors`}
        />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? "bg-[#C9A227]" : "bg-[#2a3448]"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function ActivityIcon({ type }) {
  const map = {
    login:  { icon: <RiKey2Fill size={12} />, color: "bg-[#C9A227]/15 text-[#C9A227]" },
    quote:  { icon: <RiFileListFill size={12} />, color: "bg-[#2d1b4e] text-[#c084fc]" },
    client: { icon: <RiTeamFill size={12} />, color: "bg-[#1a2e1a] text-[#4ade80]" },
    sale:   { icon: <RiBarChartFill size={12} />, color: "bg-[#C9A227]/15 text-[#C9A227]" },
    report: { icon: <RiBarChartFill size={12} />, color: "bg-[#2d200a] text-[#fbbf24]" },
    delete: { icon: <RiDeleteBinFill size={12} />, color: "bg-[#3b1a1a] text-[#f87171]" },
    export: { icon: <RiFileListFill size={12} />, color: "bg-[#1a2e1a] text-[#4ade80]" },
    create: { icon: <RiUserAddFill size={12} />, color: "bg-[#C9A227]/15 text-[#C9A227]" },
    approve:{ icon: <RiCheckboxCircleFill size={12} />, color: "bg-[#14301a] text-[#4ade80]" },
  };
  const { icon, color } = map[type] || map.login;
  return <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>;
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function AdminConfig() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(
    user?.activeCompany || user?.companies?.[0] || { name: "Grupo Víquez S.A", color: "#c9a227" }
  );

  /* Tabs */
  const [activeTab, setActiveTab] = useState("usuarios");

  /* Users tab state */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedUsers, setSelectedUsers] = useState([]);

  /* Drawers: mode can be "create"|"edit"|"role"|"editRole"|"profile" */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  /* User form */
  const [form, setForm] = useState({ name: "", email: "", phone: "", companies: [], role: "", status: "Activo" });

  /* Role form */
  const [roleForm, setRoleForm] = useState({ name: "", description: "", color: "azul" });

  /* Role permissions (keyed by role name) */
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);

  /* Modals */
  const [deleteModal, setDeleteModal] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  /* Security switches */
  const [security, setSecurity] = useState({
    strongPassword: true,
    forceChange90: true,
    lockAfterFail: true,
    twoFactor: false,
    googleLogin: true,
    autoLogout: true,
    sessionTime: "30",
  });

  /* Activity filters */
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("Todos");

  /* ── helpers ── */
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditUser(null);
    setForm({ name: "", email: "", phone: "", companies: [], role: "", status: "Activo" });
    setDrawerOpen(true);
  };
  const openEditDrawer = (u) => {
    setDrawerMode("edit");
    setEditUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || "", companies: u.companies || [], role: u.role, status: u.status });
    setDrawerOpen(true);
  };
  const openRoleDrawer = () => {
    setDrawerMode("role");
    setRoleForm({ name: "", description: "", color: "azul" });
    setDrawerOpen(true);
  };
  const openEditRoleDrawer = (role) => {
    setDrawerMode("editRole");
    setEditRole(role);
    setDrawerOpen(true);
  };
  const openProfileDrawer = (u) => {
    setDrawerMode("profile");
    setProfileUser(u);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => { setDrawerMode("create"); setEditUser(null); setEditRole(null); setProfileUser(null); }, 300);
  };

  const filtered = MOCK_USERS.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "Todos" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedUsers.length === filtered.length) setSelectedUsers([]);
    else setSelectedUsers(filtered.map((u) => u.id));
  };

  const togglePermission = (roleName, sectionKey, permIdx) => {
    setRolePermissions((prev) => {
      const current = prev[roleName]?.[sectionKey] || [];
      const updated = current.includes(permIdx) ? current.filter((i) => i !== permIdx) : [...current, permIdx];
      return { ...prev, [roleName]: { ...prev[roleName], [sectionKey]: updated } };
    });
  };

  const toggleCompanyInForm = (company) => {
    setForm((prev) => {
      const list = prev.companies.includes(company) ? prev.companies.filter((c) => c !== company) : [...prev.companies, company];
      return { ...prev, companies: list };
    });
  };

  /* Metrics */
  const metrics = [
    { label: "Usuarios Totales", value: "124", icon: <RiUserFill size={20} />, color: "bg-[#C9A227]/15", iconColor: "text-[#C9A227]", growth: "+8%", growthColor: "text-green-400" },
    { label: "Usuarios Activos", value: "112", icon: <RiUserFollowFill size={20} />, color: "bg-[#14301a]", iconColor: "text-[#4ade80]", growth: "+10%", growthColor: "text-green-400" },
    { label: "Usuarios Inactivos", value: "12", icon: <RiUserUnfollowFill size={20} />, color: "bg-[#3b1a1a]", iconColor: "text-[#f87171]", growth: "-14%", growthColor: "text-red-400" },
    { label: "Roles Registrados", value: "6", icon: <RiShieldUserFill size={20} />, color: "bg-[#2d200a]", iconColor: "text-[#fbbf24]", growth: "+2%", growthColor: "text-green-400" },
    { label: "Acceso Reciente", value: "38", icon: <RiTimeLine size={20} />, color: "bg-[#0d2030]", iconColor: "text-[#38bdf8]", growth: "+5%", growthColor: "text-green-400" },
    { label: "Usuarios Bloqueados", value: "3", icon: <RiAlertFill size={20} />, color: "bg-[#2d1818]", iconColor: "text-[#f87171]", growth: "+1", growthColor: "text-red-400" },
    { label: "Usuarios con 2FA", value: "67", icon: <RiShieldCheckFill size={20} />, color: "bg-[#132813]", iconColor: "text-[#4ade80]", growth: "+12%", growthColor: "text-green-400" },
  ];

  const TABS = [
    { key: "usuarios", label: "Usuarios", icon: <RiUserFill size={15} /> },
    { key: "roles", label: "Roles y Permisos", icon: <RiShieldUserFill size={15} /> },
    { key: "actividad", label: "Actividad", icon: <RiTimeLine size={15} /> },
    { key: "seguridad", label: "Seguridad", icon: <RiShieldCheckFill size={15} /> },
  ];

  /* ─── RENDER ───────────────────────────────────────────────── */
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-14 bg-[#1c2538] border-b border-[#2a3550] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white cursor-pointer">
              <RiMenuFill size={22} />
            </button>
            <div className="relative">
              <button
                onClick={() => setCompanyDropdown(!companyDropdown)}
                className="flex items-center gap-2 text-sm font-medium text-white hover:bg-[#1c2538] px-3 py-1.5 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.color || "#c9a227" }} />
                {currentCompany.name}
                <RiArrowDownSFill size={16} className="text-gray-400" />
              </button>
              {companyDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#1c2538] border border-[#2a3550] rounded-lg shadow-xl z-50 py-1">
                  {(user?.companies || [{ name: "Grupo Víquez S.A", color: "#c9a227" }]).map((c, i) => (
                    <button
                      key={c.id || i}
                      onClick={() => { setCurrentCompany({ ...c, color: c.color || avatarColors[i % avatarColors.length] }); setCompanyDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#C9A227]/15 transition-colors"
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
            <button className="relative w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer">
              <RiNotification3Fill size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer">
              <RiSettings4Fill size={16} />
            </button>
            <button onClick={signOut} className="w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer">
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        </header>

        {/* Main scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
            <span>Configuración</span>
            <RiArrowRightSLine size={14} />
            <span className="text-gray-300">Gestión de Usuarios</span>
          </div>

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-400 mt-1">
                Administra accesos, roles y permisos de los usuarios del sistema corporativo.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeTab === "usuarios" && (
                <>
                  <button
                    onClick={openRoleDrawer}
                    className="flex items-center gap-2 bg-[#141d2e] hover:bg-[#C9A227]/15 border border-[#2a3550] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <RiShieldStarFill size={16} className="text-[#f59e0b]" />
                    Nuevo Rol
                  </button>
                  <button
                    onClick={openCreateDrawer}
                    className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <RiAddFill size={18} />
                    Nuevo Usuario
                  </button>
                </>
              )}
              {activeTab === "roles" && (
                <button
                  onClick={openRoleDrawer}
                  className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <RiAddFill size={18} />
                  Nuevo Rol
                </button>
              )}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/40 transition-colors">
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

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[#2a3550] mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === t.key
                    ? "border-[#C9A227] text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── TAB: USUARIOS ─────────────────────────────────────────── */}
          {activeTab === "usuarios" && (
            <>
              {/* Bulk action bar */}
              {selectedUsers.length > 0 && (
                <div className="mb-4 bg-[#C9A227]/15 border border-[#C9A227]/50 rounded-xl px-5 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-sm font-medium text-white">
                    <span className="text-[#C9A227] font-bold">{selectedUsers.length}</span> usuarios seleccionados
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <RiCheckboxCircleFill size={13} /> Activar
                    </button>
                    <button className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <RiCloseCircleFill size={13} /> Desactivar
                    </button>
                    <button className="flex items-center gap-1.5 bg-[#2a3550] text-gray-300 hover:bg-[#2a3448] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <RiShieldUserFill size={13} /> Cambiar Rol
                    </button>
                    <button className="flex items-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <RiDeleteBinFill size={13} /> Eliminar
                    </button>
                    <button onClick={() => setSelectedUsers([])} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                      <RiCloseLine size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Search + filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </div>
                <div className="relative">
                  <RiFilterLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer min-w-[160px]"
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                  <RiArrowDownSFill size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Table desktop */}
              <div className="hidden md:block bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3550]">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filtered.length && filtered.length > 0}
                          onChange={toggleSelectAll}
                          className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                        />
                      </th>
                      {["USUARIO", "CORREO", "TELÉFONO", "ROL", "EMPRESA", "ESTADO", "ÚLTIMO ACCESO", "ACCIONES"].map((col) => (
                        <th key={col} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-4 py-3">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr
                        key={u.id}
                        className={`border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors ${selectedUsers.includes(u.id) ? "bg-[#C9A227]/15/20" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                            className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: u.color }}>
                              {u.initials}
                            </div>
                            <span className="font-medium text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{u.email}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{u.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.roleColor}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">{u.companies?.[0] || u.company}</td>
                        <td className="px-4 py-3">
                          {u.status === "Activo"
                            ? <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit"><RiCheckboxCircleFill size={12} /> Activo</span>
                            : <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit"><RiCloseCircleFill size={12} /> Inactivo</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.lastAccess}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openProfileDrawer(u)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Ver perfil">
                              <RiEyeFill size={14} />
                            </button>
                            <button onClick={() => openEditDrawer(u)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Editar">
                              <RiEditFill size={14} />
                            </button>
                            <button onClick={() => setDeactivateModal(u)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Desactivar">
                              <RiUserSharedFill size={14} />
                            </button>
                            <button onClick={() => setDeleteModal(u)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer" title="Eliminar">
                              <RiDeleteBinFill size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
                      <RiUserFill size={28} />
                    </div>
                    <p className="text-sm text-gray-500">No se encontraron usuarios</p>
                    <button onClick={() => { setSearch(""); setStatusFilter("Todos"); }} className="text-xs text-[#C9A227] hover:underline cursor-pointer">Limpiar filtros</button>
                  </div>
                )}
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
                  <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 124 usuarios</span>
                  <div className="flex items-center gap-1">
                    <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                    {[1,2,3].map((n) => <PagBtn key={n} label={n} active={n===1} />)}
                    <PagBtn label="..." />
                    <PagBtn label={21} />
                    <PagBtn icon={<RiArrowRightSFill size={14} />} />
                  </div>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 mb-5">
                {filtered.map((u) => (
                  <div key={u.id} className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: u.color }}>
                          {u.initials}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                          <div className="text-xs text-gray-600">{u.phone}</div>
                        </div>
                      </div>
                      {u.status === "Activo"
                        ? <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><RiCheckboxCircleFill size={11} /> Activo</span>
                        : <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><RiCloseCircleFill size={11} /> Inactivo</span>
                      }
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.roleColor}`}>{u.role}</span>
                        <span className="text-xs text-gray-500">{u.companies?.[0] || u.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openProfileDrawer(u)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"><RiEyeFill size={13} /></button>
                        <button onClick={() => openEditDrawer(u)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"><RiEditFill size={13} /></button>
                        <button onClick={() => setDeleteModal(u)} className="w-7 h-7 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer"><RiDeleteBinFill size={13} /></button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{u.lastAccess}</div>
                  </div>
                ))}
              </div>

            </>
          )}

          {/* ─── TAB: ROLES Y PERMISOS ───────────────────────────────── */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2a3550] flex items-center gap-2">
                  <RiShieldUserFill size={16} className="text-[#C9A227]" />
                  <h3 className="text-sm font-semibold text-white">Roles del Sistema</h3>
                </div>
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a3550]">
                        {["ROL", "USUARIOS ASIGNADOS", "PERMISOS", "ESTADO", "ACCIONES"].map((col) => (
                          <th key={col} className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_ROLES.map((role) => (
                        <tr key={role.id} className="border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors">
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${role.badge}`}>{role.name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1.5">
                                {MOCK_USERS.filter((u) => u.role === role.name).slice(0,3).map((u) => (
                                  <div key={u.id} className="w-6 h-6 rounded-full border-2 border-[#141d2e] flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: u.color }}>
                                    {u.initials}
                                  </div>
                                ))}
                              </div>
                              <span className="text-gray-400 text-sm">{role.users} usuarios</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 bg-[#2a3550] rounded-full w-20">
                                <div className="h-1.5 bg-[#C9A227] rounded-full" style={{ width: `${(role.permissions / 16) * 100}%` }} />
                              </div>
                              <span className="text-gray-400 text-xs">{role.permissions}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit">
                              <RiCheckboxCircleFill size={11} /> Activo
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => openEditRoleDrawer(role)}
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1c2538] hover:bg-[#C9A227]/15 border border-[#2a3550] px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <RiEditFill size={12} /> Editar Rol
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile roles */}
                <div className="md:hidden divide-y divide-[#2a3550]">
                  {MOCK_ROLES.map((role) => (
                    <div key={role.id} className="p-4 flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${role.badge}`}>{role.name}</span>
                        <div className="text-xs text-gray-500 mt-2">{role.users} usuarios · {role.permissions} permisos</div>
                      </div>
                      <button onClick={() => openEditRoleDrawer(role)} className="text-xs text-[#C9A227] hover:underline flex items-center gap-1 cursor-pointer">
                        <RiEditFill size={12} /> Editar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: ACTIVIDAD ──────────────────────────────────────── */}
          {activeTab === "actividad" && (
            <div>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </div>
                <div className="relative">
                  <RiFilterLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer min-w-[180px]"
                  >
                    <option value="Todos">Todos los tipos</option>
                    <option value="login">Inicios de sesión</option>
                    <option value="ventas">Ventas</option>
                    <option value="cotizaciones">Cotizaciones</option>
                    <option value="clientes">Clientes</option>
                  </select>
                  <RiArrowDownSFill size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <RiCalendarLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                {MOCK_ACTIVITY.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{group.group}</span>
                      <div className="flex-1 h-px bg-[#2a3550]" />
                    </div>
                    <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
                      {group.items.map((item, idx) => (
                        <div key={idx} className={`flex items-start gap-4 px-5 py-4 hover:bg-[#1c2538] transition-colors ${idx < group.items.length - 1 ? "border-b border-[#2a3550]" : ""}`}>
                          <div className="relative mt-0.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: item.color }}>
                              {item.initials}
                            </div>
                            <ActivityIcon type={item.icon} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                              <span className="font-semibold">{item.user}</span>
                              <span className="text-gray-400"> {item.action}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                              <RiTimeLine size={11} /> {item.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB: SEGURIDAD ──────────────────────────────────────── */}
          {activeTab === "seguridad" && (
            <div className="space-y-4 max-w-2xl">
              {/* Password policies */}
              <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a3550]">
                  <RiLockPasswordFill size={16} className="text-[#C9A227]" />
                  <h3 className="text-sm font-semibold text-white">Políticas de Contraseña</h3>
                </div>
                <div className="divide-y divide-[#2a3550]">
                  {[
                    { key: "strongPassword", label: "Requerir contraseña fuerte", desc: "Mínimo 8 caracteres, mayúsculas, números y símbolos." },
                    { key: "forceChange90", label: "Forzar cambio cada 90 días", desc: "Los usuarios deberán actualizar su contraseña periódicamente." },
                    { key: "lockAfterFail", label: "Bloquear después de 5 intentos fallidos", desc: "La cuenta se bloqueará automáticamente al superar el límite." },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-[#1c2538] transition-colors">
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                      </div>
                      <Toggle checked={security[key]} onChange={(v) => setSecurity((s) => ({ ...s, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication */}
              <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a3550]">
                  <RiSmartphoneFill size={16} className="text-[#c084fc]" />
                  <h3 className="text-sm font-semibold text-white">Autenticación</h3>
                </div>
                <div className="divide-y divide-[#2a3550]">
                  {[
                    { key: "twoFactor", label: "Habilitar doble factor (2FA)", desc: "Requiere un segundo método de verificación al iniciar sesión." },
                    { key: "googleLogin", label: "Permitir inicio de sesión con Google", desc: "Los usuarios podrán autenticarse usando su cuenta de Google." },
                    { key: "autoLogout", label: "Cierre automático por inactividad", desc: "La sesión se cerrará automáticamente al no detectar actividad." },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-[#1c2538] transition-colors">
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                      </div>
                      <Toggle checked={security[key]} onChange={(v) => setSecurity((s) => ({ ...s, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Session */}
              <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a3550]">
                  <RiTimerLine size={16} className="text-[#4ade80]" />
                  <h3 className="text-sm font-semibold text-white">Sesión</h3>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">Tiempo máximo de sesión</div>
                      <div className="text-xs text-gray-500 mt-0.5">La sesión se cerrará automáticamente después del tiempo seleccionado.</div>
                    </div>
                    <div className="relative">
                      <select
                        value={security.sessionTime}
                        onChange={(e) => setSecurity((s) => ({ ...s, sessionTime: e.target.value }))}
                        className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="120">2 horas</option>
                        <option value="480">8 horas</option>
                      </select>
                      <RiArrowDownSFill size={15} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                <RiCheckLine size={16} /> Guardar Configuración
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer" onClick={closeDrawer} />
      )}

      {/* ─── DRAWER ─────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerMode === "editRole" ? "w-full max-w-lg" : "w-full max-w-md"
        } ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && <><RiUserAddFill size={20} className="text-[#C9A227]" />Nuevo Usuario</>}
              {drawerMode === "edit" && <><RiEditFill size={20} className="text-[#C9A227]" />Editar Usuario</>}
              {drawerMode === "role" && <><RiShieldStarFill size={20} className="text-[#f59e0b]" />Nuevo Rol</>}
              {drawerMode === "editRole" && <><RiEditFill size={20} className="text-[#c084fc]" />Editar Rol — {editRole?.name}</>}
              {drawerMode === "profile" && <><RiUserFill size={20} className="text-[#C9A227]" />Perfil de Usuario</>}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" && "Completa la información para crear un nuevo usuario."}
              {drawerMode === "edit" && "Modifica la información del usuario seleccionado."}
              {drawerMode === "role" && "Define un nuevo rol de acceso para el sistema."}
              {drawerMode === "editRole" && "Configura los permisos y accesos del rol seleccionado."}
              {drawerMode === "profile" && "Información completa del usuario."}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 cursor-pointer">
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Create / Edit User ── */}
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-5">
              <FormField label="Nombre Completo" placeholder="Ej. Juan Pérez Gómez" value={form.name} onChange={(v) => setForm({ ...form, name: v })} icon="👤" />
              <FormField label="Correo Electrónico" placeholder="Ej. juan.perez@empresa.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" icon="✉️" />
              <FormField label="Teléfono" placeholder="Ej. +506 8888 8888" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" icon="📞" />

              {/* Empresas asignadas (multi-checkbox) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Empresas Asignadas</label>
                <div className="space-y-2">
                  {COMPANIES.map((company) => (
                    <label key={company} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-[#1c2538] transition-colors">
                      <div
                        onClick={() => toggleCompanyInForm(company)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.companies.includes(company) ? "border-[#C9A227] bg-[#C9A227]" : "border-[#2a3448]"}`}
                      >
                        {form.companies.includes(company) && <RiCheckLine size={10} className="text-white" />}
                      </div>
                      <span className={`text-sm ${form.companies.includes(company) ? "text-white" : "text-gray-400"}`}>{company}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Rol</label>
                <div className="relative">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer">
                    <option value="">Seleccionar rol</option>
                    <option>Administrador</option>
                    <option>Supervisor</option>
                    <option>Vendedor</option>
                    <option>Contabilidad</option>
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Estado</label>
                <div className="flex gap-5">
                  {["Activo", "Inactivo"].map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setForm({ ...form, status: s })} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${form.status === s ? s === "Activo" ? "border-green-400" : "border-red-400" : "border-gray-600"}`}>
                        {form.status === s && <div className={`w-2 h-2 rounded-full ${s === "Activo" ? "bg-green-400" : "bg-red-400"}`} />}
                      </div>
                      <span className={`text-sm ${form.status === s ? "text-white" : "text-gray-400"}`}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── New Role ── */}
          {drawerMode === "role" && (
            <div className="space-y-5">
              <FormField label="Nombre del Rol" placeholder="Ej. Gerente de Ventas" value={roleForm.name} onChange={(v) => setRoleForm({ ...roleForm, name: v })} icon="🎯" />
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  placeholder="Ej. Acceso completo al módulo de ventas y reportes."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Color del Badge</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value: "azul", label: "Azul", dot: "bg-[#60a5fa]" },
                    { value: "morado", label: "Morado", dot: "bg-[#c084fc]" },
                    { value: "verde", label: "Verde", dot: "bg-[#4ade80]" },
                    { value: "amarillo", label: "Amarillo", dot: "bg-[#fbbf24]" },
                    { value: "rojo", label: "Rojo", dot: "bg-[#f87171]" },
                  ].map((c) => (
                    <button key={c.value} onClick={() => setRoleForm({ ...roleForm, color: c.value })} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${roleForm.color === c.value ? "border-white/40 text-white" : "border-[#2a3550] text-gray-500 hover:text-gray-300"} cursor-pointer`}>
                      <span className={`w-3 h-3 rounded-full ${c.dot}`} />{c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Edit Role permissions ── */}
          {drawerMode === "editRole" && editRole && (
            <div className="space-y-5">
              {PERMISSION_SECTIONS.map((section) => {
                const active = rolePermissions[editRole.name]?.[section.key] || [];
                const allChecked = active.length === section.perms.length;
                return (
                  <div key={section.key} className="bg-[#1c2538] border border-[#2a3550] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3550]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="text-gray-500">{section.icon}</span>
                        {section.label}
                      </div>
                      <button
                        onClick={() => {
                          const indices = section.perms.map((_, i) => i);
                          setRolePermissions((prev) => ({
                            ...prev,
                            [editRole.name]: { ...prev[editRole.name], [section.key]: allChecked ? [] : indices },
                          }));
                        }}
                        className={`text-xs font-medium transition-colors ${allChecked ? "text-[#C9A227] hover:text-gray-400" : "text-gray-500 hover:text-[#C9A227]"}`}
                      >
                        {allChecked ? "Desmarcar todos" : "Seleccionar todos"}
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-2">
                      {section.perms.map((perm, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-[#1c2538] transition-colors">
                          <div
                            onClick={() => togglePermission(editRole.name, section.key, idx)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${active.includes(idx) ? "border-[#C9A227] bg-[#C9A227]" : "border-[#2a3448]"}`}
                          >
                            {active.includes(idx) && <RiCheckLine size={10} className="text-white" />}
                          </div>
                          <span className={`text-sm ${active.includes(idx) ? "text-white" : "text-gray-500"}`}>{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── User Profile ── */}
          {drawerMode === "profile" && profileUser && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: profileUser.color }}>
                  {profileUser.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{profileUser.name}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${profileUser.roleColor}`}>{profileUser.role}</span>
                </div>
              </div>

              {/* Datos personales */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos Personales</p>
                <div className="space-y-3">
                  {[
                    { label: "Nombre", value: profileUser.name },
                    { label: "Correo", value: profileUser.email },
                    { label: "Teléfono", value: profileUser.phone },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-[#2a3550]">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información laboral */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Información Laboral</p>
                <div className="space-y-3">
                  {[
                    { label: "Rol", value: profileUser.role },
                    { label: "Empresa", value: profileUser.companies?.[0] || profileUser.company },
                    { label: "Departamento", value: profileUser.department },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-[#2a3550]">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceso al sistema */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acceso al Sistema</p>
                <div className="space-y-3">
                  {[
                    { label: "Fecha de creación", value: profileUser.created },
                    { label: "Último acceso", value: profileUser.lastAccess },
                    { label: "Estado", value: profileUser.status },
                    { label: "2FA", value: profileUser.has2fa ? "Activo" : "Inactivo" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-[#2a3550]">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className={`text-sm ${label === "Estado" ? value === "Activo" ? "text-green-400" : "text-red-400" : label === "2FA" ? value === "Activo" ? "text-green-400" : "text-gray-500" : "text-white"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Drawer footer */}
        {drawerMode !== "profile" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button onClick={closeDrawer} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              Cancelar
            </button>
            <button className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              {drawerMode === "create" ? "Guardar Usuario" : drawerMode === "edit" ? "Guardar Cambios" : drawerMode === "editRole" ? "Guardar Permisos" : "Guardar Rol"}
            </button>
          </div>
        )}
        {drawerMode === "profile" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button onClick={() => { closeDrawer(); setTimeout(() => openEditDrawer(profileUser), 350); }} className="flex-1 flex items-center justify-center gap-2 bg-[#C9A227]/15 text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              <RiEditFill size={15} /> Editar Usuario
            </button>
            <button onClick={closeDrawer} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-pointer" onClick={() => setDeleteModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <RiDeleteBinFill size={24} className="text-red-400" />
              </div>
              <h3 className="text-center text-base font-bold text-white mb-1">Eliminar usuario</h3>
              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Estás seguro de que deseas eliminar a <span className="text-white font-medium">{deleteModal.name}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deactivate Modal */}
      {deactivateModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-pointer" onClick={() => setDeactivateModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <RiUserSharedFill size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-center text-base font-bold text-white mb-1">Desactivar usuario</h3>
              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Desactivar a <span className="text-white font-medium">{deactivateModal.name}</span>? El usuario perderá acceso al sistema de inmediato.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeactivateModal(null)} className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button onClick={() => setDeactivateModal(null)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
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
