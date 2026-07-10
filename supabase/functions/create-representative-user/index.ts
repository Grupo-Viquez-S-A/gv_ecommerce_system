import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
const CLIENT_ROLE_ID = "7fa43251-f748-4dfa-b0b4-448231d1954d";
const RESET_PASSWORD_PATH = "/restablecer-contrasena";

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

function buildRedirectTo(appUrl: string) {
  const normalizedBase = appUrl.endsWith("/") ? appUrl : `${appUrl}/`;
  return new URL(RESET_PASSWORD_PATH, normalizedBase).toString();
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

function isAccountPending(appMetadata: Record<string, unknown>, lastSignInAt: string | null) {
  if (appMetadata?.must_change_password === true) return true;
  if (appMetadata?.activation_status === "pending") return true;

  // Usuario legado nunca inicio sesion y no tiene metadata clara: se
  // considera pendiente para poder enviarle un enlace de activacion.
  if (!lastSignInAt) return true;

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
  const appUrl = Deno.env.get("APP_URL");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return errorResponse(
      "Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY.",
      500,
    );
  }

  if (!appUrl) {
    return errorResponse(
      "Falta configurar el secreto APP_URL en la Edge Function. Debe contener el origen de la aplicacion, por ejemplo https://tu-dominio.replit.app",
      500,
    );
  }

  let redirectTo: string;

  try {
    redirectTo = buildRedirectTo(appUrl);
  } catch (buildError) {
    return errorResponse(
      "APP_URL no es una URL valida.",
      500,
      buildError,
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

  // Cliente publico independiente para enviar correos de recuperacion sin
  // reutilizar el Authorization del usuario interno que esta autenticado.
  const supabasePublic = createClient(supabaseUrl, anonKey, {
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
    const quotationId = getOptionalString(body?.quotation_id);

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

    let accountState: "invited" | "pending" | "active" = "active";
    let invitationSent = false;
    let emailType: "invite" | "recovery" | null = null;
    let finalMustChangePassword = false;

    let notificationId: string | null = null;

    if (quotationId) {
      const { data: notificationRow, error: notificationInsertError } =
        await supabaseAdmin
          .from("quotation_notifications")
          .insert({
            quotation_id: quotationId,
            representative_id: representativeId,
            email,
            notification_type: "invite",
            status: "pending",
            attempt_count: 1,
            created_by: currentUserData.user.id,
          })
          .select("notification_id")
          .maybeSingle();

      if (notificationInsertError) {
        console.warn(
          "No fue posible registrar la notificacion pendiente:",
          getErrorDetails(notificationInsertError),
        );
      } else {
        notificationId = notificationRow?.notification_id || null;
      }
    }

    if (!userId) {
      // ===================================================
      // CUENTA NUEVA: invitar y marcar activacion pendiente.
      // ===================================================
      console.log("create-representative-user: invitando cuenta nueva", {
        redirectTo,
        email,
        accountState: "invited",
      });

      const { data: invitationData, error: invitationError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            created_from: "quotation_representative",
            role: "client",
            representative_id: representativeId,
            business_id: businessId,
            branch_id: branchId,
            application_id: ECOMMERCE_APPLICATION_ID,
            full_name: fullName,
          },
        });

      if (invitationError || !invitationData?.user) {
        if (notificationId) {
          await supabaseAdmin
            .from("quotation_notifications")
            .update({
              status: "failed",
              error_message: getErrorMessage(
                invitationError,
                "No fue posible enviar la invitacion.",
              ),
            })
            .eq("notification_id", notificationId);
        }

        return errorResponse(
          getErrorMessage(
            invitationError,
            "No fue posible crear la invitacion del representante en Supabase Auth.",
          ),
          400,
          invitationError,
        );
      }

      userId = invitationData.user.id;

      const invitedAppMetadata = invitationData.user.app_metadata || {};

      const { error: appMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          app_metadata: {
            ...invitedAppMetadata,
            must_change_password: true,
            activation_status: "pending",
            role_code: "cliente",
            application_code: "ecommerce",
          },
        },
      );

      if (appMetadataError) {
        return errorResponse(
          "No fue posible configurar el acceso del representante.",
          500,
          appMetadataError,
        );
      }

      accountState = "invited";
      invitationSent = true;
      emailType = "invite";
      finalMustChangePassword = true;

      if (notificationId) {
        await supabaseAdmin
          .from("quotation_notifications")
          .update({
            status: "sent",
            auth_user_id: userId,
            sent_at: new Date().toISOString(),
          })
          .eq("notification_id", notificationId);
      }
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
      const pending = !active && isAccountPending(currentAppMetadata, lastSignInAt);

      if (active) {
        // CASO A: cuenta ya activa. No se envia ningun correo ni se
        // modifica must_change_password.
        accountState = "active";
        invitationSent = false;
        emailType = null;
        finalMustChangePassword = false;

        if (notificationId) {
          await supabaseAdmin
            .from("quotation_notifications")
            .update({
              status: "skipped",
              auth_user_id: userId,
              error_message: "La cuenta ya esta activa; no se reenvio correo.",
            })
            .eq("notification_id", notificationId);
        }
      } else if (pending) {
        // CASO B / C: cuenta pendiente (invitada sin activar, o legado sin
        // metadata clara que nunca inicio sesion). Se mantiene
        // must_change_password en true y se reenvia un enlace de
        // recuperacion usando un cliente publico independiente.
        console.log("create-representative-user: reenviando activacion pendiente", {
          redirectTo,
          email,
          accountState: "pending",
        });

        const { error: appMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            app_metadata: {
              ...currentAppMetadata,
              must_change_password: true,
              activation_status: "pending",
              role_code: currentAppMetadata.role_code || "cliente",
              application_code: currentAppMetadata.application_code || "ecommerce",
            },
          },
        );

        if (appMetadataError) {
          return errorResponse(
            "No fue posible actualizar el estado de activacion del representante.",
            500,
            appMetadataError,
          );
        }

        const { error: recoveryError } = await supabasePublic.auth.resetPasswordForEmail(
          email,
          { redirectTo },
        );

        if (recoveryError) {
          if (notificationId) {
            await supabaseAdmin
              .from("quotation_notifications")
              .update({
                status: "failed",
                auth_user_id: userId,
                error_message: getErrorMessage(
                  recoveryError,
                  "No fue posible reenviar el enlace de activacion.",
                ),
              })
              .eq("notification_id", notificationId);
          }

          return errorResponse(
            getErrorMessage(
              recoveryError,
              "No fue posible reenviar el enlace de activacion al representante.",
            ),
            400,
            recoveryError,
          );
        }

        accountState = "pending";
        invitationSent = true;
        emailType = "recovery";
        finalMustChangePassword = true;

        if (notificationId) {
          await supabaseAdmin
            .from("quotation_notifications")
            .update({
              status: "sent",
              auth_user_id: userId,
              notification_type: "recovery",
              sent_at: new Date().toISOString(),
            })
            .eq("notification_id", notificationId);
        }
      } else {
        // No deberia alcanzarse, pero por seguridad se trata como activo
        // para no bloquear una cuenta funcional.
        accountState = "active";
        invitationSent = false;
        emailType = null;
        finalMustChangePassword = false;
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

    return jsonResponse({
      ok: true,
      account_state: accountState,
      invitation_sent: invitationSent,
      email_type: emailType,
      must_change_password: finalMustChangePassword,
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
