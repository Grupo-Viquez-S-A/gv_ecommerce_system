import test from "node:test";
import assert from "node:assert/strict";
import { resolveSelectedVariant } from "../src/utils/variantSelection.js";

const variants = [
  { variant_id: "nav-s", size_id: "S", color_id: "NAV", is_active: true },
  { variant_id: "neg-s", size_id: "S", color_id: "NEG", is_active: true },
  { variant_id: "nav-m", size_id: "M", color_id: "NAV", is_active: false },
];

test("resuelve el variant_id exacto que debe agregarse al carrito", () => {
  assert.equal(resolveSelectedVariant(variants, { variant_id: "neg-s" })?.variant_id, "neg-s");
});

test("resuelve una combinación exacta de talla y color", () => {
  assert.equal(resolveSelectedVariant(variants, { size_id: "S", color_id: "NAV" })?.variant_id, "nav-s");
});

test("no sustituye una combinación inexistente por la primera variante", () => {
  assert.equal(resolveSelectedVariant(variants, { size_id: "L", color_id: "NAV" }), null);
});

test("no devuelve variantes inactivas", () => {
  assert.equal(resolveSelectedVariant(variants, { variant_id: "nav-m" }), null);
});
