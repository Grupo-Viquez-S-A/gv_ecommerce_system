import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiExternalLinkLine,
  RiMapPinFill,
  RiMapPinLine,
} from "react-icons/ri";
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
const FOCUSED_ZOOM = 16;
const TILE_PROVIDERS = [
  {
    name: "Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), OpenStreetMap contributors, and the GIS User Community",
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
  {
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution: "&copy; Colaboradores de OpenStreetMap",
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

function getCoordinates(latitude, longitude) {
  if (
    latitude === "" ||
    latitude === null ||
    latitude === undefined ||
    longitude === "" ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  };
}

function buildMapUrl(latitude, longitude) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
    latitude,
  )}&mlon=${encodeURIComponent(longitude)}#map=17/${encodeURIComponent(
    latitude,
  )}/${encodeURIComponent(longitude)}`;
}

function createMapMarker(map, editable) {
  const marker = L.marker([DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude], {
    draggable: editable,
  }).addTo(map);

  if (marker.dragging) {
    if (editable) {
      marker.dragging.enable();
    } else {
      marker.dragging.disable();
    }
  }

  return marker;
}

function createTileLayer(provider) {
  return L.tileLayer(provider.url, provider.options);
}

export default function BranchLocationMap({
  latitude,
  longitude,
  accuracy,
  compact = false,
  editable = false,
  onChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const tileProviderIndexRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const coordinatesRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const coordinates = useMemo(
    () => getCoordinates(latitude, longitude),
    [latitude, longitude],
  );
  const [tileLoadError, setTileLoadError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  const emitCoordinatesChange = useCallback((nextLatitude, nextLongitude) => {
    if (typeof onChangeRef.current !== "function") {
      return;
    }

    onChangeRef.current({
      latitude: nextLatitude.toFixed(7),
      longitude: nextLongitude.toFixed(7),
      locationAccuracy: 0,
    });
  }, []);

  const handleMarkerDragEnd = useCallback(
    (event) => {
      const markerCoordinates = event.target.getLatLng();

      emitCoordinatesChange(markerCoordinates.lat, markerCoordinates.lng);
    },
    [emitCoordinatesChange],
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
      scrollWheelZoom: editable,
    });

    const initialCoordinates = coordinatesRef.current;
    const initialCenter = initialCoordinates || DEFAULT_CENTER;

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
        setTileLoadError(
          "No fue posible cargar el mapa base. Puedes abrir la ubicacion con el enlace de abajo.",
        );
        return;
      }

      tileProviderIndexRef.current = providerIndex;

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
      [initialCenter.latitude, initialCenter.longitude],
      initialCoordinates ? FOCUSED_ZOOM : DEFAULT_ZOOM,
    );

    if (initialCoordinates) {
      markerRef.current = createMapMarker(map, editable);
      markerRef.current.setLatLng([
        initialCoordinates.latitude,
        initialCoordinates.longitude,
      ]);
      markerRef.current.on("dragend", handleMarkerDragEnd);
    }

    const ensureMarker = () => {
      if (!markerRef.current) {
        markerRef.current = createMapMarker(map, editable);
        markerRef.current.on("dragend", handleMarkerDragEnd);
      }

      if (markerRef.current.dragging) {
        if (editable) {
          markerRef.current.dragging.enable();
        } else {
          markerRef.current.dragging.disable();
        }
      }

      return markerRef.current;
    };

    const handleMapClick = (event) => {
      if (!editable) {
        return;
      }

      const marker = ensureMarker();

      marker.setLatLng(event.latlng);
      emitCoordinatesChange(event.latlng.lat, event.latlng.lng);
    };

    if (editable) {
      map.on("click", handleMapClick);
    }

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      if (markerRef.current) {
        markerRef.current.off("dragend", handleMarkerDragEnd);
      }

      if (tileLayerRef.current) {
        tileLayerRef.current.off();
      }

      map.off("click", handleMapClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
      tileProviderIndexRef.current = 0;
    };
  }, [editable, emitCoordinatesChange, handleMarkerDragEnd]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (coordinates) {
      if (!markerRef.current) {
        markerRef.current = createMapMarker(map, editable);
        markerRef.current.on("dragend", handleMarkerDragEnd);
      }

      markerRef.current.setLatLng([
        coordinates.latitude,
        coordinates.longitude,
      ]);

      if (markerRef.current.dragging) {
        if (editable) {
          markerRef.current.dragging.enable();
        } else {
          markerRef.current.dragging.disable();
        }
      }

      map.setView(
        [coordinates.latitude, coordinates.longitude],
        Math.max(map.getZoom(), FOCUSED_ZOOM),
      );
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      map.setView(
        [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
        DEFAULT_ZOOM,
      );
    }

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [coordinates, editable, handleMarkerDragEnd]);

  const mapHeightClass = compact ? "h-32" : "h-64";
  const mapUrl = buildMapUrl(
    coordinates?.latitude ?? DEFAULT_CENTER.latitude,
    coordinates?.longitude ?? DEFAULT_CENTER.longitude,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a3550] bg-[#141d2e]">
      <div
        ref={mapContainerRef}
        className={`w-full ${mapHeightClass}`}
        aria-label={
          editable
            ? "Mapa interactivo para ubicar el cliente"
            : "Mapa de la ubicacion del cliente"
        }
      />

      {tileLoadError && (
        <div className="border-t border-[#2a3550] bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {tileLoadError}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-[#2a3550] px-3 py-2.5">
        {editable && (
          <div className="flex items-center gap-2 text-xs text-[#9fb4d6]">
            <RiMapPinLine className="flex-shrink-0 text-[#C9A227]" />
            <span>
              Haz clic en el mapa o arrastra el pin para fijar la ubicacion exacta.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
            <RiMapPinFill className="flex-shrink-0 text-[#C9A227]" />

            {coordinates ? (
              <>
                <span className="truncate font-mono">
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </span>

                {Number.isFinite(Number(accuracy)) && (
                  <span className="flex-shrink-0 text-gray-500">
                    +-{Math.round(Number(accuracy))} m
                  </span>
                )}
              </>
            ) : (
              <span className="truncate">
                Aun no se han definido coordenadas para este cliente.
              </span>
            )}
          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A227] transition-colors hover:text-[#E0C34A]"
          >
            Ver mapa
            <RiExternalLinkLine />
          </a>
        </div>
      </div>
    </div>
  );
}
