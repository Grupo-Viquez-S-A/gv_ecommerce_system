import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER = {
  latitude: 9.7489,
  longitude: -83.7534,
};

const DEFAULT_ZOOM = 8;
const TILE_PROVIDERS = [
  {
    name: "Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap contributors, and the GIS User Community",
      maxZoom: 19,
      crossOrigin: true,
    },
  },
  {
    name: "CARTO",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 20,
      subdomains: "abcd",
      crossOrigin: true,
    },
  },
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function createTileLayer(provider) {
  return L.tileLayer(provider.url, provider.options);
}

function createNumberedIcon(number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: linear-gradient(180deg, #3b82f6, #1d4ed8);
        color: #ffffff;
        border: 3px solid rgba(219, 234, 254, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 800;
        box-shadow: 0 18px 35px rgba(29, 78, 216, 0.35);
      ">${number}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function buildGoogleMapsUrl(latitude, longitude, label) {
  const destination = `${latitude},${longitude}`;
  const query = encodeURIComponent(label || destination);

  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=&center=${encodeURIComponent(destination)}`;
}

function buildWazeUrl(latitude, longitude) {
  return `https://waze.com/ul?ll=${encodeURIComponent(`${latitude},${longitude}`)}&navigate=yes`;
}

function buildTravelPopupContent(item, index) {
  const googleMapsUrl = buildGoogleMapsUrl(
    item.latitude,
    item.longitude,
    `${item.clientName} ${item.locationLabel || ""}`.trim(),
  );
  const wazeUrl = buildWazeUrl(item.latitude, item.longitude);

  return `
    <div style="min-width: 220px; color: #0b1120;">
      <p style="margin: 0 0 6px; font-size: 14px; font-weight: 800;">
        ${index + 1}. ${item.clientName}
      </p>
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600;">
        ${item.locationLabel || "Ubicación del cliente"}
      </p>
      <p style="margin: 0 0 10px; font-size: 12px; color: #475569;">
        ${item.address || "Dirección sin registrar"}
      </p>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a
          href="${googleMapsUrl}"
          target="_blank"
          rel="noreferrer"
          style="display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 10px; background: #2563eb; color: white; text-decoration: none; font-size: 12px; font-weight: 700;"
        >
          Google Maps
        </a>
        <a
          href="${wazeUrl}"
          target="_blank"
          rel="noreferrer"
          style="display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 10px; background: #33ccff; color: #082f49; text-decoration: none; font-size: 12px; font-weight: 800;"
        >
          Waze
        </a>
      </div>
    </div>
  `;
}

export default function VisitRoutesMap({ routeItems = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLineRef = useRef(null);
  const tileLayerRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const [tileLoadError, setTileLoadError] = useState("");
  const [legendOpen, setLegendOpen] = useState(false);

  const safeRouteItems = useMemo(
    () =>
      routeItems
        .map((item) => ({
          ...item,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
        }))
        .filter(
          (item) =>
            Number.isFinite(item.latitude) &&
            Number.isFinite(item.longitude),
        ),
    [routeItems],
  );

  useEffect(
    () => () => {
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    const mountTileLayer = (providerIndex) => {
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      const provider = TILE_PROVIDERS[providerIndex];

      if (!provider) {
        setTileLoadError(
          "No fue posible cargar el mapa base en este momento.",
        );
        return;
      }

      if (tileLayerRef.current) {
        tileLayerRef.current.off();
        map.removeLayer(tileLayerRef.current);
      }

      const tileLayer = createTileLayer(provider);
      let layerLoaded = false;

      tileLayer.on("load", () => {
        layerLoaded = true;
        setTileLoadError("");
      });

      tileLayer.on("tileerror", () => {
        if (layerLoaded) {
          return;
        }

        fallbackTimeoutRef.current = window.setTimeout(() => {
          mountTileLayer(providerIndex + 1);
        }, 250);
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
    };

    mountTileLayer(0);
    map.setView(
      [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
      DEFAULT_ZOOM,
    );

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      if (tileLayerRef.current) {
        tileLayerRef.current.off();
      }

      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLineRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (safeRouteItems.length === 0) {
      map.setView(
        [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
        DEFAULT_ZOOM,
      );

      window.requestAnimationFrame(() => {
        map.invalidateSize();
      });

      return;
    }

    const bounds = [];

    safeRouteItems.forEach((item, index) => {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: createNumberedIcon(index + 1),
      });

      marker.bindTooltip(`${index + 1}. ${item.clientName}`, {
        direction: "top",
        offset: [0, -18],
      });
      marker.bindPopup(buildTravelPopupContent(item, index), {
        maxWidth: 260,
      });

      marker.addTo(markersLayer);
      bounds.push([item.latitude, item.longitude]);
    });

    if (safeRouteItems.length > 1) {
      routeLineRef.current = L.polyline(
        safeRouteItems.map((item) => [item.latitude, item.longitude]),
        {
          color: "#2563eb",
          weight: 5,
          opacity: 0.92,
        },
      ).addTo(map);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else {
      map.fitBounds(bounds, {
        padding: [34, 34],
      });
    }

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [safeRouteItems]);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[420px] w-full"
          aria-label="Mapa de la ruta de visita"
        />

        <button
          type="button"
          onClick={() => setLegendOpen((currentValue) => !currentValue)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-2xl border border-[#1d3358] bg-[#0e1830]/92 px-3.5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-colors hover:border-[#35547E]"
        >
          <Info size={16} />
          Ver leyenda
        </button>

        {legendOpen && (
          <div className="absolute bottom-18 right-3 w-[220px] rounded-2xl border border-[#223452] bg-[#0d172c]/96 p-3.5 text-[13px] text-[#d8e3f5] shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
            <p className="font-bold text-white">Leyenda de la ruta</p>
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-black text-white">
                  1
                </span>
                <span>Primera visita del recorrido</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation size={16} className="text-[#60a5fa]" />
                <span>Línea azul del trayecto estimado</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#24314d] px-4 py-2.5">
        {tileLoadError ? (
          <p className="text-[11px] text-amber-200">{tileLoadError}</p>
        ) : safeRouteItems.length > 0 ? (
          <p className="text-[11px] text-[#9fb1cc]">
            La ruta muestra los clientes asignados en el orden preestablecido del día.
          </p>
        ) : (
          <p className="text-[11px] text-[#9fb1cc]">
            Cuando existan clientes asignados para este día, el recorrido aparecerá aquí.
          </p>
        )}
      </div>
    </div>
  );
}
