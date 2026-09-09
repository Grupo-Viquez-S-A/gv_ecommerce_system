import textileLogoUrl from "../assets/img/to_white_no_bg.png";

const RECEIPT_WIDTH = 1400;
const RECEIPT_HEIGHT = 900;

const moneyFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function sanitizeText(value, fallback = "No registrado") {
  const text = String(value || "").trim();
  return text || fallback;
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) {
    return dateFormatter.format(new Date());
  }

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00-06:00`);

  if (Number.isNaN(date.getTime())) {
    return dateFormatter.format(new Date());
  }

  return dateFormatter.format(date);
}

function drawTextBlock(ctx, text, x, y, maxWidth, lineHeight) {
  const words = sanitizeText(text).split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }

    line = testLine;
  });

  if (line) {
    lines.push(line);
  }

  lines.forEach((currentLine, index) => {
    ctx.fillText(currentLine, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function drawLabelValue(ctx, label, value, x, y, maxWidth) {
  ctx.fillStyle = "#6b7280";
  ctx.font = "700 22px Arial";
  ctx.fillText(label.toUpperCase(), x, y);

  ctx.fillStyle = "#111827";
  ctx.font = "700 30px Arial";
  return drawTextBlock(ctx, value, x, y + 42, maxWidth, 38);
}

function drawAmountRow(ctx, label, value, x, y, width, accent = false) {
  ctx.fillStyle = accent ? "#eef6f1" : "#f8fafc";
  ctx.fillRect(x, y, width, 76);

  ctx.fillStyle = accent ? "#0f3d2e" : "#374151";
  ctx.font = "700 24px Arial";
  ctx.fillText(label, x + 26, y + 47);

  ctx.fillStyle = accent ? "#0f3d2e" : "#111827";
  ctx.font = "800 30px Arial";
  ctx.textAlign = "right";
  ctx.fillText(formatMoney(value), x + width - 26, y + 48);
  ctx.textAlign = "left";
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export async function createPaymentReceiptPngBlob({
  orderCode,
  clientName,
  clientLegalId,
  clientIdentificationType,
  clientAddress,
  amount,
  previousBalance,
  pendingAmount,
  paymentDate,
  invoiceNumber,
  referenceNumber,
  paymentMethod,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = RECEIPT_WIDTH;
  canvas.height = RECEIPT_HEIGHT;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT);

  ctx.fillStyle = "#103828";
  ctx.fillRect(0, 0, RECEIPT_WIDTH, 230);

  const logo = await loadImage(textileLogoUrl);
  if (logo) {
    ctx.drawImage(logo, 90, 45, 120, 120);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("TEXTILES DE OCCIDENTE S.A", RECEIPT_WIDTH / 2, 70);
  ctx.font = "700 23px Arial";
  ctx.fillText("3-101-958719", RECEIPT_WIDTH / 2, 112);
  ctx.fillText("Grecia, Alajuela", RECEIPT_WIDTH / 2, 145);
  ctx.fillText("info@textilesoccidente.com", RECEIPT_WIDTH / 2, 178);

  ctx.textAlign = "right";
  ctx.font = "800 28px Arial";
  ctx.fillText("Recibo de dinero", RECEIPT_WIDTH - 90, 82);
  ctx.font = "700 24px Arial";
  ctx.fillText(`No. ${sanitizeText(orderCode, "Sin orden")}`, RECEIPT_WIDTH - 90, 132);
  ctx.textAlign = "left";

  ctx.fillStyle = "#111827";
  ctx.font = "800 42px Arial";
  ctx.fillText("Recibo de dinero", 90, 310);

  ctx.fillStyle = "#374151";
  ctx.font = "24px Arial";
  ctx.fillText(`Fecha de pago: ${formatDate(paymentDate)}`, 90, 350);
  ctx.fillText(`Referencia: ${sanitizeText(referenceNumber, "No indicada")}`, 90, 386);
  ctx.fillText(`Factura: ${sanitizeText(invoiceNumber, "No indicada")}`, 90, 422);
  ctx.fillText(`Metodo de pago: ${sanitizeText(paymentMethod, "No indicado")}`, 720, 422);

  drawLabelValue(ctx, "Cliente", clientName, 90, 465, 560);
  drawLabelValue(
    ctx,
    "Identificacion",
    `${sanitizeText(clientLegalId)} (${sanitizeText(clientIdentificationType, "tipo no indicado")})`,
    90,
    585,
    560,
  );
  drawLabelValue(ctx, "Direccion", clientAddress, 720, 465, 590);

  const amountX = 720;
  const amountY = 585;
  const amountWidth = 590;
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 2;
  ctx.strokeRect(amountX, amountY, amountWidth, 228);
  drawAmountRow(ctx, "Saldo anterior", previousBalance, amountX, amountY, amountWidth);
  drawAmountRow(ctx, "Monto recibido", amount, amountX, amountY + 76, amountWidth, true);
  drawAmountRow(ctx, "Monto pendiente", pendingAmount, amountX, amountY + 152, amountWidth);

  ctx.strokeStyle = "#d1d5db";
  ctx.beginPath();
  ctx.moveTo(90, 790);
  ctx.lineTo(560, 790);
  ctx.stroke();
  ctx.fillStyle = "#6b7280";
  ctx.font = "700 20px Arial";
  ctx.fillText("Firma autorizada", 90, 825);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("No fue posible generar el recibo en PNG."));
      }
    }, "image/png");
  });
}

export function downloadPaymentReceiptBlob(blob, fileName, fallbackUrl = "") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);

  if (/Android/i.test(window.navigator.userAgent) && fallbackUrl) {
    window.setTimeout(() => {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }, 500);
  }
}
