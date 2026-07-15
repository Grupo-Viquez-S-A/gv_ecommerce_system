import { createClient } from "npm:@supabase/supabase-js@2";

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
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
  console.warn("delete-representative-user rejected:", {
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

async function deactivateRepresentativeAccess(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  representativeId: string,
) {
  const now = new Date().toISOString();

  const representativeUpdate = supabaseAdmin
    .from("representatives")
    .update({
      user_id: null,
      updated_at: now,
    });

  const { error: representativeError } = representativeId
    ? await representativeUpdate.eq("representative_id", representativeId)
    : await representativeUpdate.eq("user_id", userId);

  if (representativeError) throw representativeError;

  const { error: applicationError } = await supabaseAdmin
    .from("user_applications")
    .update({
      is_active: false,
      end_date: now.slice(0, 10),
      updated_at: now,
    })
    .eq("user_id", userId);

  if (applicationError) throw applicationError;

  const { error: membershipError } = await supabaseAdmin
    .from("user_memberships")
    .update({
      is_active: false,
      end_date: now.slice(0, 10),
      updated_at: now,
    })
    .eq("user_id", userId);

  if (membershipError) throw membershipError;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      is_active: false,
      updated_at: now,
    })
    .eq("user_id", userId);

  if (profileError) throw profileError;
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
        "Debes iniciar sesion para eliminar el acceso del representante.",
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
    let userId = getRequiredString(body?.user_id);
    let targetBusinessId = "";

    if (!representativeId && !userId) {
      return errorResponse(
        "Falta el representante o el usuario a eliminar.",
        400,
      );
    }

    if ((representativeId && !isUuid(representativeId)) || (userId && !isUuid(userId))) {
      return errorResponse("El identificador recibido no tiene un formato válido.", 400);
    }

    if (representativeId) {
      const { data: representative, error: representativeError } =
        await supabaseAdmin
          .from("representatives")
          .select("representative_id, user_id, business_id")
          .eq("representative_id", representativeId)
          .maybeSingle();

      if (representativeError) {
        return errorResponse(
          "No fue posible validar el representante.",
          500,
          representativeError,
        );
      }

      if (representative?.user_id) {
        userId = representative.user_id;
      }
      targetBusinessId = representative?.business_id || "";
    } else {
      const { data: representative, error: representativeError } =
        await supabaseAdmin
          .from("representatives")
          .select("business_id")
          .eq("user_id", userId)
          .maybeSingle();

      if (representativeError) {
        return errorResponse("No fue posible validar el representante.", 500, representativeError);
      }
      targetBusinessId = representative?.business_id || "";
    }

    if (!targetBusinessId) {
      return errorResponse("No fue posible determinar el cliente del representante.", 403);
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("company_id")
      .eq("business_id", targetBusinessId)
      .maybeSingle();

    if (businessError || !business?.company_id) {
      return errorResponse("No fue posible validar la empresa del representante.", 500, businessError);
    }

    const authorizationResult = await authorizeCompanyAction({
      supabaseAdmin,
      userId: currentUserData.user.id,
      companyId: business.company_id,
      allowedRoleCodes: ACCOUNT_MANAGEMENT_ROLE_CODES,
    });

    if (!authorizationResult.authorized) {
      return errorResponse(
        authorizationResult.message,
        authorizationResult.status,
        authorizationResult.details,
      );
    }

    if (!userId) {
      return jsonResponse({
        ok: true,
        message: "El representante no tenia una cuenta de acceso asociada.",
        skipped: true,
      });
    }

    await deactivateRepresentativeAccess(supabaseAdmin, userId, representativeId);

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(userId, true);

    if (deleteUserError) {
      const status =
        (deleteUserError as { status?: number }).status || 500;

      if (status !== 404) {
        return errorResponse(
          getErrorMessage(
            deleteUserError,
            "No fue posible eliminar la cuenta de acceso del representante.",
          ),
          status,
          deleteUserError,
        );
      }
    }

    return jsonResponse({
      ok: true,
      message: "Cuenta de acceso del representante eliminada.",
      user_id: userId,
      soft_deleted: true,
    });
  } catch (error) {
    console.error("delete-representative-user error:", getErrorDetails(error));

    return jsonResponse(
      {
        ok: false,
        error: getErrorMessage(
          error,
          "No fue posible eliminar el usuario del representante.",
        ),
        details: getErrorDetails(error),
      },
      500,
    );
  }
});
