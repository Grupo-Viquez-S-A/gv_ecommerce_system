import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiErrorWarningLine,
  RiLoader4Line,
  RiRefreshLine,
} from "react-icons/ri";

import AgentsFilters from "../components/agents/AgentsFilters.jsx";
import AgentDrawer from "../components/agents/AgentDrawer.jsx";
import AgentsMetrics from "../components/agents/AgentsMetrics.jsx";
import AgentsMobileList from "../components/agents/AgentsMobileList.jsx";
import AgentsPageHeader from "../components/agents/AgentsPageHeader.jsx";
import AgentsTable from "../components/agents/AgentsTable.jsx";

import { AGENT_DRAWER_MODES } from "../constants/agents.constants.js";

import { getSalesAgents } from "../services/agentService.js";
import { filterAgents } from "../utils/agentUtils.js";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [companyFilter, setCompanyFilter] = useState("Todas");

  const [drawer, setDrawer] = useState({
    isOpen: false,
    mode: AGENT_DRAWER_MODES.VIEW,
    agent: null,
  });

  const loadAgents = useCallback(async ({ showFullLoader = false } = {}) => {
    if (showFullLoader) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const salesAgents = await getSalesAgents();
      setAgents(salesAgents);
    } catch (loadError) {
      console.error("Sales agents loading error:", loadError);
      setAgents([]);
      setError(
        loadError?.message ||
          "No fue posible cargar los agentes de ventas desde Supabase.",
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        loadAgents({ showFullLoader: true });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadAgents]);

  const filteredAgents = useMemo(() => {
    return filterAgents(agents, {
      search,
      statusFilter,
      companyFilter,
    });
  }, [agents, search, statusFilter, companyFilter]);

  const companyOptions = useMemo(() => {
    const companies = agents
      .map((agent) => agent.company)
      .filter(Boolean)
      .sort((firstCompany, secondCompany) =>
        firstCompany.localeCompare(secondCompany),
      );

    return ["Todas", ...new Set(companies)];
  }, [agents]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setCompanyFilter("Todas");
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
      mode: AGENT_DRAWER_MODES.VIEW,
      agent: null,
    });
  };

  return (
    <>
      <div className="p-4 lg:p-6">
        <AgentsPageHeader />

        <AgentsMetrics agents={agents} />

        <AgentsFilters
          search={search}
          statusFilter={statusFilter}
          companyFilter={companyFilter}
          companyOptions={companyOptions}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onCompanyFilterChange={setCompanyFilter}
          onAdvancedFiltersClick={() => {}}
          onRefresh={() => loadAgents()}
          isRefreshing={isRefreshing}
        />

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#2a3550] bg-[#141d2e] py-14 text-sm text-gray-400">
            <RiLoader4Line className="animate-spin text-[#C9A227]" size={18} />
            Cargando agentes de ventas...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <RiErrorWarningLine
                  size={20}
                  className="mt-0.5 flex-shrink-0 text-red-300"
                />
                <div>
                  <p className="text-sm font-semibold text-red-100">
                    No se pudieron cargar los agentes
                  </p>
                  <p className="mt-1 text-sm text-red-200/80">{error}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadAgents({ showFullLoader: true })}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <RiRefreshLine size={15} />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <AgentsTable
              agents={filteredAgents}
              totalAgents={agents.length}
              currentPage={1}
              totalPages={1}
              startItem={filteredAgents.length > 0 ? 1 : 0}
              endItem={filteredAgents.length}
              onPageChange={() => {}}
              onView={openViewDrawer}
              onClearFilters={clearFilters}
            />

            <AgentsMobileList
              agents={filteredAgents}
              onView={openViewDrawer}
            />
          </>
        )}
      </div>

      <AgentDrawer
        isOpen={drawer.isOpen}
        mode={drawer.mode}
        agent={drawer.agent}
        onClose={closeDrawer}
      />
    </>
  );
}
