import { useEffect, useMemo, useState } from "react";

import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiMoneyDollarCircleFill,
  RiUserFill,
} from "react-icons/ri";

import { AVATAR_COLORS } from "../data/mockClients.js";
import { getBusinessClients } from "../services/clientService.js";

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

const createEmptyBranch = () => ({
  name: "",
  phone: "",
  address: "",
  representatives: [],
});

const createEmptyForm = () => ({
  name: "",
  legalId: "",
  legalName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  status: "Activo",
  notes: "",
  branches: [createEmptyBranch()],
});

const cloneClient = (client) => ({
  ...client,
  branches: (client.branches || []).map((branch) => ({
    ...branch,
    representatives: (branch.representatives || []).map(
      (representative) => ({
        ...representative,
      }),
    ),
  })),
});

const getInitials = (name = "") => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "CL";
};

const parseSalesMillions = (sales) => {
  const normalizedValue = String(sales || "")
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  return Number.parseFloat(normalizedValue) || 0;
};

export default function Clients() {
  const [clients, setClients] = useState(() =>
    [],
  );
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [editClient, setEditClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [form, setForm] = useState(createEmptyForm);

  const [branchModal, setBranchModal] = useState(null);
  const [repModal, setRepModal] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        client.name?.toLowerCase().includes(normalizedSearch) ||
        client.email?.toLowerCase().includes(normalizedSearch) ||
        client.company?.toLowerCase().includes(normalizedSearch) ||
        client.phone?.toLowerCase().includes(normalizedSearch) ||
        client.legalId?.toLowerCase().includes(normalizedSearch) ||
        client.legalName?.toLowerCase().includes(normalizedSearch);

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

  useEffect(() => {
    let mounted = true;

    async function loadClients() {
      try {
        setClientsLoading(true);
        setClientsError("");

        const businessClients = await getBusinessClients();

        if (!mounted) {
          return;
        }

        setClients(
          businessClients.map((client) => cloneClient(client)),
        );
      } catch (error) {
        console.error("Error cargando clientes:", error);

        if (!mounted) {
          return;
        }

        setClients([]);
        setClientsError(
          error.message ||
            "No fue posible cargar los clientes registrados.",
        );
      } finally {
        if (mounted) {
          setClientsLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      mounted = false;
    };
  }, []);

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
    setForm(createEmptyForm());
  };

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditClient(null);
    setViewClient(null);
    setForm(createEmptyForm());
    setDrawerOpen(true);
  };

  const openEditDrawer = (client) => {
    const safeBranches =
      client.branches?.length > 0
        ? client.branches.map((branch) => ({
            ...branch,
            representatives: (branch.representatives || []).map(
              (representative) => ({
                ...representative,
              }),
            ),
          }))
        : [createEmptyBranch()];

    setDrawerMode("edit");
    setEditClient(client);
    setViewClient(null);

    setForm({
      name: client.name || "",
      legalId: client.legalId || "",
      legalName: client.legalName || "",
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      address: client.address || "",
      status: client.status || "Activo",
      notes: client.notes || "",
      branches: safeBranches,
    });

    setDrawerOpen(true);
  };

  const openViewDrawer = (client) => {
    setDrawerMode("view");
    setViewClient(client);
    setEditClient(null);
    setDrawerOpen(true);
  };

  const handleSaveClient = () => {
    const clientName = form.name.trim();
    const companyName = form.company.trim();

    if (!clientName) {
      window.alert("Ingresa el nombre del cliente antes de guardar.");
      return;
    }

    if (!companyName) {
      window.alert("Selecciona la empresa del grupo antes de guardar.");
      return;
    }

    setIsSaving(true);

    const cleanedBranches =
      form.branches?.length > 0
        ? form.branches.map((branch) => ({
            ...branch,
            name: branch.name?.trim() || "",
            phone: branch.phone?.trim() || "",
            address: branch.address?.trim() || "",
            representatives: (branch.representatives || []).map(
              (representative) => ({
                ...representative,
                name: representative.name?.trim() || "",
                role: representative.role?.trim() || "",
                phone: representative.phone?.trim() || "",
                email: representative.email?.trim() || "",
                status:
                  representative.status === "Inactivo"
                    ? "Inactivo"
                    : "Activo",
              }),
            ),
          }))
        : [createEmptyBranch()];

    const normalizedForm = {
      name: clientName,
      legalId: form.legalId?.trim() || "",
      legalName: form.legalName?.trim() || "",
      email: form.email?.trim() || "",
      phone: form.phone?.trim() || "",
      company: companyName,
      address: form.address?.trim() || "",
      status: form.status === "Inactivo" ? "Inactivo" : "Activo",
      notes: form.notes?.trim() || "",
      branches: cleanedBranches,
    };

    if (drawerMode === "create") {
      const newClient = {
        id: Date.now(),
        initials: getInitials(normalizedForm.name),
        color: AVATAR_COLORS[clients.length % AVATAR_COLORS.length],
        sales: "₡0",
        lastPurchase: "Sin compras",
        totalOrders: 0,
        totalQuotes: 0,
        ...normalizedForm,
      };

      setClients((previousClients) => [
        newClient,
        ...previousClients,
      ]);
    }

    if (drawerMode === "edit" && editClient) {
      setClients((previousClients) =>
        previousClients.map((client) => {
          if (client.id !== editClient.id) {
            return client;
          }

          return {
            ...client,
            ...normalizedForm,
            initials: getInitials(normalizedForm.name),
          };
        }),
      );

      setViewClient((previousClient) => {
        if (!previousClient || previousClient.id !== editClient.id) {
          return previousClient;
        }

        return {
          ...previousClient,
          ...normalizedForm,
          initials: getInitials(normalizedForm.name),
        };
      });
    }

    setCurrentPage(1);
    setIsSaving(false);
    closeDrawer();
  };

  const handleToggleClientStatus = (client) => {
    if (!client) {
      return;
    }

    setIsUpdatingStatus(true);

    const nextStatus =
      client.status === "Activo" ? "Inactivo" : "Activo";

    setClients((previousClients) =>
      previousClients.map((currentClient) =>
        currentClient.id === client.id
          ? {
              ...currentClient,
              status: nextStatus,
            }
          : currentClient,
      ),
    );

    setViewClient((previousClient) => {
      if (!previousClient || previousClient.id !== client.id) {
        return previousClient;
      }

      return {
        ...previousClient,
        status: nextStatus,
      };
    });

    setDeactivateModal(null);
    setIsUpdatingStatus(false);
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
              onView={openViewDrawer}
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
              onView={openViewDrawer}
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
          <div className="md:hidden mb-6 bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
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
