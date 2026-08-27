import { createClient } from "npm:@supabase/supabase-js@2";

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
const COMMERCIAL_OPERATION_ROLE_CODES = new Set([
  "admin",
  "administrador",
  "super_admin",
  "gerente",
  "manager",
  "encargado",
  "presidente",
  "president",
  "sales_agent",
]);

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  connectTls(options: { hostname: string; port: number }): Promise<{
    read(buffer: Uint8Array): Promise<number | null>;
    write(buffer: Uint8Array): Promise<number>;
    close(): void;
  }>;
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

function normalizeOrigin(value: string | undefined) {
  const candidate = String(value || "").trim().replace(/\/+$/, "");
  if (!candidate) return "";

  try {
    return new URL(candidate).origin;
  } catch {
    return "";
  }
}

function getConfiguredCorsHeaders() {
  const configuredOrigin = normalizeOrigin(
    Deno.env.get("CORS_ALLOWED_ORIGIN") ||
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_URL"),
  );

  return {
    ...(configuredOrigin ? { "Access-Control-Allow-Origin": configuredOrigin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
}

function isOriginAllowed(request: Request) {
  const requestOrigin = normalizeOrigin(request.headers.get("Origin") || undefined);
  if (!requestOrigin) return true;

  const configuredOrigin = normalizeOrigin(
    Deno.env.get("CORS_ALLOWED_ORIGIN") ||
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_URL"),
  );

  return Boolean(configuredOrigin && requestOrigin === configuredOrigin);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeRoleCode(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getTodayCostaRica() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isActiveRecord(record: any, today: string) {
  return Boolean(
    record &&
      record.is_active !== false &&
      (!record.start_date || record.start_date <= today) &&
      (!record.end_date || record.end_date >= today),
  );
}

async function authorizeCompanyAction({
  supabaseAdmin,
  userId,
  companyId,
  allowedRoleCodes,
}: {
  supabaseAdmin: any;
  userId: string;
  companyId: string;
  allowedRoleCodes: Set<string>;
}) {
  const today = getTodayCostaRica();
  const { data: applications, error: applicationError } = await supabaseAdmin
    .from("user_applications")
    .select("is_active, start_date, end_date")
    .eq("user_id", userId)
    .eq("application_id", ECOMMERCE_APPLICATION_ID);

  if (applicationError) {
    return { authorized: false, status: 500, message: "No fue posible validar el acceso a la aplicacion.", details: applicationError };
  }
  if (!(applications || []).some((record: any) => isActiveRecord(record, today))) {
    return { authorized: false, status: 403, message: "Tu usuario no tiene acceso activo a esta aplicacion." };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return { authorized: false, status: 500, message: "No fue posible validar el perfil del usuario.", details: profileError };
  }
  if (!profile || profile.is_active === false) {
    return { authorized: false, status: 403, message: "Tu perfil de usuario no esta activo." };
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("user_memberships")
    .select("company_id, role_id, is_active, start_date, end_date")
    .eq("user_id", userId)
    .eq("company_id", companyId);

  if (membershipError) {
    return { authorized: false, status: 500, message: "No fue posible validar la membresia del usuario.", details: membershipError };
  }

  const roleIds = [...new Set((memberships || [])
    .filter((record: any) => isActiveRecord(record, today))
    .map((record: any) => record.role_id)
    .filter(Boolean))];

  if (roleIds.length === 0) {
    return { authorized: false, status: 403, message: "No tienes una membresia activa para la empresa solicitada." };
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("role_code, role_name")
    .in("role_id", roleIds);

  if (rolesError) {
    return { authorized: false, status: 500, message: "No fue posible validar el rol del usuario.", details: rolesError };
  }

  const authorizedRole = (roles || []).find((role: any) =>
    allowedRoleCodes.has(normalizeRoleCode(role.role_code)) ||
    allowedRoleCodes.has(normalizeRoleCode(role.role_name)));

  if (!authorizedRole) {
    return { authorized: false, status: 403, message: "Tu rol no permite realizar esta operacion." };
  }

  return { authorized: true, roleCode: normalizeRoleCode(authorizedRole.role_code) || normalizeRoleCode(authorizedRole.role_name) };
}

function getSmtpConfig() {
  const ecommerceSecret = (name: string) =>
    Deno.env.get(`ECOMMERCE_SMTP_${name}`) || Deno.env.get(`SMTP_${name}`) || "";
  const host = ecommerceSecret("HOST");
  const port = Number(ecommerceSecret("PORT") || "465");
  const username = ecommerceSecret("USERNAME");
  const password = ecommerceSecret("PASSWORD");
  const fromEmail = ecommerceSecret("FROM_EMAIL") ||
    ecommerceSecret("SENDER_EMAIL") || username;
  const fromName = ecommerceSecret("FROM_NAME") ||
    ecommerceSecret("SENDER_NAME") || "E-commerce - Grupo Viquez S.A";
  return { host, port, username, password, fromEmail, fromName };
}

function isSmtpConfigured(config: ReturnType<typeof getSmtpConfig>) {
  return Boolean(config.host && config.port && config.username &&
    config.password && config.fromEmail);
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${encodeBase64(value)}?=`;
}

function assertMailbox(value: string, field: string) {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > 254 ||
    /[\r\n<>]/.test(normalized) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error(`${field} no es una direccion de correo valida.`);
  }
  return normalized;
}

function assertHeaderText(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200 || /[\r\n]/.test(normalized)) {
    throw new Error(`${field} contiene caracteres no permitidos.`);
  }
  return normalized;
}

function normalizeSmtpBody(value: string) {
  return value.replace(/\r?\n/g, "\r\n").split("\r\n")
    .map((line) => line.startsWith(".") ? `.${line}` : line).join("\r\n");
}

async function sendSmtpCommand(
  connection: {
    read(buffer: Uint8Array): Promise<number | null>;
    write(buffer: Uint8Array): Promise<number>;
  },
  bufferState: { value: string },
  command: string | null,
  expectedCodes: number[],
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  if (command !== null) await connection.write(encoder.encode(`${command}\r\n`));

  while (true) {
    const match = bufferState.value.match(/(?:^|\r\n)(\d{3}) [^\r\n]*(?:\r\n|$)/);
    if (match) {
      const responseEnd = match.index
        ? match.index + match[0].length
        : match[0].length;
      const response = bufferState.value.slice(0, responseEnd).trim();
      bufferState.value = bufferState.value.slice(responseEnd);
      const statusCode = Number(match[1]);
      if (!expectedCodes.includes(statusCode)) {
        throw new Error(`SMTP respondio ${statusCode}: ${response}`);
      }
      return response;
    }

    const chunk = new Uint8Array(4096);
    const bytesRead = await connection.read(chunk);
    if (bytesRead === null) {
      throw new Error("La conexion SMTP se cerro inesperadamente.");
    }
    bufferState.value += decoder.decode(chunk.subarray(0, bytesRead));
  }
}

async function sendSmtpMail({
  host, port, username, password, fromEmail, fromName, to, subject, text, html,
}: {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (port !== 465) {
    throw new Error("Esta funcion SMTP usa TLS directo. Configura SMTP_PORT=465.");
  }

  const safeFromEmail = assertMailbox(fromEmail, "El remitente");
  const safeTo = assertMailbox(to, "El destinatario");
  const safeFromName = assertHeaderText(fromName, "El nombre del remitente");
  const safeSubject = assertHeaderText(subject, "El asunto");
  const connection = await Deno.connectTls({ hostname: host, port });
  const bufferState = { value: "" };
  const boundary = `gv-mail-${crypto.randomUUID()}`;
  const message = [
    `From: ${encodeHeader(safeFromName)} <${safeFromEmail}>`,
    `To: ${safeTo}`,
    `Subject: ${encodeHeader(safeSubject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  try {
    await sendSmtpCommand(connection, bufferState, null, [220]);
    await sendSmtpCommand(connection, bufferState, `EHLO ${host}`, [250]);
    await sendSmtpCommand(connection, bufferState, "AUTH LOGIN", [334]);
    await sendSmtpCommand(connection, bufferState, encodeBase64(username), [334]);
    await sendSmtpCommand(connection, bufferState, encodeBase64(password), [235]);
    await sendSmtpCommand(connection, bufferState, `MAIL FROM:<${safeFromEmail}>`, [250]);
    await sendSmtpCommand(connection, bufferState, `RCPT TO:<${safeTo}>`, [250, 251]);
    await sendSmtpCommand(connection, bufferState, "DATA", [354]);
    await sendSmtpCommand(connection, bufferState, `${normalizeSmtpBody(message)}\r\n.`, [250]);
    await sendSmtpCommand(connection, bufferState, "QUIT", [221]);
  } finally {
    connection.close();
  }
}

const corsHeaders = getConfiguredCorsHeaders();

type PaymentRow = {
  amount: number | string;
  payment_date: string | null;
  method_id: string | null;
  reference_number: string | null;
  created_at: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatCurrency(value: unknown) {
  return `CRC ${getNumber(value).toLocaleString("es-CR", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value: unknown) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getErrorDetails(error: unknown) {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }

  return String(error);
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message && error.message !== "{}") {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      error_description?: unknown;
      error?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      status?: unknown;
    };

    const message = [
      maybeError.message,
      maybeError.error_description,
      maybeError.error,
      maybeError.details,
      maybeError.hint,
      maybeError.code,
      maybeError.status ? `Status ${maybeError.status}` : null,
    ].find((value) => typeof value === "string" && value.trim());

    if (message) return String(message);
  }

  return fallbackMessage;
}

function errorResponse(message: string, status = 400, details?: unknown) {
  console.warn("notify-payment-success rejected:", {
    status,
    message,
    details: getErrorDetails(details),
  });

  return jsonResponse(
    {
      ok: false,
      error: message,
      message,
    },
    status,
  );
}

function buildEmailHtml({
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
}: {
  representativeName: string;
  clientName: string;
  orderCode: string;
  quotationNumber: string;
  amountPaid: number;
  balance: number;
  total: number;
  paymentStatus: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
}) {
  const isPaid = paymentStatus === "pagado" || balance <= 0;
  const statusText = isPaid ? "Pagado" : "Pago parcial registrado";
  const safeRepresentativeName = escapeHtml(representativeName || "representante");
  const safeClientName = escapeHtml(clientName);
  const safeOrderCode = escapeHtml(orderCode);
  const safeQuotationNumber = escapeHtml(quotationNumber);
  const safePaymentMethod = escapeHtml(paymentMethod);
  const safeReferenceNumber = escapeHtml(referenceNumber);

  return `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#111827;border-radius:12px;padding:22px 24px;color:#ffffff;">
          <p style="margin:0;color:#d1d5db;font-size:13px;">Grupo Viquez S.A</p>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Pago confirmado correctamente</h1>
        </div>

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-top:16px;padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Hola ${safeRepresentativeName}, hemos validado el comprobante de pago asociado a tu orden de venta.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Cliente</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safeClientName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Orden</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safeOrderCode}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Cotizacion</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safeQuotationNumber}</td>
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
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safePaymentMethod}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Fecha del pago</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${formatDate(paymentDate)}</td>
            </tr>
            ${
              referenceNumber
                ? `<tr>
                    <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Referencia</td>
                    <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safeReferenceNumber}</td>
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

function buildEmailText({
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
}: {
  representativeName: string;
  clientName: string;
  orderCode: string;
  quotationNumber: string;
  amountPaid: number;
  balance: number;
  total: number;
  paymentStatus: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
}) {
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

Deno.serve(async (request) => {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: "Origen no permitido." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Metodo no permitido.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return errorResponse(
      "Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY.",
      500,
    );
  }

  const smtpConfig = getSmtpConfig();

  if (!isSmtpConfigured(smtpConfig)) {
    return errorResponse(
      "Faltan variables SMTP: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD y SMTP_FROM_EMAIL.",
      500,
    );
  }

  const authorization = request.headers.get("Authorization") || "";

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    const { data: currentUserData, error: currentUserError } =
      await supabaseAuth.auth.getUser();

    if (currentUserError || !currentUserData.user) {
      return errorResponse(
        "Debes iniciar sesion para enviar la notificacion de pago.",
        401,
        currentUserError,
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch (parseError) {
      return errorResponse(
        "El cuerpo de la solicitud no es un JSON valido.",
        400,
        parseError,
      );
    }

    const productionOrderId = getRequiredString(body?.production_order_id);

    if (!productionOrderId) {
      return errorResponse("Falta el identificador de la orden.", 400);
    }

    if (!isUuid(productionOrderId)) {
      return errorResponse("El identificador de la orden no tiene un formato valido.", 400);
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("production_orders")
      .select(
        "production_order_id, quotation_id, production_order_code, payment_status, balance",
      )
      .eq("production_order_id", productionOrderId)
      .maybeSingle();

    if (orderError) {
      return errorResponse("No fue posible cargar la orden.", 500, orderError);
    }

    if (!order) {
      return errorResponse("La orden no existe.", 404);
    }

    const { data: quotation, error: quotationError } = await supabaseAdmin
      .from("quotations")
      .select(
        "quotation_id, quotation_number, customer_id, total",
      )
      .eq("quotation_id", order.quotation_id)
      .maybeSingle();

    if (quotationError) {
      return errorResponse(
        "No fue posible cargar la cotizacion asociada.",
        500,
        quotationError,
      );
    }

    if (!quotation) {
      return errorResponse("La cotizacion asociada no existe.", 404);
    }

    const [
      { data: business, error: businessError },
      { data: emails, error: emailsError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("customers")
        .select("customer_id, company_id, commercial_name, company_name")
        .eq("customer_id", quotation.customer_id)
        .maybeSingle(),
      supabaseAdmin
        .from("emails")
        .select("email")
        .eq("customer_id", quotation.customer_id)
        .order("is_primary", { ascending: false })
        .limit(1),
      supabaseAdmin
        .from("payments")
        .select("amount, payment_date, method_id, reference_number, created_at")
        .eq("production_order_id", productionOrderId)
        .eq("is_valid", true)
        .order("payment_date", { ascending: false }),
    ]);

    if (businessError) {
      return errorResponse(
        "No fue posible cargar el cliente.",
        500,
        businessError,
      );
    }

    if (!business) {
      return errorResponse("El cliente de la orden no existe.", 404);
    }

    if (emailsError) {
      return errorResponse(
        "No fue posible cargar el correo del cliente.",
        500,
        emailsError,
      );
    }

    const authorizationResult = await authorizeCompanyAction({
      supabaseAdmin,
      userId: currentUserData.user.id,
      companyId: business.company_id,
      allowedRoleCodes: COMMERCIAL_OPERATION_ROLE_CODES,
    });

    if (!authorizationResult.authorized) {
      return errorResponse(authorizationResult.message, authorizationResult.status, authorizationResult.details);
    }

    if (paymentsError) {
      return errorResponse(
        "No fue posible cargar los pagos validados.",
        500,
        paymentsError,
      );
    }

    const recipientEmail = String(emails?.[0]?.email || "").trim();

    if (!recipientEmail) {
      return errorResponse(
        "El cliente no tiene correo registrado.",
        409,
        business,
      );
    }

    const validPayments = (payments || []) as PaymentRow[];
    const amountPaid = validPayments.reduce(
      (sum, payment) => sum + getNumber(payment.amount),
      0,
    );
    const lastPayment = validPayments[0] || null;

    let paymentMethod = "No indicado";

    if (lastPayment?.method_id) {
      const { data: method, error: methodError } = await supabaseAdmin
        .from("payment_methods")
        .select("method_name")
        .eq("method_id", lastPayment.method_id)
        .maybeSingle();

      if (methodError) {
        return errorResponse(
          "No fue posible cargar el metodo de pago.",
          500,
          methodError,
        );
      }

      paymentMethod = method?.method_name || paymentMethod;
    }

    const emailPayload = {
      representativeName:
        business?.commercial_name || business?.company_name || "cliente",
      clientName:
        business?.commercial_name || business?.company_name || "Cliente sin nombre",
      orderCode: order.production_order_code || "Sin codigo",
      quotationNumber: quotation.quotation_number || "Sin cotizacion",
      amountPaid,
      balance: getNumber(order.balance),
      total: getNumber(quotation.total),
      paymentStatus: String(order.payment_status || ""),
      paymentDate: lastPayment?.payment_date || lastPayment?.created_at || "",
      paymentMethod,
      referenceNumber: lastPayment?.reference_number || null,
    };

    const subject = `Pago confirmado - ${emailPayload.quotationNumber}`;

    await sendSmtpMail({
      host: smtpConfig.host,
      port: smtpConfig.port,
      username: smtpConfig.username,
      password: smtpConfig.password,
      fromEmail: smtpConfig.fromEmail,
      fromName: smtpConfig.fromName,
      to: recipientEmail,
      subject,
      text: buildEmailText(emailPayload),
      html: buildEmailHtml(emailPayload),
    });

    return jsonResponse({
      ok: true,
      message: "Notificacion de pago enviada correctamente.",
      recipient: representative.email,
      subject,
    });
  } catch (error) {
    console.error("notify-payment-success error:", getErrorDetails(error));

    return jsonResponse(
      {
        ok: false,
        error: "No fue posible enviar la notificacion de pago.",
      },
      500,
    );
  }
});
