export function buildAccessEmailHtml({ representativeName, email, tempPassword, loginUrl }) {
  return `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#111827;border-radius:12px;padding:22px 24px;color:#ffffff;">
          <p style="margin:0;color:#d1d5db;font-size:13px;">Grupo Viquez S.A</p>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Tu acceso al portal de cliente</h1>
        </div>

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-top:16px;padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Hola ${representativeName || "representante"}, se genero un acceso para que puedas revisar tus cotizaciones en el portal de cliente.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Correo</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${email}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Contrasena temporal</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:700;">${tempPassword}</td>
            </tr>
          </table>

          ${
            loginUrl
              ? `<div style="margin-top:22px;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#c9a227;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">
              Iniciar sesion
            </a>
          </div>`
              : ""
          }

          <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
            Por seguridad, el sistema te pedira cambiar esta contrasena la primera vez que inicies sesion.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function buildAccessEmailText({ representativeName, email, tempPassword, loginUrl }) {
  return [
    `Hola ${representativeName || "representante"},`,
    "",
    "Se genero un acceso para que puedas revisar tus cotizaciones en el portal de cliente.",
    "",
    `Correo: ${email}`,
    `Contrasena temporal: ${tempPassword}`,
    "",
    loginUrl ? `Ingresa en: ${loginUrl}` : "",
    "",
    "Por seguridad, se te pedira cambiar esta contrasena la primera vez que inicies sesion.",
    "",
    "Grupo Viquez S.A",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildQuotationEmailHtml({ representativeName, clientName, quotationNumber, loginUrl }) {
  return `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#111827;border-radius:12px;padding:22px 24px;color:#ffffff;">
          <p style="margin:0;color:#d1d5db;font-size:13px;">Grupo Viquez S.A</p>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Tienes una nueva cotizacion</h1>
        </div>

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-top:16px;padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Hola ${representativeName || "representante"}, se genero una nueva cotizacion para ${clientName}.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Cotizacion</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${quotationNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Empresa</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${clientName}</td>
            </tr>
          </table>

          ${
            loginUrl
              ? `<div style="margin-top:22px;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#c9a227;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">
              Ver mi cotizacion
            </a>
          </div>`
              : ""
          }

          <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
            Inicia sesion con tu correo y contrasena habituales para revisar el detalle en tu portal de cliente.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function buildQuotationEmailText({ representativeName, clientName, quotationNumber, loginUrl }) {
  return [
    `Hola ${representativeName || "representante"},`,
    "",
    `Se genero una nueva cotizacion (${quotationNumber}) para ${clientName}.`,
    "",
    loginUrl
      ? `Ingresa a ${loginUrl} para revisarla en tu portal de cliente.`
      : "Ingresa a tu portal de cliente con tu correo y contrasena habituales para revisarla.",
    "",
    "Grupo Viquez S.A",
  ].join("\n");
}

function formatCurrency(value) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return `CRC ${safeValue.toLocaleString("es-CR", { maximumFractionDigits: 0 })}`;
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function buildPaymentEmailHtml(payload) {
  const {
    representativeName,
    clientName,
    orderCode,
    quotationNumber,
    amountPaid,
    balance,
    total,
    paymentStatus,
    paymentDate,
    paymentMethod,
    referenceNumber,
  } = payload;
  const isPaid = paymentStatus === "pagado" || balance <= 0;
  const statusText = isPaid ? "Pagado" : "Pago parcial registrado";

  return `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#111827;border-radius:12px;padding:22px 24px;color:#ffffff;">
          <p style="margin:0;color:#d1d5db;font-size:13px;">Grupo Viquez S.A</p>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Pago confirmado correctamente</h1>
        </div>

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-top:16px;padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Hola ${representativeName || "representante"}, hemos validado el comprobante de pago asociado a tu orden de venta.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Cliente</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Orden</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${orderCode}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Cotizacion</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${quotationNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Monto pagado</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${formatCurrency(amountPaid)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Total de la orden</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${formatCurrency(total)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Saldo pendiente</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${formatCurrency(balance)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Estado</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${statusText}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Metodo</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Fecha del pago</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${formatDate(paymentDate)}</td>
            </tr>
            ${
              referenceNumber
                ? `<tr>
                    <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Referencia</td>
                    <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${referenceNumber}</td>
                  </tr>`
                : ""
            }
          </table>

          <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
            Si tienes alguna consulta sobre este pago, puedes responder a este correo para contactar a soporte.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function buildPaymentEmailText(payload) {
  const {
    representativeName,
    clientName,
    orderCode,
    quotationNumber,
    amountPaid,
    balance,
    total,
    paymentStatus,
    paymentDate,
    paymentMethod,
    referenceNumber,
  } = payload;

  return [
    `Hola ${representativeName || "representante"},`,
    "",
    "Hemos validado correctamente el comprobante de pago asociado a tu orden de venta.",
    "",
    `Cliente: ${clientName}`,
    `Orden: ${orderCode}`,
    `Cotizacion: ${quotationNumber}`,
    `Monto pagado: ${formatCurrency(amountPaid)}`,
    `Total de la orden: ${formatCurrency(total)}`,
    `Saldo pendiente: ${formatCurrency(balance)}`,
    `Estado: ${paymentStatus === "pagado" || balance <= 0 ? "Pagado" : "Pago parcial registrado"}`,
    `Metodo: ${paymentMethod}`,
    `Fecha del pago: ${formatDate(paymentDate)}`,
    referenceNumber ? `Referencia: ${referenceNumber}` : null,
    "",
    "Grupo Viquez S.A",
  ]
    .filter(Boolean)
    .join("\n");
}
