import { createClient } from "npm:@supabase/supabase-js@2";

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

function errorResponse(message: string, status = 400) {
  console.warn("complete-client-activation rejected:", { status, message });

  return jsonResponse({ ok: false, error: message }, status);
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

  if (!authorization) {
    return errorResponse("Debes iniciar sesion para completar la activacion.", 401);
  }

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
        "Debes iniciar sesion para completar la activacion.",
        401,
      );
    }

    const userId = currentUserData.user.id;

    const { data: currentUserRecord, error: currentUserRecordError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (currentUserRecordError || !currentUserRecord?.user) {
      return errorResponse(
        "No fue posible validar la cuenta del usuario.",
        500,
      );
    }

    const currentAppMetadata = currentUserRecord.user.app_metadata || {};

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          ...currentAppMetadata,
          must_change_password: false,
          activated_at: new Date().toISOString(),
        },
      },
    );

    if (updateError) {
      return errorResponse(
        getErrorMessage(
          updateError,
          "No fue posible completar la activacion de la cuenta.",
        ),
        500,
      );
    }

    return jsonResponse({
      ok: true,
      message: "Activacion completada correctamente.",
    });
  } catch (error) {
    console.error("complete-client-activation error:", error);

    return jsonResponse(
      {
        ok: false,
        error: getErrorMessage(
          error,
          "No fue posible completar la activacion de la cuenta.",
        ),
      },
      500,
    );
  }
});
