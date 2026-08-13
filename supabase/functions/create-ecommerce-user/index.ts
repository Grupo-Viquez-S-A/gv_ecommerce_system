import { createClient } from "npm:@supabase/supabase-js@2";

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

const ALLOWED_ROLE_CODES = new Set([
  "gerente",
  "encargado",
  "manager",
  "administrador",
  "admin",
  "presidente",
  "president",
  "super_admin",
]);
const ACCOUNT_MANAGEMENT_ROLE_CODES = ALLOWED_ROLE_CODES;

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

function getErrorDetails(error: unknown) {
  if (!error) {
    return null;
  }

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
  if (!error) {
    return fallbackMessage;
  }

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
      name?: unknown;
    };

    const possibleMessages = [
      maybeError.message,
      maybeError.error_description,
      maybeError.error,
      maybeError.details,
      maybeError.hint,
      maybeError.code,
      maybeError.name,
      maybeError.status ? `Status ${maybeError.status}` : null,
    ];

    const message = possibleMessages.find(
      (value) =>
        typeof value === "string" &&
        value.trim() &&
        value.trim() !== "{}",
    );

    if (message) {
      return String(message);
    }
  }

  return fallbackMessage;
}

function errorResponse(message: string, status = 400, details?: unknown) {
  console.warn("create-ecommerce-user rejected:", {
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

function getRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(value: unknown) {
  const text = getRequiredString(value);
  return text || null;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

async function canCreateUsers(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("user_memberships")
    .select(`
      membership_id,
      is_active,
      start_date,
      end_date,
      roles (
        role_code,
        is_active
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const today = getToday();

  return (data || []).some((membership) => {
    const role = Array.isArray(membership.roles)
      ? membership.roles[0]
      : membership.roles;

    const roleCode = String(role?.role_code || "").trim().toLowerCase();

    const membershipStarted =
      !membership.start_date || membership.start_date <= today;

    const membershipNotExpired =
      !membership.end_date || membership.end_date >= today;

    return (
      role?.is_active !== false &&
      membershipStarted &&
      membershipNotExpired &&
      ALLOWED_ROLE_CODES.has(roleCode)
    );
  });
}

Deno.serve(async (request) => {
  if (!isOriginAllowed(request)) {
    return errorResponse("Origen no permitido.", 403);
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Método no permitido.", 405);
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

  let newUserId: string | null = null;

  try {
    const { data: userData, error: userError } =
      await supabaseAuth.auth.getUser();

    if (userError || !userData.user) {
      return errorResponse(
        "Debes iniciar sesión para crear usuarios.",
        401,
        userError,
      );
    }

    const hasPermission = await canCreateUsers(
      supabaseAdmin,
      userData.user.id,
    );

    if (!hasPermission) {
      return errorResponse(
        "No tienes permisos para crear usuarios en el e-commerce.",
        403,
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch (parseError) {
      return errorResponse(
        "El cuerpo de la solicitud no es un JSON válido.",
        400,
        parseError,
      );
    }

    const email = getRequiredString(body?.email).toLowerCase();
    const password = getRequiredString(body?.password);

    const profile = body?.profile || {};
    const membership = body?.membership || {};

    const name = getRequiredString(profile.name);
    const surname = getRequiredString(profile.surname);
    const phone = getOptionalString(profile.phone);
    const identification = getOptionalString(profile.identification);

    const companyId = getRequiredString(membership.company_id);
    const departmentId = getRequiredString(membership.department_id);
    const roleId = getRequiredString(membership.role_id);
    const startDate = getRequiredString(membership.start_date) || getToday();
    const endDate = getOptionalString(membership.end_date);

    const missingFields: string[] = [];

    if (!email) {
      missingFields.push("correo electrónico");
    }

    if (!password || password.length < 8) {
      missingFields.push("contraseña temporal de al menos 8 caracteres");
    }

    if (!name) {
      missingFields.push("nombre");
    }

    if (!surname) {
      missingFields.push("apellidos");
    }

    if (!companyId) {
      missingFields.push("empresa");
    }

    if (!departmentId) {
      missingFields.push("departamento");
    }

    if (!roleId) {
      missingFields.push("rol");
    }

    if (missingFields.length > 0) {
      return errorResponse(
        `Faltan o son inválidos estos datos: ${missingFields.join(", ")}.`,
        400,
        {
          missingFields,
          hasEmail: Boolean(email),
          passwordLength: password.length,
          hasName: Boolean(name),
          hasSurname: Boolean(surname),
          hasCompanyId: Boolean(companyId),
          hasDepartmentId: Boolean(departmentId),
          hasRoleId: Boolean(roleId),
        },
      );
    }

    if (![companyId, departmentId, roleId].every(isUuid)) {
      return errorResponse("Uno o más identificadores no tienen un formato válido.", 400);
    }

    if (!isValidEmail(email) || name.length > 100 || surname.length > 160) {
      return errorResponse("El nombre, los apellidos o el correo no son válidos.", 400);
    }

    const scopedAuthorization = await authorizeCompanyAction({
      supabaseAdmin,
      userId: userData.user.id,
      companyId,
      allowedRoleCodes: ACCOUNT_MANAGEMENT_ROLE_CODES,
    });

    if (!scopedAuthorization.authorized) {
      return errorResponse(
        scopedAuthorization.message,
        scopedAuthorization.status,
        scopedAuthorization.details,
      );
    }

    const { data: existingAuthUserData, error: existingAuthUserError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (existingAuthUserError) {
      return errorResponse(
        "No fue posible validar si el correo ya existe en Auth.",
        500,
        existingAuthUserError,
      );
    }

    const authUserAlreadyExists = existingAuthUserData.users.some(
      (user) => user.email?.toLowerCase() === email,
    );

    if (authUserAlreadyExists) {
      return errorResponse(
        "Ya existe un usuario registrado en Supabase Auth con ese correo.",
        409,
      );
    }

    const { data: existingProfile, error: existingProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("user_id, email")
        .ilike("email", email)
        .maybeSingle();

    if (existingProfileError) {
      return errorResponse(
        "No fue posible validar si el perfil ya existe.",
        500,
        existingProfileError,
      );
    }

    if (existingProfile) {
      return errorResponse(
        "Ya existe un perfil registrado con ese correo. Revisa si quedó un perfil huérfano en la tabla profiles.",
        409,
        existingProfile,
      );
    }

    const fullName = `${name} ${surname}`.trim();

    const { data: authData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          created_from: "ecommerce_admin",
          application_id: ECOMMERCE_APPLICATION_ID,
          name,
          surname,
          full_name: fullName,
          phone,
        },
      });

    if (createUserError || !authData.user) {
      return errorResponse(
        getErrorMessage(
          createUserError,
          "No fue posible crear el usuario en Supabase Auth.",
        ),
        400,
        createUserError,
      );
    }

    newUserId = authData.user.id;

    try {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            user_id: newUserId,
            name,
            surname,
            email,
            identification,
            phone,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (profileError) {
        throw profileError;
      }

      const { error: membershipError } = await supabaseAdmin
        .from("user_memberships")
        .insert({
          user_id: newUserId,
          company_id: companyId,
          department_id: departmentId,
          role_id: roleId,
          is_active: true,
          start_date: startDate,
          end_date: endDate,
        });

      if (membershipError) {
        throw membershipError;
      }

      const { error: applicationError } = await supabaseAdmin
        .from("user_applications")
        .insert({
          user_id: newUserId,
          application_id: ECOMMERCE_APPLICATION_ID,
          is_active: true,
          start_date: startDate,
          end_date: endDate,
        });

      if (applicationError) {
        throw applicationError;
      }
    } catch (databaseError) {
      console.error("Database insert failed. Rolling back Auth user:", {
        newUserId,
        error: getErrorDetails(databaseError),
      });

      if (newUserId) {
        const { error: deleteUserError } =
          await supabaseAdmin.auth.admin.deleteUser(newUserId);

        if (deleteUserError) {
          console.error("Failed to rollback Auth user:", {
            newUserId,
            error: getErrorDetails(deleteUserError),
          });
        }
      }

      throw databaseError;
    }

    return jsonResponse({
      ok: true,
      message: "Usuario del e-commerce creado correctamente.",
      user: {
        user_id: newUserId,
        email,
      },
    });
  } catch (error) {
    console.error("create-ecommerce-user error:", getErrorDetails(error));

    return jsonResponse(
      {
        ok: false,
        error: getErrorMessage(
          error,
          "No fue posible crear el usuario del e-commerce.",
        ),
        details: getErrorDetails(error),
      },
      500,
    );
  }
});
