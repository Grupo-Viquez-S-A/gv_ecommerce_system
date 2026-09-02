const HACIENDA_API_BASE_URL = "https://api.hacienda.go.cr/fe/ae";
const CACHE_STORAGE_KEY = "gv:hacienda-taxpayer-cache:v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const memoryCache = new Map();

function getText(value) {
  const normalizedValue = String(value || "").trim();

  return normalizedValue || "";
}

export function normalizeCostaRicaIdentification(value) {
  return getText(value).replace(/\D/g, "");
}

export function isValidCostaRicaIdentificationForHacienda(value) {
  const normalizedValue = normalizeCostaRicaIdentification(value);

  return normalizedValue.length >= 9 && normalizedValue.length <= 12;
}

function readStorageCache() {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  try {
    const cacheValue = JSON.parse(
      window.localStorage.getItem(CACHE_STORAGE_KEY) || "{}",
    );

    return cacheValue && typeof cacheValue === "object" ? cacheValue : {};
  } catch {
    return {};
  }
}

function writeStorageCache(cacheValue) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify(cacheValue),
    );
  } catch {
    // Ignore storage write errors.
  }
}

function getCachedValue(identification) {
  const now = Date.now();
  const memoryEntry = memoryCache.get(identification);

  if (memoryEntry && now - memoryEntry.cachedAt < CACHE_TTL_MS) {
    return memoryEntry.data;
  }

  const storageCache = readStorageCache();
  const storageEntry = storageCache[identification];

  if (
    storageEntry &&
    now - Number(storageEntry.cachedAt || 0) < CACHE_TTL_MS
  ) {
    memoryCache.set(identification, storageEntry);
    return storageEntry.data;
  }

  return null;
}

function setCachedValue(identification, data) {
  const entry = {
    cachedAt: Date.now(),
    data,
  };

  memoryCache.set(identification, entry);

  const storageCache = readStorageCache();
  storageCache[identification] = entry;
  writeStorageCache(storageCache);
}

function getPrimaryActivityCode(activities = []) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return "";
  }

  const firstActivity = activities[0] || {};

  return getText(
    firstActivity.codigo ||
      firstActivity.codigoActividad ||
      firstActivity.code,
  );
}

function normalizeTaxpayerPayload(identification, payload = {}) {
  const name = getText(payload.nombre);

  return {
    identification,
    name,
    legalName: name,
    ownerName: name,
    activityCode: getPrimaryActivityCode(payload.actividades),
    taxStatus: getText(payload?.situacion?.estado),
    regime: getText(payload?.regimen?.descripcion),
    identificationTypeCode: getText(payload.tipoIdentificacion),
    source: "hacienda",
    raw: payload,
  };
}

export async function lookupCostaRicaTaxpayerByIdentification(value) {
  const identification = normalizeCostaRicaIdentification(value);

  if (!isValidCostaRicaIdentificationForHacienda(identification)) {
    return null;
  }

  const cachedValue = getCachedValue(identification);

  if (cachedValue) {
    return cachedValue;
  }

  const response = await fetch(
    `${HACIENDA_API_BASE_URL}?identificacion=${encodeURIComponent(identification)}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (response.status === 429) {
    throw new Error(
      "Hacienda bloqueó temporalmente la consulta por límite de solicitudes. Inténtalo de nuevo en unos minutos.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `No fue posible consultar Hacienda (${response.status}).`,
    );
  }

  const payload = await response.json();
  const normalizedPayload = normalizeTaxpayerPayload(
    identification,
    payload,
  );

  setCachedValue(identification, normalizedPayload);

  return normalizedPayload;
}
