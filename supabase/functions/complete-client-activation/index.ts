import { createClient } from "npm:@supabase/supabase-js@2";
import { getConfiguredCorsHeaders, isOriginAllowed } from "../_shared/http.ts";

const corsHeaders = getConfiguredCorsHeaders();

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "Error desconocido";
}

Deno.serve(async (request) => {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: "Origen no permitido." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { ok: false, error: "Metodo no permitido. Usa POST." },
      405,
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse(
        { ok: false, error: "Faltan variables de entorno de Supabase." },
        500,
      );
    }

    const authorization = request.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        { ok: false, error: "No se recibio una sesion valida." },
        401,
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: { Authorization: authorization },
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: currentUserData, error: currentUserError } =
      await supabaseUser.auth.getUser();

    if (currentUserError || !currentUserData?.user) {
      return jsonResponse(
        {
          ok: false,
          error: "El enlace de acceso es inválido o ha vencido.",
        },
        401,
      );
    }

    const userId = currentUserData.user.id;

    const { data: authUserData, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authUserError || !authUserData?.user) {
      return jsonResponse(
        {
          ok: false,
          error:
            authUserError?.message ||
            "No fue posible obtener el usuario autenticado.",
        },
        500,
      );
    }

    const existingMetadata = authUserData.user.app_metadata || {};

    if (
      existingMetadata.application_id !== ECOMMERCE_APPLICATION_ID ||
      existingMetadata.must_change_password !== true ||
      existingMetadata.activation_status !== "pending"
    ) {
      return jsonResponse(
        { ok: false, error: "La cuenta no tiene una activación pendiente válida." },
        409,
      );
    }

    const [{ data: representative }, { data: applicationAccess }] = await Promise.all([
      supabaseAdmin
        .from("representatives")
        .select("representative_id")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("user_applications")
        .select("user_application_id")
        .eq("user_id", userId)
        .eq("application_id", ECOMMERCE_APPLICATION_ID)
        .maybeSingle(),
    ]);

    if (!representative || !applicationAccess) {
      return jsonResponse(
        { ok: false, error: "La cuenta no posee un acceso de cliente válido." },
        403,
      );
    }

    const { error: updateAuthError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...existingMetadata,
          must_change_password: false,
          activation_status: "active",
          activated_at: new Date().toISOString(),
        },
      });

    if (updateAuthError) {
      return jsonResponse(
        {
          ok: false,
          error: "No fue posible activar la cuenta.",
        },
        500,
      );
    }

    const now = new Date().toISOString();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: true, updated_at: now })
      .eq("user_id", userId);

    if (profileError) {
      return jsonResponse(
        {
          ok: false,
          error: "No fue posible activar el perfil.",
        },
        500,
      );
    }

    const { error: representativeError } = await supabaseAdmin
      .from("representatives")
      .update({ is_active: true, updated_at: now })
      .eq("user_id", userId);

    if (representativeError) {
      return jsonResponse(
        {
          ok: false,
          error: "No fue posible activar el representante.",
        },
        500,
      );
    }

    const { error: applicationError } = await supabaseAdmin
      .from("user_applications")
      .update({ is_active: true, updated_at: now })
      .eq("user_id", userId)
      .eq("application_id", ECOMMERCE_APPLICATION_ID);

    if (applicationError) {
      return jsonResponse(
        {
          ok: false,
          error: "No fue posible activar el acceso al e-commerce.",
        },
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
        error: "No fue posible completar la activación.",
      },
      500,
    );
  }
});
