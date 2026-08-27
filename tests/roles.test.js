import test from "node:test";
import assert from "node:assert/strict";

import {
  hasClientDeletionAccess,
  hasSystemAccess,
} from "../src/utils/roles.js";

test("permite eliminar clientes a presidente, gerente y encargado", () => {
  assert.equal(
    hasClientDeletionAccess({ role: { code: "presidente" } }),
    true,
  );
  assert.equal(
    hasClientDeletionAccess({ role: { code: "gerente" } }),
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
