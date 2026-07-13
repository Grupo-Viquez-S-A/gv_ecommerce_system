// Supabase Edge Function: admin-settings
// Deploy with: supabase functions deploy admin-settings
//
// This function centralizes admin operations (users, departments, roles,
// module access) that require the service role key (e.g. creating auth
// users). It must never be called with the anon key from the client without
// going through supabase.functions.invoke, and it must only be reachable by
// authenticated users who are allowed to manage the system (see the
// isCallerAuthorized check below).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { getConfiguredCorsHeaders, isOriginAllowed, isUuid, isValidEmail } from "../_shared/http.ts";
import { ACCOUNT_MANAGEMENT_ROLE_CODES } from "../_shared/authorization.ts";

const corsHeaders = getConfiguredCorsHeaders();

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Service-role client: bypasses RLS, used for all privileged reads/writes.
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Module codes that are allowed to manage the settings panel.
// Adjust this if you rename the settings module.
const SETTINGS_MODULE_CODE = "settings";

async function isCallerAuthorized(authHeader: string | null) {
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) return false;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.is_active === false) return false;

  // Public/global modules (is_public = true) are visible to everyone, so we
  // explicitly check that the caller has been granted the settings module
  // either directly (profile_modules) or through their department
  // (department_modules).
  const { data: memberships } = await adminClient
    .from("user_memberships")
    .select("department_id, start_date, end_date, roles (role_code, role_name, is_active)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const today = new Date().toISOString().slice(0, 10);
  const membership = (memberships || []).find((record: any) => {
    const role = Array.isArray(record.roles) ? record.roles[0] : record.roles;
    const roleCode = String(role?.role_code || role?.role_name || "").trim().toLowerCase();
    return role?.is_active !== false &&
      (!record.start_date || record.start_date <= today) &&
      (!record.end_date || record.end_date >= today) &&
      ACCOUNT_MANAGEMENT_ROLE_CODES.has(roleCode);
  });
  if (!membership) return false;

  const { data: settingsModule } = await adminClient
    .from("modules")
    .select("module_id, is_public")
    .eq("module_code", SETTINGS_MODULE_CODE)
    .maybeSingle();

  if (!settingsModule) return false;

  const { data: directAccess } = await adminClient
    .from("profile_modules")
    .select("module_id")
    .eq("profile_id", user.id)
    .eq("module_id", settingsModule.module_id)
    .eq("can_view", true)
    .maybeSingle();

  if (directAccess) return true;

  if (membership?.department_id) {
    const { data: departmentAccess } = await adminClient
      .from("department_modules")
      .select("module_id")
      .eq("department_id", membership.department_id)
      .eq("module_id", settingsModule.module_id)
      .eq("can_view", true)
      .maybeSingle();

    if (departmentAccess) return true;
  }

  return false;
}

function validateAdminPayload(action: unknown, payload: any) {
  const allowedActions = new Set([
    "list", "create-user", "update-user", "set-user-status",
    "save-department", "set-department-status", "save-role", "set-role-status",
  ]);
  if (typeof action !== "string" || !allowedActions.has(action)) {
    return "Acción administrativa inválida.";
  }

  if (action === "create-user") {
    if (!isValidEmail(String(payload?.email || "").trim().toLowerCase())) return "El correo no es válido.";
    if (typeof payload?.password !== "string" || payload.password.length < 12 || payload.password.length > 128) {
      return "La contraseña temporal debe tener entre 12 y 128 caracteres.";
    }
    const membership = payload?.membership || {};
    if (![membership.company_id, membership.department_id, membership.role_id].every((id) => isUuid(String(id || "")))) {
      return "La empresa, el departamento o el rol no son válidos.";
    }
  }

  if (["update-user", "set-user-status"].includes(action) && !isUuid(String(payload?.userId || ""))) {
    return "El usuario no es válido.";
  }
  if (action === "set-department-status" && !isUuid(String(payload?.departmentId || ""))) {
    return "El departamento no es válido.";
  }
  if (action === "set-role-status" && !isUuid(String(payload?.roleId || ""))) {
    return "El rol no es válido.";
  }
  return null;
}

async function handleList() {
  const [
    usersResponse,
    departmentsResponse,
    rolesResponse,
    companiesResponse,
    modulesResponse,
    departmentModulesResponse,
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select(
        `
        user_id, name, surname, email, identification, phone, is_active, created_at,
        user_memberships (
          membership_id, company_id, department_id, role_id, is_active, start_date, end_date,
          companies ( company_id, company_name ),
          departments ( department_id, name ),
          roles ( role_id, role_name, role_code )
        ),
        profile_modules ( module_id, can_view, can_create, can_edit, can_delete )
      `,
      )
      .order("created_at", { ascending: false }),
    adminClient.from("departments").select("*").order("name"),
    adminClient.from("roles").select("*").order("role_name"),
    adminClient.from("companies").select("*").order("company_name"),
    adminClient.from("modules").select("*").order("display_order"),
    adminClient.from("department_modules").select("*"),
  ]);

  for (const response of [
    usersResponse,
    departmentsResponse,
    rolesResponse,
    companiesResponse,
    modulesResponse,
    departmentModulesResponse,
  ]) {
    if (response.error) throw response.error;
  }

  return {
    users: usersResponse.data ?? [],
    departments: departmentsResponse.data ?? [],
    roles: rolesResponse.data ?? [],
    companies: companiesResponse.data ?? [],
    modules: modulesResponse.data ?? [],
    departmentModules: departmentModulesResponse.data ?? [],
  };
}

async function replaceProfileModules(
  userId: string,
  moduleIds: string[] = [],
) {
  const { error: deleteError } = await adminClient
    .from("profile_modules")
    .delete()
    .eq("profile_id", userId);

  if (deleteError) throw deleteError;

  if (!moduleIds.length) return;

  const rows = moduleIds.map((moduleId) => ({
    profile_id: userId,
    module_id: moduleId,
    can_view: true,
    can_create: false,
    can_edit: true,
    can_delete: false,
  }));

  const { error: insertError } = await adminClient
    .from("profile_modules")
    .insert(rows);

  if (insertError) throw insertError;
}

async function handleCreateUser(payload: any) {
  const { email, password, profile = {}, membership = {}, moduleIds = [] } =
    payload;

  if (!email || !password) {
    throw new Error("El correo y la contraseña temporal son obligatorios.");
  }

  if (!membership.company_id || !membership.department_id || !membership.role_id) {
    throw new Error("Selecciona empresa, departamento y rol para el usuario.");
  }

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError) throw createUserError;

  const userId = createdUser.user?.id;
  if (!userId) throw new Error("No fue posible crear el usuario en Auth.");

  try {
    const { error: profileError } = await adminClient.from("profiles").insert({
      user_id: userId,
      name: profile.name || "",
      surname: profile.surname || "",
      email,
      identification: profile.identification || null,
      phone: profile.phone || null,
      is_active: true,
    });

    if (profileError) throw profileError;

    const { error: membershipError } = await adminClient
      .from("user_memberships")
      .insert({
        user_id: userId,
        company_id: membership.company_id,
        department_id: membership.department_id,
        role_id: membership.role_id,
        is_active: true,
      });

    if (membershipError) throw membershipError;

    await replaceProfileModules(userId, moduleIds);
  } catch (error) {
    // Roll back the auth user if any downstream insert fails, so we don't
    // leave an orphaned auth account with no profile.
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    throw error;
  }

  return { userId };
}

async function handleUpdateUser(payload: any) {
  const {
    userId,
    email,
    password,
    profile = {},
    membership = {},
    moduleIds = [],
  } = payload;

  if (!userId) throw new Error("Falta el identificador del usuario.");

  const authUpdate: Record<string, unknown> = {};
  if (email) authUpdate.email = email;
  if (password) authUpdate.password = password;

  if (Object.keys(authUpdate).length > 0) {
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
      userId,
      authUpdate,
    );
    if (authUpdateError) throw authUpdateError;
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      name: profile.name || "",
      surname: profile.surname || "",
      email,
      identification: profile.identification || null,
      phone: profile.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (profileError) throw profileError;

  if (membership.company_id || membership.department_id || membership.role_id) {
    if (membership.membership_id) {
      const { error: membershipError } = await adminClient
        .from("user_memberships")
        .update({
          company_id: membership.company_id,
          department_id: membership.department_id,
          role_id: membership.role_id,
          updated_at: new Date().toISOString(),
        })
        .eq("membership_id", membership.membership_id);

      if (membershipError) throw membershipError;
    } else {
      const { error: membershipError } = await adminClient
        .from("user_memberships")
        .insert({
          user_id: userId,
          company_id: membership.company_id,
          department_id: membership.department_id,
          role_id: membership.role_id,
          is_active: true,
        });

      if (membershipError) throw membershipError;
    }
  }

  await replaceProfileModules(userId, moduleIds);

  return { userId };
}

async function handleSetUserStatus(payload: any) {
  const { userId, isActive } = payload;
  if (!userId) throw new Error("Falta el identificador del usuario.");

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (profileError) throw profileError;

  // Also block/unblock sign-in at the Auth level.
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: isActive ? "none" : "876000h" },
  );

  if (authError) throw authError;

  return { userId };
}

async function handleSaveDepartment(payload: any) {
  const { department } = payload;
  if (!department?.name) throw new Error("El nombre del departamento es obligatorio.");

  const row = {
    name: department.name,
    email: department.email || null,
    is_active: department.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (department.department_id) {
    const { error } = await adminClient
      .from("departments")
      .update(row)
      .eq("department_id", department.department_id);
    if (error) throw error;
    return { departmentId: department.department_id };
  }

  const { data, error } = await adminClient
    .from("departments")
    .insert(row)
    .select("department_id")
    .single();

  if (error) throw error;
  return { departmentId: data.department_id };
}

async function handleSetDepartmentStatus(payload: any) {
  const { departmentId, isActive } = payload;
  if (!departmentId) throw new Error("Falta el identificador del departamento.");

  const { error } = await adminClient
    .from("departments")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("department_id", departmentId);

  if (error) throw error;
  return { departmentId };
}

async function handleSaveRole(payload: any) {
  const { role } = payload;
  if (!role?.role_name || !role?.role_code) {
    throw new Error("El nombre y código del rol son obligatorios.");
  }

  const row = {
    role_name: role.role_name,
    role_code: role.role_code,
    description: role.description || null,
    is_active: role.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (role.role_id) {
    const { error } = await adminClient
      .from("roles")
      .update(row)
      .eq("role_id", role.role_id);
    if (error) throw error;
    return { roleId: role.role_id };
  }

  const { data, error } = await adminClient
    .from("roles")
    .insert(row)
    .select("role_id")
    .single();

  if (error) throw error;
  return { roleId: data.role_id };
}

async function handleSetRoleStatus(payload: any) {
  const { roleId, isActive } = payload;
  if (!roleId) throw new Error("Falta el identificador del rol.");

  const { error } = await adminClient
    .from("roles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("role_id", roleId);

  if (error) throw error;
  return { roleId };
}

Deno.serve(async (request: Request) => {
  if (!isOriginAllowed(request)) {
    return jsonResponse({ ok: false, error: "Origen no permitido." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método no permitido." }, 405);
  }

  try {
    const authHeader = request.headers.get("Authorization");
    const authorized = await isCallerAuthorized(authHeader);

    if (!authorized) {
      return jsonResponse(
        { ok: false, error: "No tienes permisos para administrar el sistema." },
        403,
      );
    }

    const body = await request.json();
    const { action, ...payload } = body ?? {};
    const validationError = validateAdminPayload(action, payload);
    if (validationError) {
      return jsonResponse({ ok: false, error: validationError }, 400);
    }

    let data: Record<string, unknown> = {};

    switch (action) {
      case "list":
        data = await handleList();
        break;
      case "create-user":
        data = await handleCreateUser(payload);
        break;
      case "update-user":
        data = await handleUpdateUser(payload);
        break;
      case "set-user-status":
        data = await handleSetUserStatus(payload);
        break;
      case "save-department":
        data = await handleSaveDepartment(payload);
        break;
      case "set-department-status":
        data = await handleSetDepartmentStatus(payload);
        break;
      case "save-role":
        data = await handleSaveRole(payload);
        break;
      case "set-role-status":
        data = await handleSetRoleStatus(payload);
        break;
      default:
        return jsonResponse({ ok: false, error: `Acción desconocida: ${action}` }, 400);
    }

    return jsonResponse({ ok: true, ...data });
  } catch (error) {
    console.error("admin-settings error:", error);
    return jsonResponse({ ok: false, error: "No fue posible completar la operación administrativa." }, 500);
  }
});
