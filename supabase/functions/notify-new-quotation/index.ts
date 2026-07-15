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
  const host = Deno.env.get("SMTP_HOST") || "";
  const port = Number(Deno.env.get("SMTP_PORT") || "465");
  const username = Deno.env.get("SMTP_USERNAME") || "";
  const password = Deno.env.get("SMTP_PASSWORD") || "";
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") ||
    Deno.env.get("SMTP_SENDER_EMAIL") || username;
  const fromName = Deno.env.get("SMTP_FROM_NAME") ||
    Deno.env.get("SMTP_SENDER_NAME") || "Grupo Viquez S.A";
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

function getErrorDetails(error: unknown) {
  if (!error) return null;

  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
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
    const maybeError = error as { message?: unknown; error?: unknown };
    const message = [maybeError.message, maybeError.error].find(
      (value) => typeof value === "string" && value.trim(),
    );

    if (message) return String(message);
  }

  return fallbackMessage;
}

function errorResponse(message: string, status = 400, details?: unknown) {
  console.warn("notify-new-quotation rejected:", {
    status,
    message,
    details: getErrorDetails(details),
  });

  return jsonResponse({ ok: false, error: message }, status);
}

function buildEmailHtml({
  representativeName,
  clientName,
  quotationNumber,
  loginUrl,
}: {
  representativeName: string;
  clientName: string;
  quotationNumber: string;
  loginUrl: string;
}) {
  const safeRepresentativeName = escapeHtml(representativeName || "representante");
  const safeClientName = escapeHtml(clientName);
  const safeQuotationNumber = escapeHtml(quotationNumber);
  const safeLoginUrl = escapeHtml(loginUrl);
  return `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#111827;border-radius:12px;padding:22px 24px;color:#ffffff;">
          <p style="margin:0;color:#d1d5db;font-size:13px;">Grupo Viquez S.A</p>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Tienes una nueva cotizacion</h1>
        </div>

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin-top:16px;padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
            Hola ${safeRepresentativeName}, se genero una nueva cotizacion para ${safeClientName}.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Cotizacion</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safeQuotationNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;color:#6b7280;">Empresa</td>
              <td style="padding:10px 0;border-bottom:1px solid #edf0f5;text-align:right;font-weight:600;">${safeClientName}</td>
            </tr>
          </table>

          ${
            loginUrl
              ? `<div style="margin-top:22px;text-align:center;">
            <a href="${safeLoginUrl}" style="display:inline-block;background:#c9a227;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">
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

function buildEmailText({
  representativeName,
  clientName,
  quotationNumber,
  loginUrl,
}: {
  representativeName: string;
  clientName: string;
  quotationNumber: string;
  loginUrl: string;
}) {
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
  const siteUrl = Deno.env.get("SITE_URL") || Deno.env.get("APP_URL") || "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return errorResponse(
      "Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY.",
      500,
    );
  }

  const smtpConfig = getSmtpConfig();
  const smtpConfigured = isSmtpConfigured(smtpConfig);

  const authorization = request.headers.get("Authorization") || "";

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: currentUserData, error: currentUserError } =
      await supabaseAuth.auth.getUser();

    if (currentUserError || !currentUserData.user) {
      return errorResponse(
        "Debes iniciar sesion para enviar la notificacion.",
        401,
        currentUserError,
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch (parseError) {
      return errorResponse("El cuerpo de la solicitud no es un JSON valido.", 400, parseError);
    }

    const quotationId = getRequiredString(body?.quotation_id);
    const representativeId = getRequiredString(body?.representative_id);

    if (!quotationId || !representativeId) {
      return errorResponse("Faltan datos: cotizacion o representante.", 400);
    }

    if (!isUuid(quotationId) || !isUuid(representativeId)) {
      return errorResponse("Los identificadores recibidos no tienen un formato valido.", 400);
    }

    const { data: quotation, error: quotationError } = await supabaseAdmin
      .from("quotations")
      .select("quotation_id, quotation_number, business_id")
      .eq("quotation_id", quotationId)
      .maybeSingle();

    if (quotationError) {
      return errorResponse("No fue posible cargar la cotizacion.", 500, quotationError);
    }

    if (!quotation) {
      return errorResponse("La cotizacion no existe.", 404);
    }

    const [
      { data: representative, error: representativeError },
      { data: business, error: businessError },
    ] = await Promise.all([
      supabaseAdmin
        .from("representatives")
        .select("representative_id, business_id, name, email, user_id")
        .eq("representative_id", representativeId)
        .maybeSingle(),
      supabaseAdmin
        .from("businesses")
        .select("business_id, company_id, business_name, legal_name")
        .eq("business_id", quotation.business_id)
        .maybeSingle(),
    ]);

    if (representativeError) {
      return errorResponse("No fue posible cargar el representante.", 500, representativeError);
    }

    if (businessError) {
      return errorResponse("No fue posible cargar el cliente.", 500, businessError);
    }

    if (!business) {
      return errorResponse("El cliente de la cotizacion no existe.", 404);
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

    if (!representative || representative.business_id !== quotation.business_id) {
      return errorResponse("El representante no pertenece al cliente de la cotizacion.", 409);
    }

    if (!representative?.email) {
      return errorResponse("El representante no tiene correo registrado.", 409);
    }

    if (!representative.user_id) {
      return errorResponse(
        "El representante todavia no ha activado su cuenta; no se envia notificacion de nueva cotizacion.",
        409,
      );
    }

    const { data: existingNotification, error: existingNotificationError } =
      await supabaseAdmin
        .from("quotation_notifications")
        .select("notification_id, status")
        .eq("quotation_id", quotationId)
        .eq("representative_id", representativeId)
        .eq("notification_type", "new_quotation")
        .maybeSingle();

    if (existingNotificationError) {
      return errorResponse(
        "No fue posible validar el historial de notificaciones.",
        500,
        existingNotificationError,
      );
    }

    if (existingNotification && existingNotification.status === "sent") {
      return jsonResponse({
        ok: true,
        message: "La notificacion ya habia sido enviada.",
        skipped: true,
      });
    }

    if (!smtpConfigured) {
      return errorResponse(
        "Faltan variables SMTP: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD y SMTP_FROM_EMAIL.",
        500,
      );
    }

    let notificationId = existingNotification?.notification_id || null;

    if (!notificationId) {
      const { data: notificationRow, error: notificationInsertError } =
        await supabaseAdmin
          .from("quotation_notifications")
          .insert({
            quotation_id: quotationId,
            representative_id: representativeId,
            auth_user_id: representative.user_id,
            email: representative.email,
            notification_type: "new_quotation",
            status: "pending",
            attempt_count: 1,
            created_by: currentUserData.user.id,
          })
          .select("notification_id")
          .maybeSingle();

      if (notificationInsertError) {
        return errorResponse(
          "No fue posible registrar la notificacion.",
          500,
          notificationInsertError,
        );
      }

      notificationId = notificationRow?.notification_id || null;
    } else {
      await supabaseAdmin
        .from("quotation_notifications")
        .update({ status: "pending" })
        .eq("notification_id", notificationId);
    }

    const loginUrl = siteUrl ? siteUrl.replace(/\/+$/, "") : "";
    const clientName = business?.business_name || business?.legal_name || "tu empresa";
    const subject = `Nueva cotizacion - ${quotation.quotation_number}`;

    try {
      await sendSmtpMail({
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: smtpConfig.password,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
        to: representative.email,
        subject,
        text: buildEmailText({
          representativeName: representative.name || "",
          clientName,
          quotationNumber: quotation.quotation_number,
          loginUrl,
        }),
        html: buildEmailHtml({
          representativeName: representative.name || "",
          clientName,
          quotationNumber: quotation.quotation_number,
          loginUrl,
        }),
      });
    } catch (sendError) {
      if (notificationId) {
        await supabaseAdmin
          .from("quotation_notifications")
          .update({
            status: "failed",
            error_message: getErrorMessage(sendError, "No fue posible enviar el correo."),
          })
          .eq("notification_id", notificationId);
      }

      return errorResponse(
        "No fue posible enviar la notificacion de nueva cotizacion.",
        500,
        sendError,
      );
    }

    if (notificationId) {
      await supabaseAdmin
        .from("quotation_notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("notification_id", notificationId);
    }

    return jsonResponse({
      ok: true,
      message: "Notificacion de nueva cotizacion enviada.",
      recipient: representative.email,
      subject,
    });
  } catch (error) {
    console.error("notify-new-quotation error:", getErrorDetails(error));

    return jsonResponse(
      {
        ok: false,
        error: "No fue posible enviar la notificacion de nueva cotizacion.",
      },
      500,
    );
  }
});
