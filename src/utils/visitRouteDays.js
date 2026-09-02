import { addDaysCRDateString, CR_TIME_ZONE } from "./dateUtils.js";

export const VISIT_ROUTE_DAYS = [
  { code: "monday", label: "Lunes", shortLabel: "Lun" },
  { code: "tuesday", label: "Martes", shortLabel: "Mar" },
  { code: "wednesday", label: "Miércoles", shortLabel: "Mié" },
  { code: "thursday", label: "Jueves", shortLabel: "Jue" },
  { code: "friday", label: "Viernes", shortLabel: "Vie" },
];

const VISIT_ROUTE_DAY_BY_CODE = VISIT_ROUTE_DAYS.reduce(
  (catalog, day) => ({
    ...catalog,
    [day.code]: day,
  }),
  {},
);

const WEEKDAY_TO_VISIT_ROUTE_DAY = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "monday",
  sunday: "monday",
};

function toValidDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export function normalizeVisitRouteDay(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  return VISIT_ROUTE_DAY_BY_CODE[normalizedValue]?.code || null;
}

export function getVisitRouteDayFromDate(value = new Date()) {
  const date = toValidDate(value);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CR_TIME_ZONE,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();

  return WEEKDAY_TO_VISIT_ROUTE_DAY[weekday] || "monday";
}

export function getVisitRouteDayLabel(code) {
  const normalizedCode = normalizeVisitRouteDay(code);

  return VISIT_ROUTE_DAY_BY_CODE[normalizedCode]?.label || "Lunes";
}

export function getVisitRouteDayShortLabel(code) {
  const normalizedCode = normalizeVisitRouteDay(code);

  return VISIT_ROUTE_DAY_BY_CODE[normalizedCode]?.shortLabel || "Lun";
}

export function getVisitRouteDayIndex(code) {
  const normalizedCode = normalizeVisitRouteDay(code);

  return VISIT_ROUTE_DAYS.findIndex((day) => day.code === normalizedCode);
}

export function getVisitRouteDateForCurrentWeek(
  code,
  referenceDate = new Date(),
) {
  const targetIndex = getVisitRouteDayIndex(code);

  if (targetIndex < 0) {
    return addDaysCRDateString(0, referenceDate);
  }

  const referenceDayCode = getVisitRouteDayFromDate(referenceDate);
  const referenceDayIndex = getVisitRouteDayIndex(referenceDayCode);
  const safeReferenceIndex = referenceDayIndex < 0 ? 0 : referenceDayIndex;

  return addDaysCRDateString(targetIndex - safeReferenceIndex, referenceDate);
}

export function resolveCustomerVisitRouteDay(customer = {}) {
  return (
    normalizeVisitRouteDay(
      customer.visitRouteDay || customer.visit_route_day,
    ) ||
    getVisitRouteDayFromDate(customer.createdAt || customer.created_at || new Date())
  );
}
