export const GTI_PRODUCT_EXPORT_HEADERS = [
  "Codigo",
  "CodigoCabys",
  "Detalle",
  "Unidad",
  "Cantidad",
  "Precio",
  "TarifaIVA",
  "Categoria",
  "RegistroMedicamento",
  "FormaFarmaceutica",
  "PartidaArancelaria",
];

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function getText(value, fallback = "") {
  const text = String(value ?? "").trim();

  return text || fallback;
}

function getNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function roundCurrency(value) {
  return Math.round(getNumber(value) * 100) / 100;
}

function getProductVariants(product) {
  if (!Array.isArray(product?.variants)) {
    return [];
  }

  return product.variants.filter((variant) => variant?.is_active !== false);
}

function getProductName(product) {
  return getText(
    product?.product_name || product?.fabric_name || product?.name,
    "Producto sin nombre",
  );
}

function getProductSku(product, variant) {
  return getText(
    variant?.sku || product?.sku || product?.fabric_code,
    "Sin codigo",
  );
}

function getProductCategory(product) {
  return getText(
    product?.category?.category_name ||
      product?.category_name ||
      product?.type,
  );
}

function getProductStock(product, variant) {
  if (variant) {
    return getNumber(
      variant.stock ?? variant.stock_quantity ?? variant.available_quantity,
    );
  }

  if (
    product?.stock !== null &&
    product?.stock !== undefined &&
    product?.stock !== ""
  ) {
    return getNumber(product.stock);
  }

  if (Array.isArray(product?.colors)) {
    return product.colors.reduce(
      (total, color) => total + getNumber(color?.quantity),
      0,
    );
  }

  return getNumber(product?.available_quantity ?? product?.stock_quantity);
}

function getProductPrice(product, variant) {
  return roundCurrency(
    variant?.price ??
      product?.price ??
      product?.base_price ??
      product?.raw_product?.price,
  );
}

function getProductTaxRate(product, variant) {
  return getNumber(
    variant?.tax_rate ??
      variant?.iva ??
      product?.iva_percentage ??
      product?.tax_rate ??
      product?.iva ??
      product?.raw_product?.iva,
    null,
  );
}

function getGtiTaxRateCode(product, variant) {
  const taxRate = getProductTaxRate(product, variant);

  return taxRate === 13 ? 8 : "";
}

function createGtiProductRow(product, variant = null) {
  return {
    Codigo: getProductSku(product, variant),
    CodigoCabys: "",
    Detalle: getProductName(product),
    Unidad: 1,
    Cantidad: getProductStock(product, variant),
    Precio: getProductPrice(product, variant),
    TarifaIVA: getGtiTaxRateCode(product, variant),
    Categoria: getProductCategory(product),
    RegistroMedicamento: "",
    FormaFarmaceutica: "",
    PartidaArancelaria: "",
  };
}

export function createGtiProductRows(products = []) {
  return (Array.isArray(products) ? products : []).flatMap((product) => {
    const variants = getProductVariants(product);

    if (variants.length > 0) {
      return variants.map((variant) => createGtiProductRow(product, variant));
    }

    return [createGtiProductRow(product)];
  });
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getColumnName(index) {
  let columnName = "";
  let currentIndex = index + 1;

  while (currentIndex > 0) {
    const remainder = (currentIndex - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    currentIndex = Math.floor((currentIndex - 1) / 26);
  }

  return columnName;
}

function createTextCell(reference, value) {
  return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function createNumberCell(reference, value) {
  return `<c r="${reference}"><v>${getNumber(value)}</v></c>`;
}

function createCell(reference, value, forceNumber = false) {
  if (forceNumber) {
    return createNumberCell(reference, value);
  }

  return createTextCell(reference, value);
}

function createWorksheetXml(rows) {
  const allRows = [
    GTI_PRODUCT_EXPORT_HEADERS,
    ...rows.map((row) =>
      GTI_PRODUCT_EXPORT_HEADERS.map((header) => row[header]),
    ),
  ];
  const numericHeaders = new Set([
    "Unidad",
    "Cantidad",
    "Precio",
    "TarifaIVA",
  ]);
  const columnsXml = [
    24,
    18,
    42,
    10,
    12,
    14,
    12,
    22,
    22,
    22,
    22,
  ]
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join("");
  const rowsXml = allRows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cellsXml = row
        .map((value, columnIndex) => {
          const reference = `${getColumnName(columnIndex)}${rowNumber}`;
          const isNumeric =
            rowIndex > 0 &&
            numericHeaders.has(GTI_PRODUCT_EXPORT_HEADERS[columnIndex]) &&
            value !== "";

          return createCell(reference, value, isNumeric);
        })
        .join("");

      return `<row r="${rowNumber}">${cellsXml}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:K${allRows.length}"/>
  <cols>${columnsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function createWorkbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Productos" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function createWorkbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function createRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function createContentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function createStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`;
}

function createCorePropsXml() {
  const timestamp = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Grupo Viquez</dc:creator>
  <cp:lastModifiedBy>Grupo Viquez</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>
</cp:coreProperties>`;
}

function createAppPropsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Grupo Viquez ERP</Application>
</Properties>`;
}

function createCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let current = index;

    for (let bit = 0; bit < 8; bit += 1) {
      current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    }

    table[index] = current >>> 0;
  }

  return table;
}

const CRC_TABLE = createCrcTable();

function getCrc32(bytes) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createEncodedText(value) {
  return new TextEncoder().encode(value);
}

function createZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = createEncodedText(entry.name);
    const dataBytes = createEncodedText(entry.content);
    const crc = getCrc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...localParts, ...centralParts, endHeader], {
    type: XLSX_MIME_TYPE,
  });
}

export function createGtiProductWorkbookBlob(rows) {
  const entries = [
    { name: "[Content_Types].xml", content: createContentTypesXml() },
    { name: "_rels/.rels", content: createRootRelsXml() },
    { name: "docProps/app.xml", content: createAppPropsXml() },
    { name: "docProps/core.xml", content: createCorePropsXml() },
    { name: "xl/workbook.xml", content: createWorkbookXml() },
    { name: "xl/_rels/workbook.xml.rels", content: createWorkbookRelsXml() },
    { name: "xl/styles.xml", content: createStylesXml() },
    { name: "xl/worksheets/sheet1.xml", content: createWorksheetXml(rows) },
  ];

  return createZipArchive(entries);
}

export function downloadGtiProductsExcel(products = []) {
  const rows = createGtiProductRows(products);
  const blob = createGtiProductWorkbookBlob(rows);
  const timestamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `productos-gti-${timestamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
