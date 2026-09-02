import test from "node:test";
import assert from "node:assert/strict";

import {
  getVisitRouteDayFromDate,
  getVisitRouteDayLabel,
  normalizeVisitRouteDay,
  resolveCustomerVisitRouteDay,
} from "../src/utils/visitRouteDays.js";

test("asigna el día de ruta correcto según la fecha en Costa Rica", () => {
  assert.equal(
    getVisitRouteDayFromDate(new Date("2026-08-27T18:00:00.000Z")),
    "thursday",
  );
  assert.equal(
    getVisitRouteDayFromDate(new Date("2026-08-24T18:00:00.000Z")),
    "monday",
  );
});

test("reubica fines de semana a la ruta del lunes", () => {
  assert.equal(
    getVisitRouteDayFromDate(new Date("2026-08-29T18:00:00.000Z")),
    "monday",
  );
  assert.equal(
    getVisitRouteDayFromDate(new Date("2026-08-30T18:00:00.000Z")),
    "monday",
  );
});

test("normaliza y resuelve el día de ruta del cliente", () => {
  assert.equal(normalizeVisitRouteDay(" Thursday "), "thursday");
  assert.equal(getVisitRouteDayLabel("friday"), "Viernes");
  assert.equal(
    resolveCustomerVisitRouteDay({ visitRouteDay: "tuesday" }),
    "tuesday",
  );
  assert.equal(
    resolveCustomerVisitRouteDay({
      createdAt: "2026-08-28T15:30:00.000Z",
    }),
    "friday",
  );
});
