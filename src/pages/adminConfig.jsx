import { useCallback, useEffect, useState } from "react";
import { getEcommerceUsers } from "../services/ecommerceUserService";
import {
  createAdminUser,
  getAdminFormCatalogs,
} from "../services/adminSettingsService";
import {
  RiSettings4Fill,
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
  RiDeleteBinFill,
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
  RiKey2Fill,
} from "react-icons/ri";

/*
  Las pestañas Roles y Permisos, Actividad y Seguridad conservan datos mock.
  La pestaña Usuarios sí carga datos reales de Supabase mediante getEcommerceUsers.
*/
/* ─── MOCK DATA ─────────────────────────────────────────────── */
const MOCK_USERS = [
  {
    id: 1,
    initials: "JG",
    color: "#C9A227",
    name: "José González",
    email: "jose@grupoviquez.com",
    phone: "+506 8421 1234",
    role: "Administrador",
    roleColor: "bg-[#C9A227]/15 text-[#C9A227]",
    companies: ["Grupo Víquez S.A", "Constructora Víquez"],
    status: "Activo",
    lastAccess: "Hace 2 horas",
    created: "12 Ene 2024",
    department: "Tecnología",
    sales: 0,
    quotes: 14,
    clients: 8,
    orders: 21,
    has2fa: true,
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
    companies: ["Grupo Víquez S.A"],
    status: "Activo",
    lastAccess: "Hace 1 día",
    created: "03 Mar 2024",
    department: "Ventas",
    sales: 45,
    quotes: 62,
    clients: 23,
    orders: 58,
    has2fa: true,
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
    companies: ["Textiles de Occidente"],
    status: "Activo",
    lastAccess: "Hace 3 horas",
    created: "18 Feb 2024",
    department: "Ventas",
    sales: 112,
    quotes: 88,
    clients: 41,
    orders: 130,
    has2fa: false,
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
    companies: ["Grupo Víquez S.A", "Pacific Pet Food"],
    status: "Activo",
    lastAccess: "Hace 5 horas",
    created: "07 Abr 2024",
    department: "Finanzas",
    sales: 0,
    quotes: 0,
    clients: 12,
    orders: 0,
    has2fa: true,
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
    companies: ["Pacific Pet Food"],
    status: "Inactivo",
    lastAccess: "Hace 15 días",
    created: "22 May 2024",
    department: "Ventas",
    sales: 67,
    quotes: 45,
    clients: 29,
    orders: 72,
    has2fa: false,
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
    companies: ["Constructora Víquez"],
    status: "Inactivo",
    lastAccess: "Hace 20 días",
    created: "01 Jun 2024",
    department: "Operaciones",
    sales: 0,
    quotes: 30,
    clients: 18,
    orders: 44,
    has2fa: false,
  },
];

const MOCK_ROLES = [
  {
    id: 1,
    name: "Administrador",
    badge: "bg-[#C9A227]/15 text-[#C9A227]",
    users: 2,
    permissions: 16,
    status: "Activo",
  },
  {
    id: 2,
    name: "Supervisor",
    badge: "bg-[#2d1b4e] text-[#c084fc]",
    users: 2,
    permissions: 12,
    status: "Activo",
  },
  {
    id: 3,
    name: "Vendedor",
    badge: "bg-[#1a2e1a] text-[#4ade80]",
    users: 2,
    permissions: 8,
    status: "Activo",
  },
  {
    id: 4,
    name: "Contabilidad",
    badge: "bg-[#2d200a] text-[#fbbf24]",
    users: 1,
    permissions: 6,
    status: "Activo",
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    group: "Hoy",
    items: [
      {
        user: "José González",
        initials: "JG",
        color: "#C9A227",
        action: "inició sesión",
        time: "Hace 10 minutos",
        icon: "login",
      },
      {
        user: "María Castillo",
        initials: "MC",
        color: "#ec4899",
        action: "creó una cotización",
        time: "Hace 35 minutos",
        icon: "quote",
      },
      {
        user: "Luis Pérez",
        initials: "LP",
        color: "#6366f1",
        action: "actualizó un cliente",
        time: "Hace 1 hora",
        icon: "client",
      },
      {
        user: "Ana Córdoba",
        initials: "AC",
        color: "#f59e0b",
        action: "generó un reporte financiero",
        time: "Hace 2 horas",
        icon: "report",
      },
    ],
  },
  {
    id: 2,
    group: "Ayer",
    items: [
      {
        user: "Ana Córdoba",
        initials: "AC",
        color: "#f59e0b",
        action: "modificó una venta",
        time: "23 Jun · 4:15 PM",
        icon: "sale",
      },
      {
        user: "Roberto Sánchez",
        initials: "RS",
        color: "#ef4444",
        action: "eliminó una cotización",
        time: "23 Jun · 2:30 PM",
        icon: "delete",
      },
      {
        user: "Daniela Cruz",
        initials: "DC",
        color: "#22c55e",
        action: "exportó lista de clientes",
        time: "23 Jun · 11:00 AM",
        icon: "export",
      },
    ],
  },
  {
    id: 3,
    group: "22 Jun",
    items: [
      {
        user: "José González",
        initials: "JG",
        color: "#C9A227",
        action: "creó un nuevo usuario",
        time: "22 Jun · 9:45 AM",
        icon: "create",
      },
      {
        user: "María Castillo",
        initials: "MC",
        color: "#ec4899",
        action: "aprobó una orden de compra",
        time: "22 Jun · 8:20 AM",
        icon: "approve",
      },
    ],
  },
];

const COMPANIES = [
  "Grupo Víquez S.A",
  "Textiles de Occidente",
  "Pacific Pet Food",
  "Constructora Víquez",
];

const PERMISSION_SECTIONS = [
  {
    key: "clients",
    label: "Clientes",
    icon: <RiTeamFill size={14} />,
    perms: [
      "Ver clientes",
      "Crear clientes",
      "Editar clientes",
      "Eliminar clientes",
    ],
  },
  {
    key: "sales",
    label: "Ventas",
    icon: <RiBarChartFill size={14} />,
    perms: [
      "Ver ventas",
      "Crear ventas",
      "Editar ventas",
      "Aprobar ventas",
    ],
  },
  {
    key: "quotes",
    label: "Cotizaciones",
    icon: <RiFileListFill size={14} />,
    perms: [
      "Ver cotizaciones",
      "Crear cotizaciones",
      "Aprobar cotizaciones",
    ],
  },
  {
    key: "config",
    label: "Configuración",
    icon: <RiSettings4Fill size={14} />,
    perms: [
      "Gestión de usuarios",
      "Gestión de roles",
      "Configuración general",
    ],
  },
  {
    key: "companies",
    label: "Empresas",
    icon: <RiGlobalLine size={14} />,
    perms: COMPANIES,
  },
];

const DEFAULT_ROLE_PERMISSIONS = {
  Administrador: {
    clients: [0, 1, 2, 3],
    sales: [0, 1, 2, 3],
    quotes: [0, 1, 2],
    config: [0, 1, 2],
    companies: [0, 1, 2, 3],
  },
  Supervisor: {
    clients: [0, 1, 2],
    sales: [0, 1, 2, 3],
    quotes: [0, 1, 2],
    config: [],
    companies: [0, 1],
  },
  Vendedor: {
    clients: [0, 1, 2],
    sales: [0, 1],
    quotes: [0, 1],
    config: [],
    companies: [0],
  },
  Contabilidad: {
    clients: [0],
    sales: [0],
    quotes: [0],
    config: [],
    companies: [0, 1, 2, 3],
  },
};

/* ─── COMPONENTES AUXILIARES ───────────────────────────────── */
function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none">
            {icon}
          </span>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full bg-[#222e44] border border-[#2a3550] rounded-lg ${icon ? "pl-9" : "pl-3"
            } pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors`}
        />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${checked ? "bg-[#C9A227]" : "bg-[#2a3448]"
        }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-5" : "left-0.5"
          }`}
      />
    </button>
  );
}

function ActivityIcon({ type }) {
  const map = {
    login: {
      icon: <RiKey2Fill size={12} />,
      color: "bg-[#C9A227]/15 text-[#C9A227]",
    },
    quote: {
      icon: <RiFileListFill size={12} />,
      color: "bg-[#2d1b4e] text-[#c084fc]",
    },
    client: {
      icon: <RiTeamFill size={12} />,
      color: "bg-[#1a2e1a] text-[#4ade80]",
    },
    sale: {
      icon: <RiBarChartFill size={12} />,
      color: "bg-[#C9A227]/15 text-[#C9A227]",
    },
    report: {
      icon: <RiBarChartFill size={12} />,
      color: "bg-[#2d200a] text-[#fbbf24]",
    },
    delete: {
      icon: <RiDeleteBinFill size={12} />,
      color: "bg-[#3b1a1a] text-[#f87171]",
    },
    export: {
      icon: <RiFileListFill size={12} />,
      color: "bg-[#1a2e1a] text-[#4ade80]",
    },
    create: {
      icon: <RiUserAddFill size={12} />,
      color: "bg-[#C9A227]/15 text-[#C9A227]",
    },
    approve: {
      icon: <RiCheckboxCircleFill size={12} />,
      color: "bg-[#14301a] text-[#4ade80]",
    },
  };

  const { icon, color } = map[type] || map.login;

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}
    >
      {icon}
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ─────────────────────────────────── */
function generateTemporaryPassword() {
  const randomText = Math.random().toString(36).slice(2, 10);
  const randomNumber = Math.floor(100 + Math.random() * 900);

  return `GV-${randomText}${randomNumber}!`;
}

function getEmptyUserForm() {
  return {
    name: "",
    email: "",
    phone: "",
    companies: [],
    departmentId: "",
    role: "",
    password: generateTemporaryPassword(),
    status: "Activo",
  };
}

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const [name, ...surnameParts] = parts;

  return {
    name: name || "",
    surname: surnameParts.join(" "),
  };
}

function normalizeCatalogItem(item, idKey, labelKey) {
  return {
    id: item?.[idKey] || item?.id || "",
    label: item?.[labelKey] || item?.name || item?.company_name || "",
    raw: item,
  };
}

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState("usuarios");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [editRole, setEditRole] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  const [form, setForm] = useState(() => getEmptyUserForm());

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    color: "azul",
  });

  const [rolePermissions, setRolePermissions] = useState(
    DEFAULT_ROLE_PERMISSIONS,
  );

  const [deleteModal, setDeleteModal] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  const [security, setSecurity] = useState({
    strongPassword: true,
    forceChange90: true,
    lockAfterFail: true,
    twoFactor: false,
    googleLogin: true,
    autoLogout: true,
    sessionTime: "30",
  });

  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("Todos");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [adminCatalogs, setAdminCatalogs] = useState({
    companies: [],
    departments: [],
    roles: [],
  });
  const [adminCatalogsLoading, setAdminCatalogsLoading] = useState(false);
  const [adminCatalogsError, setAdminCatalogsError] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [saveUserError, setSaveUserError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const ecommerceUsers = await getEcommerceUsers();

      setUsers(ecommerceUsers);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error cargando usuarios e-commerce:", error);

      setUsers([]);
      setUsersError(
        error.message ||
        "No fue posible cargar los usuarios del e-commerce.",
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadAdminCatalogs = useCallback(async () => {
    try {
      setAdminCatalogsLoading(true);
      setAdminCatalogsError("");

      const catalogs = await getAdminFormCatalogs();

      setAdminCatalogs({
        companies: (catalogs.companies || []).map((company) => ({
          id: company.company_id,
          label: company.company_name,
        })).filter((c) => c.id && c.label),

        departments: (catalogs.departments || []).map((dept) => ({
          id: dept.department_id,
          label: dept.name,
        })).filter((d) => d.id && d.label),

        roles: (catalogs.roles || []).map((role) => ({
          id: role.role_id,
          label: role.role_name,
        })).filter((r) => r.id && r.label),
      });
    } catch (error) {
      console.error("Error cargando catálogos del formulario:", error);

      setAdminCatalogsError(
        error.message ||
        "No fue posible cargar empresas, departamentos y roles.",
      );
    } finally {
      setAdminCatalogsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadUsers();
      loadAdminCatalogs();
    });

    return () => {
      isMounted = false;
    };
  }, [loadAdminCatalogs, loadUsers]);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setForm(getEmptyUserForm());
    setSaveUserError("");

    setDrawerOpen(true);
  };

  const openEditDrawer = (user) => {
    setDrawerMode("edit");
    setSaveUserError("");

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      companies: user.companies || [],
      departmentId: "",
      role: user.role,
      password: "",
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

  const openEditRoleDrawer = (role) => {
    setDrawerMode("editRole");
    setEditRole(role);
    setDrawerOpen(true);
  };

  const openProfileDrawer = (user) => {
    setDrawerMode("profile");
    setProfileUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);

    window.setTimeout(() => {
      setDrawerMode("create");
      setEditRole(null);
      setProfileUser(null);
    }, 300);
  };

  const availableCompanies = adminCatalogs.companies;

  const availableDepartments = adminCatalogs.departments;
  const availableRoles = adminCatalogs.roles;

  const filtered = users.filter((user) => {
    const query = search.toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "Todos" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const toggleSelectUser = (id) => {
    setSelectedUsers((previousUsers) =>
      previousUsers.includes(id)
        ? previousUsers.filter((userId) => userId !== id)
        : [...previousUsers, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filtered.length) {
      setSelectedUsers([]);
      return;
    }

    setSelectedUsers(filtered.map((user) => user.id));
  };

  const togglePermission = (roleName, sectionKey, permissionIndex) => {
    setRolePermissions((previousPermissions) => {
      const currentPermissions =
        previousPermissions[roleName]?.[sectionKey] || [];

      const updatedPermissions = currentPermissions.includes(
        permissionIndex,
      )
        ? currentPermissions.filter(
          (index) => index !== permissionIndex,
        )
        : [...currentPermissions, permissionIndex];

      return {
        ...previousPermissions,
        [roleName]: {
          ...previousPermissions[roleName],
          [sectionKey]: updatedPermissions,
        },
      };
    });
  };

  const toggleCompanyInForm = (company) => {
    setForm((previousForm) => {
      const companies = previousForm.companies.includes(company)
        ? previousForm.companies.filter(
          (companyName) => companyName !== company,
        )
        : [...previousForm.companies, company];

      return {
        ...previousForm,
        companies,
      };
    });
  };

  const handleSaveDrawer = async () => {
    if (drawerMode !== "create") {
      closeDrawer();
      return;
    }

    const { name, surname } = splitFullName(form.name);
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const companyId = form.companies[0];

    if (!name || !surname) {
      setSaveUserError("Ingresa nombre y apellido para crear el usuario.");
      return;
    }

    if (!email) {
      setSaveUserError("Ingresa el correo electronico del usuario.");
      return;
    }

    if (password.length < 8) {
      setSaveUserError("La contrasena temporal debe tener al menos 8 caracteres.");
      return;
    }

    if (!companyId) {
      setSaveUserError("Selecciona al menos una empresa para el usuario.");
      return;
    }

    if (!form.departmentId) {
      setSaveUserError("Selecciona el departamento del usuario.");
      return;
    }

    if (!form.role) {
      setSaveUserError("Selecciona el rol del usuario.");
      return;
    }

    try {
      setSavingUser(true);
      setUsersError("");
      setSaveUserError("");

      const payload = {
        email,
        password,
        profile: {
          name,
          surname,
          phone: form.phone.trim() || null,
        },
        membership: {
          company_id: companyId,
          department_id: form.departmentId,
          role_id: form.role,
        },
      };

      console.log("createAdminUser payload", payload);

      await createAdminUser(payload);

      await loadUsers();
      closeDrawer();
    } catch (error) {
      console.error("Error creando usuario e-commerce:", error);

      setSaveUserError(error.message || "No fue posible crear el usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  const totalUsers = users.length;

  const activeUsersCount = users.filter(
    (user) => user.status === "Activo",
  ).length;

  const inactiveUsersCount = users.filter(
    (user) => user.status === "Inactivo",
  ).length;

  const registeredRolesCount = new Set(
    users
      .map((user) => user.role)
      .filter((role) => role !== "Sin rol asignado"),
  ).size;

  const metrics = [
    {
      label: "Usuarios e-commerce",
      value: totalUsers,
      icon: <RiUserFill size={20} />,
      color: "bg-[#C9A227]/15",
      iconColor: "text-[#C9A227]",
      detail: "Asignados a la aplicación",
    },
    {
      label: "Accesos activos",
      value: activeUsersCount,
      icon: <RiUserFollowFill size={20} />,
      color: "bg-[#14301a]",
      iconColor: "text-[#4ade80]",
      detail: "Con acceso vigente",
    },
    {
      label: "Accesos inactivos",
      value: inactiveUsersCount,
      icon: <RiUserUnfollowFill size={20} />,
      color: "bg-[#3b1a1a]",
      iconColor: "text-[#f87171]",
      detail: "Desactivados o vencidos",
    },
    {
      label: "Roles en uso",
      value: registeredRolesCount,
      icon: <RiShieldUserFill size={20} />,
      color: "bg-[#2d200a]",
      iconColor: "text-[#fbbf24]",
      detail: "Entre usuarios e-commerce",
    },
  ];

  const TABS = [
    {
      key: "usuarios",
      label: "Usuarios",
      icon: <RiUserFill size={15} />,
    },
    {
      key: "roles",
      label: "Roles y Permisos",
      icon: <RiShieldUserFill size={15} />,
    },
    {
      key: "actividad",
      label: "Actividad",
      icon: <RiTimeLine size={15} />,
    },
    {
      key: "seguridad",
      label: "Seguridad",
      icon: <RiShieldCheckFill size={15} />,
    },
  ];

  return (
    <>
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <span>Configuración</span>
          <RiArrowRightSLine size={14} />
          <span className="text-gray-300">Gestión de Usuarios</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Gestión de Usuarios
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Administra los usuarios asignados al e-commerce, sus accesos,
              roles y empresas relacionadas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {activeTab === "usuarios" && (
              <>
                <button
                  type="button"
                  onClick={openRoleDrawer}
                  className="flex items-center gap-2 bg-[#141d2e] hover:bg-[#C9A227]/15 border border-[#2a3550] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RiShieldStarFill
                    size={16}
                    className="text-[#f59e0b]"
                  />
                  Nuevo Rol
                </button>

                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RiAddFill size={18} />
                  Nuevo Usuario
                </button>
              </>
            )}

            {activeTab === "roles" && (
              <button
                type="button"
                onClick={openRoleDrawer}
                className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RiAddFill size={18} />
                Nuevo Rol
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/40 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg ${metric.color} flex items-center justify-center ${metric.iconColor} mb-2`}
              >
                {metric.icon}
              </div>

              <div className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">
                {metric.label}
              </div>

              <div className="text-2xl font-bold text-white">
                {metric.value}
              </div>

              <div className="text-xs text-gray-500 mt-0.5">
                {metric.detail}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-[#2a3550] mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${activeTab === tab.key
                ? "border-[#C9A227] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "usuarios" && (
          <>
            {usersError && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3">
                <p className="text-sm text-red-300">
                  {usersError}
                </p>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="text-sm font-medium text-red-200 hover:text-white underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mb-4 bg-[#C9A227]/15 border border-[#C9A227]/50 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">
                  <span className="text-[#C9A227] font-bold">
                    {selectedUsers.length}
                  </span>{" "}
                  usuarios seleccionados
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiCheckboxCircleFill size={13} />
                    Activar
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiCloseCircleFill size={13} />
                    Desactivar
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-[#2a3550] text-gray-300 hover:bg-[#2a3448] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiShieldUserFill size={13} />
                    Cambiar Rol
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiDeleteBinFill size={13} />
                    Eliminar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <RiSearchLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>

              <div className="relative">
                <RiFilterLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>

                <RiArrowDownSFill
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="hidden md:block bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3550]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedUsers.length === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                      />
                    </th>

                    {[
                      "USUARIO",
                      "CORREO",
                      "TELÉFONO",
                      "ROL",
                      "EMPRESA",
                      "ESTADO",
                      "ÚLTIMA ACTIVIDAD",
                      "ACCIONES",
                    ].map((column) => (
                      <th
                        key={column}
                        className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-4 py-3"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {usersLoading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-gray-400"
                      >
                        Cargando usuarios autorizados para e-commerce...
                      </td>
                    </tr>
                  )}

                  {!usersLoading &&
                    filtered.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors ${selectedUsers.includes(user.id)
                          ? "bg-[#C9A227]/10"
                          : ""
                          }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                            className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.initials}
                            </div>

                            <span className="font-medium text-white">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-400">
                          {user.email}
                        </td>

                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {user.phone}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.roleColor}`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-300 text-xs">
                          {user.companies?.[0] || user.company}
                        </td>

                        <td className="px-4 py-3">
                          {user.status === "Activo" ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit">
                              <RiCheckboxCircleFill size={12} />
                              Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit">
                              <RiCloseCircleFill size={12} />
                              Inactivo
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {user.lastActivity}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openProfileDrawer(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Ver perfil"
                            >
                              <RiEyeFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditDrawer(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <RiEditFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeactivateModal(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Desactivar"
                            >
                              <RiUserSharedFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <RiDeleteBinFill size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!usersLoading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
                    <RiUserFill size={28} />
                  </div>

                  <p className="text-sm text-gray-500">
                    No se encontraron usuarios
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("Todos");
                    }}
                    className="text-xs text-[#C9A227] hover:underline cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}

              <div className="px-5 py-3 border-t border-[#2a3550]">
                <span className="text-xs text-gray-500">
                  Mostrando {filtered.length > 0 ? 1 : 0} a {filtered.length} de{" "}
                  {users.length} usuarios
                </span>
              </div>
            </div>

            <div className="md:hidden space-y-3 mb-5">
              {!usersLoading && filtered.length === 0 && (
                <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-8 text-center text-sm text-gray-500">
                  No se encontraron usuarios.
                </div>
              )}

              {!usersLoading && filtered.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.initials}
                      </div>

                      <div>
                        <div className="font-medium text-white text-sm">
                          {user.name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>

                        <div className="text-xs text-gray-600">
                          {user.phone}
                        </div>
                      </div>
                    </div>

                    {user.status === "Activo" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                        <RiCheckboxCircleFill size={11} />
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                        <RiCloseCircleFill size={11} />
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.roleColor}`}
                      >
                        {user.role}
                      </span>

                      <span className="text-xs text-gray-500">
                        {user.companies?.[0] || user.company}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openProfileDrawer(user)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RiEyeFill size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditDrawer(user)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RiEditFill size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModal(user)}
                        className="w-7 h-7 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RiDeleteBinFill size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    {user.lastActivity}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3550] flex items-center gap-2">
                <RiShieldUserFill
                  size={16}
                  className="text-[#C9A227]"
                />

                <h3 className="text-sm font-semibold text-white">
                  Roles del Sistema
                </h3>
              </div>

              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3550]">
                      {[
                        "ROL",
                        "USUARIOS ASIGNADOS",
                        "PERMISOS",
                        "ESTADO",
                        "ACCIONES",
                      ].map((column) => (
                        <th
                          key={column}
                          className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {MOCK_ROLES.map((role) => (
                      <tr
                        key={role.id}
                        className="border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${role.badge}`}
                          >
                            {role.name}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {MOCK_USERS.filter(
                                (user) => user.role === role.name,
                              )
                                .slice(0, 3)
                                .map((user) => (
                                  <div
                                    key={user.id}
                                    className="w-6 h-6 rounded-full border-2 border-[#141d2e] flex items-center justify-center text-[9px] font-bold text-white"
                                    style={{
                                      backgroundColor: user.color,
                                    }}
                                  >
                                    {user.initials}
                                  </div>
                                ))}
                            </div>

                            <span className="text-gray-400 text-sm">
                              {role.users} usuarios
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-[#2a3550] rounded-full w-20">
                              <div
                                className="h-1.5 bg-[#C9A227] rounded-full"
                                style={{
                                  width: `${(role.permissions / 16) * 100
                                    }%`,
                                }}
                              />
                            </div>

                            <span className="text-gray-400 text-xs">
                              {role.permissions}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit">
                            <RiCheckboxCircleFill size={11} />
                            Activo
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => openEditRoleDrawer(role)}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1c2538] hover:bg-[#C9A227]/15 border border-[#2a3550] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <RiEditFill size={12} />
                            Editar Rol
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-[#2a3550]">
                {MOCK_ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${role.badge}`}
                      >
                        {role.name}
                      </span>

                      <div className="text-xs text-gray-500 mt-2">
                        {role.users} usuarios · {role.permissions} permisos
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditRoleDrawer(role)}
                      className="text-xs text-[#C9A227] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RiEditFill size={12} />
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "actividad" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <RiSearchLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={activitySearch}
                  onChange={(event) =>
                    setActivitySearch(event.target.value)
                  }
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>

              <div className="relative">
                <RiFilterLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <select
                  value={activityType}
                  onChange={(event) =>
                    setActivityType(event.target.value)
                  }
                  className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="Todos">Todos los tipos</option>
                  <option value="login">Inicios de sesión</option>
                  <option value="ventas">Ventas</option>
                  <option value="cotizaciones">Cotizaciones</option>
                  <option value="clientes">Clientes</option>
                </select>

                <RiArrowDownSFill
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>

              <div className="relative">
                <RiCalendarLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-6">
              {MOCK_ACTIVITY.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      {group.group}
                    </span>

                    <div className="flex-1 h-px bg-[#2a3550]" />
                  </div>

                  <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
                    {group.items.map((item, index) => (
                      <div
                        key={`${item.user}-${item.time}`}
                        className={`flex items-start gap-4 px-5 py-4 hover:bg-[#1c2538] transition-colors ${index < group.items.length - 1
                          ? "border-b border-[#2a3550]"
                          : ""
                          }`}
                      >
                        <div className="relative mt-0.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          >
                            {item.initials}
                          </div>

                          <ActivityIcon type={item.icon} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">
                            <span className="font-semibold">
                              {item.user}
                            </span>

                            <span className="text-gray-400">
                              {" "}
                              {item.action}
                            </span>
                          </p>

                          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                            <RiTimeLine size={11} />
                            {item.time}
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

        {activeTab === "seguridad" && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a3550]">
                <RiLockPasswordFill
                  size={16}
                  className="text-[#C9A227]"
                />

                <h3 className="text-sm font-semibold text-white">
                  Políticas de Contraseña
                </h3>
              </div>

              <div className="divide-y divide-[#2a3550]">
                {[
                  {
                    key: "strongPassword",
                    label: "Requerir contraseña fuerte",
                    description:
                      "Mínimo 8 caracteres, mayúsculas, números y símbolos.",
                  },
                  {
                    key: "forceChange90",
                    label: "Forzar cambio cada 90 días",
                    description:
                      "Los usuarios deberán actualizar su contraseña periódicamente.",
                  },
                  {
                    key: "lockAfterFail",
                    label: "Bloquear después de 5 intentos fallidos",
                    description:
                      "La cuenta se bloqueará automáticamente al superar el límite.",
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-4 hover:bg-[#1c2538] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {label}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5">
                        {description}
                      </div>
                    </div>

                    <Toggle
                      checked={security[key]}
                      onChange={(value) =>
                        setSecurity((previousSecurity) => ({
                          ...previousSecurity,
                          [key]: value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a3550]">
                <RiSmartphoneFill
                  size={16}
                  className="text-[#c084fc]"
                />

                <h3 className="text-sm font-semibold text-white">
                  Autenticación
                </h3>
              </div>

              <div className="divide-y divide-[#2a3550]">
                {[
                  {
                    key: "twoFactor",
                    label: "Habilitar doble factor (2FA)",
                    description:
                      "Requiere un segundo método de verificación al iniciar sesión.",
                  },
                  {
                    key: "googleLogin",
                    label: "Permitir inicio de sesión con Google",
                    description:
                      "Los usuarios podrán autenticarse usando su cuenta de Google.",
                  },
                  {
                    key: "autoLogout",
                    label: "Cierre automático por inactividad",
                    description:
                      "La sesión se cerrará automáticamente al no detectar actividad.",
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-4 hover:bg-[#1c2538] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {label}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5">
                        {description}
                      </div>
                    </div>

                    <Toggle
                      checked={security[key]}
                      onChange={(value) =>
                        setSecurity((previousSecurity) => ({
                          ...previousSecurity,
                          [key]: value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a3550]">
                <RiTimerLine
                  size={16}
                  className="text-[#4ade80]"
                />

                <h3 className="text-sm font-semibold text-white">
                  Sesión
                </h3>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      Tiempo máximo de sesión
                    </div>

                    <div className="text-xs text-gray-500 mt-0.5">
                      La sesión se cerrará automáticamente después del
                      tiempo seleccionado.
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={security.sessionTime}
                      onChange={(event) =>
                        setSecurity((previousSecurity) => ({
                          ...previousSecurity,
                          sessionTime: event.target.value,
                        }))
                      }
                      className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                      <option value="480">8 horas</option>
                    </select>

                    <RiArrowDownSFill
                      size={15}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RiCheckLine size={16} />
              Guardar Configuración
            </button>
          </div>
        )}
      </div>

      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel lateral"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerMode === "editRole"
          ? "w-full max-w-lg"
          : "w-full max-w-md"
          } ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && (
                <>
                  <RiUserAddFill
                    size={20}
                    className="text-[#C9A227]"
                  />
                  Nuevo Usuario
                </>
              )}

              {drawerMode === "edit" && (
                <>
                  <RiEditFill size={20} className="text-[#C9A227]" />
                  Editar Usuario
                </>
              )}

              {drawerMode === "role" && (
                <>
                  <RiShieldStarFill
                    size={20}
                    className="text-[#f59e0b]"
                  />
                  Nuevo Rol
                </>
              )}

              {drawerMode === "editRole" && (
                <>
                  <RiEditFill size={20} className="text-[#c084fc]" />
                  Editar Rol — {editRole?.name}
                </>
              )}

              {drawerMode === "profile" && (
                <>
                  <RiUserFill size={20} className="text-[#C9A227]" />
                  Perfil de Usuario
                </>
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" &&
                "Completa la información para crear un nuevo usuario."}
              {drawerMode === "edit" &&
                "Modifica la información del usuario seleccionado."}
              {drawerMode === "role" &&
                "Define un nuevo rol de acceso para el sistema."}
              {drawerMode === "editRole" &&
                "Configura los permisos y accesos del rol seleccionado."}
              {drawerMode === "profile" &&
                "Información completa del usuario."}
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
            <div className="space-y-5">
              <FormField
                label="Nombre Completo"
                placeholder="Ej. Juan Pérez Gómez"
                value={form.name}
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
                icon="👤"
              />

              <FormField
                label="Correo Electrónico"
                placeholder="Ej. juan.perez@empresa.com"
                value={form.email}
                onChange={(value) =>
                  setForm({
                    ...form,
                    email: value,
                  })
                }
                type="email"
                icon="✉️"
              />

              <FormField
                label="Teléfono"
                placeholder="Ej. +506 8888 8888"
                value={form.phone}
                onChange={(value) =>
                  setForm({
                    ...form,
                    phone: value,
                  })
                }
                type="tel"
                icon="📞"
              />

              {drawerMode === "create" && (
                <FormField
                  label="Contraseña Temporal"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      password: value,
                    })
                  }
                  type="text"
                  icon="🔐"
                />
              )}

              {adminCatalogsError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {adminCatalogsError}
                </div>
              )}

              {saveUserError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {saveUserError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Empresas Asignadas
                </label>

                <div className="space-y-2">
                  {availableCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => toggleCompanyInForm(company.id)}
                      className="w-full flex items-center gap-3 text-left cursor-pointer group p-2 rounded-lg hover:bg-[#1c2538] transition-colors"
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.companies.includes(company.id)
                          ? "border-[#C9A227] bg-[#C9A227]"
                          : "border-[#2a3448]"
                          }`}
                      >
                        {form.companies.includes(company.id) && (
                          <RiCheckLine
                            size={10}
                            className="text-white"
                          />
                        )}
                      </span>

                      <span
                        className={`text-sm ${form.companies.includes(company.id)
                          ? "text-white"
                          : "text-gray-400"
                          }`}
                      >
                        {company.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Departamento
                </label>

                <div className="relative">
                  <select
                    value={form.departmentId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        departmentId: event.target.value,
                      })
                    }
                    disabled={adminCatalogsLoading}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer disabled:opacity-60"
                  >
                    <option value="">
                      {adminCatalogsLoading
                        ? "Cargando departamentos..."
                        : "Seleccionar departamento"}
                    </option>

                    {availableDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.label}
                      </option>
                    ))}
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Rol
                </label>

                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role: event.target.value,
                      })
                    }
                    disabled={adminCatalogsLoading}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer disabled:opacity-60"
                  >
                    <option value="">
                      {adminCatalogsLoading ? "Cargando roles..." : "Seleccionar rol"}
                    </option>

                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Estado
                </label>

                <div className="flex gap-5">
                  {["Activo", "Inactivo"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          status,
                        })
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${form.status === status
                          ? status === "Activo"
                            ? "border-green-400"
                            : "border-red-400"
                          : "border-gray-600"
                          }`}
                      >
                        {form.status === status && (
                          <span
                            className={`w-2 h-2 rounded-full ${status === "Activo"
                              ? "bg-green-400"
                              : "bg-red-400"
                              }`}
                          />
                        )}
                      </span>

                      <span
                        className={`text-sm ${form.status === status
                          ? "text-white"
                          : "text-gray-400"
                          }`}
                      >
                        {status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {drawerMode === "role" && (
            <div className="space-y-5">
              <FormField
                label="Nombre del Rol"
                placeholder="Ej. Gerente de Ventas"
                value={roleForm.name}
                onChange={(value) =>
                  setRoleForm({
                    ...roleForm,
                    name: value,
                  })
                }
                icon="🎯"
              />

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Descripción
                </label>

                <textarea
                  placeholder="Ej. Acceso completo al módulo de ventas y reportes."
                  value={roleForm.description}
                  onChange={(event) =>
                    setRoleForm({
                      ...roleForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Color del Badge
                </label>

                <div className="flex gap-3 flex-wrap">
                  {[
                    {
                      value: "azul",
                      label: "Azul",
                      dot: "bg-[#60a5fa]",
                    },
                    {
                      value: "morado",
                      label: "Morado",
                      dot: "bg-[#c084fc]",
                    },
                    {
                      value: "verde",
                      label: "Verde",
                      dot: "bg-[#4ade80]",
                    },
                    {
                      value: "amarillo",
                      label: "Amarillo",
                      dot: "bg-[#fbbf24]",
                    },
                    {
                      value: "rojo",
                      label: "Rojo",
                      dot: "bg-[#f87171]",
                    },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setRoleForm({
                          ...roleForm,
                          color: color.value,
                        })
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${roleForm.color === color.value
                        ? "border-white/40 text-white"
                        : "border-[#2a3550] text-gray-500 hover:text-gray-300"
                        } cursor-pointer`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${color.dot}`}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {drawerMode === "editRole" && editRole && (
            <div className="space-y-5">
              {PERMISSION_SECTIONS.map((section) => {
                const activePermissions =
                  rolePermissions[editRole.name]?.[section.key] || [];

                const allChecked =
                  activePermissions.length === section.perms.length;

                return (
                  <div
                    key={section.key}
                    className="bg-[#1c2538] border border-[#2a3550] rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3550]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="text-gray-500">
                          {section.icon}
                        </span>

                        {section.label}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const indices = section.perms.map(
                            (_, index) => index,
                          );

                          setRolePermissions(
                            (previousPermissions) => ({
                              ...previousPermissions,
                              [editRole.name]: {
                                ...previousPermissions[editRole.name],
                                [section.key]: allChecked
                                  ? []
                                  : indices,
                              },
                            }),
                          );
                        }}
                        className={`text-xs font-medium transition-colors cursor-pointer ${allChecked
                          ? "text-[#C9A227] hover:text-gray-400"
                          : "text-gray-500 hover:text-[#C9A227]"
                          }`}
                      >
                        {allChecked
                          ? "Desmarcar todos"
                          : "Seleccionar todos"}
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 gap-2">
                      {section.perms.map(
                        (permission, permissionIndex) => (
                          <button
                            key={permission}
                            type="button"
                            onClick={() =>
                              togglePermission(
                                editRole.name,
                                section.key,
                                permissionIndex,
                              )
                            }
                            className="flex items-center gap-3 text-left cursor-pointer group p-1.5 rounded-lg hover:bg-[#22304a] transition-colors"
                          >
                            <span
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${activePermissions.includes(
                                permissionIndex,
                              )
                                ? "border-[#C9A227] bg-[#C9A227]"
                                : "border-[#2a3448]"
                                }`}
                            >
                              {activePermissions.includes(
                                permissionIndex,
                              ) && (
                                  <RiCheckLine
                                    size={10}
                                    className="text-white"
                                  />
                                )}
                            </span>

                            <span
                              className={`text-sm ${activePermissions.includes(
                                permissionIndex,
                              )
                                ? "text-white"
                                : "text-gray-500"
                                }`}
                            >
                              {permission}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {drawerMode === "profile" && profileUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: profileUser.color }}
                >
                  {profileUser.initials}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {profileUser.name}
                  </h3>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${profileUser.roleColor}`}
                  >
                    {profileUser.role}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Datos Personales
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Nombre",
                      value: profileUser.name,
                    },
                    {
                      label: "Correo",
                      value: profileUser.email,
                    },
                    {
                      label: "Teléfono",
                      value: profileUser.phone,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center gap-4 py-2 border-b border-[#2a3550]"
                    >
                      <span className="text-xs text-gray-500">
                        {label}
                      </span>

                      <span className="text-sm text-white text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Información Laboral
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Rol",
                      value: profileUser.role,
                    },
                    {
                      label: "Empresa",
                      value:
                        profileUser.companies?.[0] ||
                        profileUser.company,
                    },
                    {
                      label: "Departamento",
                      value: profileUser.department,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center gap-4 py-2 border-b border-[#2a3550]"
                    >
                      <span className="text-xs text-gray-500">
                        {label}
                      </span>

                      <span className="text-sm text-white text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Acceso al Sistema
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Fecha de creación",
                      value: profileUser.created,
                    },
                    {
                      label: "ÚLTIMA ACTIVIDAD",
                      value: profileUser.lastActivity,
                    },
                    {
                      label: "Estado",
                      value: profileUser.status,
                    },
                    {
                      label: "2FA",
                      value: "No disponible",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center gap-4 py-2 border-b border-[#2a3550]"
                    >
                      <span className="text-xs text-gray-500">
                        {label}
                      </span>

                      <span
                        className={`text-sm text-right ${label === "Estado"
                          ? value === "Activo"
                            ? "text-green-400"
                            : "text-red-400"
                          : label === "2FA"
                            ? value === "Activo"
                              ? "text-green-400"
                              : "text-gray-500"
                            : "text-white"
                          }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {drawerMode !== "profile" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveDrawer}
              disabled={savingUser}
              className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingUser
                ? "Guardando..."
                : drawerMode === "create"
                ? "Guardar Usuario"
                : drawerMode === "edit"
                  ? "Guardar Cambios"
                  : drawerMode === "editRole"
                    ? "Guardar Permisos"
                    : "Guardar Rol"}
            </button>
          </div>
        )}

        {drawerMode === "profile" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                const userToEdit = profileUser;

                closeDrawer();

                window.setTimeout(() => {
                  if (userToEdit) {
                    openEditDrawer(userToEdit);
                  }
                }, 350);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C9A227]/15 text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RiEditFill size={15} />
              Editar Usuario
            </button>

            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {deleteModal && (
        <>
          <button
            type="button"
            onClick={() => setDeleteModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
            aria-label="Cerrar confirmación de eliminación"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <RiDeleteBinFill
                  size={24}
                  className="text-red-400"
                />
              </div>

              <h3 className="text-center text-base font-bold text-white mb-1">
                Eliminar usuario
              </h3>

              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Estás seguro de que deseas eliminar a{" "}
                <span className="text-white font-medium">
                  {deleteModal.name}
                </span>
                ? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 bg-[#1c2538] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deactivateModal && (
        <>
          <button
            type="button"
            onClick={() => setDeactivateModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
            aria-label="Cerrar confirmación de desactivación"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <RiUserSharedFill
                  size={24}
                  className="text-yellow-400"
                />
              </div>

              <h3 className="text-center text-base font-bold text-white mb-1">
                Desactivar usuario
              </h3>

              <p className="text-center text-sm text-gray-400 mb-5">
                ¿Desactivar a{" "}
                <span className="text-white font-medium">
                  {deactivateModal.name}
                </span>
                ? El usuario perderá acceso al sistema de inmediato.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeactivateModal(null)}
                  className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => setDeactivateModal(null)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
