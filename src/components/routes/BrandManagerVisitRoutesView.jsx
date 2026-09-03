import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  MapPinned,
  Route,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { getBusinessClients, saveCustomerRouteAssignments } from "../../services/clientService.js";
import { getSalesAgents } from "../../services/agentService.js";
import {
  getCustomerVisitConfirmations,
  VISIT_STOP_STATUSES,
} from "../../services/customerVisitConfirmationService.js";
import { formatDateCR } from "../../utils/dateUtils.js";
import {
  VISIT_ROUTE_DAYS,
  getVisitRouteDateForCurrentWeek,
  getVisitRouteDayFromDate,
  getVisitRouteDayLabel,
  resolveCustomerVisitRouteDay,
} from "../../utils/visitRouteDays.js";
import BrandManagerRoutesMap from "./BrandManagerRoutesMap.jsx";

const AGENT_ROUTE_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#ec4899",
  "#eab308",
  "#64748b",
];

const ROUTE_SPEED_KMH = 35;
const STOP_BUFFER_MINUTES = 12;
const UNASSIGNED_AGENT_ID = "__unassigned__";

function hasValidCoordinates(client = {}) {
  const latitude = Number(client.latitude ?? client.branches?.[0]?.latitude);
  const longitude = Number(client.longitude ?? client.branches?.[0]?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function formatStopLocation(client = {}) {
  return [client.district, client.city, client.province]
    .filter(Boolean)
    .join(", ");
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceBetweenPoints(firstPoint, secondPoint) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(secondPoint.latitude - firstPoint.latitude);
  const longitudeDelta = toRadians(secondPoint.longitude - firstPoint.longitude);
  const firstLatitude = toRadians(firstPoint.latitude);
  const secondLatitude = toRadians(secondPoint.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * arc;
}

function calculateRouteDistance(routeItems = []) {
  if (routeItems.length < 2) {
    return 0;
  }

  return routeItems.slice(1).reduce((totalDistance, currentStop, index) => {
    const previousStop = routeItems[index];

    return (
      totalDistance +
      calculateDistanceBetweenPoints(previousStop, currentStop)
    );
  }, 0);
}

function calculateEstimatedMinutes(distanceKm, stopsCount) {
  if (stopsCount <= 0) {
    return 0;
  }

  const driveMinutes = (distanceKm / ROUTE_SPEED_KMH) * 60;
  const stopMinutes = Math.max(0, stopsCount - 1) * STOP_BUFFER_MINUTES;

  return Math.max(20, Math.round(driveMinutes + stopMinutes));
}

function formatDistance(distanceKm) {
  return `${distanceKm.toFixed(1)} km`;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function getAgentStatus(clientsCount, visitedCount) {
  if (clientsCount <= 0) {
    return { label: "Pendiente", color: "text-[#94A3B8]" };
  }

  if (visitedCount >= clientsCount) {
    return { label: "Completada", color: "text-[#4ADE80]" };
  }

  if (visitedCount > 0) {
    return { label: "En progreso", color: "text-[#FBBF24]" };
  }

  return { label: "Sin visitar", color: "text-[#F87171]" };
}

function buildAgentInitials(name = "") {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "AG"
  );
}

function normalizeCustomer(client = {}) {
  return {
    id: client.businessId || client.business_id || client.id,
    clientName: client.name || "Cliente sin nombre",
    clientCompany: client.company || "Sin empresa asignada",
    province: client.province || client.branches?.[0]?.province || "",
    city: client.city || client.branches?.[0]?.city || "",
    district: client.district || client.branches?.[0]?.district || "",
    address: client.address || client.branches?.[0]?.address || "",
    latitude: Number(client.latitude ?? client.branches?.[0]?.latitude),
    longitude: Number(client.longitude ?? client.branches?.[0]?.longitude),
    createdAt: client.createdAt || client.created_at || null,
    visitRouteDay: resolveCustomerVisitRouteDay(client),
    assignedSalesAgentUserId: client.assignedSalesAgentUserId || null,
    locationLabel: formatStopLocation(client),
  };
}

function buildUnassignedAgent() {
  return {
    id: UNASSIGNED_AGENT_ID,
    userId: UNASSIGNED_AGENT_ID,
    name: "Sin asignar",
    initials: "SA",
    status: "Activo",
    color: "#64748b",
    role: "Pendiente",
  };
}

export default function BrandManagerVisitRoutesView() {
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [visitConfirmations, setVisitConfirmations] = useState([]);
  const [visitConfirmationsLoading, setVisitConfirmationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(() =>
    getVisitRouteDayFromDate(new Date()),
  );
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [sourceAgentId, setSourceAgentId] = useState("");
  const [targetAgentId, setTargetAgentId] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState({});
  const [actionsOpen, setActionsOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [loadedClients, loadedAgents] = await Promise.all([
        getBusinessClients(),
        getSalesAgents(),
      ]);

      setClients(loadedClients || []);
      setAgents(loadedAgents || []);
    } catch (loadError) {
      console.error("Brand manager routes loading error:", loadError);
      setClients([]);
      setAgents([]);
      setError(
        loadError?.message ||
          "No fue posible cargar las rutas de visita para gerencia de marca.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadData]);

  const customers = useMemo(
    () =>
      clients
        .filter((client) => client.status !== "Inactivo")
        .filter(hasValidCoordinates)
        .map(normalizeCustomer),
    [clients],
  );

  const brandManagerAgents = useMemo(() => {
    const activeAgents = (agents || []).filter(
      (agent) => agent.status !== "Inactivo",
    );

    return [...activeAgents, buildUnassignedAgent()].map((agent, index) => ({
      ...agent,
      color: AGENT_ROUTE_COLORS[index % AGENT_ROUTE_COLORS.length],
      initials: agent.initials || buildAgentInitials(agent.name),
    }));
  }, [agents]);

  const routedCustomersForDay = useMemo(
    () => customers.filter((customer) => customer.visitRouteDay === selectedDay),
    [customers, selectedDay],
  );
  const selectedVisitDate = useMemo(
    () => getVisitRouteDateForCurrentWeek(selectedDay),
    [selectedDay],
  );
  const visitConfirmationsByCustomerId = useMemo(
    () =>
      new Map(
        visitConfirmations.map((confirmation) => [
          confirmation.customerId,
          confirmation,
        ]),
      ),
    [visitConfirmations],
  );

  const customersByAgentId = useMemo(() => {
    return routedCustomersForDay.reduce((catalog, customer) => {
      const assignedAgentId =
        customer.assignedSalesAgentUserId || UNASSIGNED_AGENT_ID;

      if (!catalog[assignedAgentId]) {
        catalog[assignedAgentId] = [];
      }

      catalog[assignedAgentId].push(customer);

      return catalog;
    }, {});
  }, [routedCustomersForDay]);

  const filteredAgents = useMemo(() => {
    const normalizedSearch = agentSearch.trim().toLowerCase();

    return brandManagerAgents
      .map((agent) => {
        const routeItems = (customersByAgentId[agent.userId] || []).map((client) => ({
          ...client,
          visitConfirmation: visitConfirmationsByCustomerId.get(client.id) || null,
        }));
        const decoratedRouteItems = routeItems.map((item) => ({
          ...item,
          hasVisitRecord: Boolean(item.visitConfirmation),
          isVisited:
            item.visitConfirmation?.visitStatus ===
            VISIT_STOP_STATUSES.VISITED,
          isNotVisited:
            item.visitConfirmation?.visitStatus ===
            VISIT_STOP_STATUSES.NOT_VISITED,
        }));
        const routeDistanceKm = calculateRouteDistance(decoratedRouteItems);
        const visitedCount = decoratedRouteItems.filter((item) => item.isVisited).length;
        const notVisitedCount = decoratedRouteItems.filter((item) => item.isNotVisited).length;
        const recordedCount = decoratedRouteItems.filter((item) => item.hasVisitRecord).length;
        const status = getAgentStatus(decoratedRouteItems.length, recordedCount);

        return {
          ...agent,
          routeItems: decoratedRouteItems,
          routeDistanceKm,
          routeEstimatedMinutes: calculateEstimatedMinutes(
            routeDistanceKm,
            decoratedRouteItems.length,
          ),
          clientsCount: decoratedRouteItems.length,
          visitedCount,
          notVisitedCount,
          recordedCount,
          pendingCount: Math.max(0, decoratedRouteItems.length - recordedCount),
          routeStatus: status.label,
          routeStatusColor: status.color,
        };
      })
      .filter((agent) => {
        if (!normalizedSearch) {
          return true;
        }

        return agent.name.toLowerCase().includes(normalizedSearch);
      })
      .sort((firstAgent, secondAgent) => {
        if (secondAgent.clientsCount !== firstAgent.clientsCount) {
          return secondAgent.clientsCount - firstAgent.clientsCount;
        }

        return firstAgent.name.localeCompare(secondAgent.name);
      });
  }, [agentSearch, brandManagerAgents, customersByAgentId, visitConfirmationsByCustomerId]);

  const safeSelectedAgentId =
    filteredAgents.find((agent) => agent.userId === selectedAgentId)?.userId ||
    filteredAgents[0]?.userId ||
    "";

  const safeSourceAgentId =
    filteredAgents.find((agent) => agent.userId === sourceAgentId)?.userId ||
    filteredAgents[0]?.userId ||
    "";

  const targetAgentOptions = useMemo(
    () =>
      filteredAgents.filter(
        (agent) =>
          agent.userId !== safeSourceAgentId &&
          agent.userId !== UNASSIGNED_AGENT_ID,
      ),
    [filteredAgents, safeSourceAgentId],
  );

  const safeTargetAgentId =
    targetAgentOptions.find((agent) => agent.userId === targetAgentId)?.userId ||
    targetAgentOptions[0]?.userId ||
    "";

  const mapRouteGroups = useMemo(() => {
    const visibleAgents = filteredAgents.filter((agent) => agent.clientsCount > 0);

    return visibleAgents.map((agent) => ({
      agentId: agent.userId,
      agentName: agent.name,
      color: agent.color,
      routeItems: agent.routeItems,
    }));
  }, [filteredAgents]);

  const sourceClients = useMemo(() => {
    const normalizedSearch = clientSearch.trim().toLowerCase();

    return (customersByAgentId[safeSourceAgentId] || []).filter((client) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        client.clientName,
        client.clientCompany,
        client.locationLabel,
        client.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [clientSearch, customersByAgentId, safeSourceAgentId]);

  const selectedCustomers = useMemo(() => {
    const sourceCatalog = Object.values(customersByAgentId).flat();
    const sourceMap = new Map(sourceCatalog.map((customer) => [customer.id, customer]));

    return selectedCustomerIds
      .map((customerId) => sourceMap.get(customerId))
      .filter(Boolean);
  }, [customersByAgentId, selectedCustomerIds]);

  const pendingAssignmentsList = useMemo(
    () =>
      Object.entries(pendingAssignments).map(([customerId, targetAgentUserId]) => ({
        customerId,
        targetAgentUserId,
      })),
    [pendingAssignments],
  );

  const selectedDayLabel = getVisitRouteDayLabel(selectedDay);
  const selectedAgent = useMemo(
    () =>
      filteredAgents.find((agent) => agent.userId === safeSelectedAgentId) || null,
    [filteredAgents, safeSelectedAgentId],
  );
  const activeAgentsCount = brandManagerAgents.filter(
    (agent) => agent.userId !== UNASSIGNED_AGENT_ID,
  ).length;
  const totalAssignedClients = routedCustomersForDay.length;
  const totalVisitedClients = filteredAgents.reduce(
    (sum, agent) => sum + agent.visitedCount,
    0,
  );
  const totalRecordedStops = filteredAgents.reduce(
    (sum, agent) => sum + agent.recordedCount,
    0,
  );
  const totalNotVisitedClients = filteredAgents.reduce(
    (sum, agent) => sum + agent.notVisitedCount,
    0,
  );
  const routesProgrammedCount = filteredAgents.filter(
    (agent) => agent.clientsCount > 0 && agent.userId !== UNASSIGNED_AGENT_ID,
  ).length;
  const totalDistance = filteredAgents.reduce(
    (sum, agent) => sum + agent.routeDistanceKm,
    0,
  );
  const totalEstimatedMinutes = filteredAgents.reduce(
    (sum, agent) => sum + agent.routeEstimatedMinutes,
    0,
  );

  const loadVisitConfirmations = useCallback(async () => {
    const customerIds = routedCustomersForDay.map((customer) => customer.id).filter(Boolean);

    if (!customerIds.length) {
      setVisitConfirmations([]);
      return;
    }

    try {
      setVisitConfirmationsLoading(true);
      const rows = await getCustomerVisitConfirmations({
        customerIds,
        visitDate: selectedVisitDate,
      });
      setVisitConfirmations(rows || []);
    } catch (loadError) {
      console.error("Brand manager visit confirmations loading error:", loadError);
      setVisitConfirmations([]);
      setError(
        loadError?.message ||
          "No fue posible cargar el estado de visitas para gerencia de marca.",
      );
    } finally {
      setVisitConfirmationsLoading(false);
    }
  }, [routedCustomersForDay, selectedVisitDate]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadVisitConfirmations();
    });
  }, [loadVisitConfirmations]);

  const handleToggleCustomer = (customerId) => {
    setSelectedCustomerIds((currentIds) =>
      currentIds.includes(customerId)
        ? currentIds.filter((id) => id !== customerId)
        : [...currentIds, customerId],
    );
  };

  const handleQueueReassignment = () => {
    if (!selectedCustomerIds.length) {
      window.alert("Selecciona al menos un cliente para reasignar.");
      return;
    }

    if (!safeTargetAgentId || safeTargetAgentId === UNASSIGNED_AGENT_ID) {
      window.alert("Selecciona un agente destino válido.");
      return;
    }

    const targetAgent = brandManagerAgents.find(
      (agent) => agent.userId === safeTargetAgentId,
    );

    const nextPendingAssignments = { ...pendingAssignments };
    const nextClients = clients.map((client) => {
      const clientId = client.businessId || client.business_id || client.id;

      if (!selectedCustomerIds.includes(clientId)) {
        return client;
      }

      nextPendingAssignments[clientId] = safeTargetAgentId;

      return {
        ...client,
        assignedSalesAgentUserId: safeTargetAgentId,
        assigned_sales_agent_user_id: safeTargetAgentId,
      };
    });

    setPendingAssignments(nextPendingAssignments);
    setClients(nextClients);
    setSelectedCustomerIds([]);
    setClientSearch("");

    if (targetAgent) {
      setSelectedAgentId(targetAgent.userId);
    }
  };

  const handleDiscardPendingChanges = () => {
    setPendingAssignments({});
    setSelectedCustomerIds([]);
    setClientSearch("");
    setActionsOpen(false);
    void loadData();
  };

  const handleSavePendingChanges = async () => {
    if (!pendingAssignmentsList.length) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await saveCustomerRouteAssignments(pendingAssignmentsList);
      setPendingAssignments({});
      setSelectedCustomerIds([]);
      await loadData();
      window.alert("Las reasignaciones de rutas se guardaron correctamente.");
    } catch (saveError) {
      console.error("Route reassignment save error:", saveError);
      setError(
        saveError?.message ||
          "No fue posible guardar las reasignaciones de rutas.",
      );
      window.alert(
        saveError?.message ||
          "No fue posible guardar las reasignaciones de rutas.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOptimizeRoutes = () => {
    const agentWithLargestLoad = [...filteredAgents]
      .filter((agent) => agent.clientsCount > 0)
      .sort((firstAgent, secondAgent) => {
        if (secondAgent.routeDistanceKm !== firstAgent.routeDistanceKm) {
          return secondAgent.routeDistanceKm - firstAgent.routeDistanceKm;
        }

        return secondAgent.clientsCount - firstAgent.clientsCount;
      })[0];

    if (!agentWithLargestLoad) {
      return;
    }

    setSelectedAgentId(agentWithLargestLoad.userId);
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,#182744_0%,#0b1324_48%,#09101d_100%)] p-4 lg:p-5">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[#7f8ea8]">
        <span>Comercial</span>
        <ChevronRight size={14} />
        <span>Clientes</span>
        <ChevronRight size={14} />
        <span className="text-[#d7e3f7]">Rutas de visita</span>
      </div>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[2rem] font-black tracking-tight text-white lg:text-[2.35rem]">
            Rutas de visita
          </h1>
          <p className="mt-1.5 max-w-4xl text-[13px] text-[#9fb1cc]">
            Supervise las rutas de todos los agentes, visualice su carga de trabajo y reasigne clientes entre agentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOptimizeRoutes}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#35547E] bg-[#102441]/80 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:border-[#D7A91D] hover:text-[#F4DA7B]"
          >
            <Route size={16} />
            Optimizar rutas
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#35547E] bg-[#102441]/80 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:border-[#D7A91D] hover:text-[#F4DA7B]"
            >
              Acciones
              <ChevronDown size={16} />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-48 rounded-2xl border border-[#2a3550] bg-[#141d2e] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    void loadData();
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] text-white transition-colors hover:bg-[#1c2740]"
                >
                  Actualizar datos
                </button>
                <button
                  type="button"
                  onClick={handleDiscardPendingChanges}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] text-white transition-colors hover:bg-[#1c2740]"
                >
                  Descartar cambios
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleSavePendingChanges()}
            disabled={saving || pendingAssignmentsList.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-[13px] font-bold text-[#0b1324] transition-colors hover:bg-[#ddb63f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
            Guardar cambios
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-4">
        {[
          {
            icon: <Users size={22} />,
            label: "Agentes activos",
            value: activeAgentsCount,
            description: `de ${activeAgentsCount} agentes`,
          },
          {
            icon: <Users size={22} />,
            label: "Clientes asignados",
            value: totalAssignedClients,
            description: `${selectedDayLabel.toLowerCase()}`,
          },
          {
            icon: <MapPinned size={22} />,
            label: "Rutas programadas",
            value: routesProgrammedCount,
            description: "para este día",
          },
          {
            icon: <CheckCircle2 size={22} />,
            label: "Visitas confirmadas",
            value: visitConfirmationsLoading ? "..." : totalVisitedClients,
            description: `${totalNotVisitedClients} no visitados, ${Math.max(0, totalAssignedClients - totalRecordedStops)} pendientes`,
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7A91D]/12 text-[#E9BC2D]">
                {item.icon}
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A227]">
                  {item.label}
                </p>
                <p className="mt-1.5 text-[2rem] font-black leading-none text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-[13px] text-[#9fb1cc]">
                  {item.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mb-4 overflow-x-auto rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <div className="flex min-w-[720px]">
          {VISIT_ROUTE_DAYS.map((day) => {
            const isActive = selectedDay === day.code;

            return (
              <button
                key={day.code}
                type="button"
                onClick={() => setSelectedDay(day.code)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2.5 border-r border-[#23314d] px-4 py-3 text-[13px] font-bold transition-colors last:border-r-0 ${
                  isActive
                    ? "bg-[linear-gradient(90deg,rgba(201,162,39,0.48),rgba(201,162,39,0.18))] text-white"
                    : "text-[#dbe6f7] hover:bg-[#18243a]"
                }`}
              >
                <CalendarDays size={16} />
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 px-4 py-12 text-center text-[13px] text-[#9fb1cc]">
          Cargando panel de rutas por agente...
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black text-white">Agentes y rutas</h2>
              </div>
              <span className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-2.5 py-1 text-[11px] font-bold text-[#E9BC2D]">
                {filteredAgents.length} agentes
              </span>
            </div>

            <div className="relative mb-3">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8ea8]" />
              <input
                type="text"
                value={agentSearch}
                onChange={(event) => setAgentSearch(event.target.value)}
                placeholder="Buscar agente..."
                className="w-full rounded-xl border border-[#2a3550] bg-[#111a2d] px-10 py-2.5 text-[13px] text-white placeholder-[#6f87ab] focus:border-[#C9A227] focus:outline-none"
              />
            </div>

            <div className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
              {filteredAgents.map((agent) => {
                const isSelected = agent.userId === safeSelectedAgentId;

                return (
                  <button
                    key={agent.userId}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.userId)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-[#C9A227] bg-[#2a2413]"
                        : "border-[#2a3550] bg-[#161f33] hover:border-[#35547E]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[14px] font-bold text-white">
                            {agent.name}
                          </p>
                          <span className={`text-[12px] font-semibold ${agent.routeStatusColor}`}>
                            {agent.routeStatus}
                          </span>
                        </div>

                        <p className="mt-1 text-[12px] text-[#9fb1cc]">
                          {agent.clientsCount} clientes
                          {" • "}
                          {agent.recordedCount} registrados
                        </p>
                      </div>

                      <ChevronRight size={16} className="text-[#7f8ea8]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
              <div className="mb-3 flex flex-wrap items-center gap-4">
                {filteredAgents
                  .filter((agent) => agent.clientsCount > 0)
                  .map((agent) => (
                    <div key={agent.userId} className="flex items-center gap-2 text-[12px] text-[#dbe6f7]">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span>{agent.name}</span>
                    </div>
                  ))}
              </div>

              <BrandManagerRoutesMap
                routeGroups={mapRouteGroups}
                highlightedAgentId={safeSelectedAgentId}
              />

              <div className="mt-3 grid gap-3 border-t border-[#24314d] pt-3 md:grid-cols-3">
                <div className="flex items-center gap-2 text-[13px] text-white">
                  <CheckCircle2 size={16} className="text-[#4ADE80]" />
                  <div>
                    <p className="font-bold">
                      {visitConfirmationsLoading ? "..." : `${totalVisitedClients}/${totalAssignedClients}`}
                    </p>
                    <p className="text-[11px] text-[#9fb1cc]">
                      Visitas confirmadas al {formatDateCR(selectedVisitDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[13px] text-white">
                  <Route size={16} className="text-[#C9A227]" />
                  <div>
                    <p className="font-bold">{formatDistance(totalDistance)}</p>
                    <p className="text-[11px] text-[#9fb1cc]">Distancia total</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[13px] text-white">
                  <CalendarDays size={16} className="text-[#C9A227]" />
                  <div>
                    <p className="font-bold">{formatDuration(totalEstimatedMinutes)}</p>
                    <p className="text-[11px] text-[#9fb1cc]">Tiempo estimado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-black text-white">
                    Seguimiento de visitas
                  </h3>
                  <p className="mt-1 text-[13px] text-[#9fb1cc]">
                    {selectedAgent
                      ? `${selectedAgent.name} • ${formatDateCR(selectedVisitDate)}`
                      : `Estado del ${formatDateCR(selectedVisitDate)}`}
                  </p>
                </div>

                {selectedAgent && (
                  <span className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-[11px] font-bold text-[#E9BC2D]">
                    {selectedAgent.recordedCount}/{selectedAgent.clientsCount} registrados
                  </span>
                )}
              </div>

              <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {selectedAgent?.routeItems?.length ? (
                  selectedAgent.routeItems.map((client, index) => (
                    <article
                      key={client.id}
                      className="rounded-2xl border border-[#24314d] bg-[#161f33] px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white">
                            {index + 1}. {client.clientName}
                          </p>
                          <p className="mt-1 truncate text-[12px] text-[#9fb1cc]">
                            {client.locationLabel || "Ubicación sin detalle"}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-[#6f87ab]">
                            {client.clientCompany}
                          </p>
                        </div>

                        {client.isVisited ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                            <CheckCircle2 size={12} />
                            Visitado
                          </span>
                        ) : client.isNotVisited ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-100">
                            <XCircle size={12} />
                            No visitado
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
                            Pendiente
                          </span>
                        )}
                      </div>

                      <div className="mt-3 rounded-xl border border-[#2a3550] bg-[#101a2d] px-3 py-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7f8ea8]">
                          Nota del agente
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[#dbe6f7]">
                          {client.visitConfirmation?.note ||
                            "Sin nota registrada todavía."}
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#2a3550] px-3 py-8 text-center text-[12px] text-[#8ea3c3]">
                    Selecciona un agente con clientes asignados para revisar el estado de sus visitas.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
            <div>
              <h2 className="text-[18px] font-black text-white">
                Reasignación de clientes
              </h2>
              <p className="mt-1 text-[13px] text-[#9fb1cc]">
                Seleccione clientes para reasignar entre agentes.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A227]">
                  Origen
                </label>
                <select
                  value={safeSourceAgentId}
                  onChange={(event) => {
                    setSourceAgentId(event.target.value);
                    setSelectedCustomerIds([]);
                  }}
                  className="w-full rounded-xl border border-[#2a3550] bg-[#111a2d] px-3 py-2.5 text-[13px] text-white focus:border-[#C9A227] focus:outline-none"
                >
                  {filteredAgents.map((agent) => (
                    <option key={agent.userId} value={agent.userId}>
                      {agent.name} ({agent.clientsCount} clientes)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A227]">
                  Destino
                </label>
                <select
                  value={safeTargetAgentId}
                  onChange={(event) => setTargetAgentId(event.target.value)}
                  className="w-full rounded-xl border border-[#2a3550] bg-[#111a2d] px-3 py-2.5 text-[13px] text-white focus:border-[#C9A227] focus:outline-none"
                >
                  {targetAgentOptions.map((agent) => (
                      <option key={agent.userId} value={agent.userId}>
                        {agent.name} ({agent.clientsCount} clientes)
                      </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-white">
                  Clientes disponibles
                </p>
                <span className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-2.5 py-1 text-[11px] font-bold text-[#E9BC2D]">
                  {sourceClients.length}
                </span>
              </div>

              <div className="relative mb-3">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8ea8]" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full rounded-xl border border-[#2a3550] bg-[#111a2d] px-10 py-2.5 text-[13px] text-white placeholder-[#6f87ab] focus:border-[#C9A227] focus:outline-none"
                />
              </div>

              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {sourceClients.map((client) => {
                  const isChecked = selectedCustomerIds.includes(client.id);

                  return (
                    <label
                      key={client.id}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#2a3550] bg-[#161f33] px-3 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCustomer(client.id)}
                        className="mt-1 accent-[#C9A227]"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-white">
                          {client.clientName}
                        </p>
                        <p className="truncate text-[12px] text-[#9fb1cc]">
                          {client.locationLabel || "Ubicación sin detalle"}
                        </p>
                        <p className="truncate text-[11px] text-[#6f87ab]">
                          {formatDistance(calculateRouteDistance([client]))}
                        </p>
                      </div>
                    </label>
                  );
                })}

                {sourceClients.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#2a3550] px-3 py-6 text-center text-[12px] text-[#8ea3c3]">
                    No hay clientes disponibles para este origen y día.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#2a3550] bg-[#111a2d] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[13px] font-bold text-white">Clientes seleccionados</p>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerIds([])}
                  className="text-[12px] font-semibold text-[#E9BC2D] transition-colors hover:text-[#f4da7b]"
                >
                  Limpiar todo
                </button>
              </div>

              <div className="space-y-2">
                {selectedCustomers.length > 0 ? (
                  selectedCustomers.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[#2a3550] bg-[#161f33] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {client.clientName}
                        </p>
                        <p className="truncate text-[11px] text-[#9fb1cc]">
                          {client.locationLabel}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCustomer(client.id)}
                        className="text-[12px] font-semibold text-[#fca5a5] transition-colors hover:text-[#fecaca]"
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-[#8ea3c3]">
                    Todavía no has seleccionado clientes para mover.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleQueueReassignment}
              disabled={selectedCustomerIds.length === 0 || !safeTargetAgentId}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-3 text-[13px] font-bold text-[#0b1324] transition-colors hover:bg-[#ddb63f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Re-asignar clientes ({selectedCustomerIds.length})
            </button>
          </section>
        </div>
      )}

      <article className="mt-4 rounded-3xl border border-[#4b3f12] bg-[#1e1c14]/92 px-4 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
        <p className="text-[13px] text-[#d1c79d]">
          Los cambios de reasignación se aplicarán al guardar. La ruta del cliente conserva el día seleccionado y solo cambia el agente responsable.
        </p>
      </article>
    </div>
  );
}
