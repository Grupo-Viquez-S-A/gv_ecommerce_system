import test from "node:test";
import assert from "node:assert/strict";
import { resolveSelectedVariant } from "../src/utils/variantSelection.js";

const variants = [
  { variant_id: "size-s", size_id: "S", is_active: true },
  { variant_id: "size-m", size_id: "M", is_active: false },
];

test("resuelve el variant_id exacto que debe agregarse al carrito", () => {
  assert.equal(resolveSelectedVariant(variants, { variant_id: "size-s" })?.variant_id, "size-s");
});

test("resuelve la variante exacta de una talla", () => {
  assert.equal(resolveSelectedVariant(variants, { size_id: "S" })?.variant_id, "size-s");
});

test("no sustituye una talla inexistente por la primera variante", () => {
  assert.equal(resolveSelectedVariant(variants, { size_id: "L" }), null);
});

test("no devuelve variantes inactivas", () => {
  assert.equal(resolveSelectedVariant(variants, { variant_id: "size-m" }), null);
});
