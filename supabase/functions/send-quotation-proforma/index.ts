import { createClient } from "npm:@supabase/supabase-js@2";
import {
  authorizeCompanyAction,
  COMMERCIAL_OPERATION_ROLE_CODES,
} from "../_shared/authorization.ts";
import {
  escapeHtml,
  getCorsHeaders,
  isOriginAllowed,
  isUuid,
  isValidEmail,
} from "../_shared/http.ts";
import {
  getSmtpConfig,
  isSmtpConfigured,
  sendSmtpMail,
} from "../_shared/mailer.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const MAX_PDF_BYTES = 6 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_PDF_BYTES / 3) * 4 + 4;

function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(request: Request, message: string, status = 400) {
  console.warn("send-quotation-proforma rejected:", { status, message });
  return jsonResponse(request, { ok: false, error: message }, status);
}

function isApprovedQuotation(quotation: { state?: unknown; status?: unknown }) {
  const status = String(quotation.state || quotation.status || "")
    .trim()
    .toLowerCase();
  return status === "approved" || status === "aprobada";
}

function validatePdfBase64(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("No se recibio la proforma PDF.");
  }

  const normalized = value.replace(/\s+/g, "");
  if (!normalized || normalized.length > MAX_BASE64_LENGTH) {
    throw new Error("La proforma PDF supera el tamano permitido.");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error("El contenido de la proforma no es Base64 valido.");
  }

  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error("No fue posible decodificar la proforma PDF.");
  }

  if (binary.length > MAX_PDF_BYTES || !binary.startsWith("%PDF-")) {
    throw new Error("El archivo adjunto no es una proforma PDF valida.");
  }

  return normalized;
}

function getAttachmentFilename(quotationNumber: string) {
  const safeNumber = String(quotationNumber || "proforma")
    .replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${safeNumber}-proforma.pdf`;
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "correo registrado";
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

function getPublicMailError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (message.startsWith("SMTP_TIMEOUT:")) {
    return "El servidor de correo no respondio a tiempo. Intenta nuevamente.";
  }
  if (/SMTP respondio (?:535|534)/.test(message)) {
    return "El servidor de correo rechazo las credenciales del remitente.";
  }
  if (/SMTP respondio (?:550|551|552|553|554)/.test(message)) {
    return "El servidor de correo rechazo el destinatario o el mensaje.";
  }
  if (message === "SMTP_WRITE_FAILED") {
    return "La conexion con el servidor de correo se interrumpio durante el envio.";
  }

  return "No fue posible enviar la proforma por correo.";
}

function buildEmailText({
  representativeName,
  businessName,
  quotationNumber,
}: {
  representativeName: string;
  businessName: string;
  quotationNumber: string;
}) {
  return [
    `Hola ${representativeName || "representante"},`,
    "",
    `Adjuntamos la proforma ${quotationNumber} correspondiente a ${businessName}.`,
    "",
    "La cotizacion fue aprobada y el documento se encuentra disponible en formato PDF.",
    "",
    "Saludos,",
    "Grupo Viquez S.A",
  ].join("\n");
}

function buildEmailHtml({
  representativeName,
  businessName,
  quotationNumber,
}: {
  representativeName: string;
  businessName: string;
  quotationNumber: string;
}) {
  const safeRepresentative = escapeHtml(representativeName || "representante");
  const safeBusiness = escapeHtml(businessName);
  const safeQuotation = escapeHtml(quotationNumber);

  return `
    <div style="margin:0;padding:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#0b203c;border-radius:14px;padding:24px;color:#ffffff;">
          <p style="margin:0;color:#f2c230;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Grupo Viquez S.A</p>
          <h1 style="margin:9px 0 0;font-size:23px;line-height:1.3;">Proforma aprobada</h1>
        </div>
        <div style="margin-top:16px;border:1px solid #dce4ef;border-radius:14px;background:#ffffff;padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hola ${safeRepresentative},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
            Adjuntamos la proforma aprobada correspondiente a <strong>${safeBusiness}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #edf1f6;color:#64748b;">Cotizacion</td>
              <td style="padding:11px 0;border-bottom:1px solid #edf1f6;text-align:right;font-weight:700;">${safeQuotation}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;color:#64748b;">Documento</td>
              <td style="padding:11px 0;text-align:right;font-weight:700;">Proforma PDF adjunta</td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
            Este correo fue enviado al representante registrado para la sucursal seleccionada en la cotizacion.
          </p>
        </div>
      </div>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (!isOriginAllowed(request)) {
    return errorResponse(request, "Origen no permitido.", 403);
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return errorResponse(request, "Metodo no permitido.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return errorResponse(request, "La funcion no tiene configuracion de Supabase.", 500);
  }

  const smtpConfig = getSmtpConfig("ECOMMERCE_SMTP");
  if (!isSmtpConfigured(smtpConfig)) {
    return errorResponse(request, "La funcion no tiene configuracion SMTP.", 500);
  }

  const authorization = request.headers.get("Authorization") || "";
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) {
      return errorResponse(request, "Debes iniciar sesion para enviar la proforma.", 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse(request, "El cuerpo de la solicitud no es valido.", 400);
    }

    const quotationId = String(body.quotation_id || "").trim();
    if (!isUuid(quotationId)) {
      return errorResponse(request, "La cotizacion recibida no es valida.", 400);
    }

    let pdfBase64: string;
    try {
      pdfBase64 = validatePdfBase64(body.pdf_base64);
    } catch (validationError) {
      return errorResponse(
        request,
        validationError instanceof Error
          ? validationError.message
          : "La proforma PDF no es valida.",
        400,
      );
    }

    const { data: quotation, error: quotationError } = await supabaseAdmin
      .from("quotations")
      .select(
        "quotation_id, quotation_number, company_id, customer_id, user_id, state, status, is_active",
      )
      .eq("quotation_id", quotationId)
      .maybeSingle();

    if (quotationError) {
      console.error("Quotation lookup failed:", quotationError);
      return errorResponse(request, "No fue posible cargar la cotizacion.", 500);
    }
    if (!quotation || quotation.is_active === false) {
      return errorResponse(request, "La cotizacion no existe o esta inactiva.", 404);
    }
    if (!isApprovedQuotation(quotation)) {
      return errorResponse(
        request,
        "La proforma solo puede enviarse cuando la cotizacion este aprobada.",
        409,
      );
    }
    const [customerResult, emailResult] = await Promise.all([
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
    ]);

    if (customerResult.error || emailResult.error) {
      console.error("Quotation recipient lookup failed:", {
        customer: customerResult.error,
        email: emailResult.error,
      });
      return errorResponse(request, "No fue posible cargar el destinatario.", 500);
    }

    const customer = customerResult.data;
    if (!customer) {
      return errorResponse(request, "No se encontro el cliente de la cotizacion.", 404);
    }

    const companyId = quotation.company_id || customer.company_id;
    if (!companyId) {
      return errorResponse(request, "La cotizacion no tiene una empresa emisora valida.", 409);
    }

    const access = await authorizeCompanyAction({
      supabaseAdmin,
      userId: userData.user.id,
      companyId,
      allowedRoleCodes: COMMERCIAL_OPERATION_ROLE_CODES,
      // The e-commerce membership belongs to the group company while a
      // quotation may be issued by one of its operating companies.
      allowAnyActiveCompany: true,
    });

    if (!access.authorized) {
      return errorResponse(request, access.message, access.status);
    }
    if (access.roleCode === "sales_agent" && quotation.user_id !== userData.user.id) {
      return errorResponse(request, "Solo puedes enviar proformas de tus propias cotizaciones.", 403);
    }

    const recipientEmail = String(emailResult.data?.[0]?.email || "").trim();
    if (!isValidEmail(recipientEmail)) {
      return errorResponse(
        request,
        "El cliente no tiene un correo valido registrado.",
        409,
      );
    }

    const businessName = customer.commercial_name || customer.company_name || "el cliente";
    const quotationNumber = quotation.quotation_number || "Cotizacion";
    const filename = getAttachmentFilename(quotationNumber);
    const subject = `Proforma aprobada - ${quotationNumber}`;

    await sendSmtpMail({
      ...smtpConfig,
      to: recipientEmail,
      subject,
      text: buildEmailText({
        representativeName: businessName,
        businessName,
        quotationNumber,
      }),
      html: buildEmailHtml({
        representativeName: businessName,
        businessName,
        quotationNumber,
      }),
      attachments: [{
        filename,
        contentType: "application/pdf",
        contentBase64: pdfBase64,
      }],
    });

    return jsonResponse(request, {
      ok: true,
      message: `Proforma enviada a ${maskEmail(recipientEmail)}.`,
      recipient: maskEmail(recipientEmail),
    });
  } catch (error) {
    console.error(
      "send-quotation-proforma error:",
      error instanceof Error ? error.message : String(error),
    );
    return errorResponse(request, getPublicMailError(error), 502);
  }
});
