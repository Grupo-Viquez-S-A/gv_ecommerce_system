import test from "node:test";
import assert from "node:assert/strict";

import { isSalesAgentRole } from "../src/utils/roles.js";

test("solo autoasigna clientes a rutas cuando el creador es agente de ventas", () => {
  assert.equal(
    isSalesAgentRole({ role_code: "sales_agent" }),
    true,
  );
  assert.equal(
    isSalesAgentRole({ role_name: "Agente de ventas" }),
    true,
  );
  assert.equal(
    isSalesAgentRole({ role_code: "brand_manager" }),
    false,
  );
  assert.equal(
    isSalesAgentRole({ role_name: "Presidente" }),
    false,
  );
});
