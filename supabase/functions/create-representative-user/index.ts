import { createClient } from "npm:@supabase/supabase-js@2";

const ACCOUNT_MANAGEMENT_ROLE_CODES = new Set([
  "admin",
  "administrador",
  "super_admin",
  "gerente",
  "manager",
  "encargado",
  "presidente",
  "president",
]);

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

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const corsHeaders = getConfiguredCorsHeaders();

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
const CLIENT_ROLE_ID = "7fa43251-f748-4dfa-b0b4-448231d1954d";

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
    return {
      authorized: false,
      status: 500,
      message: "No fue posible validar el acceso a la aplicacion.",
      details: applicationError,
    };
  }

  if (!(applications || []).some((record: any) => isActiveRecord(record, today))) {
    return {
      authorized: false,
      status: 403,
      message: "Tu usuario no tiene acceso activo a esta aplicacion.",
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return {
      authorized: false,
      status: 500,
      message: "No fue posible validar el perfil del usuario.",
      details: profileError,
    };
  }

  if (!profile || profile.is_active === false) {
    return {
      authorized: false,
      status: 403,
      message: "Tu perfil de usuario no esta activo.",
    };
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("user_memberships")
    .select("company_id, role_id, is_active, start_date, end_date")
    .eq("user_id", userId)
    .eq("company_id", companyId);

  if (membershipError) {
    return {
      authorized: false,
      status: 500,
      message: "No fue posible validar la membresia del usuario.",
      details: membershipError,
    };
  }

  const roleIds = [...new Set((memberships || [])
    .filter((record: any) => isActiveRecord(record, today))
    .map((record: any) => record.role_id)
    .filter(Boolean))];

  if (roleIds.length === 0) {
    return {
      authorized: false,
      status: 403,
      message: "No tienes una membresia activa para la empresa solicitada.",
    };
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("role_code, role_name")
    .in("role_id", roleIds);

  if (rolesError) {
    return {
      authorized: false,
      status: 500,
      message: "No fue posible validar el rol del usuario.",
      details: rolesError,
    };
  }

  const authorizedRole = (roles || []).find((role: any) =>
    allowedRoleCodes.has(normalizeRoleCode(role.role_code)) ||
    allowedRoleCodes.has(normalizeRoleCode(role.role_name)));

  if (!authorizedRole) {
    return {
      authorized: false,
      status: 403,
      message: "Tu rol no permite realizar esta operacion.",
    };
  }

  return {
    authorized: true,
    roleCode: normalizeRoleCode(authorizedRole.role_code) ||
      normalizeRoleCode(authorizedRole.role_name),
  };
}

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

function generateTempPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const base = Array.from(bytes, (byte) => byte.toString(36)).join("").slice(0, 10);

  return `Gv${base}${Math.floor(Math.random() * 90 + 10)}!`;
}

function getClientRedirectUrl() {
  return (
    Deno.env.get("ECOMMERCE_CLIENT_REDIRECT_URL") ||
    Deno.env.get("SITE_URL") ||
    Deno.env.get("APP_URL") ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
}

async function sendPasswordSetupEmail({
  supabaseUrl,
  anonKey,
  email,
}: {
  supabaseUrl: string;
  anonKey: string;
  email: string;
}) {
  const redirectBaseUrl = getClientRedirectUrl();
  const redirectTo = redirectBaseUrl
    ? `${redirectBaseUrl}/restablecer-contrasena`
    : undefined;

  const supabasePublic = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw error;
  }

  return {
    sent: true,
    redirect_to: redirectTo || null,
  };
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

function isAccountActive(appMetadata: Record<string, unknown>, lastSignInAt: string | null) {
  if (appMetadata?.must_change_password === false) return true;
  if (appMetadata?.activation_status === "active") return true;

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
  if (!isOriginAllowed(request)) {
    return errorResponse("Origen no permitido.", 403);
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

    if (![representativeId, businessId, branchId, companyId].every(isUuid)) {
      return errorResponse("Uno o más identificadores no tienen un formato válido.", 400);
    }

    if (fullName.length > 160 || !isValidEmail(email)) {
      return errorResponse("El nombre o correo del representante no es válido.", 400);
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


    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("business_id, company_id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (businessError) {
      return errorResponse("No fue posible validar el cliente.", 500, businessError);
    }

    if (!business || business.company_id !== companyId) {
      return errorResponse("El cliente no pertenece a la empresa indicada.", 409);
    }

    const authorizationResult = await authorizeCompanyAction({
      supabaseAdmin,
      userId: currentUserData.user.id,
      companyId,
      allowedRoleCodes: ACCOUNT_MANAGEMENT_ROLE_CODES,
    });

    if (!authorizationResult.authorized) {
      return errorResponse(
        authorizationResult.message,
        authorizationResult.status,
        authorizationResult.details,
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
    let emailNotification: { sent: boolean; error: string | null; redirect_to?: string | null } = {
      sent: false,
      error: null,
    };

    if (!userId) {
      tempPassword = generateTempPassword();

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
        accountState = "active";
        finalMustChangePassword = false;
      } else {
        tempPassword = generateTempPassword();

        const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            password: tempPassword,
            app_metadata: {
              ...currentAppMetadata,
              must_change_password: true,
              activation_status: "pending",
              application_id: ECOMMERCE_APPLICATION_ID,
              representative_id: representativeId,
              business_id: businessId,
              branch_id: branchId,
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

    if (accountState === "new" || accountState === "pending") {
      try {
        emailNotification = await sendPasswordSetupEmail({
          supabaseUrl,
          anonKey,
          email,
        });
      } catch (emailError) {
        console.error("No fue posible enviar el correo de activacion:", getErrorDetails(emailError));
        emailNotification = {
          sent: false,
          error: "No fue posible enviar el correo para crear/restablecer contraseña.",
        };
      }
    }

    return jsonResponse({
      ok: true,
      account_state: accountState,
      must_change_password: finalMustChangePassword,
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
