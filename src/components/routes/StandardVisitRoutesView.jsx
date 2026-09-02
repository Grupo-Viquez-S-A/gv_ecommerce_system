import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  LoaderCircle,
  MapPinned,
  Navigation,
  RefreshCw,
  Route,
  Ruler,
  Store,
} from "lucide-react";

import { getBusinessClients } from "../../services/clientService.js";
import {
  confirmCustomerVisit,
  getCustomerVisitConfirmations,
  removeCustomerVisitConfirmation,
} from "../../services/customerVisitConfirmationService.js";
import { formatDateCR } from "../../utils/dateUtils.js";
import { hasSystemAccess, isSalesAgent } from "../../utils/roles.js";
import {
  VISIT_ROUTE_DAYS,
  getVisitRouteDateForCurrentWeek,
  getVisitRouteDayFromDate,
  getVisitRouteDayLabel,
  resolveCustomerVisitRouteDay,
} from "../../utils/visitRouteDays.js";
import VisitRoutesMap from "./VisitRoutesMap.jsx";

const ROUTE_SPEED_KMH = 35;
const STOP_BUFFER_MINUTES = 12;

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
  if (distanceKm <= 0) {
    return "0 km";
  }

  return `${distanceKm.toFixed(1)} km`;
}

function formatDuration(totalMinutes) {
  if (totalMinutes <= 0) {
    return "0 min";
  }

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

function buildGoogleDirectionsUrl(routeItems = []) {
  if (!routeItems.length) {
    return "";
  }

  const [firstStop, ...remainingStops] = routeItems;
  const destination = remainingStops[remainingStops.length - 1] || firstStop;
  const waypointStops =
    remainingStops.length > 1 ? remainingStops.slice(0, -1) : [];

  const origin = `${firstStop.latitude},${firstStop.longitude}`;
  const destinationPoint = `${destination.latitude},${destination.longitude}`;
  const baseUrl = "https://www.google.com/maps/dir/?api=1";
  const waypoints = waypointStops
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join("|");

  return `${baseUrl}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
    destinationPoint,
  )}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=driving`;
}

function getRouteStopStatusLabel(index, totalStops) {
  if (totalStops === 1) {
    return "Ruta única";
  }

  if (index === 0) {
    return "Inicio";
  }

  if (index === totalStops - 1) {
    return "Fin";
  }

  return null;
}

export default function StandardVisitRoutesView({ user }) {
  const mapSectionRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [visitConfirmations, setVisitConfirmations] = useState([]);
  const [visitConfirmationsLoading, setVisitConfirmationsLoading] = useState(false);
  const [visitActionIds, setVisitActionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(() =>
    getVisitRouteDayFromDate(new Date()),
  );

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const rows = await getBusinessClients();
      setClients(rows || []);
    } catch (loadError) {
      console.error("Visit routes loading error:", loadError);
      setClients([]);
      setError(
        loadError?.message ||
          "No fue posible cargar los clientes disponibles para las rutas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadClients();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadClients]);

  const visibleRoutedClients = useMemo(() => {
    return clients
      .filter((client) => client.status !== "Inactivo")
      .filter(hasValidCoordinates)
      .filter((client) => {
        if (hasSystemAccess(user)) {
          return true;
        }

        if (isSalesAgent(user)) {
          return (
            client.assignedSalesAgentUserId === user?.id ||
            client.assignedSalesAgentUserId === null
          );
        }

        return true;
      })
      .map((client) => ({
        id: client.businessId || client.business_id || client.id,
        clientName: client.name || "Cliente sin nombre",
        clientCompany: client.company || "Sin empresa asignada",
        province: client.province || client.branches?.[0]?.province || "",
        city: client.city || client.branches?.[0]?.city || "",
        district: client.district || client.branches?.[0]?.district || "",
        address: client.address || client.branches?.[0]?.address || "",
        latitude: Number(client.latitude ?? client.branches?.[0]?.latitude),
        longitude: Number(client.longitude ?? client.branches?.[0]?.longitude),
        visitRouteDay: resolveCustomerVisitRouteDay(client),
        assignedSalesAgentUserId: client.assignedSalesAgentUserId || null,
        createdAt: client.createdAt || client.created_at || null,
      }));
  }, [clients, user]);

  const routeStopsByDay = useMemo(() => {
    const baseCatalog = VISIT_ROUTE_DAYS.reduce((catalog, day) => {
      catalog[day.code] = [];
      return catalog;
    }, {});

    visibleRoutedClients.forEach((client) => {
      const routeDay = resolveCustomerVisitRouteDay(client);
      const currentDayStops = baseCatalog[routeDay];

      if (!currentDayStops) {
        return;
      }

      currentDayStops.push({
        ...client,
        locationLabel: formatStopLocation(client),
      });
    });

    VISIT_ROUTE_DAYS.forEach((day) => {
      baseCatalog[day.code].sort((firstClient, secondClient) => {
        const firstDate = new Date(firstClient.createdAt || 0).getTime();
        const secondDate = new Date(secondClient.createdAt || 0).getTime();

        if (firstDate !== secondDate) {
          return firstDate - secondDate;
        }

        return firstClient.clientName.localeCompare(secondClient.clientName);
      });
    });

    return baseCatalog;
  }, [visibleRoutedClients]);

  const selectedRouteItems = useMemo(
    () => routeStopsByDay[selectedDay] || [],
    [routeStopsByDay, selectedDay],
  );
  const selectedVisitDate = useMemo(
    () => getVisitRouteDateForCurrentWeek(selectedDay),
    [selectedDay],
  );
  const routeDistanceKm = useMemo(
    () => calculateRouteDistance(selectedRouteItems),
    [selectedRouteItems],
  );
  const routeEstimatedMinutes = useMemo(
    () => calculateEstimatedMinutes(routeDistanceKm, selectedRouteItems.length),
    [routeDistanceKm, selectedRouteItems.length],
  );
  const directionsUrl = useMemo(
    () => buildGoogleDirectionsUrl(selectedRouteItems),
    [selectedRouteItems],
  );

  const selectedDayLabel = getVisitRouteDayLabel(selectedDay);
  const selectedDayLabelLower = selectedDayLabel.toLowerCase();
  const totalGeolocatedClients = visibleRoutedClients.length;
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
  const visitedCount = useMemo(
    () =>
      selectedRouteItems.filter((item) =>
        visitConfirmationsByCustomerId.has(item.id),
      ).length,
    [selectedRouteItems, visitConfirmationsByCustomerId],
  );
  const pendingCount = Math.max(0, selectedRouteItems.length - visitedCount);

  const loadVisitConfirmations = useCallback(async () => {
    const customerIds = selectedRouteItems.map((item) => item.id).filter(Boolean);

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
      console.error("Visit confirmations loading error:", loadError);
      setVisitConfirmations([]);
      setError(
        loadError?.message ||
          "No fue posible cargar el estado de las visitas del día.",
      );
    } finally {
      setVisitConfirmationsLoading(false);
    }
  }, [selectedRouteItems, selectedVisitDate]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadVisitConfirmations();
    });
  }, [loadVisitConfirmations]);

  const handleScrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleToggleVisitConfirmation = async (item) => {
    if (!item?.id) {
      return;
    }

    const currentConfirmation = visitConfirmationsByCustomerId.get(item.id);

    try {
      setVisitActionIds((currentIds) => [...new Set([...currentIds, item.id])]);
      setError("");

      if (currentConfirmation) {
        await removeCustomerVisitConfirmation({
          customerId: item.id,
          visitDate: selectedVisitDate,
        });
      } else {
        await confirmCustomerVisit({
          customerId: item.id,
          salesAgentUserId: user?.id,
          visitDate: selectedVisitDate,
          visitRouteDay: selectedDay,
        });
      }

      await loadVisitConfirmations();
    } catch (actionError) {
      console.error("Visit confirmation action error:", actionError);
      setError(
        actionError?.message ||
          "No fue posible actualizar el estado de la visita.",
      );
    } finally {
      setVisitActionIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== item.id),
      );
    }
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
          <p className="mt-1.5 max-w-3xl text-[13px] text-[#9fb1cc]">
            Consulta las rutas de visita preestablecidas por día de la semana.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadClients()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#35547E] bg-[#102441]/80 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:border-[#D7A91D] hover:text-[#F4DA7B] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          Actualizar rutas
        </button>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7A91D]/12 text-[#E9BC2D]">
              <CalendarDays size={22} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A227]">
                Días programados
              </p>
              <p className="mt-1.5 text-[2.15rem] font-black leading-none text-white">5</p>
              <p className="mt-1 text-[13px] text-[#9fb1cc]">Lunes a Viernes</p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7A91D]/12 text-[#E9BC2D]">
              <MapPinned size={22} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A227]">
                Clientes geolocalizados
              </p>
              <p className="mt-1.5 text-[2.15rem] font-black leading-none text-white">
                {totalGeolocatedClients}
              </p>
              <p className="mt-1 text-[13px] text-[#9fb1cc]">
                En todas las rutas
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7A91D]/12 text-[#E9BC2D]">
              <Route size={22} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A227]">
                Ruta del día
              </p>
              <p className="mt-1.5 text-[2.15rem] font-black leading-none text-white">
                {selectedDayLabel}
              </p>
              <p className="mt-1 text-[13px] text-[#9fb1cc]">
                {formatDateCR(selectedVisitDate)}
              </p>
            </div>
          </div>
        </article>
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
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="space-y-3">
          <article className="overflow-hidden rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#24314d] px-4 py-3.5">
              <div>
                <h2 className="text-[1.8rem] font-black leading-tight text-white">
                  Paradas del {selectedDayLabelLower}
                </h2>
                <p className="mt-1 text-[12px] text-[#8ea3c3]">
                  Estado de visitas para el {formatDateCR(selectedVisitDate)}.
                </p>
              </div>

              <span className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-[11px] font-bold text-[#E9BC2D]">
                {selectedRouteItems.length} clientes
              </span>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-[#9fb1cc]">
                Cargando ruta preestablecida...
              </div>
            ) : selectedRouteItems.length > 0 ? (
              <>
                <div className="divide-y divide-[#24314d] px-3 py-1.5">
                  {selectedRouteItems.map((item, index) => {
                    const statusLabel = getRouteStopStatusLabel(
                      index,
                      selectedRouteItems.length,
                    );

                    return (
                      <article
                        key={item.id}
                        className="flex items-start gap-3 px-1.5 py-2.5"
                      >
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#3B82F6,#1D4ED8)] text-[13px] font-black text-white shadow-[0_10px_20px_rgba(29,78,216,0.35)]">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-bold leading-tight text-white">
                                {item.clientName}
                              </p>
                              <p className="truncate text-[13px] text-[#9fb1cc]">
                                {item.locationLabel || "Ubicación sin detalle"}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              {statusLabel && (
                                <span
                                  className={`flex-shrink-0 text-[13px] font-bold ${
                                    index === 0
                                      ? "text-[#4ADE80]"
                                      : index === selectedRouteItems.length - 1
                                        ? "text-[#F87171]"
                                        : "text-[#E9BC2D]"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              )}
                              {visitConfirmationsByCustomerId.has(item.id) ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                                  <CheckCircle2 size={12} />
                                  Visitado
                                </span>
                              ) : (
                                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-1 text-[13px] text-[#dbe6f7]">
                            {item.address || "Dirección sin registrar"}
                          </p>

                          <p className="mt-1.5 text-[11px] text-[#6f87ab]">
                            {item.clientCompany}
                          </p>

                          {item.assignedSalesAgentUserId === user?.id && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleToggleVisitConfirmation(item)}
                                disabled={visitActionIds.includes(item.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                  visitConfirmationsByCustomerId.has(item.id)
                                    ? "border border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/15"
                                    : "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                                }`}
                              >
                                {visitActionIds.includes(item.id) ? (
                                  <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                {visitConfirmationsByCustomerId.has(item.id)
                                  ? "Marcar como no visitado"
                                  : "Confirmar visita"}
                              </button>

                              {visitConfirmationsByCustomerId.has(item.id) && (
                                <span className="text-[11px] text-[#8ea3c3]">
                                  Confirmado por ti para esta fecha.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="border-t border-[#24314d] px-4 py-3">
                  {directionsUrl ? (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-2.5 text-[13px] font-bold text-[#E9BC2D] transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/15"
                    >
                      <Navigation size={16} />
                      Ver detalles de la ruta
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleScrollToMap}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#35547E] bg-[#102441]/80 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:border-[#D7A91D] hover:text-[#F4DA7B]"
                    >
                      <Navigation size={16} />
                      Ver mapa de la ruta
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <Store className="mx-auto text-[#3d4d6a]" size={30} />
                <p className="mt-3 text-[15px] font-bold text-white">
                  No hay clientes asignados para {selectedDayLabelLower}
                </p>
                <p className="mt-1.5 text-[13px] text-[#8ea3c3]">
                  Los nuevos clientes creados ese día se agregarán automáticamente a esta ruta.
                </p>
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
            <div className="grid grid-cols-2 divide-x divide-y divide-[#24314d]">
              <div className="p-4">
                <div className="flex items-center gap-2 text-[#E9BC2D]">
                  <Ruler size={18} />
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
                    Distancia total
                  </p>
                </div>
                <p className="mt-2 text-[1.8rem] font-black leading-none text-white">
                  {formatDistance(routeDistanceKm)}
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-[#E9BC2D]">
                  <Clock3 size={18} />
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
                    Tiempo estimado
                  </p>
                </div>
                <p className="mt-2 text-[1.8rem] font-black leading-none text-white">
                  {formatDuration(routeEstimatedMinutes)}
                </p>
              </div>

              <div className="col-span-2 p-4">
                <div className="flex items-center gap-2 text-[#E9BC2D]">
                  <CheckCircle2 size={18} />
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
                    Visitas confirmadas
                  </p>
                </div>
                <p className="mt-2 text-[1.8rem] font-black leading-none text-white">
                  {visitConfirmationsLoading ? "..." : `${visitedCount}/${selectedRouteItems.length}`}
                </p>
                <p className="mt-1 text-[12px] text-[#8ea3c3]">
                  {pendingCount} pendientes para {selectedDayLabelLower}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section ref={mapSectionRef} className="space-y-4">
          <VisitRoutesMap routeItems={selectedRouteItems} />
        </section>
      </div>

      <article className="mt-4 rounded-3xl border border-[#4b3f12] bg-[#1e1c14]/92 px-4 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#6b5712] bg-[#2a2617] text-[#E9BC2D]">
            <Info size={20} />
          </div>

          <div>
            <h3 className="text-[15px] font-black text-white">
              Información importante
            </h3>
            <p className="mt-1 text-[13px] text-[#d1c79d]">
              Las rutas de visita son predefinidas por el sistema. Cuando se crea un cliente nuevo, se asigna automáticamente al día correspondiente según la fecha de registro en Costa Rica.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
