import test from "node:test";
import assert from "node:assert/strict";

import { shouldProductUseDimensions } from "../src/components/catalog/petCategoryUtils.js";

test("muestra dimensiones solo en camas de mascotas o productos fuera de mascotas", () => {
  assert.equal(
    shouldProductUseDimensions({
      category: { category_name: "Mascotas" },
      product_type: { product_type: "Camas" },
    }),
    true,
  );
  assert.equal(
    shouldProductUseDimensions({
      category: { category_name: "Mascotas" },
      product_type: { product_type: "Ropa" },
    }),
    false,
  );
  assert.equal(
    shouldProductUseDimensions({
      category_name: "Mascotas",
      type_name: "Disfraces",
    }),
    false,
  );
  assert.equal(
    shouldProductUseDimensions({
      category: { category_name: "Uniformes" },
      product_type: { product_type: "Corporativos" },
    }),
    true,
  );
});
