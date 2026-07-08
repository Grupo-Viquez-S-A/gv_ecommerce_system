import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
const ALLOWED_ROLE_CODES = new Set([
  "encargado",
  "manager",
  "presidente",
  "president",
  "super_admin",
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(message: string, status = 400, details?: unknown) {
  console.warn("create-ecommerce-user rejected:", {
    status,
    message,
    details,
  });

  return jsonResponse(
    {
      ok: false,
      error: message,
      message,
      details,
    },
    status,
  );
}

function getRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

async function canCreateUsers(supabaseAdmin: ReturnType<typeof createClient>, userId: string) {
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
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: userData, error: userError } =
      await supabaseAuth.auth.getUser();

    if (userError || !userData.user) {
      return errorResponse(
        "Debes iniciar sesion para crear usuarios.",
        401,
        userError?.message,
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

    const body = await request.json();
    const email = getRequiredString(body?.email).toLowerCase();
    const password = getRequiredString(body?.password);
    const profile = body?.profile || {};
    const membership = body?.membership || {};

    const name = getRequiredString(profile.name);
    const surname = getRequiredString(profile.surname);
    const phone = getRequiredString(profile.phone) || null;
    const identification = getRequiredString(profile.identification) || null;
    const companyId = getRequiredString(membership.company_id);
    const departmentId = getRequiredString(membership.department_id);
    const roleId = getRequiredString(membership.role_id);
    const startDate = getRequiredString(membership.start_date) || getToday();
    const endDate = getRequiredString(membership.end_date) || null;

    const missingFields: string[] = [];

    if (!email) missingFields.push("correo electronico");
    if (!password || password.length < 8) {
      missingFields.push("contrasena temporal de al menos 8 caracteres");
    }
    if (!name) missingFields.push("nombre");
    if (!surname) missingFields.push("apellidos");
    if (!companyId) missingFields.push("empresa");
    if (!departmentId) missingFields.push("departamento");
    if (!roleId) missingFields.push("rol");

    if (missingFields.length > 0) {
      return errorResponse(
        `Faltan o son invalidos estos datos: ${missingFields.join(", ")}.`,
        400,
        {
          missingFields,
          hasEmail: Boolean(email),
          passwordLength: password.length,
          hasCompanyId: Boolean(companyId),
          hasDepartmentId: Boolean(departmentId),
          hasRoleId: Boolean(roleId),
        },
      );
    }

    const { data: authData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          surname,
          phone,
        },
      });

    if (createUserError || !authData.user) {
      return errorResponse(
        createUserError?.message ||
          "No fue posible crear el usuario en Supabase Auth.",
        400,
        createUserError,
      );
    }

    const newUserId = authData.user.id;

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
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw databaseError;
    }

    return jsonResponse({
      ok: true,
      user: {
        user_id: newUserId,
        email,
      },
    });
  } catch (error) {
    console.error("create-ecommerce-user error:", error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No fue posible crear el usuario del e-commerce.",
      },
      500,
    );
  }
});
