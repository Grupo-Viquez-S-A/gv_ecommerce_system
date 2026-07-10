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
      details: getErrorDetails(details),
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
        "quotation_id, quotation_number, representative_id, business_id, total",
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
      { data: representative, error: representativeError },
      { data: business, error: businessError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("representatives")
        .select("representative_id, name, email")
        .eq("representative_id", quotation.representative_id)
        .maybeSingle(),
      supabaseAdmin
        .from("businesses")
        .select("business_id, business_name, legal_name")
        .eq("business_id", quotation.business_id)
        .maybeSingle(),
      supabaseAdmin
        .from("payments")
        .select("amount, payment_date, method_id, reference_number, created_at")
        .eq("production_order_id", productionOrderId)
        .eq("is_valid", true)
        .order("payment_date", { ascending: false }),
    ]);

    if (representativeError) {
      return errorResponse(
        "No fue posible cargar el representante.",
        500,
        representativeError,
      );
    }

    if (businessError) {
      return errorResponse(
        "No fue posible cargar el cliente.",
        500,
        businessError,
      );
    }

    if (paymentsError) {
      return errorResponse(
        "No fue posible cargar los pagos validados.",
        500,
        paymentsError,
      );
    }

    if (!representative?.email) {
      return errorResponse(
        "El representante no tiene correo registrado.",
        409,
        representative,
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
      representativeName: representative.name || "representante",
      clientName:
        business?.business_name || business?.legal_name || "Cliente sin nombre",
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
      to: representative.email,
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
        error: getErrorMessage(
          error,
          "No fue posible enviar la notificacion de pago.",
        ),
        details: getErrorDetails(error),
      },
      500,
    );
  }
});
