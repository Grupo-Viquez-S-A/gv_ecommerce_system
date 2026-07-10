import { createClient } from "npm:@supabase/supabase-js@2";
import { getSmtpConfig, isSmtpConfigured, sendSmtpMail } from "../_shared/mailer.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
        .select("representative_id, name, email, user_id")
        .eq("representative_id", representativeId)
        .maybeSingle(),
      supabaseAdmin
        .from("businesses")
        .select("business_id, business_name, legal_name")
        .eq("business_id", quotation.business_id)
        .maybeSingle(),
    ]);

    if (representativeError) {
      return errorResponse("No fue posible cargar el representante.", 500, representativeError);
    }

    if (businessError) {
      return errorResponse("No fue posible cargar el cliente.", 500, businessError);
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
        getErrorMessage(sendError, "No fue posible enviar la notificacion de nueva cotizacion."),
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
        error: getErrorMessage(error, "No fue posible enviar la notificacion de nueva cotizacion."),
        details: getErrorDetails(error),
      },
      500,
    );
  }
});
