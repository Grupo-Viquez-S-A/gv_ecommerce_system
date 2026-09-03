import test from "node:test";
import assert from "node:assert/strict";

import {
  createGtiProductRows,
  createGtiProductWorkbookBlob,
} from "../src/utils/gtiProductExport.js";

test("mapea productos textiles por variante para el formato GTI", () => {
  const rows = createGtiProductRows([
    {
      product_name: "Camisa Polo",
      category: { category_name: "Uniformes" },
      variants: [
        {
          sku: "POLO-S",
          price: 12500,
          stock: 7,
          tax_rate: 13,
          is_active: true,
        },
        {
          sku: "POLO-M",
          price: "13250.456",
          stock_quantity: "3",
          tax_rate: 0,
          is_active: true,
        },
        {
          sku: "POLO-L",
          price: 14000,
          stock: 1,
          tax_rate: 13,
          is_active: false,
        },
      ],
    },
  ]);

  assert.deepEqual(rows, [
    {
      Codigo: "POLO-S",
      CodigoCabys: "",
      Detalle: "Camisa Polo",
      Unidad: 1,
      Cantidad: 7,
      Precio: 12500,
      TarifaIVA: 8,
      Categoria: "Uniformes",
      RegistroMedicamento: "",
      FormaFarmaceutica: "",
      PartidaArancelaria: "",
    },
    {
      Codigo: "POLO-M",
      CodigoCabys: "",
      Detalle: "Camisa Polo",
      Unidad: 1,
      Cantidad: 3,
      Precio: 13250.46,
      TarifaIVA: "",
      Categoria: "Uniformes",
      RegistroMedicamento: "",
      FormaFarmaceutica: "",
      PartidaArancelaria: "",
    },
  ]);
});

test("mapea telas sin variantes sumando el stock por colores", () => {
  const rows = createGtiProductRows([
    {
      sku: "TELA-001",
      fabric_name: "Tela Oxford",
      price: 2600,
      type: "Telas",
      colors: [{ quantity: 4 }, { quantity: "6" }, { quantity: null }],
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].Codigo, "TELA-001");
  assert.equal(rows[0].Detalle, "Tela Oxford");
  assert.equal(rows[0].Cantidad, 10);
  assert.equal(rows[0].Categoria, "Telas");
});

test("genera un archivo xlsx con la hoja y encabezados GTI", async () => {
  const blob = createGtiProductWorkbookBlob([
    {
      Codigo: "SKU-001",
      CodigoCabys: "",
      Detalle: "Producto de prueba",
      Unidad: 1,
      Cantidad: 2,
      Precio: 1000,
      TarifaIVA: 8,
      Categoria: "Pruebas",
      RegistroMedicamento: "",
      FormaFarmaceutica: "",
      PartidaArancelaria: "",
    },
  ]);
  const content = new TextDecoder().decode(await blob.arrayBuffer());

  assert.equal(
    blob.type,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  assert.match(content, /\[Content_Types\]\.xml/);
  assert.match(content, /xl\/workbook\.xml/);
  assert.match(content, /xl\/worksheets\/sheet1\.xml/);
  assert.match(content, /CodigoCabys/);
  assert.match(content, /Producto de prueba/);
});
