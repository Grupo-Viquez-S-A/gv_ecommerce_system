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
  { client = {}, items = [], status },
  { getDbQuotationStatus },
) {
  const companyId = getText(client.companyId);
  const identificationType =
    client.identificationType === "personal" ? "personal" : "legal";
  const businessName = getText(client.businessName);
  const legalName = getText(client.legalName);
  const ownerName = getText(client.ownerName);
  const legalId = getText(client.legalId);
  const activityCode = getText(client.activityCode);
  const businessEmail = getText(client.businessEmail);
  const branchAddress = getText(client.branchAddress);
  const branchLatitude = getNullableNumber(client.branchLatitude);
  const branchLongitude = getNullableNumber(client.branchLongitude);
  const branchLocationAccuracy = getNullableNumber(
    client.branchLocationAccuracy,
  );
  const representativeName = getText(client.representativeName);
  const representativeEmail = getText(client.representativeEmail)?.toLowerCase();
  const advancePercentage = Math.min(
    100,
    Math.max(0, getNumber(client.advancePercentage, 50)),
  );

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

  if (!branchAddress) {
    throw new Error("Ingresa la dirección de la sucursal.");
  }

  if (!client.branchId && (branchLatitude === null || branchLongitude === null)) {
    throw new Error(
      "Obtén la ubicación actual para registrar las coordenadas de la sucursal.",
    );
  }

  if (branchLatitude !== null && (branchLatitude < -90 || branchLatitude > 90)) {
    throw new Error("La latitud de la sucursal no es válida.");
  }

  if (branchLongitude !== null && (branchLongitude < -180 || branchLongitude > 180)) {
    throw new Error("La longitud de la sucursal no es válida.");
  }

  if (!representativeName) {
    throw new Error("Ingresa el nombre del representante.");
  }

  if (!representativeEmail) {
    throw new Error("Ingresa el correo electrónico del representante.");
  }

  if (
    representativeEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representativeEmail)
  ) {
    throw new Error("Ingresa un correo electrónico válido para el representante.");
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

      businessEmail,
      businessPhone: getText(client.businessPhone),

      branchProvince: getText(client.branchProvince),
      branchDistrict: getText(client.branchDistrict),
      branchAddress,
      branchPhone: getText(client.branchPhone),
      branchLatitude,
      branchLongitude,
      branchLocationAccuracy,

      representativeName,
      representativeEmail,
      representativeUserId: getText(client.representativeUserId),

      notes: getText(client.notes),

      earlyDelivery: getBoolean(client.earlyDelivery),
      earlyDeliveryDate: getText(client.earlyDeliveryDate),
      validUntil: getText(client.validUntil),
      methodId: getText(client.methodId),
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
      };
    }),

    status: getDbQuotationStatus(status),
  };
}
