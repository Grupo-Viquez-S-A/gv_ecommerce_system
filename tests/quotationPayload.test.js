import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuotationPayload } from "../src/utils/quotationPayload.js";

const baseClient = {
  companyId: "company-1",
  identificationType: "legal",
  businessName: "Cliente Demo",
  legalName: "Cliente Demo S.A.",
  legalId: "3-101-999999",
  activityCode: "62010",
  businessEmail: "compras@cliente-demo.com",
  branchAddress: "San José, Costa Rica",
  branchLatitude: "9.9325",
  branchLongitude: "-84.0796",
  representativeName: "Andrea Compras",
  representativeEmail: "andrea@cliente-demo.com",
  methodId: "method-1",
  advancePercentage: "35",
};

test("normaliza el payload del carrito usando variant_id y adelanto porcentual", () => {
  const payload = normalizeQuotationPayload(
    {
      client: baseClient,
      status: "pending",
      items: [
        {
          catalogType: "textile_products",
          variantId: "variant-1",
          quantity: 3,
          unitPrice: 12500,
          ivaAmount: 1625,
          hasSublimation: true,
          hasEmbroidery: false,
        },
      ],
    },
    {
      getDbQuotationStatus: (status) => status,
    },
  );

  assert.equal(payload.client.advancePercentage, 35);
  assert.deepEqual(payload.items, [
    {
      variant_id: "variant-1",
      quantity: 3,
      unit_price: 12500,
      iva_amount: 4875,
      has_sublimation: true,
      has_embroidery: false,
    },
  ]);
});

test("rechaza productos sin variante textil válida", () => {
  assert.throws(
    () =>
      normalizeQuotationPayload(
        {
          client: baseClient,
          status: "pending",
          items: [
            {
              catalogType: "fabric_catalog",
              productId: "fabric-1",
              quantity: 1,
              unitPrice: 5000,
              ivaAmount: 650,
            },
          ],
        },
        {
          getDbQuotationStatus: (status) => status,
        },
      ),
    /variante válida del inventario textil/i,
  );
});
