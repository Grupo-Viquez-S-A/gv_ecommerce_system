import { createClient } from "npm:@supabase/supabase-js@2";
import { ACCOUNT_MANAGEMENT_ROLE_CODES, authorizeCompanyAction } from "../_shared/authorization.ts";
import { getConfiguredCorsHeaders, isOriginAllowed, isUuid } from "../_shared/http.ts";

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
    },
    status,
  );
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

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      const status =
        (deleteUserError as { status?: number }).status || 500;

      if (status !== 404) {
        return errorResponse(
          "No fue posible eliminar la cuenta de acceso del representante.",
          status,
          deleteUserError,
        );
      }
    }

    return jsonResponse({
      ok: true,
      message: "Cuenta de acceso del representante eliminada.",
      user_id: userId,
    });
  } catch (error) {
    console.error("delete-representative-user error:", getErrorDetails(error));

    return jsonResponse(
      {
        ok: false,
        error: "No fue posible eliminar el usuario del representante.",
      },
      500,
    );
  }
});
