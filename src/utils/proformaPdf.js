import { jsPDF } from "jspdf";
import textilesOccidenteLogo from "../assets/img/to_white_no_bg.png";
import { formatDateCR as formatDateDMY } from "./dateUtils.js";

const BRAND_NAVY = [7, 26, 59];
const TEXTILES_GREEN = [18, 46, 35];
const LINE_BLUE = [53, 84, 126];
const TEXT_MUTED = [92, 111, 143];
let cachedTextilesLogo = null;

function formatMoney(value) {
  return `CRC ${new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;
}

function sanitize(value, fallback = "") {
  return String(value ?? fallback).trim() || fallback;
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
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
    issuer?.commercialName || issuer?.name || issuer?.company_name || issuer?.commercial_name,
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

function buildItemDetail(item) {
  const details = [];

  if (item?.sizeName) details.push(`Talla: ${item.sizeName}`);
  if (item?.hasSublimation) details.push(`Sublimacion: ${formatMoney(item.sublimationUnitPrice)}`);
  if (item?.hasEmbroidery) details.push(`Bordado: ${formatMoney(item.embroideryUnitPrice)}`);

  return details.join(" | ");
}

function getItems(quotation) {
  return Array.isArray(quotation?.items) ? quotation.items : [];
}

function getItemServiceTotal(item, flagName, unitPriceName) {
  if (!item?.[flagName]) return 0;
  return toNumber(item?.[unitPriceName]) * toNumber(item?.quantity || 1);
}

function getEmbroideryTotal(quotation) {
  const explicitTotal = toNumber(quotation?.embroideryPrice);
  if (explicitTotal > 0) return explicitTotal;

  return getItems(quotation).reduce(
    (total, item) => total + getItemServiceTotal(item, "hasEmbroidery", "embroideryUnitPrice"),
    0,
  );
}

function getSublimationTotal(quotation) {
  const explicitTotal = toNumber(quotation?.sublimationPrice);
  if (explicitTotal > 0) return explicitTotal;

  return getItems(quotation).reduce(
    (total, item) => total + getItemServiceTotal(item, "hasSublimation", "sublimationUnitPrice"),
    0,
  );
}

function drawTextBlock(doc, label, value, x, y, width) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 29, 45);
  const lines = doc.splitTextToSize(sanitize(value, "No indicado"), width);
  doc.text(lines, x, y + 6);
  return y + 6 + lines.length * 5;
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
  const issuerLines = [
    issuer.legalId,
    issuer.address,
    issuer.phone,
    issuer.email,
  ].filter(Boolean);
  doc.text(issuerLines, 105, 15, { align: "center", lineHeightFactor: 1.15 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Proforma", 196, 12, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.4);
  const numberLines = doc.splitTextToSize(`No. ${sanitize(quotation?.number, "sin numero")}`, 46);
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

function drawProductsTable(doc, quotation, startY) {
  let y = startY;
  const tableX = 14;
  const tableWidth = 182;
  const columns = {
    product: { x: 14, width: 82, label: "Producto / servicio" },
    price: { x: 96, width: 36, label: "Precio", alignX: 130 },
    quantity: { x: 132, width: 16, label: "Cant.", alignX: 140 },
    iva: { x: 148, width: 24, label: "IVA", alignX: 170 },
    total: { x: 172, width: 24, label: "Total", alignX: 194 },
  };

  drawSectionTitle(doc, "Articulos cotizados", 14, y);
  y += 14;

  doc.setFillColor(...BRAND_NAVY);
  doc.rect(tableX, y, tableWidth, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(columns.product.label, columns.product.x + 3, y + 6);
  doc.text(columns.price.label, columns.price.alignX, y + 6, { align: "right" });
  doc.text(columns.quantity.label, columns.quantity.alignX, y + 6, { align: "center" });
  doc.text(columns.iva.label, columns.iva.alignX, y + 6, { align: "right" });
  doc.text(columns.total.label, columns.total.alignX, y + 6, { align: "right" });
  y += 9;

  const items = quotation?.items?.length ? quotation.items : [];

  if (!items.length) {
    doc.setDrawColor(...LINE_BLUE);
    doc.rect(tableX, y, tableWidth, 14);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("No hay articulos registrados.", 18, y + 9);
    return y + 18;
  }

  items.forEach((item, index) => {
    const productName = sanitize(item.name, "Producto sin nombre");
    const detail = buildItemDetail(item);
    const description = sanitize(item.description);
    const productLines = doc.splitTextToSize(
      [productName, `SKU: ${sanitize(item.sku, "Sin SKU")}`, detail, description]
        .filter(Boolean)
        .join("\n"),
      columns.product.width - 8,
    );
    const rowHeight = Math.max(26, productLines.length * 4.3 + 9);
    y = ensureSpace(doc, y, rowHeight + 8, quotation);

    doc.setFillColor(index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 251, index % 2 === 0 ? 255 : 254);
    doc.setDrawColor(222, 229, 239);
    doc.rect(tableX, y, tableWidth, rowHeight, "FD");
    doc.setDrawColor(226, 231, 240);
    [columns.price.x, columns.quantity.x, columns.iva.x, columns.total.x].forEach((x) => {
      doc.line(x, y, x, y + rowHeight);
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 29, 45);
    doc.text(productLines, columns.product.x + 4, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 29, 45);
    doc.text(formatMoney(item.unitPrice), columns.price.alignX, y + 8, { align: "right" });
    doc.text(String(Number(item.quantity) || 0), columns.quantity.alignX, y + 8, { align: "center" });
    doc.text(formatMoney(item.ivaAmount), columns.iva.alignX, y + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(item.total), columns.total.alignX, y + 8, { align: "right" });

    y += rowHeight;
  });

  return y + 6;
}

function buildPaymentSummaryRows(quotation) {
  const items = getItems(quotation);
  const hasEmbroideryItems = items.some((item) => item?.hasEmbroidery);
  const hasSublimationItems = items.some((item) => item?.hasSublimation);
  const embroideryTotal = getEmbroideryTotal(quotation);
  const sublimationTotal = getSublimationTotal(quotation);
  const earlyDeliveryPrice = toNumber(quotation?.earlyDeliveryPrice);
  const rows = [
    ["Subtotal", formatMoney(quotation?.subtotal)],
    ["IVA (13.00%)", formatMoney(quotation?.ivaAmount)],
  ];
  let serviceInsertIndex = 1;

  if (hasEmbroideryItems || embroideryTotal > 0) {
    rows.splice(serviceInsertIndex, 0, ["Bordado incluido", formatMoney(embroideryTotal)]);
    serviceInsertIndex += 1;
  }

  if (hasSublimationItems || sublimationTotal > 0) {
    rows.splice(serviceInsertIndex, 0, ["Sublimacion incluida", formatMoney(sublimationTotal)]);
  }

  if (quotation?.earlyDelivery || earlyDeliveryPrice > 0) {
    rows.push(["Entrega anticipada", formatMoney(earlyDeliveryPrice)]);
  }

  rows.push(["Total", formatMoney(quotation?.total)]);
  rows.push(["Adelanto (50%)", formatMoney(quotation?.advancePayment)]);

  if (quotation?.earlyDelivery) {
    rows.push([
      "Fecha entrega anticipada",
      formatDateDMY(quotation?.earlyDeliveryDate) || "Sin fecha",
    ]);
  }

  return rows;
}

function getPaymentSummaryHeight(quotation) {
  const rows = buildPaymentSummaryRows(quotation);
  return 8 + rows.length * 8 + 6;
}

function drawPaymentSummary(doc, quotation, startY) {
  let y = startY;
  const tableX = 14;
  const tableWidth = 86;
  const labelX = tableX + 4;
  const valueX = tableX + tableWidth - 4;
  const rows = buildPaymentSummaryRows(quotation);

  y = ensureSpace(doc, y, getPaymentSummaryHeight(quotation), quotation);

  doc.setDrawColor(160, 172, 191);
  doc.rect(tableX, y, tableWidth, 8, "S");
  doc.setFillColor(230, 232, 236);
  doc.rect(tableX, y, tableWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 29, 45);
  doc.text("Concepto", labelX, y + 5.5);
  doc.text("Monto", valueX, y + 5.5, { align: "right" });
  y += 8;

  rows.forEach(([label, value]) => {
    const isTotal = label === "Total";
    doc.setFillColor(isTotal ? 220 : 255, isTotal ? 224 : 255, isTotal ? 230 : 255);
    doc.setDrawColor(190, 198, 210);
    doc.rect(tableX, y, tableWidth, 8, "FD");
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(20, 29, 45);
    doc.text(label, labelX, y + 5.5);
    doc.text(value, valueX, y + 5.5, { align: "right" });
    y += 8;
  });

  return y + 6;
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
      `Documento generado desde VikezCorp ERP para la cotizacion ${sanitize(quotation?.number, "sin numero")}.`,
      14,
      289,
    );
    doc.text(`Pagina ${page} de ${pageCount}`, 196, 289, { align: "right" });
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
  doc.text(sanitize(quotation?.number, "Cotizacion sin numero"), 14, 56);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_NAVY);
  doc.setFontSize(10);
  doc.text("Fecha", 142, 46);
  doc.text("Vigencia", 142, 59);
  doc.text("Estado", 142, 72);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 29, 45);
  doc.text(formatDateDMY(quotation?.date) || "Sin fecha", 168, 46);
  doc.text(formatDateDMY(quotation?.validity) || "Sin fecha", 168, 59);
  doc.text(sanitize(quotation?.status, "Pendiente"), 168, 72);

  doc.setDrawColor(...LINE_BLUE);
  doc.line(14, 80, 196, 80);

  drawSectionTitle(doc, "Datos del cliente", 14, 88);
  let y = 104;
  drawTextBlock(doc, "Cliente", quotation?.company, 18, y, 54);
  drawTextBlock(doc, "Razon social", quotation?.legalName, 76, y, 54);
  drawTextBlock(doc, "Cedula juridica", quotation?.legalId, 134, y, 40);

  y += 24;
  drawTextBlock(doc, "Sucursal", quotation?.branch?.address, 18, y, 54);
  drawTextBlock(
    doc,
    "Ubicacion",
    [quotation?.branch?.province, quotation?.branch?.district].filter(Boolean).join(", "),
    76,
    y,
    54,
  );
  drawTextBlock(doc, "Representante", `${sanitize(quotation?.representative?.name, "Sin representante")}\n${sanitize(quotation?.representative?.email)}`, 134, y, 54);

  y += 28;
  y = drawProductsTable(doc, quotation, y);
  y = ensureSpace(doc, y, getPaymentSummaryHeight(quotation) + 14, quotation);

  drawSectionTitle(doc, "Resumen de pago", 14, y);
  y += 14;
  y = drawPaymentSummary(doc, quotation, y);

  if (quotation?.notes) {
    y += 28;
    y = ensureSpace(doc, y, 28, quotation);
    drawSectionTitle(doc, "Notas", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(20, 29, 45);
    doc.text(doc.splitTextToSize(quotation.notes, 174), 18, y + 16);
  }

  drawFooter(doc, quotation);

  const filename = `${sanitize(quotation?.number, "proforma").replace(/[^a-zA-Z0-9-_]/g, "_")}-proforma.pdf`;
  return { doc, filename };
}

export async function downloadQuotationProforma(quotation) {
  const { doc, filename } = await createQuotationProforma(quotation);
  doc.save(filename);
}
