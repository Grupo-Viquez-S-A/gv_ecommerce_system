import { createClient } from "npm:@supabase/supabase-js@2";
import { getSmtpConfig, isSmtpConfigured, sendSmtpMail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
const CLIENT_ROLE_ID = "7fa43251-f748-4dfa-b0b4-448231d1954d";

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

function getOptionalString(value: unknown) {
  const valueText = getRequiredString(value);
  return valueText || null;
}

function splitName(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return {
      name: words[0] || "Cliente",
      surname: "",
    };
  }

  return {
    name: words.slice(0, -1).join(" "),
    surname: words.at(-1) || "",
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
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

// Genera una contrasena temporal segura. Se envia por correo al
// representante y tambien se retorna en la respuesta por si el correo falla.
function generateTempPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const base = Array.from(bytes, (byte) => byte.toString(36)).join("").slice(0, 10);

  return `Gv${base}${Math.floor(Math.random() * 90 + 10)}!`;
}

function buildAccessEmailHtml({
  representativeName,
  email,
  tempPassword,
  loginUrl,
}: {
  representativeName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
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

function buildAccessEmailText({
  representativeName,
  email,
  tempPassword,
  loginUrl,
}: {
  representativeName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
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

async function findAuthUserIdByEmail(supabaseAdmin: any, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const existingUser = data?.users?.find(
      (user) => String(user.email || "").trim().toLowerCase() === normalizedEmail,
    );

    if (existingUser?.id) return existingUser.id;

    if (!data?.users || data.users.length < perPage) break;
  }

  return null;
}

function errorResponse(message: string, status = 400, details?: unknown) {
  console.warn("create-representative-user rejected:", {
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

// Determina si la cuenta ya completo su activacion.
function isAccountActive(appMetadata: Record<string, unknown>, lastSignInAt: string | null) {
  if (appMetadata?.must_change_password === false) return true;
  if (appMetadata?.activation_status === "active") return true;

  // Usuario legado: si ya inicio sesion alguna vez y no tiene una activacion
  // pendiente marcada explicitamente, se trata como activo para no bloquearlo.
  if (
    lastSignInAt &&
    appMetadata?.must_change_password !== true &&
    appMetadata?.activation_status !== "pending"
  ) {
    return true;
  }

  return false;
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
        "Debes iniciar sesion para crear el acceso del representante.",
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

    const representativeId = getRequiredString(body?.representative_id);
    const businessId = getRequiredString(body?.business_id);
    const branchId = getRequiredString(body?.branch_id);
    const companyId = getRequiredString(body?.company_id);
    const fullName = getRequiredString(body?.name);
    const email = getRequiredString(body?.email).toLowerCase();

    const missingFields: string[] = [];

    if (!representativeId) missingFields.push("representante");
    if (!businessId) missingFields.push("cliente");
    if (!branchId) missingFields.push("sucursal");
    if (!companyId) missingFields.push("empresa del grupo");
    if (!fullName) missingFields.push("nombre del representante");
    if (!email) missingFields.push("correo del representante");

    if (missingFields.length > 0) {
      return errorResponse(
        `Faltan estos datos: ${missingFields.join(", ")}.`,
        400,
        { missingFields },
      );
    }

    const { data: representative, error: representativeError } =
      await supabaseAdmin
        .from("representatives")
        .select("representative_id, business_id, branch_id, user_id, name, email")
        .eq("representative_id", representativeId)
        .maybeSingle();

    if (representativeError) {
      return errorResponse(
        "No fue posible validar el representante.",
        500,
        representativeError,
      );
    }

    if (!representative) {
      return errorResponse("El representante no existe.", 404);
    }

    if (representative.business_id !== businessId || representative.branch_id !== branchId) {
      return errorResponse(
        "El representante no pertenece al cliente o sucursal indicados.",
        409,
        representative,
      );
    }

    let userId = representative.user_id || null;

    if (!userId) {
      const { data: existingProfile, error: existingProfileError } =
        await supabaseAdmin
          .from("profiles")
          .select("user_id, email")
          .ilike("email", email)
          .maybeSingle();

      if (existingProfileError) {
        return errorResponse(
          "No fue posible validar si el perfil del representante ya existe.",
          500,
          existingProfileError,
        );
      }

      userId = existingProfile?.user_id || null;
    }

    if (!userId) {
      userId = await findAuthUserIdByEmail(supabaseAdmin, email);
    }

    let accountState: "new" | "pending" | "active" = "active";
    let finalMustChangePassword = false;
    let tempPassword: string | null = null;

    if (!userId) {
      // ===================================================
      // CUENTA NUEVA: se crea directamente con contrasena
      // temporal. No se envia ningun correo.
      // ===================================================
      tempPassword = generateTempPassword();

      console.log("create-representative-user: creando cuenta nueva sin correo", {
        email,
        accountState: "new",
      });

      const { data: createdUserData, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          app_metadata: {
            created_from: "quotation_representative",
            role: "client",
            representative_id: representativeId,
            business_id: businessId,
            branch_id: branchId,
            application_id: ECOMMERCE_APPLICATION_ID,
            must_change_password: true,
            activation_status: "pending",
            role_code: "cliente",
            application_code: "ecommerce",
          },
          user_metadata: {
            full_name: fullName,
          },
        });

      if (createUserError || !createdUserData?.user) {
        return errorResponse(
          getErrorMessage(
            createUserError,
            "No fue posible crear la cuenta del representante en Supabase Auth.",
          ),
          400,
          createUserError,
        );
      }

      userId = createdUserData.user.id;
      accountState = "new";
      finalMustChangePassword = true;
    } else {
      // ===================================================
      // USUARIO EXISTENTE: revisar si esta activo o pendiente.
      // ===================================================
      const { data: currentUserRecord, error: currentUserRecordError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (currentUserRecordError || !currentUserRecord?.user) {
        return errorResponse(
          "No fue posible validar la cuenta del representante.",
          500,
          currentUserRecordError,
        );
      }

      const existingUser = currentUserRecord.user;
      const currentAppMetadata = existingUser.app_metadata || {};
      const lastSignInAt = existingUser.last_sign_in_at || null;

      const active = isAccountActive(currentAppMetadata, lastSignInAt);

      if (active) {
        // Cuenta ya activa: no se genera contrasena nueva ni se modifica
        // must_change_password.
        accountState = "active";
        finalMustChangePassword = false;
      } else {
        // Cuenta pendiente (invitada/creada sin activar, o legado sin
        // metadata clara). Se genera una nueva contrasena temporal
        // directamente en Auth, sin enviar ningun correo.
        tempPassword = generateTempPassword();

        console.log("create-representative-user: regenerando contrasena temporal", {
          email,
          accountState: "pending",
        });

        const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            password: tempPassword,
            app_metadata: {
              ...currentAppMetadata,
              must_change_password: true,
              activation_status: "pending",
              role_code: currentAppMetadata.role_code || "cliente",
              application_code: currentAppMetadata.application_code || "ecommerce",
            },
          },
        );

        if (updateUserError) {
          return errorResponse(
            "No fue posible generar una nueva contrasena temporal para el representante.",
            500,
            updateUserError,
          );
        }

        accountState = "pending";
        finalMustChangePassword = true;
      }
    }

    const { name, surname } = splitName(fullName);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          name,
          surname,
          email,
          phone: getOptionalString(body?.phone),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (profileError) {
      return errorResponse(
        "No fue posible guardar el perfil del representante.",
        500,
        profileError,
      );
    }

    const { error: representativeUpdateError } = await supabaseAdmin
      .from("representatives")
      .update({
        user_id: userId,
        name: fullName,
        email,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("representative_id", representativeId);

    if (representativeUpdateError) {
      return errorResponse(
        "No fue posible enlazar el representante con el perfil.",
        500,
        representativeUpdateError,
      );
    }

    const startDate = getToday();

    const { data: existingMembership, error: existingMembershipError } =
      await supabaseAdmin
        .from("user_memberships")
        .select("membership_id")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("role_id", CLIENT_ROLE_ID)
        .maybeSingle();

    if (existingMembershipError) {
      return errorResponse(
        "No fue posible validar la membresia del cliente.",
        500,
        existingMembershipError,
      );
    }

    if (!existingMembership) {
      const { error: membershipError } = await supabaseAdmin
        .from("user_memberships")
        .insert({
          user_id: userId,
          company_id: companyId,
          department_id: null,
          role_id: CLIENT_ROLE_ID,
          is_active: true,
          start_date: startDate,
          end_date: null,
        });

      if (membershipError) {
        return errorResponse(
          "No fue posible asignar el rol Cliente al representante.",
          500,
          membershipError,
        );
      }
    }

    const { data: existingApplication, error: existingApplicationError } =
      await supabaseAdmin
        .from("user_applications")
        .select("user_application_id")
        .eq("user_id", userId)
        .eq("application_id", ECOMMERCE_APPLICATION_ID)
        .maybeSingle();

    if (existingApplicationError) {
      return errorResponse(
        "No fue posible validar el acceso al e-commerce.",
        500,
        existingApplicationError,
      );
    }

    if (!existingApplication) {
      const { error: applicationError } = await supabaseAdmin
        .from("user_applications")
        .insert({
          user_id: userId,
          application_id: ECOMMERCE_APPLICATION_ID,
          is_active: true,
          start_date: startDate,
          end_date: null,
        });

      if (applicationError) {
        return errorResponse(
          "No fue posible asignar acceso al e-commerce.",
          500,
          applicationError,
        );
      }
    }

    let emailNotification: { sent: boolean; error: string | null } = {
      sent: false,
      error: null,
    };

    if (tempPassword) {
      const smtpConfig = getSmtpConfig();

      if (!isSmtpConfigured(smtpConfig)) {
        emailNotification.error =
          "Faltan variables SMTP: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD y SMTP_FROM_EMAIL.";
      } else {
        const loginUrl = (Deno.env.get("SITE_URL") || Deno.env.get("APP_URL") || "")
          .trim()
          .replace(/\/+$/, "");

        try {
          await sendSmtpMail({
            host: smtpConfig.host,
            port: smtpConfig.port,
            username: smtpConfig.username,
            password: smtpConfig.password,
            fromEmail: smtpConfig.fromEmail,
            fromName: smtpConfig.fromName,
            to: email,
            subject: "Tu acceso al portal de cliente - Grupo Viquez",
            text: buildAccessEmailText({
              representativeName: fullName,
              email,
              tempPassword,
              loginUrl,
            }),
            html: buildAccessEmailHtml({
              representativeName: fullName,
              email,
              tempPassword,
              loginUrl,
            }),
          });

          emailNotification.sent = true;
        } catch (sendError) {
          console.error(
            "create-representative-user: fallo el envio de correo de acceso",
            getErrorDetails(sendError),
          );
          emailNotification.error = getErrorMessage(
            sendError,
            "No fue posible enviar el correo con la contrasena temporal.",
          );
        }
      }
    }

    return jsonResponse({
      ok: true,
      account_state: accountState,
      must_change_password: finalMustChangePassword,
      temp_password: tempPassword,
      email_notification: emailNotification,
      message: "Representante enlazado como cliente del e-commerce.",
      user: {
        user_id: userId,
        email,
      },
      representative: {
        representative_id: representativeId,
        user_id: userId,
      },
    });
  } catch (error) {
    console.error("create-representative-user error:", getErrorDetails(error));

    return jsonResponse(
      {
        ok: false,
        error: getErrorMessage(
          error,
          "No fue posible crear el usuario del representante.",
        ),
        details: getErrorDetails(error),
      },
      500,
    );
  }
});
