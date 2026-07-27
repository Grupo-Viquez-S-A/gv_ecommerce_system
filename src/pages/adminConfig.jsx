import { useCallback, useEffect, useState } from "react";
import { getEcommerceUsers } from "../services/ecommerceUserService";
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
} from "../services/adminSettingsService";
import {
  createEcommerceUser,
  getUserFormCatalogs,
} from "../services/userServices";
import {
  RiSettings4Fill,
  RiUserFill,
  RiUserFollowFill,
  RiUserUnfollowFill,
  RiShieldUserFill,
  RiTimeLine,
  RiShieldCheckFill,
  RiGlobalLine,
  RiBarChartFill,
  RiTeamFill,
  RiFileListFill,
} from "react-icons/ri";
import AdminActivityTab from "../components/admin/AdminActivityTab.jsx";
import AdminSecurityTab from "../components/admin/AdminSecurityTab.jsx";
import AdminOverview from "../components/admin/AdminOverview.jsx";
import AdminUsersTab from "../components/admin/AdminUsersTab.jsx";
import AdminRolesTab from "../components/admin/AdminRolesTab.jsx";
import AdminDrawer from "../components/admin/AdminDrawer.jsx";
import AdminConfirmModals from "../components/admin/AdminConfirmModals.jsx";
import {
  getEmptyAdminUserForm as getEmptyUserForm,
  mapAdminRoleRow as mapRoleRow,
  splitAdminFullName as splitFullName,
} from "../components/admin/AdminViewHelpers.jsx";

/*
  Usuarios y Roles cargan datos reales de Supabase.
  Actividad y Seguridad conservan datos mock de interfaz.
*/
/* MOCK DATA */

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
    code: "",
    description: "",
    isActive: true,
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
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [roleFormError, setRoleFormError] = useState("");

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

      const catalogs = await getUserFormCatalogs();

      setAdminCatalogs({
        companies: (catalogs.companies || []).map((company) => ({
          id: company.company_id,
          label: company.commercial_name || company.company_name,
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

  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      setRolesError("");

      const roleRows = await getRoles();

      setRoles(roleRows.map(mapRoleRow));
    } catch (error) {
      console.error("Error cargando roles:", error);

      setRoles([]);
      setRolesError(error.message || "No fue posible cargar los roles.");
    } finally {
      setRolesLoading(false);
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
      loadRoles();
    });

    return () => {
      isMounted = false;
    };
  }, [loadAdminCatalogs, loadRoles, loadUsers]);

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
    setEditRole(null);
    setRoleFormError("");

    setRoleForm({
      name: "",
      code: "",
      description: "",
      isActive: true,
      color: "azul",
    });

    setDrawerOpen(true);
  };

  const openEditRoleDrawer = (role) => {
    setDrawerMode("editRole");
    setEditRole(role);
    setRoleFormError("");
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive,
      color: "azul",
    });

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
      setRoleFormError("");
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

  const handleSaveRole = async () => {
    const payload = {
      name: roleForm.name,
      code: roleForm.code,
      description: roleForm.description,
      isActive: roleForm.isActive,
    };

    if (!payload.name.trim()) {
      setRoleFormError("Ingresa el nombre del rol.");
      return;
    }

    try {
      setSavingRole(true);
      setRolesError("");
      setRoleFormError("");

      if (drawerMode === "editRole") {
        await updateRole(editRole?.id, payload);
      } else {
        await createRole(payload);
      }

      await loadRoles();
      await loadAdminCatalogs();
      closeDrawer();
    } catch (error) {
      console.error("Error guardando rol:", error);

      setRoleFormError(error.message || "No fue posible guardar el rol.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Deseas eliminar el rol "${role.name}"?`)) {
      return;
    }

    try {
      setSavingRole(true);
      setRolesError("");

      await deleteRole(role.id);
      await loadRoles();
      await loadAdminCatalogs();
    } catch (error) {
      console.error("Error eliminando rol:", error);

      setRolesError(error.message || "No fue posible eliminar el rol.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleSaveDrawer = async () => {
    if (drawerMode === "role" || drawerMode === "editRole") {
      await handleSaveRole();
      return;
    }

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

      await createEcommerceUser(payload);

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

  const roleRows = roles.map((role) => {
    const assignedUsers = users.filter((user) => user.role === role.name);

    return {
      ...role,
      assignedUsers,
      users: assignedUsers.length,
    };
  });

  const registeredRolesCount = roles.filter((role) => role.isActive).length;

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
        <AdminOverview
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openRoleDrawer={openRoleDrawer}
          openCreateDrawer={openCreateDrawer}
          metrics={metrics}
          tabs={TABS}
        />

        <AdminUsersTab
          activeTab={activeTab}
          usersError={usersError}
          loadUsers={loadUsers}
          selectedUsers={selectedUsers}
          search={search} setSearch={setSearch}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          filtered={filtered} users={users} usersLoading={usersLoading}
          toggleSelectAll={toggleSelectAll}
          toggleSelectUser={toggleSelectUser}
          openProfileDrawer={openProfileDrawer}
          openEditDrawer={openEditDrawer}
          setDeactivateModal={setDeactivateModal}
          setDeleteModal={setDeleteModal}
        />

        <AdminRolesTab
          activeTab={activeTab}
          rolesError={rolesError}
          rolesLoading={rolesLoading}
          roleRows={roleRows}
          openEditRoleDrawer={openEditRoleDrawer}
          handleDeleteRole={handleDeleteRole}
          savingRole={savingRole}
        />

        {activeTab === "actividad" && (
          <AdminActivityTab search={activitySearch} type={activityType} onSearchChange={setActivitySearch} onTypeChange={setActivityType} />
        )}

        {activeTab === "seguridad" && (
          <AdminSecurityTab security={security} onChange={(key, value) => setSecurity((current) => ({ ...current, [key]: value }))} />
        )}
      </div>

      <AdminDrawer
        drawerOpen={drawerOpen} closeDrawer={closeDrawer} drawerMode={drawerMode}
        form={form} setForm={setForm}
        adminCatalogsLoading={adminCatalogsLoading} adminCatalogsError={adminCatalogsError}
        availableRoles={availableRoles} availableDepartments={availableDepartments}
        availableCompanies={availableCompanies} toggleCompanyInForm={toggleCompanyInForm}
        roleForm={roleForm} setRoleForm={setRoleForm} roleFormError={roleFormError}
        editRole={editRole} rolePermissions={rolePermissions}
        setRolePermissions={setRolePermissions} togglePermission={togglePermission}
        savingUser={savingUser} saveUserError={saveUserError} savingRole={savingRole}
        handleSaveDrawer={handleSaveDrawer}
        profileUser={profileUser} openEditDrawer={openEditDrawer}
        PERMISSION_SECTIONS={PERMISSION_SECTIONS}
      />

      <AdminConfirmModals
        deleteModal={deleteModal} setDeleteModal={setDeleteModal}
        deactivateModal={deactivateModal} setDeactivateModal={setDeactivateModal}
      />
    </>
  );
}
