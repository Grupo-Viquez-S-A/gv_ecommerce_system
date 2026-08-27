import { jsPDF } from "jspdf";
import textilesOccidenteLogo from "../assets/img/to_white_no_bg.png";
import { formatDateCR as formatDateValue } from "./dateUtils.js";

const BRAND_NAVY = [7, 26, 59];
const TEXTILES_GREEN = [18, 46, 35];
const LINE_BLUE = [53, 84, 126];
const TEXT_MUTED = [92, 111, 143];
const LIGHT_FILL = [243, 246, 251];
const TOTAL_FILL = [232, 236, 242];
const DANGER_RED = [220, 38, 38];

let cachedTextilesLogo = null;

function formatMoney(value) {
  return `CRC ${new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;
}

function sanitize(value, fallback = "") {
  return String(value ?? fallback).trim() || fallback;
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getDateLabel(value, fallback = "Sin fecha") {
  return formatDateValue(value) || fallback;
}

async function loadImageAsDataUrl(src) {
  if (!src) return null;
  const response = await fetch(src);
  if (!response.ok) return null;
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getIssuerName(quotation) {
  const issuer = quotation?.groupCompany;
  return sanitize(
    issuer?.commercialName ||
      issuer?.name ||
      issuer?.company_name ||
      issuer?.commercial_name,
    "GRUPO VIQUEZ",
  );
}

function getIssuerDetails(quotation) {
  const issuer = quotation?.groupCompany || {};
  const primaryPhone =
    issuer.phones?.find((phone) => phone?.is_primary)?.phone ||
    issuer.phones?.find((phone) => phone?.phone)?.phone ||
    "";

  return {
    name: getIssuerName(quotation),
    legalId: sanitize(issuer.legalId || issuer.legal_id),
    address: sanitize(issuer.address),
    phone: sanitize(primaryPhone),
    email: sanitize(issuer.email),
  };
}

function getItems(quotation) {
  return Array.isArray(quotation?.items) ? quotation.items : [];
}

function getItemQuantity(item) {
  return Math.max(0, toNumber(item?.quantity, 0));
}

function getItemPrice(item) {
  return toNumber(item?.unitPrice, 0);
}

function getItemEmbroideryUnitAmount(item) {
  return item?.hasEmbroidery
    ? toNumber(item?.embroideryUnitPrice ?? item?.embroideryPrice, 0)
    : 0;
}

function getItemSublimationUnitAmount(item) {
  return item?.hasSublimation
    ? toNumber(item?.sublimationUnitPrice ?? item?.sublimationPrice, 0)
    : 0;
}

function getItemEmbroideryLineAmount(item) {
  return getItemEmbroideryUnitAmount(item) * getItemQuantity(item);
}

function getItemSublimationLineAmount(item) {
  return getItemSublimationUnitAmount(item) * getItemQuantity(item);
}

function getProductsSubtotal(quotation) {
  return getItems(quotation).reduce(
    (total, item) => total + getItemPrice(item) * getItemQuantity(item),
    0,
  );
}

function getEmbroideryTotal(quotation) {
  const explicitAmount = toNumber(quotation?.embroideryAmount, null);
  if (explicitAmount !== null) {
    return Math.max(0, explicitAmount);
  }

  return getItems(quotation).reduce(
    (total, item) => total + getItemEmbroideryLineAmount(item),
    0,
  );
}

function getSublimationTotal(quotation) {
  const explicitAmount = toNumber(quotation?.sublimationAmount, null);
  if (explicitAmount !== null) {
    return Math.max(0, explicitAmount);
  }

  return getItems(quotation).reduce(
    (total, item) => total + getItemSublimationLineAmount(item),
    0,
  );
}

function getEarlyDeliveryTotal(quotation) {
  return Math.max(0, toNumber(quotation?.earlyDeliveryPrice, 0));
}

function getSubtotalBeforeDiscount(quotation) {
  return (
    getProductsSubtotal(quotation) +
    getEmbroideryTotal(quotation) +
    getSublimationTotal(quotation) +
    getEarlyDeliveryTotal(quotation)
  );
}

function getDiscountPercentage(quotation) {
  const explicitPercentage = toNumber(quotation?.discountPercentage, null);
  if (explicitPercentage !== null) {
    return Math.min(100, Math.max(0, explicitPercentage));
  }

  const subtotalBeforeDiscount = getSubtotalBeforeDiscount(quotation);
  const discountAmount = toNumber(quotation?.discountAmount, 0);
  if (subtotalBeforeDiscount <= 0 || discountAmount <= 0) return 0;
  return (discountAmount / subtotalBeforeDiscount) * 100;
}

function getDiscountAmount(quotation) {
  const explicitAmount = toNumber(quotation?.discountAmount, null);
  if (explicitAmount !== null) {
    return Math.max(0, explicitAmount);
  }

  const subtotalBeforeDiscount = getSubtotalBeforeDiscount(quotation);
  return subtotalBeforeDiscount * (getDiscountPercentage(quotation) / 100);
}

function getSubtotalAfterDiscount(quotation) {
  return Math.max(0, getSubtotalBeforeDiscount(quotation) - getDiscountAmount(quotation));
}

function getIvaAmount(quotation) {
  return Math.max(0, toNumber(quotation?.ivaAmount, 0));
}

function getTotalAmount(quotation) {
  const explicitTotal = toNumber(quotation?.total, null);
  if (explicitTotal !== null) {
    return Math.max(0, explicitTotal);
  }
  return getSubtotalAfterDiscount(quotation) + getIvaAmount(quotation);
}

function getAdvancePercentage(quotation) {
  const explicitPercentage = toNumber(quotation?.advancePercentage, null);
  if (explicitPercentage !== null) {
    return Math.min(100, Math.max(0, explicitPercentage));
  }

  const total = getTotalAmount(quotation);
  if (total <= 0) return 0;
  return (getAdvancePayment(quotation) / total) * 100;
}

function getAdvancePayment(quotation) {
  const explicitAdvance = toNumber(quotation?.advancePayment, null);
  if (explicitAdvance !== null) {
    return Math.max(0, explicitAdvance);
  }
  return getTotalAmount(quotation) * 0.5;
}

function getRemainingBalance(quotation) {
  return Math.max(0, getTotalAmount(quotation) - getAdvancePayment(quotation));
}

function getRowTotalIvai(item) {
  return (
    getItemPrice(item) * getItemQuantity(item) +
    getItemEmbroideryLineAmount(item) +
    getItemSublimationLineAmount(item) +
    toNumber(item?.ivaAmount, 0)
  );
}

function ensureSpace(doc, y, requiredHeight, quotation) {
  if (y + requiredHeight <= 275) return y;
  doc.addPage();
  drawPageHeader(doc, quotation);
  return 48;
}

function drawPageHeader(doc, quotation) {
  const issuer = getIssuerDetails(quotation);

  doc.setFillColor(...TEXTILES_GREEN);
  doc.rect(0, 0, 210, 34, "F");

  if (cachedTextilesLogo) {
    doc.addImage(cachedTextilesLogo, "PNG", 12, 4, 28, 28, undefined, "FAST");
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(issuer.name.toUpperCase(), 84), 105, 9, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const issuerLines = [issuer.legalId, issuer.address, issuer.phone, issuer.email].filter(Boolean);
  doc.text(issuerLines, 105, 15, { align: "center", lineHeightFactor: 1.15 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.text("Proforma", 196, 12, { align: "right" });
  const numberLines = doc.splitTextToSize(
    `No. ${sanitize(quotation?.number, "sin numero")}`,
    46,
  );
  doc.text(numberLines, 196, 19, { align: "right", lineHeightFactor: 1.15 });
}

function drawSectionTitle(doc, title, x, y, width = 182) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_NAVY);
  doc.text(title, x, y);
  doc.setDrawColor(...LINE_BLUE);
  doc.setLineWidth(0.35);
  doc.line(x, y + 4, x + width, y + 4);
}

function drawField(doc, label, value, x, y, width) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 29, 45);
  const lines = doc.splitTextToSize(sanitize(value, "No indicado"), width);
  doc.text(lines, x, y + 6);
}

function drawProductsTableHeader(doc, y) {
  const tableX = 14;
  const tableWidth = 182;
  const columns = [
    { key: "product", label: "Producto", x: 14, width: 28, align: "left" },
    { key: "sku", label: "SKU", x: 42, width: 26, align: "left" },
    { key: "gtin", label: "GTIN / Código de barras", x: 68, width: 30, align: "left" },
    { key: "size", label: "Talla", x: 98, width: 10, align: "center" },
    { key: "qty", label: "Cant.", x: 108, width: 10, align: "center" },
    { key: "price", label: "Precio Unit.", x: 118, width: 18, align: "right" },
    { key: "emb", label: "Bordado", x: 136, width: 14, align: "right" },
    { key: "sub", label: "Sublimación", x: 150, width: 18, align: "right" },
    { key: "iva", label: "IVA", x: 168, width: 14, align: "right" },
    { key: "total", label: "Total IVAI", x: 182, width: 14, align: "right" },
  ];

  doc.setFillColor(...BRAND_NAVY);
  doc.rect(tableX, y, tableWidth, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);

  columns.forEach((column) => {
    const textX =
      column.align === "right"
        ? column.x + column.width - 2
        : column.align === "center"
          ? column.x + column.width / 2
          : column.x + 2;

    doc.text(column.label, textX, y + 5.8, {
      align: column.align === "left" ? "left" : column.align,
      maxWidth: column.width - 3,
    });
  });

  return columns;
}

function drawProductsTable(doc, quotation, startY) {
  let y = startY;
  const tableX = 14;
  const tableWidth = 182;

  drawSectionTitle(doc, "Artículos cotizados", 14, y);
  y += 8;

  let columns = drawProductsTableHeader(doc, y);
  y += 9;

  const items = getItems(quotation);
  if (!items.length) {
    doc.setDrawColor(222, 229, 239);
    doc.rect(tableX, y, tableWidth, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("No hay artículos registrados.", tableX + 4, y + 7);
    return y + 16;
  }

  items.forEach((item, index) => {
    const productLines = doc.splitTextToSize(
      sanitize(item?.name, "Producto sin nombre"),
      columns[0].width - 4,
    );
    const skuLines = doc.splitTextToSize(
      sanitize(item?.sku, "Sin SKU"),
      columns[1].width - 4,
    );
    const gtinLines = doc.splitTextToSize(
      sanitize(item?.gtin, "Sin código"),
      columns[2].width - 4,
    );
    const lineCount = Math.max(productLines.length, skuLines.length, gtinLines.length, 1);
    const rowHeight = Math.max(11, lineCount * 4.2 + 3);

    y = ensureSpace(doc, y, rowHeight + 8, quotation);
    if (y === 48) {
      columns = drawProductsTableHeader(doc, y);
      y += 9;
    }

    doc.setFillColor(...(index % 2 === 0 ? [255, 255, 255] : LIGHT_FILL));
    doc.setDrawColor(222, 229, 239);
    doc.rect(tableX, y, tableWidth, rowHeight, "FD");

    columns.slice(1).forEach((column) => {
      doc.line(column.x, y, column.x, y + rowHeight);
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(20, 29, 45);
    doc.text(productLines, columns[0].x + 2, y + 5.3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(skuLines, columns[1].x + 2, y + 5.3);
    doc.text(gtinLines, columns[2].x + 2, y + 5.3);

    const centerY = y + 5.3;
    const values = [
      { column: columns[3], value: sanitize(item?.sizeName, "-"), align: "center" },
      { column: columns[4], value: String(getItemQuantity(item)), align: "center" },
      { column: columns[5], value: formatMoney(getItemPrice(item)), align: "right" },
      { column: columns[6], value: formatMoney(getItemEmbroideryUnitAmount(item)), align: "right" },
      { column: columns[7], value: formatMoney(getItemSublimationUnitAmount(item)), align: "right" },
      { column: columns[8], value: formatMoney(toNumber(item?.ivaAmount, 0)), align: "right" },
      { column: columns[9], value: formatMoney(getRowTotalIvai(item)), align: "right", bold: true },
    ];

    values.forEach(({ column, value, align, bold }) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(
        value,
        align === "right" ? column.x + column.width - 2 : column.x + column.width / 2,
        centerY,
        { align },
      );
    });

    y += rowHeight;
  });

  return y + 8;
}

function buildQuotationSummaryRows(quotation) {
  const rows = [
    { label: "Subtotal productos", value: formatMoney(getProductsSubtotal(quotation)) },
    { label: "Bordado", value: formatMoney(getEmbroideryTotal(quotation)) },
    { label: "Sublimación", value: formatMoney(getSublimationTotal(quotation)) },
  ];

  const earlyDeliveryTotal = getEarlyDeliveryTotal(quotation);
  if (earlyDeliveryTotal > 0) {
    rows.push({ label: "Entrega anticipada", value: formatMoney(earlyDeliveryTotal) });
  }

  rows.push(
    {
      label: "Subtotal antes de descuento",
      value: formatMoney(getSubtotalBeforeDiscount(quotation)),
      highlight: true,
    },
    {
      label: `Descuento (${getDiscountPercentage(quotation).toFixed(0)}%)`,
      value: `-${formatMoney(getDiscountAmount(quotation))}`,
      danger: true,
    },
    {
      label: "Subtotal con descuento",
      value: formatMoney(getSubtotalAfterDiscount(quotation)),
      highlight: true,
    },
    {
      label: "IVA (13.00%)",
      value: formatMoney(getIvaAmount(quotation)),
    },
    {
      label: "TOTAL IVAI",
      value: formatMoney(getTotalAmount(quotation)),
      total: true,
    },
  );

  return rows;
}

function buildPaymentConditionsRows(quotation) {
  return [
    {
      label: "Porcentaje de adelanto",
      value: `${getAdvancePercentage(quotation).toFixed(0)}%`,
    },
    {
      label: "Monto de adelanto",
      value: formatMoney(getAdvancePayment(quotation)),
    },
    {
      label: "Saldo restante",
      value: formatMoney(getRemainingBalance(quotation)),
      total: true,
    },
  ];
}

function getSummaryBlockHeight(rows) {
  return 8 + rows.length * 8 + 4;
}

function drawSummaryTable(doc, title, rows, x, y, width) {
  drawSectionTitle(doc, title, x, y, width);
  y += 8;

  doc.setDrawColor(190, 198, 210);
  doc.rect(x, y, width, 8, "S");
  doc.setFillColor(...TOTAL_FILL);
  doc.rect(x, y, width, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 29, 45);
  doc.text("Concepto", x + 3, y + 5.5);
  doc.text("Monto", x + width - 3, y + 5.5, { align: "right" });
  y += 8;

  rows.forEach((row) => {
    const fill = row.total || row.highlight ? TOTAL_FILL : [255, 255, 255];
    doc.setFillColor(...fill);
    doc.setDrawColor(200, 208, 220);
    doc.rect(x, y, width, 8, "FD");
    doc.setFont("helvetica", row.total || row.highlight ? "bold" : "normal");
    doc.setFontSize(8.1);
    doc.setTextColor(...(row.danger ? DANGER_RED : [20, 29, 45]));
    doc.text(row.label, x + 3, y + 5.5);
    doc.text(row.value, x + width - 3, y + 5.5, { align: "right" });
    y += 8;
  });

  return y;
}

function drawFooter(doc, quotation) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(222, 229, 239);
    doc.line(14, 284, 196, 284);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Documento generado desde ${getIssuerName(quotation)} para la cotización ${sanitize(quotation?.number, "sin numero")}.`,
      14,
      289,
    );
    doc.text(`Página ${page} de ${pageCount}`, 196, 289, { align: "right" });
  }
}

export async function createQuotationProforma(quotation, { logoDataUrl } = {}) {
  if (logoDataUrl) {
    cachedTextilesLogo = logoDataUrl;
  } else if (!cachedTextilesLogo) {
    cachedTextilesLogo = await loadImageAsDataUrl(textilesOccidenteLogo);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawPageHeader(doc, quotation);

  doc.setTextColor(...BRAND_NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Proforma", 14, 48);

  doc.setFontSize(11);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(sanitize(quotation?.number, "Cotización sin número"), 14, 56);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_NAVY);
  doc.setFontSize(10);
  doc.text("Fecha", 142, 46);
  doc.text("Vigencia", 142, 59);
  doc.text("Estado", 142, 72);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 29, 45);
  doc.text(getDateLabel(quotation?.date), 168, 46);
  doc.text(getDateLabel(quotation?.validity), 168, 59);
  doc.text(sanitize(quotation?.status, "Pendiente"), 168, 72);

  drawSectionTitle(doc, "Datos del cliente", 14, 88);
  let y = 104;

  drawField(doc, "Cliente", quotation?.company, 18, y, 54);
  drawField(doc, "Razón social", quotation?.legalName, 76, y, 54);
  drawField(doc, "Cédula jurídica", quotation?.legalId, 134, y, 40);

  y += 24;
  drawField(doc, "Sucursal", quotation?.branch?.address, 18, y, 54);
  drawField(
    doc,
    "Ubicación",
    [quotation?.branch?.province, quotation?.branch?.district].filter(Boolean).join(", "),
    76,
    y,
    54,
  );
  drawField(
    doc,
    "Representante",
    `${sanitize(quotation?.representative?.name, "Sin representante")}\n${sanitize(quotation?.representative?.email)}`,
    134,
    y,
    54,
  );

  y += 28;
  y = drawProductsTable(doc, quotation, y);

  const quotationSummaryRows = buildQuotationSummaryRows(quotation);
  const paymentConditionsRows = buildPaymentConditionsRows(quotation);
  const summaryHeight = Math.max(
    getSummaryBlockHeight(quotationSummaryRows),
    getSummaryBlockHeight(paymentConditionsRows),
  );

  y = ensureSpace(doc, y, summaryHeight + 16, quotation);

  const leftX = 14;
  const rightX = 108;
  const blockWidth = 80;

  drawSummaryTable(doc, "Resumen de la cotización", quotationSummaryRows, leftX, y, blockWidth);
  drawSummaryTable(doc, "Condiciones de pago", paymentConditionsRows, rightX, y, blockWidth);

  y += summaryHeight + 12;

  y = ensureSpace(doc, y, 24, quotation);
  drawSectionTitle(doc, "Notas", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(20, 29, 45);
  doc.text(
    doc.splitTextToSize(sanitize(quotation?.notes, "Sin notas registradas."), 174),
    18,
    y + 12,
  );

  drawFooter(doc, quotation);

  const filename = `${sanitize(quotation?.number, "proforma").replace(/[^a-zA-Z0-9-_]/g, "_")}-proforma.pdf`;
  return { doc, filename };
}

export async function downloadQuotationProforma(quotation) {
  const { doc, filename } = await createQuotationProforma(quotation);
  doc.save(filename);
}
