import { createClient } from "npm:@supabase/supabase-js@2";

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
  const redirectTo =
    Deno.env.get("ECOMMERCE_CLIENT_REDIRECT_URL") ||
    Deno.env.get("SITE_URL") ||
    undefined;

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
      const { data: invitationData, error: invitationError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            created_from: "quotation_representative",
            role: "client",
            representative_id: representativeId,
            business_id: businessId,
            branch_id: branchId,
            application_id: ECOMMERCE_APPLICATION_ID,
            full_name: fullName,
          },
          redirectTo,
        });

      if (invitationError || !invitationData.user) {
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
