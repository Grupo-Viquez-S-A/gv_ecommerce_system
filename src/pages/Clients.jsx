import { useCallback, useEffect, useMemo, useState } from "react";

import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiMoneyDollarCircleFill,
  RiUserFill,
} from "react-icons/ri";

import { AVATAR_COLORS } from "../data/mockClients.js";

import {
  createBusinessClient,
  getBusinessClients,
  updateBusinessClient,
  updateBusinessClientStatus,
} from "../services/clientService.js";

import { createEmptyClientForm } from "../components/clients/clientFormDefaults.js";

import ClientsPageHeader from "../components/clients/ClientsPageHeader.jsx";
import ClientMetrics from "../components/clients/ClientMetrics.jsx";
import ClientsToolbar from "../components/clients/ClientsToolBar.jsx";
import ClientsTable from "../components/clients/ClientsTable.jsx";
import ClientMobileList from "../components/clients/ClientMobileList.jsx";
import ClientsPagination from "../components/clients/ClientsPagination.jsx";
import ClientDrawer from "../components/clients/ClientDrawer.jsx";
import BranchesModal from "../components/clients/BranchesModal.jsx";
import RepresentativesModal from "../components/clients/RepresentativesModal.jsx";
import DeactivateClientModal from "../components/clients/DeactivateClientModal.jsx";

const ITEMS_PER_PAGE = 6;

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "CL";
}

function parseSalesMillions(sales) {
  const normalizedValue = String(sales || "")
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  return Number.parseFloat(normalizedValue) || 0;
}

function normalizeStatus(value) {
  return value === "Inactivo" ? "Inactivo" : "Activo";
}

function clonePhone(phone = {}, index = 0, prefix = "phone") {
  return {
    ...phone,
    draftId:
      phone.draftId ||
      phone.phone_id ||
      phone.id ||
      `${prefix}-${index}`,
    phone: phone.phone || "",
    type: phone.type || "General",
    isPrimary:
      phone.isPrimary === true || phone.is_primary === true,
  };
}

function cloneRepresentative(representative = {}, index = 0) {
  return {
    ...representative,
    draftId:
      representative.draftId ||
      representative.representative_id ||
      representative.id ||
      `representative-${index}`,
    name: representative.name || "",
    email: representative.email || "",
    status: normalizeStatus(
      representative.status ||
        (representative.is_active === false ? "Inactivo" : "Activo"),
    ),
  };
}

function cloneBranch(branch = {}, index = 0) {
  const sourcePhones = Array.isArray(branch.phones)
    ? branch.phones
    : branch.phone
      ? [
          {
            phone: branch.phone,
            type: "Oficina",
            isPrimary: true,
          },
        ]
      : [];

  return {
    ...branch,
    id: branch.id || branch.branch_id,
    branchId: branch.branchId || branch.branch_id || branch.id || null,
    draftId:
      branch.draftId ||
      branch.branch_id ||
      branch.id ||
      `branch-${index}`,
    province: branch.province || "",
    district: branch.district || "",
    address: branch.address || "",
    status: normalizeStatus(
      branch.status || (branch.is_active === false ? "Inactivo" : "Activo"),
    ),
    phones: sourcePhones.map((phone, phoneIndex) =>
      clonePhone(phone, phoneIndex, `branch-${index}-phone`),
    ),
    representatives: (branch.representatives || []).map(
      (representative, representativeIndex) =>
        cloneRepresentative(representative, representativeIndex),
    ),
  };
}

function cloneClient(client = {}, index = 0) {
  const sourceClientPhones = Array.isArray(client.clientPhones)
    ? client.clientPhones
    : client.phone
      ? [
          {
            phone: client.phone,
            type: "General",
            isPrimary: true,
          },
        ]
      : [];

  const clientName = client.name || client.business_name || "";

  return {
    ...client,
    id: client.id || client.business_id,
    businessId: client.businessId || client.business_id || client.id,
    name: clientName,
    initials: client.initials || getInitials(clientName),
    color:
      client.color ||
      AVATAR_COLORS[index % AVATAR_COLORS.length],
    companyId: client.companyId || client.company_id || "",
    company:
      client.company ||
      client.companyName ||
      "Sin empresa asignada",
    identificationType:
      client.identificationType || client.identification_type || "legal",
    legalId: client.legalId || client.legal_id || "",
    legalName: client.legalName || client.legal_name || "",
    ownerName: client.ownerName || client.owner_name || "",
    activityCode: client.activityCode || client.activity_code || "",
    email: client.email || "",
    status: normalizeStatus(
      client.status || (client.is_active === false ? "Inactivo" : "Activo"),
    ),
    sales: client.sales || "₡0 M",
    lastPurchase: client.lastPurchase || "Sin compras",
    totalOrders: client.totalOrders ?? 0,
    totalQuotes: client.totalQuotes ?? 0,
    clientPhones: sourceClientPhones.map((phone, phoneIndex) =>
      clonePhone(phone, phoneIndex, `client-${client.id || index}-phone`),
    ),
    branches: (client.branches || []).map((branch, branchIndex) =>
      cloneBranch(branch, branchIndex),
    ),
  };
}

function createEditableForm(client) {
  const safeClient = cloneClient(client);

  return {
    businessId: safeClient.businessId || safeClient.id || null,
    name: safeClient.name || "",
    identificationType: safeClient.identificationType || "legal",
    legalId: safeClient.legalId || "",
    legalName: safeClient.legalName || "",
    ownerName: safeClient.ownerName || "",
    activityCode: safeClient.activityCode || "",
    companyId: safeClient.companyId || "",
    email: safeClient.email || "",
    status: normalizeStatus(safeClient.status),
    clientPhones: (safeClient.clientPhones || []).map(
      (phone, index) => clonePhone(phone, index, "client-phone"),
    ),
    branches:
      safeClient.branches?.length > 0
        ? safeClient.branches.map((branch, index) =>
            cloneBranch(branch, index),
          )
        : createEmptyClientForm().branches,
  };
}

function cleanPhone(phone = {}) {
  return {
    ...phone,
    phone: phone.phone?.trim() || "",
    type: phone.type?.trim() || "General",
    isPrimary: phone.isPrimary === true,
  };
}

function cleanRepresentative(representative = {}) {
  return {
    ...representative,
    name: representative.name?.trim() || "",
    email: representative.email?.trim() || "",
    status: normalizeStatus(representative.status),
  };
}

function hasPhoneContent(phone = {}) {
  return Boolean(phone.phone?.trim());
}

function hasRepresentativeContent(representative = {}) {
  return Boolean(
    representative.name?.trim() ||
      representative.email?.trim(),
  );
}

function hasBranchContent(branch = {}) {
  return Boolean(
    branch.province?.trim() ||
      branch.district?.trim() ||
      branch.address?.trim() ||
      branch.phones?.some(hasPhoneContent) ||
      branch.representatives?.some(hasRepresentativeContent),
  );
}

function normalizeClientForm(form = {}) {
  const name = form.name?.trim() || "";
  const companyId = form.companyId || "";
  const identificationType =
    form.identificationType === "personal" ? "personal" : "legal";
  const legalId = form.legalId?.trim() || "";
  const legalName = form.legalName?.trim() || "";
  const ownerName = form.ownerName?.trim() || "";
  const activityCode = form.activityCode?.trim() || "";
  const email = form.email?.trim() || "";

  if (!name) {
    return {
      valid: false,
      message: "Ingresa el nombre comercial del cliente.",
    };
  }

  if (!companyId) {
    return {
      valid: false,
      message: "Selecciona la empresa del grupo a la que pertenece el cliente.",
    };
  }

  if (
    identificationType === "legal" &&
    !legalName
  ) {
    return {
      valid: false,
      message: "Ingresa la razón social del cliente jurídico.",
    };
  }

  if (identificationType === "personal" && !ownerName) {
    return {
      valid: false,
      message: "Ingresa el nombre y apellidos del dueño.",
    };
  }

  if (!legalId) {
    return {
      valid: false,
      message:
        identificationType === "legal"
          ? "Ingresa la cédula jurídica del cliente."
          : "Ingresa el número de identificación del dueño.",
    };
  }

  if (!activityCode) {
    return {
      valid: false,
      message: "Ingresa el código de actividad del cliente.",
    };
  }

  if (!email) {
    return {
      valid: false,
      message: "Ingresa el correo electrónico principal del cliente.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      valid: false,
      message: "Ingresa un correo electrónico principal válido.",
    };
  }

  const clientPhones = (form.clientPhones || [])
    .map(cleanPhone)
    .filter(hasPhoneContent);

  const branches = [];

  for (let index = 0; index < (form.branches || []).length; index += 1) {
    const originalBranch = form.branches[index];

    if (!hasBranchContent(originalBranch)) {
      continue;
    }

    const branch = {
      ...originalBranch,
      province: originalBranch.province?.trim() || "",
      district: originalBranch.district?.trim() || "",
      address: originalBranch.address?.trim() || "",
      status: normalizeStatus(originalBranch.status),
      phones: (originalBranch.phones || [])
        .map(cleanPhone)
        .filter(hasPhoneContent),
      representatives: (originalBranch.representatives || [])
        .map(cleanRepresentative)
        .filter(hasRepresentativeContent),
    };

    if (!branch.province || !branch.district || !branch.address) {
      return {
        valid: false,
        message: `Completa provincia, cantón y dirección de la sucursal ${
          index + 1
        }.`,
      };
    }

    const representativeWithoutName = branch.representatives.find(
      (representative) => !representative.name,
    );

    if (representativeWithoutName) {
      return {
        valid: false,
        message: `Completa el nombre de todos los representantes de la sucursal ${
          index + 1
        }.`,
      };
    }

    branches.push(branch);
  }

  return {
    valid: true,
    value: {
      businessId: form.businessId || null,
      name,
      identificationType,
      legalId,
      legalName:
        identificationType === "personal"
          ? ""
          : legalName,
      ownerName:
        identificationType === "personal"
          ? ownerName
          : "",
      activityCode,
      companyId,
      email,
      status: normalizeStatus(form.status),
      clientPhones,
      branches,
    },
  };
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [editClient, setEditClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [form, setForm] = useState(createEmptyClientForm);

  const [branchModal, setBranchModal] = useState(null);
  const [repModal, setRepModal] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      setClientsError("");

      const businessClients = await getBusinessClients();

      const normalizedClients = (businessClients || []).map(
        (client, index) => cloneClient(client, index),
      );

      setClients(normalizedClients);

      return normalizedClients;
    } catch (error) {
      console.error("Error cargando clientes:", error);

      setClients([]);
      setClientsError(
        error.message ||
          "No fue posible cargar los clientes registrados.",
      );

      return [];
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadClients();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        client.name?.toLowerCase().includes(normalizedSearch) ||
        client.email?.toLowerCase().includes(normalizedSearch) ||
        client.company?.toLowerCase().includes(normalizedSearch) ||
        client.legalId?.toLowerCase().includes(normalizedSearch) ||
        client.legalName?.toLowerCase().includes(normalizedSearch) ||
        client.activityCode?.toLowerCase().includes(normalizedSearch) ||
        client.clientPhones?.some((phone) =>
          phone.phone?.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        statusFilter === "Todos" || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / ITEMS_PER_PAGE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClients = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;

    return filteredClients.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredClients, safeCurrentPage]);

  const startItem =
    filteredClients.length > 0
      ? (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1
      : 0;

  const endItem =
    filteredClients.length > 0
      ? Math.min(
          safeCurrentPage * ITEMS_PER_PAGE,
          filteredClients.length,
        )
      : 0;

  const activeClientsCount = clients.filter(
    (client) => client.status === "Activo",
  ).length;

  const inactiveClientsCount = clients.filter(
    (client) => client.status === "Inactivo",
  ).length;

  const accumulatedSales = clients.reduce(
    (total, client) => total + parseSalesMillions(client.sales),
    0,
  );

  const metrics = [
    {
      label: "Clientes Totales",
      value: String(clients.length),
      icon: <RiUserFill size={20} />,
      color: "bg-[#C9A227]/15",
      iconColor: "text-[#C9A227]",
    },
    {
      label: "Activos",
      value: String(activeClientsCount),
      icon: <RiCheckboxCircleFill size={20} />,
      color: "bg-[#14301a]",
      iconColor: "text-[#4ade80]",
    },
    {
      label: "Inactivos",
      value: String(inactiveClientsCount),
      icon: <RiCloseCircleFill size={20} />,
      color: "bg-[#3b1a1a]",
      iconColor: "text-[#f87171]",
    },
    {
      label: "Ventas Acumuladas",
      value: `₡${accumulatedSales.toFixed(1)} M`,
      icon: <RiMoneyDollarCircleFill size={20} />,
      color: "bg-[#2d200a]",
      iconColor: "text-[#fbbf24]",
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setCurrentPage(1);
  };

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (nextStatusFilter) => {
    setStatusFilter(nextStatusFilter);
    setCurrentPage(1);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerMode("create");
    setEditClient(null);
    setViewClient(null);
    setForm(createEmptyClientForm());
  };

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditClient(null);
    setViewClient(null);
    setForm(createEmptyClientForm());
    setDrawerOpen(true);
  };

  const openEditDrawer = (client) => {
    const safeClient = cloneClient(client);

    setDrawerMode("edit");
    setEditClient(safeClient);
    setViewClient(null);
    setForm(createEditableForm(safeClient));
    setDrawerOpen(true);
  };

  const openClientDetails = (client) => {
    setBranchModal(cloneClient(client));
  };

  const handleSaveClient = async () => {
    const normalizedResult = normalizeClientForm(form);

    if (!normalizedResult.valid) {
      window.alert(normalizedResult.message);
      return;
    }

    try {
      setIsSaving(true);
      setClientsError("");

      if (drawerMode === "create") {
        await createBusinessClient(normalizedResult.value);
      }

      if (drawerMode === "edit" && editClient) {
        await updateBusinessClient(
          editClient.businessId || editClient.id,
          normalizedResult.value,
        );
      }

      await loadClients();

      setCurrentPage(1);
      closeDrawer();
    } catch (error) {
      console.error("Error guardando cliente:", error);

      const message =
        error.message ||
        "No fue posible guardar la información del cliente.";

      setClientsError(message);
      window.alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleClientStatus = async (client) => {
    if (!client) {
      return;
    }

    const nextStatus =
      client.status === "Activo" ? "Inactivo" : "Activo";

    try {
      setIsUpdatingStatus(true);
      setClientsError("");

      await updateBusinessClientStatus(
        client.businessId || client.id,
        nextStatus === "Activo",
      );

      const refreshedClients = await loadClients();

      const refreshedClient = refreshedClients.find(
        (currentClient) =>
          currentClient.id === client.id ||
          currentClient.businessId === client.businessId,
      );

      if (refreshedClient) {
        setViewClient(refreshedClient);
      }

      setDeactivateModal(null);
    } catch (error) {
      console.error("Error actualizando estado del cliente:", error);

      const message =
        error.message ||
        "No fue posible actualizar el estado del cliente.";

      setClientsError(message);
      window.alert(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <div className="p-4 lg:p-6">
        <ClientsPageHeader onCreateClient={openCreateDrawer} />

        <ClientMetrics metrics={metrics} />

        <ClientsToolbar
          search={search}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onOpenAdvancedFilters={() => {}}
        />

        {clientsLoading && (
          <div className="mb-4 rounded-xl border border-[#2a3550] bg-[#141d2e] px-4 py-3 text-sm text-gray-400">
            Cargando clientes registrados...
          </div>
        )}

        {clientsError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {clientsError}
          </div>
        )}

        {!clientsLoading && (
          <>
            <ClientsTable
              clients={paginatedClients}
              totalClients={filteredClients.length}
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              startItem={startItem}
              endItem={endItem}
              onPageChange={setCurrentPage}
              onClearFilters={clearFilters}
              onOpenBranches={setBranchModal}
              onOpenRepresentatives={setRepModal}
              onView={openClientDetails}
              onEdit={openEditDrawer}
              onDeactivate={setDeactivateModal}
              emptyTitle={
                clients.length === 0
                  ? "No hay clientes registrados"
                  : "No se encontraron clientes"
              }
              emptyDescription={
                clients.length === 0
                  ? "Cuando registres empresas cliente en la base de datos aparecerán aquí."
                  : "Prueba ajustando la búsqueda o los filtros aplicados."
              }
            />

            <ClientMobileList
              clients={paginatedClients}
              onClearFilters={clearFilters}
              onOpenBranches={setBranchModal}
              onOpenRepresentatives={setRepModal}
              onView={openClientDetails}
              onEdit={openEditDrawer}
              onDeactivate={setDeactivateModal}
              emptyTitle={
                clients.length === 0
                  ? "No hay clientes registrados"
                  : "No se encontraron clientes"
              }
              emptyDescription={
                clients.length === 0
                  ? "Cuando registres empresas cliente en la base de datos aparecerán aquí."
                  : "Prueba ajustando la búsqueda o los filtros aplicados."
              }
            />
          </>
        )}

        {filteredClients.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-xl border border-[#2a3550] bg-[#141d2e] md:hidden">
            <ClientsPagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredClients.length}
              startItem={startItem}
              endItem={endItem}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <ClientDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        form={form}
        client={drawerMode === "view" ? viewClient : editClient}
        onFormChange={setForm}
        onClose={closeDrawer}
        onSave={handleSaveClient}
        isSaving={isSaving}
      />

      <BranchesModal
        client={branchModal}
        onClose={() => setBranchModal(null)}
      />

      <RepresentativesModal
        client={repModal}
        onClose={() => setRepModal(null)}
      />

      <DeactivateClientModal
        client={deactivateModal}
        onClose={() => setDeactivateModal(null)}
        onConfirm={handleToggleClientStatus}
        isProcessing={isUpdatingStatus}
      />
    </>
  );
}
