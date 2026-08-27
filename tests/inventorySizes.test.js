import test from "node:test";
import assert from "node:assert/strict";
import {
  getCartItemNameWithSize,
  getInventorySizeLabel,
} from "../src/utils/inventorySizes.js";

test("mapea tallas base a etiquetas generales", () => {
  assert.equal(getInventorySizeLabel("S"), "Pequeño (P)");
  assert.equal(getInventorySizeLabel("M"), "Mediano (M)");
  assert.equal(getInventorySizeLabel("L"), "Grande (G)");
});

test("arma el nombre del carrito con la etiqueta general", () => {
  assert.equal(
    getCartItemNameWithSize("Woody", "S"),
    "Woody - Pequeño (P)",
  );
});

test("omite talla única en el nombre del carrito", () => {
  assert.equal(getCartItemNameWithSize("Producto", "Única"), "Producto");
});
