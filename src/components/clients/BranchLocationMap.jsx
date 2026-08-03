import { RiExternalLinkLine, RiMapPinFill } from "react-icons/ri";

function getCoordinates(latitude, longitude) {
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

function buildMapUrls(latitude, longitude) {
  const latitudeDelta = 0.0035;
  const longitudeDelta = 0.0045;
  const bbox = [
    longitude - longitudeDelta,
    latitude - latitudeDelta,
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ].join(",");

  return {
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox,
    )}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`,
    full: `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
      latitude,
    )}&mlon=${encodeURIComponent(longitude)}#map=17/${latitude}/${longitude}`,
  };
}

export default function BranchLocationMap({
  latitude,
  longitude,
  accuracy,
  compact = false,
}) {
  const coordinates = getCoordinates(latitude, longitude);

  if (!coordinates) {
    return null;
  }

  const urls = buildMapUrls(
    coordinates.latitude,
    coordinates.longitude,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a3550] bg-[#141d2e]">
      <iframe
        title={`Mapa de la sucursal en ${coordinates.latitude}, ${coordinates.longitude}`}
        src={urls.embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={`block w-full border-0 ${compact ? "h-32" : "h-44"}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2a3550] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
          <RiMapPinFill className="flex-shrink-0 text-[#C9A227]" />
          <span className="truncate font-mono">
            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </span>
          {Number.isFinite(Number(accuracy)) && (
            <span className="flex-shrink-0 text-gray-500">
              ±{Math.round(Number(accuracy))} m
            </span>
          )}
        </div>

        <a
          href={urls.full}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A227] transition-colors hover:text-[#E0C34A]"
        >
          Ver mapa
          <RiExternalLinkLine />
        </a>
      </div>
    </div>
  );
}
