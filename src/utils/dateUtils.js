export const CR_TIME_ZONE = "America/Costa_Rica";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

function toDateObject(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getCRDateParts(value) {
  const date = toDateObject(value) || new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce((accumulator, part) => {
    accumulator[part.type] = part.value;
    return accumulator;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatDateCR(value, options) {
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(String(value || ""));

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...options,
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  const date = toDateObject(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: CR_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateShortCR(value) {
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(String(value || ""));

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Intl.DateTimeFormat("es-CR", {
      day: "numeric",
      month: "short",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  const date = toDateObject(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: CR_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatTimeCR(value) {
  const date = toDateObject(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: CR_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTimeCR(value) {
  const date = toDateObject(value);

  if (!date) return "";

  return `${formatDateCR(date)} ${formatTimeCR(date)}`;
}

export function getTodayCRDateString() {
  const { year, month, day } = getCRDateParts(new Date());

  return `${year}-${pad(month)}-${pad(day)}`;
}

export function addDaysCRDateString(days = 0, fromValue = new Date()) {
  const { year, month, day } = getCRDateParts(fromValue);
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));

  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + days);

  return `${utcMidnight.getUTCFullYear()}-${pad(utcMidnight.getUTCMonth() + 1)}-${pad(
    utcMidnight.getUTCDate(),
  )}`;
}

export function toDateInputValueCR(value) {
  if (!value) return "";

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(String(value));

  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  const { year, month, day } = getCRDateParts(value);

  return `${year}-${pad(month)}-${pad(day)}`;
}

export function isSameCRDate(valueA, valueB) {
  if (!valueA || !valueB) return false;

  return toDateInputValueCR(valueA) === toDateInputValueCR(valueB);
}

export function isTodayCR(value) {
  return isSameCRDate(value, new Date());
}

export function isYesterdayCR(value) {
  const yesterday = addDaysCRDateString(-1);

  return toDateInputValueCR(value) === yesterday;
}

export function formatRelativeDateTimeCR(value) {
  const date = toDateObject(value);

  if (!date) return "";

  const time = formatTimeCR(date);

  if (isTodayCR(date)) {
    return `Hoy, ${time}`;
  }

  if (isYesterdayCR(date)) {
    return `Ayer, ${time}`;
  }

  return formatDateShortCR(date);
}
