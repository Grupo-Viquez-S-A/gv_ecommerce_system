import { useEffect, useMemo, useRef, useState } from "react";
import { Info, MapPin, Route } from "lucide-react";
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
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution:
        "&copy; OpenStreetMap contributors",
      maxZoom: 19,
      crossOrigin: true,
    },
  },
  {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 20,
      subdomains: "abcd",
      crossOrigin: true,
    },
  },
  {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap contributors, and the GIS User Community",
      maxZoom: 19,
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

function createNumberedIcon(color, number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: ${color};
        color: #ffffff;
        border: 3px solid rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.35);
      ">${number}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function createPopupContent(route, stop, index) {
  return `
    <div style="min-width: 200px; color: #0b1120;">
      <p style="margin: 0 0 4px; font-size: 14px; font-weight: 800;">
        ${index + 1}. ${stop.clientName}
      </p>
      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: ${route.color};">
        ${route.agentName}
      </p>
      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600;">
        ${stop.locationLabel || "Ubicación del cliente"}
      </p>
      <p style="margin: 0; font-size: 12px; color: #475569;">
        ${stop.address || "Dirección sin registrar"}
      </p>
    </div>
  `;
}

export default function BrandManagerRoutesMap({
  routeGroups = [],
  highlightedAgentId = "",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);
  const tileLayerRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [tileLoadError, setTileLoadError] = useState("");

  const safeRouteGroups = useMemo(
    () =>
      routeGroups
        .map((routeGroup) => ({
          ...routeGroup,
          routeItems: (routeGroup.routeItems || [])
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
        }))
        .filter((routeGroup) => routeGroup.routeItems.length > 0),
    [routeGroups],
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
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    const mountTileLayer = (providerIndex) => {
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      const provider = TILE_PROVIDERS[providerIndex];

      if (!provider) {
        setTileLoadError("No fue posible cargar el mapa base en este momento.");
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
      tileLayerRef.current = null;
      layersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    layersRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });
    layersRef.current = [];

    if (!safeRouteGroups.length) {
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

    safeRouteGroups.forEach((routeGroup) => {
      const isHighlighted =
        highlightedAgentId &&
        routeGroup.agentId === highlightedAgentId;

      const polyline = L.polyline(
        routeGroup.routeItems.map((item) => [item.latitude, item.longitude]),
        {
          color: routeGroup.color,
          weight: isHighlighted ? 5 : 3.5,
          opacity: isHighlighted ? 0.98 : 0.82,
        },
      ).addTo(map);

      layersRef.current.push(polyline);

      routeGroup.routeItems.forEach((item, index) => {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: createNumberedIcon(routeGroup.color, index + 1),
        });

        marker.bindTooltip(`${routeGroup.agentName}: ${item.clientName}`, {
          direction: "top",
          offset: [0, -16],
        });
        marker.bindPopup(createPopupContent(routeGroup, item, index), {
          maxWidth: 240,
        });
        marker.addTo(map);
        layersRef.current.push(marker);
        bounds.push([item.latitude, item.longitude]);
      });
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.fitBounds(bounds, { padding: [26, 26] });
    }

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [highlightedAgentId, safeRouteGroups]);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#2a3550] bg-[#141d2e]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[438px] w-full"
          aria-label="Mapa consolidado de rutas"
        />

        <button
          type="button"
          onClick={() => setLegendOpen((value) => !value)}
          className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl border border-[#1d3358] bg-[#0e1830]/92 px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-colors hover:border-[#35547E]"
        >
          <Info size={15} />
          Ver leyenda
        </button>

        {legendOpen && (
          <div className="absolute left-3 top-3 max-w-[320px] rounded-2xl border border-[#223452] bg-[#0d172c]/96 p-3.5 text-[12px] text-[#d8e3f5] shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
            <p className="font-bold text-white">Leyenda</p>
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#60a5fa]" />
                <span>Cada color corresponde a la ruta de un agente.</span>
              </div>
              <div className="flex items-center gap-2">
                <Route size={14} className="text-[#60a5fa]" />
                <span>Las líneas muestran el recorrido asignado por día.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#24314d] px-4 py-2.5">
        {tileLoadError ? (
          <p className="text-[11px] text-amber-200">{tileLoadError}</p>
        ) : (
          <p className="text-[11px] text-[#9fb1cc]">
            El mapa consolida las rutas visibles del día seleccionado para todos los agentes de ventas.
          </p>
        )}
      </div>
    </div>
  );
}
