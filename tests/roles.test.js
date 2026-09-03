import test from "node:test";
import assert from "node:assert/strict";

import {
  hasAgentsPanelAccess,
  hasClientDeletionAccess,
  hasPaymentApprovalAccess,
  hasQuotationAdjustmentAccess,
  hasSystemAccess,
  isBrandManager,
} from "../src/utils/roles.js";

test("permite eliminar clientes a presidente, gerente de marca y encargado", () => {
  assert.equal(
    hasClientDeletionAccess({ role: { code: "presidente" } }),
    true,
  );
  assert.equal(
    hasClientDeletionAccess({ role: { code: "brand_manager" } }),
    true,
  );
  assert.equal(
    hasClientDeletionAccess({ role: { name: "Gerente de marca" } }),
    true,
  );
  assert.equal(
    hasClientDeletionAccess({ role: { name: "Encargado" } }),
    true,
  );
});

test("no permite eliminar clientes a roles administrativos fuera de la lista", () => {
  assert.equal(
    hasSystemAccess({ role: { code: "admin" } }),
    true,
  );
  assert.equal(
    hasClientDeletionAccess({ role: { code: "admin" } }),
    false,
  );
});

test("permite editar clientes completos a gerente de marca, encargado y presidente", () => {
  assert.equal(
    hasSystemAccess({ role: { code: "brand_manager" } }),
    true,
  );
  assert.equal(
    hasSystemAccess({ role: { name: "Encargado" } }),
    true,
  );
  assert.equal(
    hasSystemAccess({ role: { code: "president" } }),
    true,
  );
});

test("solo contador y presidente pueden aprobar reportes de pago", () => {
  assert.equal(
    hasPaymentApprovalAccess({ role: { code: "ACCOUNTANT" } }),
    true,
  );
  assert.equal(
    hasPaymentApprovalAccess({ role: { name: "Contador" } }),
    true,
  );
  assert.equal(
    hasPaymentApprovalAccess({ role: { code: "PRESIDENT" } }),
    true,
  );
  assert.equal(
    hasPaymentApprovalAccess({ role: { code: "gerente" } }),
    false,
  );
  assert.equal(
    hasPaymentApprovalAccess({ role: { code: "sales_agent" } }),
    false,
  );
});

test("detecta el rol gerente de marca por código o nombre", () => {
  assert.equal(
    isBrandManager({ role: { code: "BRAND_MANAGER" } }),
    true,
  );
  assert.equal(
    isBrandManager({ role: { name: "Gerente de marca" } }),
    true,
  );
  assert.equal(
    isBrandManager({ role: { code: "sales_agent" } }),
    false,
  );
});

test("solo roles autorizados pueden ajustar descuentos de cotizaciones", () => {
  assert.equal(
    hasQuotationAdjustmentAccess({ role: { code: "BRAND_MANAGER" } }),
    true,
  );
  assert.equal(
    hasQuotationAdjustmentAccess({ role: { name: "Encargado" } }),
    true,
  );
  assert.equal(
    hasQuotationAdjustmentAccess({ role: { code: "PRESIDENT" } }),
    true,
  );
  assert.equal(
    hasQuotationAdjustmentAccess({ role: { code: "sales_agent" } }),
    false,
  );
});

test("solo roles autorizados pueden ver el panel de agentes", () => {
  assert.equal(
    hasAgentsPanelAccess({ role: { code: "BRAND_MANAGER" } }),
    true,
  );
  assert.equal(
    hasAgentsPanelAccess({ role: { name: "Encargado" } }),
    true,
  );
  assert.equal(
    hasAgentsPanelAccess({ role: { code: "PRESIDENT" } }),
    true,
  );
  assert.equal(
    hasAgentsPanelAccess({ role: { code: "ACCOUNTANT" } }),
    true,
  );
  assert.equal(
    hasAgentsPanelAccess({ role: { code: "sales_agent" } }),
    false,
  );
});
