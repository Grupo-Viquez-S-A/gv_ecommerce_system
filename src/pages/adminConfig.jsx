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
} from "react-icons/ri";

const MOCK_USERS = [
  {
    id: 1,
    initials: "JG",
    color: "#3b82f6",
    name: "José González",
    email: "jose@grupoviquez.com",
    phone: "+506 8421 1234",
    role: "Administrador",
    roleColor: "bg-[#1e3a5f] text-[#60a5fa]",
    company: "Grupo Víquez S.A",
    status: "Activo",
    lastAccess: "Hace 2 horas",
  },
  {
    id: 2,
    initials: "MC",
    color: "#ec4899",
    name: "María Castillo",
    email: "maria.castillo@grupoviquez.com",
    phone: "+506 8815 6789",
    role: "Supervisor",
    roleColor: "bg-[#2d1b4e] text-[#c084fc]",
    company: "Grupo Víquez S.A",
    status: "Activo",
    lastAccess: "Hace 1 día",
  },
  {
    id: 3,
    initials: "LP",
    color: "#6366f1",
    name: "Luis Pérez",
    email: "luis.perez@grupoviquez.com",
    phone: "+506 8350 2244",
    role: "Vendedor",
    roleColor: "bg-[#1a2e1a] text-[#4ade80]",
    company: "Textiles de Occidente",
    status: "Activo",
    lastAccess: "Hace 3 horas",
  },
  {
    id: 4,
    initials: "AC",
    color: "#f59e0b",
    name: "Ana Córdoba",
    email: "ana.cordoba@grupoviquez.com",
    phone: "+506 8560 3311",
    role: "Contabilidad",
    roleColor: "bg-[#2d200a] text-[#fbbf24]",
    company: "Grupo Víquez S.A",
    status: "Activo",
    lastAccess: "Hace 5 horas",
  },
  {
    id: 5,
    initials: "RS",
    color: "#ef4444",
    name: "Roberto Sánchez",
    email: "roberto.sanchez@grupoviquez.com",
    phone: "+506 8721 9900",
    role: "Vendedor",
    roleColor: "bg-[#1a2e1a] text-[#4ade80]",
    company: "Pacific Pet Food",
    status: "Inactivo",
    lastAccess: "Hace 15 días",
  },
  {
    id: 6,
    initials: "DC",
    color: "#22c55e",
    name: "Daniela Cruz",
    email: "daniela.cruz@grupoviquez.com",
    phone: "+506 8492 5567",
    role: "Supervisor",
    roleColor: "bg-[#2d1b4e] text-[#c084fc]",
    company: "Constructora Víquez",
    status: "Inactivo",
    lastAccess: "Hace 20 días",
  },
];

const avatarColors = ["#6366f1", "#ec4899", "#3b82f6", "#f59e0b", "#22c55e"];

function AdminConfig() {
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
  const [drawerMode, setDrawerMode] = useState("create"); // "create" | "edit" | "role"
  const [editUser, setEditUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    status: "Activo",
  });
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    color: "azul",
  });

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditUser(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "",
      status: "Activo",
    });
    setDrawerOpen(true);
  };

  const openEditDrawer = (user) => {
    setDrawerMode("edit");
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      company: user.company,
      role: user.role,
      status: user.status,
    });
    setDrawerOpen(true);
  };

  const openRoleDrawer = () => {
    setDrawerMode("role");
    setRoleForm({
      name: "",
      description: "",
      color: "azul",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setDrawerMode("create");
      setEditUser(null);
    }, 300);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const metrics = [
    {
      label: "Usuarios Totales",
      value: "124",
      icon: <RiUserFill size={20} />,
      color: "bg-[#1e3a5f]",
      iconColor: "text-[#60a5fa]",
      growth: "+8%",
      growthColor: "text-green-400",
    },
    {
      label: "Usuarios Activos",
      value: "112",
      icon: <RiUserFollowFill size={20} />,
      color: "bg-[#14301a]",
      iconColor: "text-[#4ade80]",
      growth: "+10%",
      growthColor: "text-green-400",
    },
    {
      label: "Usuarios Inactivos",
      value: "12",
      icon: <RiUserUnfollowFill size={20} />,
      color: "bg-[#3b1a1a]",
      iconColor: "text-[#f87171]",
      growth: "-14%",
      growthColor: "text-red-400",
    },
    {
      label: "Roles Registrados",
      value: "6",
      icon: <RiShieldUserFill size={20} />,
      color: "bg-[#2d200a]",
      iconColor: "text-[#fbbf24]",
      growth: "+2%",
      growthColor: "text-green-400",
    },
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
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors"
            >
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
            <span className="text-gray-300">Usuarios</span>
          </div>

          {/* Header + Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-400 mt-1">
                Administra los accesos y permisos de los usuarios del sistema. Adicionalmente puedes crear, editar o eliminar usuarios.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={openRoleDrawer}
                className="flex items-center gap-2 bg-[#111827] hover:bg-[#1e3a5f] border border-[#1f2a40] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <RiShieldStarFill size={18} className="text-[#f59e0b]" />
                Nuevo Rol
              </button>
              <button
                onClick={openCreateDrawer}
                className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <RiAddFill size={18} />
                Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar usuario..."
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
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-5">
                <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center ${m.iconColor} mb-3`}>
                  {m.icon}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{m.label}</div>
                <div className="text-3xl font-bold text-white mb-1">{m.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  <span className={`font-medium ${m.growthColor}`}>{m.growth}</span>
                  <span className="text-gray-500">vs. mes anterior</span>
                </div>
              </div>
            ))}
          </div>

          {/* Table — desktop */}
          <div className="hidden md:block bg-[#111827] border border-[#1f2a40] rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2a40]">
                  {["USUARIO", "CORREO", "TELÉFONO", "ROL", "EMPRESA", "ESTADO", "ÚLTIMO ACCESO", "ACCIONES"].map((col) => (
                    <th
                      key={col}
                      className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`border-b border-[#1f2a40] last:border-0 hover:bg-[#141a2a] transition-colors`}
                  >
                    {/* Usuario */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: u.color }}
                        >
                          {u.initials}
                        </div>
                        <span className="font-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    {/* Correo */}
                    <td className="px-5 py-3 text-gray-400">{u.email}</td>
                    {/* Teléfono */}
                    <td className="px-5 py-3 text-gray-400 text-xs">{u.phone}</td>
                    {/* Rol */}
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.roleColor}`}>
                        {u.role}
                      </span>
                    </td>
                    {/* Empresa */}
                    <td className="px-5 py-3 text-gray-300">{u.company}</td>
                    {/* Estado */}
                    <td className="px-5 py-3">
                      {u.status === "Activo" ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit">
                          <RiCheckboxCircleFill size={12} /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit">
                          <RiCloseCircleFill size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    {/* Último acceso */}
                    <td className="px-5 py-3 text-gray-500 text-xs">{u.lastAccess}</td>
                    {/* Acciones */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDrawer(u)}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"
                          title="Editar usuario"
                        >
                          <RiEditFill size={14} />
                        </button>
                        <button
                          onClick={() => setDeactivateModal(u)}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"
                          title="Desactivar usuario"
                        >
                          <RiUserSharedFill size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteModal(u)}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors"
                          title="Eliminar usuario"
                        >
                          <RiDeleteBinFill size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1f2a40]">
              <span className="text-xs text-gray-500">Mostrando 1 a {filtered.length} de 124 usuarios</span>
              <div className="flex items-center gap-1">
                <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                {[1, 2, 3].map((n) => (
                  <PagBtn key={n} label={n} active={n === 1} />
                ))}
                <PagBtn label="..." />
                <PagBtn label={21} />
                <PagBtn icon={<RiArrowRightSLine size={14} />} />
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 mb-6">
            {filtered.map((u) => (
              <div key={u.id} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.initials}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                      <div className="text-xs text-gray-600">{u.phone}</div>
                    </div>
                  </div>
                  {u.status === "Activo" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      <RiCheckboxCircleFill size={11} /> Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                      <RiCloseCircleFill size={11} /> Inactivo
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.roleColor}`}>{u.role}</span>
                    <span className="text-xs text-gray-500">{u.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDrawer(u)}
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"
                      title="Editar usuario"
                    >
                      <RiEditFill size={13} />
                    </button>
                    <button
                      onClick={() => setDeactivateModal(u)}
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors"
                      title="Desactivar usuario"
                    >
                      <RiUserSharedFill size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteModal(u)}
                      className="w-7 h-7 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors"
                      title="Eliminar usuario"
                    >
                      <RiDeleteBinFill size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">{u.lastAccess}</div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={closeDrawer}
        />
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
              {drawerMode === "create" && (
                <>
                  <RiUserAddFill size={20} className="text-[#2563eb]" />
                  Nuevo Usuario
                </>
              )}
              {drawerMode === "edit" && (
                <>
                  <RiEditFill size={20} className="text-[#2563eb]" />
                  Editar Usuario
                </>
              )}
              {drawerMode === "role" && (
                <>
                  <RiShieldStarFill size={20} className="text-[#f59e0b]" />
                  Nuevo Rol
                </>
              )}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create"
                ? "Completa la información para crear un nuevo usuario."
                : drawerMode === "edit"
                  ? "Modifica la información del usuario seleccionado."
                  : "Define un nuevo rol de acceso para el sistema."}
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f] flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
          >
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {drawerMode === "role" ? (
            <>
              <FormField
                label="Nombre del Rol"
                placeholder="Ej. Gerente de Ventas"
                value={roleForm.name}
                onChange={(v) => setRoleForm({ ...roleForm, name: v })}
                icon="🎯"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <textarea
                  placeholder="Ej. Acceso completo al módulo de ventas y reportes."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
                />
              </div>
              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Color del Badge
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value: "azul", label: "Azul", bg: "bg-[#1e3a5f]", dot: "bg-[#60a5fa]" },
                    { value: "morado", label: "Morado", bg: "bg-[#2d1b4e]", dot: "bg-[#c084fc]" },
                    { value: "verde", label: "Verde", bg: "bg-[#1a2e1a]", dot: "bg-[#4ade80]" },
                    { value: "amarillo", label: "Amarillo", bg: "bg-[#2d200a]", dot: "bg-[#fbbf24]" },
                    { value: "rojo", label: "Rojo", bg: "bg-[#3b1a1a]", dot: "bg-[#f87171]" },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setRoleForm({ ...roleForm, color: c.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                        roleForm.color === c.value
                          ? "border-white/40 text-white"
                          : "border-[#1f2a40] text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <FormField
                label="Nombre Completo"
                placeholder="Ej. Juan Pérez Gómez"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                icon="👤"
              />
              <FormField
                label="Correo Electrónico"
                placeholder="Ej. juan.perez@empresa.com"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                type="email"
                icon="✉️"
              />
              <FormField
                label="Teléfono"
                placeholder="Ej. +506 8888 8888"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                type="tel"
                icon="📞"
              />

              {/* Empresa */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Empresa
                </label>
                <div className="relative">
                  <select
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar empresa</option>
                    <option>Grupo Víquez S.A</option>
                    <option>Constructora Víquez</option>
                    <option>Textiles de Occidente</option>
                    <option>Pacific Pet Food</option>
                    <option>Occidente Lab</option>
                  </select>
                  <RiArrowDownSFill size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Rol
                </label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors appearance-none cursor-pointer"
                  >
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
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Estado
                </label>
                <div className="flex gap-5">
                  {["Activo", "Inactivo"].map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer group">
                      <div
                        onClick={() => setForm({ ...form, status: s })}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          form.status === s
                            ? s === "Activo"
                              ? "border-green-400"
                              : "border-red-400"
                            : "border-gray-600"
                        }`}
                      >
                        {form.status === s && (
                          <div className={`w-2 h-2 rounded-full ${s === "Activo" ? "bg-green-400" : "bg-red-400"}`} />
                        )}
                      </div>
                      <span className={`text-sm ${form.status === s ? "text-white" : "text-gray-400"}`}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#1f2a40] flex-shrink-0">
          <button
            onClick={closeDrawer}
            className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {drawerMode === "create"
              ? "Guardar Usuario"
              : drawerMode === "edit"
                ? "Guardar Cambios"
                : "Guardar Rol"}
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setDeleteModal(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#1f2a40] rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                  <RiDeleteBinFill size={22} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-1">Eliminar Usuario</h3>
                <p className="text-sm text-gray-400 text-center mb-1">
                  ¿Desea eliminar a{" "}
                  <span className="text-white font-medium">{deleteModal.name}</span>?
                </p>
                <p className="text-xs text-gray-500 text-center">Esta acción no puede deshacerse.</p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
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
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setDeactivateModal(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#1f2a40] rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-4">
                  <RiUserSharedFill size={22} className="text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-1">Desactivar Usuario</h3>
                <p className="text-sm text-gray-400 text-center mb-1">
                  ¿Desea desactivar a{" "}
                  <span className="text-white font-medium">{deactivateModal.name}</span>?
                </p>
                <p className="text-xs text-gray-500 text-center">El usuario perderá acceso al sistema hasta ser reactivado.</p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setDeactivateModal(null)}
                  className="flex-1 bg-[#141a2a] border border-[#1f2a40] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setDeactivateModal(null)}
                  className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
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

function FormField({ label, placeholder, value, onChange, type = "text", icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#141a2a] border border-[#1f2a40] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2563eb] transition-colors"
        />
      </div>
    </div>
  );
}

function PagBtn({ icon, label, active = false }) {
  return (
    <button
      className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-colors ${
        active
          ? "bg-[#2563eb] text-white font-bold"
          : "text-gray-400 hover:text-white hover:bg-[#1e3a5f]"
      }`}
    >
      {icon || label}
    </button>
  );
}

export default AdminConfig;
