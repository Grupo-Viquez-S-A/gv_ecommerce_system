import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import CommercialTopBar from "../components/CommercialTopBar.jsx";

import AgentsFilters from "../components/agents/AgentsFilters.jsx";
import AgentDrawer from "../components/agents/AgentDrawer.jsx";
import AgentsMetrics from "../components/agents/AgentsMetrics.jsx";
import AgentsMobileList from "../components/agents/AgentsMobileList.jsx";
import AgentsPageHeader from "../components/agents/AgentsPageHeader.jsx";
import AgentsTable from "../components/agents/AgentsTable.jsx";
import ConfirmAgentModal from "../components/agents/ConfirmAgentModal.jsx";
import EmptyState from "../components/agents/EmptyState.jsx";
import Pagination from "../components/agents/Pagination.jsx";

import { MOCK_AGENTS } from "../data/mockAgents.js";

import {
  AGENT_COMPANIES,
  AGENT_DRAWER_MODES,
  createEmptyAgentForm,
} from "../constants/agents.constants.js";

import { filterAgents } from "../utils/agentUtils.js";

const DEFAULT_COMPANY = {
  name: "Grupo Víquez S.A.",
  color: "#C9A227",
};

function normalizeCompany(company) {
  if (typeof company === "string") {
    return {
      name: company,
      color: "#C9A227",
    };
  }

  if (company?.name) {
    return {
      color: "#C9A227",
      ...company,
    };
  }

  return DEFAULT_COMPANY;
}

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "AG";
}

function getAgentFormData(agent) {
  return {
    name: agent?.name || "",
    email: agent?.email || "",
    phone: agent?.phone || "",
    company: agent?.company || "",
    territory: agent?.territory || "",
    commission: agent?.commission || "",
    status: agent?.status || "Activo",
    notes: agent?.notes || "",
  };
}

export default function Agents() {
  const { user } = useAuth();

  const [agents, setAgents] = useState(() => [...MOCK_AGENTS]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [currentCompany, setCurrentCompany] = useState(() =>
    normalizeCompany(user?.activeCompany || user?.companies?.[0])
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [companyFilter, setCompanyFilter] = useState("Todas");

  const [drawer, setDrawer] = useState({
    isOpen: false,
    mode: AGENT_DRAWER_MODES.CREATE,
    agent: null,
  });

  const [form, setForm] = useState(createEmptyAgentForm);

  const [confirmation, setConfirmation] = useState({
    action: null,
    agent: null,
  });

  const filteredAgents = useMemo(() => {
    return filterAgents(agents, {
      search,
      statusFilter,
      companyFilter,
    });
  }, [agents, search, statusFilter, companyFilter]);

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed((isCollapsed) => !isCollapsed);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setCompanyFilter("Todas");
  };

  const openCreateDrawer = () => {
    setForm(createEmptyAgentForm());

    setDrawer({
      isOpen: true,
      mode: AGENT_DRAWER_MODES.CREATE,
      agent: null,
    });
  };

  const openEditDrawer = (agent) => {
    setForm(getAgentFormData(agent));

    setDrawer({
      isOpen: true,
      mode: AGENT_DRAWER_MODES.EDIT,
      agent,
    });
  };

  const openViewDrawer = (agent) => {
    setDrawer({
      isOpen: true,
      mode: AGENT_DRAWER_MODES.VIEW,
      agent,
    });
  };

  const closeDrawer = () => {
    setDrawer({
      isOpen: false,
      mode: AGENT_DRAWER_MODES.CREATE,
      agent: null,
    });

    setForm(createEmptyAgentForm());
  };

  const openConfirmation = (action, agent) => {
    setConfirmation({
      action,
      agent,
    });
  };

  const closeConfirmation = () => {
    setConfirmation({
      action: null,
      agent: null,
    });
  };

  const handleSaveAgent = (agentData) => {
    const isCreating =
      drawer.mode === AGENT_DRAWER_MODES.CREATE;

    const isEditing =
      drawer.mode === AGENT_DRAWER_MODES.EDIT &&
      drawer.agent;

    if (isCreating) {
      const newAgent = {
        id: Date.now(),
        initials: getInitials(agentData.name),
        color: "#C9A227",
        sales: "0.0 M",
        clientsCount: 0,
        totalQuotes: 0,
        totalOrders: 0,
        ...agentData,
      };

      setAgents((currentAgents) => [
        ...currentAgents,
        newAgent,
      ]);
    }

    if (isEditing) {
      setAgents((currentAgents) =>
        currentAgents.map((agent) =>
          agent.id === drawer.agent.id
            ? {
                ...agent,
                ...agentData,
                initials: getInitials(agentData.name),
              }
            : agent
        )
      );
    }

    closeDrawer();
  };

  const handleDeactivateAgent = (agentToDeactivate) => {
    setAgents((currentAgents) =>
      currentAgents.map((agent) =>
        agent.id === agentToDeactivate.id
          ? {
              ...agent,
              status: "Inactivo",
            }
          : agent
      )
    );

    closeConfirmation();
  };

  const handleDeleteAgent = (agentToDelete) => {
    setAgents((currentAgents) =>
      currentAgents.filter(
        (agent) => agent.id !== agentToDelete.id
      )
    );

    if (drawer.agent?.id === agentToDelete.id) {
      closeDrawer();
    }

    closeConfirmation();
  };

  const handleConfirmation = (selectedAgent) => {
    if (confirmation.action === "delete") {
      handleDeleteAgent(selectedAgent);
      return;
    }

    if (confirmation.action === "deactivate") {
      handleDeactivateAgent(selectedAgent);
    }
  };

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
        <CommercialTopBar
          currentCompany={currentCompany}
          companies={AGENT_COMPANIES}
          onCompanyChange={setCurrentCompany}
          onOpenSidebar={toggleSidebar}
          sectionLabel="Comercial"
          pageLabel="Agentes"
        />

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          <AgentsPageHeader
            onCreateAgent={openCreateDrawer}
          />

          <AgentsMetrics />

          <AgentsFilters
            search={search}
            statusFilter={statusFilter}
            companyFilter={companyFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onCompanyFilterChange={setCompanyFilter}
            onAdvancedFiltersClick={() => {}}
          />

          <AgentsTable
            agents={filteredAgents}
            totalAgents={agents.length}
            currentPage={1}
            totalPages={1}
            startItem={filteredAgents.length > 0 ? 1 : 0}
            endItem={filteredAgents.length}
            onPageChange={() => {}}
            onView={openViewDrawer}
            onEdit={openEditDrawer}
            onDeactivate={(agent) =>
              openConfirmation("deactivate", agent)
            }
            onDelete={(agent) =>
              openConfirmation("delete", agent)
            }
            onClearFilters={clearFilters}
          />

          <AgentsMobileList
            agents={filteredAgents}
            onView={openViewDrawer}
            onEdit={openEditDrawer}
            onDeactivate={(agent) =>
              openConfirmation("deactivate", agent)
            }
            onDelete={(agent) =>
              openConfirmation("delete", agent)
            }
          />
        </main>
      </div>

      <AgentDrawer
        isOpen={drawer.isOpen}
        mode={drawer.mode}
        agent={drawer.agent}
        form={form}
        onFormChange={setForm}
        onClose={closeDrawer}
        onSave={handleSaveAgent}
      />

      <ConfirmAgentModal
        action={confirmation.action}
        agent={confirmation.agent}
        onClose={closeConfirmation}
        onConfirm={handleConfirmation}
      />
    </div>
  );
}