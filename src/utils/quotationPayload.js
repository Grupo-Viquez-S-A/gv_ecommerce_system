import { getQuotationAdvancePercentageForItems } from "./quotationAdvanceRules.js";

function getText(value) {
  const normalizedValue = String(value || "").trim();

  return normalizedValue || null;
}

function getNumber(value, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getBoolean(value) {
  return value === true || value === "true";
}

function getNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isTextileCartItem(item) {
  const normalizedType = String(item?.catalogType || "")
    .trim()
    .toLowerCase();

  return (
    normalizedType === "textile_products" ||
    normalizedType === "producto"
  );
}

export function normalizeQuotationPayload(
  { client = {}, items = [] },
) {
  const companyId = getText(client.companyId);
  const identificationType =
    client.identificationType === "personal" ? "personal" : "legal";
  const businessName = getText(client.businessName);
  const legalName = getText(client.legalName);
  const ownerName = getText(client.ownerName);
  const legalId = getText(client.legalId);
  const activityCode = getText(client.activityCode);
  const taxStatus = getText(client.taxStatus);
  const businessEmail = getText(client.businessEmail);
  const branchProvince = getText(client.branchProvince);
  const branchCity = getText(client.branchCity);
  const branchDistrict = getText(client.branchDistrict);
  const branchAddress = getText(client.branchAddress);
  const branchLatitude = getNullableNumber(client.branchLatitude);
  const branchLongitude = getNullableNumber(client.branchLongitude);
  const branchLocationAccuracy = getNullableNumber(
    client.branchLocationAccuracy,
  );
  const advancePercentage = getQuotationAdvancePercentageForItems(items);

  if (!companyId) {
    throw new Error("Selecciona la empresa del grupo.");
  }

  if (!businessName) {
    throw new Error("Ingresa el nombre comercial del cliente.");
  }

  if (!legalId) {
    throw new Error(
      identificationType === "personal"
        ? "Ingresa el número de identificación del dueño."
        : "Ingresa la cédula jurídica del cliente.",
    );
  }

  if (identificationType === "legal" && !legalName) {
    throw new Error("Ingresa la razón social del cliente.");
  }

  if (identificationType === "personal" && !ownerName) {
    throw new Error("Ingresa el nombre y apellidos del dueño.");
  }

  if (!activityCode) {
    throw new Error("Ingresa el código de actividad del cliente.");
  }

  if (!businessEmail) {
    throw new Error("Ingresa el correo electrónico principal del cliente.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
    throw new Error("Ingresa un correo electrónico principal válido.");
  }

  if (!getText(client.methodId)) {
    throw new Error("Selecciona el método de pago.");
  }

  if (!getText(client.conditionId)) {
    throw new Error("Selecciona la condición de pago.");
  }

  if (!branchAddress) {
    throw new Error("Ingresa la dirección del cliente.");
  }

  if (!branchProvince || !branchCity || !branchDistrict) {
    throw new Error("Ingresa provincia, cantón y distrito del cliente.");
  }

  if (branchLatitude !== null && (branchLatitude < -90 || branchLatitude > 90)) {
    throw new Error("La latitud del cliente no es válida.");
  }

  if (branchLongitude !== null && (branchLongitude < -180 || branchLongitude > 180)) {
    throw new Error("La longitud del cliente no es válida.");
  }

  if (!items.length) {
    throw new Error("Agrega al menos un producto al carrito.");
  }

  return {
    client: {
      businessId: getText(client.businessId),
      branchId: getText(client.branchId),
      representativeId: getText(client.representativeId),

      companyId,
      identificationType,
      legalId,
      legalName: identificationType === "legal" ? legalName : "",
      ownerName: identificationType === "personal" ? ownerName : "",
      businessName,
      activityCode,
      taxStatus,

      businessEmail,
      businessPhone: getText(client.businessPhone),

      branchProvince,
      branchCity,
      branchDistrict,
      branchAddress,
      branchPhone: getText(client.branchPhone),
      branchLatitude,
      branchLongitude,
      branchLocationAccuracy,

      representativeName: null,
      representativeEmail: null,
      representativeUserId: null,

      notes: getText(client.notes),

      validUntil: getText(client.validUntil),
      methodId: getText(client.methodId),
      conditionId: getText(client.conditionId),
      advancePercentage,
    },

    items: items.map((item) => {
      const quantity = Math.max(1, getNumber(item.quantity, 1));
      const unitPrice = getNumber(item.unitPrice, 0);
      const unitIva = getNumber(item.ivaAmount, 0);
      const ivaAmount = unitIva * quantity;
      const variantId = getText(item.variantId);

      if (!isTextileCartItem(item) || !variantId) {
        throw new Error(
          "Cada producto cotizado debe corresponder a una variante válida del inventario textil.",
        );
      }

      return {
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
        iva_amount: ivaAmount,
        has_sublimation: getBoolean(item.hasSublimation),
        has_embroidery: getBoolean(item.hasEmbroidery),
        category_name: getText(
          item.categoryName ||
          item.category_name ||
          item.category?.category_name,
        ),
      };
    }),
  };
}
