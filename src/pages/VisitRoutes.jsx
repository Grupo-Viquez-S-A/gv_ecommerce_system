import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiGroupFill,
  RiMapPinLine,
  RiRefreshLine,
  RiSearchLine,
} from "react-icons/ri";

import { useAuth } from "../context/AuthContext.js";
import { getBusinessClients } from "../services/clientService.js";
import VisitRoutesMap from "../components/routes/VisitRoutesMap.jsx";

const VISIT_ROUTE_STORAGE_PREFIX = "gv-ecommerce:visit-routes:v1";

function getStorageKey(userId) {
  return `${VISIT_ROUTE_STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function loadStoredRouteIds(storageKey) {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function buildBranchLabel(branch = {}, index = 0) {
  return (
    branch.name ||
    [branch.province, branch.district].filter(Boolean).join(", ") ||
    `Sucursal ${index + 1}`
  );
}

function hasValidCoordinates(branch = {}) {
  const latitude = Number(branch.latitude);
  const longitude = Number(branch.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export default function VisitRoutes() {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.id);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [routeQueueIds, setRouteQueueIds] = useState(() =>
    loadStoredRouteIds(storageKey),
  );

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(routeQueueIds),
    );
  }, [routeQueueIds, storageKey]);

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

  const branchCatalog = useMemo(() => {
    return clients
      .filter((client) => client.status !== "Inactivo")
      .flatMap((client) =>
        (client.branches || [])
          .filter(
            (branch) =>
              branch.status !== "Inactivo" && hasValidCoordinates(branch),
          )
          .map((branch, branchIndex) => ({
            id: branch.branchId || branch.branch_id || branch.id,
            businessId: client.businessId || client.business_id || client.id,
            clientId: client.businessId || client.business_id || client.id,
            clientName: client.name || "Cliente sin nombre",
            clientCompany: client.company || "Sin empresa",
            branchLabel: buildBranchLabel(branch, branchIndex),
            branchAddress: branch.address || "Direccion sin registrar",
            province: branch.province || "",
            district: branch.district || "",
            latitude: Number(branch.latitude),
            longitude: Number(branch.longitude),
          })),
      )
      .filter((branch) => branch.id);
  }, [clients]);

  const branchCatalogById = useMemo(
    () => new Map(branchCatalog.map((branch) => [branch.id, branch])),
    [branchCatalog],
  );

  const routeItems = useMemo(() => {
    return routeQueueIds
      .map((branchId) => branchCatalogById.get(branchId))
      .filter(Boolean);
  }, [routeQueueIds, branchCatalogById]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredBranches = useMemo(() => {
    return branchCatalog.filter((branch) => {
      const matchesClient =
        !selectedClientId || branch.clientId === selectedClientId;
      const searchableContent = [
        branch.clientName,
        branch.clientCompany,
        branch.branchLabel,
        branch.branchAddress,
        branch.province,
        branch.district,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedSearch || searchableContent.includes(normalizedSearch);

      return matchesClient && matchesSearch;
    });
  }, [branchCatalog, normalizedSearch, selectedClientId]);

  const availableClients = useMemo(() => {
    const uniqueClients = new Map();

    branchCatalog.forEach((branch) => {
      if (!uniqueClients.has(branch.clientId)) {
        uniqueClients.set(branch.clientId, {
          clientId: branch.clientId,
          clientName: branch.clientName,
          clientCompany: branch.clientCompany,
        });
      }
    });

    return Array.from(uniqueClients.values()).sort((first, second) =>
      first.clientName.localeCompare(second.clientName),
    );
  }, [branchCatalog]);

  const addBranchToQueue = (branchId) => {
    setRouteQueueIds((currentIds) =>
      currentIds.includes(branchId) ? currentIds : [...currentIds, branchId],
    );
  };

  const removeBranchFromQueue = (branchId) => {
    setRouteQueueIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== branchId),
    );
  };

  const moveQueueItem = (branchId, direction) => {
    setRouteQueueIds((currentIds) => {
      const currentIndex = currentIds.indexOf(branchId);

      if (currentIndex === -1) {
        return currentIds;
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= currentIds.length) {
        return currentIds;
      }

      const nextIds = [...currentIds];
      const [movedItem] = nextIds.splice(currentIndex, 1);
      nextIds.splice(targetIndex, 0, movedItem);
      return nextIds;
    });
  };

  const clearRouteQueue = () => {
    setRouteQueueIds([]);
  };

  const queuedBranchIds = useMemo(
    () => new Set(routeQueueIds),
    [routeQueueIds],
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
        <span>Comercial</span>
        <RiArrowRightSLine size={14} />
        <span>Clientes</span>
        <RiArrowRightSLine size={14} />
        <span className="text-gray-300">Rutas de visita</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rutas de visita</h1>
          <p className="mt-1 text-sm text-gray-400">
            Selecciona sucursales, ordénalas en una cola y visualiza la ruta sobre el mapa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadClients()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2a3550] bg-[#141d2e] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[#C9A227] hover:text-[#F4D56A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} size={16} />
          Actualizar sucursales
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#2a3550] bg-[#141d2e] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]/80">
            Sucursales geolocalizadas
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {branchCatalog.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2a3550] bg-[#141d2e] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]/80">
            Clientes disponibles
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {availableClients.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2a3550] bg-[#141d2e] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]/80">
            Cola actual
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {routeItems.length}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#2a3550] bg-[#141d2e] p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227]/15 text-[#C9A227]">
                <RiGroupFill size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">
                  Seleccion de sucursales
                </h2>
                <p className="text-sm text-gray-400">
                  Filtra clientes y agrega sucursales a la cola de visita.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="relative">
                <RiSearchLine
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por cliente, sucursal o direccion..."
                  className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#C9A227]"
                />
              </label>

              <select
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#C9A227]"
              >
                <option value="">Todos los clientes</option>
                {availableClients.map((client) => (
                  <option key={client.clientId} value={client.clientId}>
                    {client.clientName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2a3550] bg-[#141d2e]">
            <div className="border-b border-[#2a3550] px-4 py-3">
              <h3 className="text-sm font-semibold text-white">
                Sucursales disponibles
              </h3>
            </div>

            {loading ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                Cargando sucursales con coordenadas...
              </div>
            ) : filteredBranches.length > 0 ? (
              <div className="divide-y divide-[#2a3550]">
                {filteredBranches.map((branch) => {
                  const isQueued = queuedBranchIds.has(branch.id);

                  return (
                    <div
                      key={branch.id}
                      className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#C9A227]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8C65A]">
                            {branch.clientName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {branch.clientCompany}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-white">
                          {branch.branchLabel}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {branch.branchAddress}
                        </p>

                        <p className="mt-2 text-xs text-[#86A4CE]">
                          {branch.province}
                          {branch.province && branch.district ? " · " : ""}
                          {branch.district}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addBranchToQueue(branch.id)}
                        disabled={isQueued}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-2 text-sm font-semibold text-[#F1D36D] transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RiCheckboxCircleLine size={16} />
                        {isQueued ? "Agregada" : "Agregar a la cola"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                No se encontraron sucursales activas con coordenadas para este filtro.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-[#2a3550] bg-[#141d2e] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Cola de visita
                </h2>
                <p className="text-sm text-gray-400">
                  Reordena las sucursales para definir el recorrido.
                </p>
              </div>

              <button
                type="button"
                onClick={clearRouteQueue}
                disabled={routeItems.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RiDeleteBinLine size={15} />
                Vaciar cola
              </button>
            </div>

            {routeItems.length > 0 ? (
              <div className="space-y-3">
                {routeItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#2a3550] bg-[#1c2538] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A227] text-xs font-extrabold text-[#0B1120]">
                            {index + 1}
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {item.clientName}
                          </p>
                        </div>

                        <p className="mt-2 text-sm text-[#E5ECF7]">
                          {item.branchLabel}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {item.branchAddress}
                        </p>

                        <p className="mt-2 text-xs text-[#86A4CE]">
                          {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveQueueItem(item.id, "up")}
                          disabled={index === 0}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a3550] text-gray-300 transition-colors hover:border-[#C9A227] hover:text-[#F1D36D] disabled:cursor-not-allowed disabled:opacity-40"
                          title="Subir en la cola"
                        >
                          <RiArrowUpSLine size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveQueueItem(item.id, "down")}
                          disabled={index === routeItems.length - 1}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a3550] text-gray-300 transition-colors hover:border-[#C9A227] hover:text-[#F1D36D] disabled:cursor-not-allowed disabled:opacity-40"
                          title="Bajar en la cola"
                        >
                          <RiArrowDownSLine size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeBranchFromQueue(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/25 text-red-200 transition-colors hover:bg-red-500/10"
                          title="Quitar de la cola"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#2a3550] bg-[#1c2538]/60 px-4 py-10 text-center">
                <RiMapPinLine size={28} className="mx-auto text-gray-600" />
                <p className="mt-3 text-sm font-medium text-white">
                  La cola de visita esta vacia
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Agrega sucursales desde la lista para construir la ruta.
                </p>
              </div>
            )}
          </div>

          <VisitRoutesMap routeItems={routeItems} />
        </section>
      </div>
    </div>
  );
}
