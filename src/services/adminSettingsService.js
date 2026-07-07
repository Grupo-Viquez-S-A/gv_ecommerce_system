import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_API_URL?.replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Faltan VITE_SUPABASE_API_URL o VITE_SUPABASE_SERVICE_ROLE_KEY en Replit Secrets."
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(value) {
  const result = getRequiredString(value);
  return result || null;
}

function getBoolean(value, defaultValue = true) {
  return typeof value === "boolean" ? value : defaultValue;
}

function getStringArray(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
    ),
  ];
}

function getNow() {
  return new Date().toISOString();
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function extractMessage(error) {
  if (!error) return null;
  if (typeof error === "string" && error.trim() && error !== "{}") return error.trim();
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object") {
    const msg = error.error || error.message || error.msg || error.details || error.hint;
    if (msg && typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return null;
}

function throwError(error, fallback) {
  const msg = extractMessage(error) || fallback;
  throw new Error(msg);
}

// ---------------------------------------------------------------------------
// Replace module access (same logic as edge function)
// ---------------------------------------------------------------------------

async function replaceUserModuleAccess(profileId, moduleIds) {
  const uniqueModuleIds = getStringArray(moduleIds);

  const { data: assignableModules, error: modulesError } = await supabaseAdmin
    .from("modules")
    .select("module_id")
    .eq("is_active", true)
    .eq("is_public", false)
    .eq("is_assignable", true);

  if (modulesError) {
    throwError(modulesError, "No fue posible validar los módulos disponibles.");
  }

  const validModuleIds = new Set(
    (assignableModules || []).map((m) => m.module_id)
  );

  const invalidIds = uniqueModuleIds.filter((id) => !validModuleIds.has(id));
  if (invalidIds.length > 0) {
    throw new Error(
      "Se intentó asignar un módulo inválido, público, no asignable o inactivo."
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("profile_modules")
    .delete()
    .eq("profile_id", profileId);

  if (deleteError) {
    throwError(deleteError, "No fue posible eliminar los permisos adicionales anteriores.");
  }

  if (uniqueModuleIds.length === 0) return;

  const now = getNow();
  const assignments = uniqueModuleIds.map((moduleId) => ({
    profile_id: profileId,
    module_id: moduleId,
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    created_at: now,
    updated_at: now,
  }));

  const { error: insertError } = await supabaseAdmin
    .from("profile_modules")
    .insert(assignments);

  if (insertError) {
    throwError(insertError, "No fue posible guardar los permisos adicionales.");
  }
}

// ---------------------------------------------------------------------------
// getAdminSettingsCatalogs — replaces "list" action
// ---------------------------------------------------------------------------

export async function getAdminSettingsCatalogs() {
  const [
    usersRes,
    departmentsRes,
    rolesRes,
    companiesRes,
    modulesRes,
    deptModulesRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(`
        user_id, name, surname, email, identification, phone, is_active, created_at,
        user_memberships (
          membership_id, company_id, department_id, role_id, is_active, start_date, end_date,
          companies ( company_id, company_name ),
          departments ( department_id, name ),
          roles ( role_id, role_name, role_code )
        ),
        profile_modules (
          profile_id, module_id, can_view, can_create, can_edit, can_delete, created_at, updated_at
        )
      `)
      .order("created_at", { ascending: false }),

    supabaseAdmin.from("departments").select("*").order("name", { ascending: true }),

    supabaseAdmin.from("roles").select("*").order("role_name", { ascending: true }),

    supabaseAdmin
      .from("companies")
      .select("company_id, company_name, is_active")
      .order("company_name", { ascending: true }),

    supabaseAdmin
      .from("modules")
      .select("module_id, module_code, name, parent_module_id, route, display_order, is_public, is_assignable, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),

    supabaseAdmin
      .from("department_modules")
      .select("department_id, module_id, can_view, can_create, can_edit, can_delete"),
  ]);

  const firstError = [
    usersRes.error,
    departmentsRes.error,
    rolesRes.error,
    companiesRes.error,
    modulesRes.error,
    deptModulesRes.error,
  ].find(Boolean);

  if (firstError) {
    throwError(firstError, "No fue posible cargar la configuración administrativa.");
  }

  return {
    ok: true,
    users: usersRes.data ?? [],
    departments: departmentsRes.data ?? [],
    roles: rolesRes.data ?? [],
    companies: companiesRes.data ?? [],
    modules: modulesRes.data ?? [],
    departmentModules: deptModulesRes.data ?? [],
  };
}

// ---------------------------------------------------------------------------
// createAdminUser — replaces "create-user" action
// ---------------------------------------------------------------------------

export async function createAdminUser({
  email,
  password,
  profile = {},
  membership = {},
  moduleIds = [],
}) {
  const cleanEmail = getRequiredString(email).toLowerCase();
  const cleanPassword = getRequiredString(password);
  const name = getRequiredString(profile.name);
  const surname = getRequiredString(profile.surname);
  const companyId = getRequiredString(membership.company_id);
  const departmentId = getRequiredString(membership.department_id);
  const roleId = getRequiredString(membership.role_id);

  const missing = [];
  if (!cleanEmail) missing.push("correo electrónico");
  if (!cleanPassword) missing.push("contraseña temporal");
  if (!name) missing.push("nombre");
  if (!surname) missing.push("apellidos");
  if (!companyId) missing.push("empresa");
  if (!departmentId) missing.push("departamento");
  if (!roleId) missing.push("rol");

  if (missing.length > 0) {
    throw new Error(`Faltan o son inválidos estos datos: ${missing.join(", ")}.`);
  }

  if (cleanPassword.length < 8) {
    throw new Error("La contraseña temporal debe tener al menos 8 caracteres.");
  }

  // 1. Crear cuenta de autenticación
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPassword,
    email_confirm: true,
    user_metadata: { name, surname },
  });

  if (authError || !authData?.user) {
    throwError(authError, "No fue posible crear la cuenta de acceso.");
  }

  const newUserId = authData.user.id;
  const now = getNow();

  // 2. Crear perfil
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: newUserId,
        name,
        surname,
        email: cleanEmail,
        identification: getOptionalString(profile.identification),
        phone: getOptionalString(profile.phone),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    throwError(
      profileError,
      "No fue posible guardar el perfil del usuario."
    );
  }

  // 3. Asignar empresa, departamento y rol
  const { error: membershipError } = await supabaseAdmin
    .from("user_memberships")
    .insert({
      user_id: newUserId,
      company_id: companyId,
      department_id: departmentId,
      role_id: roleId,
      is_active: true,
      start_date: getToday(),
      created_at: now,
      updated_at: now,
    });

  if (membershipError) {
    await supabaseAdmin.from("profiles").delete().eq("user_id", newUserId);
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    throwError(
      membershipError,
      "No fue posible asignar empresa, departamento o rol."
    );
  }

  // 4. Asignar módulos
  try {
    await replaceUserModuleAccess(newUserId, moduleIds);
  } catch (moduleAccessError) {
    await supabaseAdmin.from("user_memberships").delete().eq("user_id", newUserId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", newUserId);
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    throw new Error(
      `No fue posible asignar los módulos al usuario: ${moduleAccessError.message}`
    );
  }

  return { ok: true, message: "Usuario creado correctamente." };
}

// ---------------------------------------------------------------------------
// updateAdminUser — replaces "update-user" action
// ---------------------------------------------------------------------------

export async function updateAdminUser({
  userId,
  email,
  password,
  profile = {},
  membership = {},
  moduleIds = [],
}) {
  const cleanUserId = getRequiredString(userId);
  const cleanEmail = getRequiredString(email).toLowerCase();
  const cleanPassword = getRequiredString(password);
  const name = getRequiredString(profile.name);
  const surname = getRequiredString(profile.surname);
  const companyId = getRequiredString(membership.company_id);
  const departmentId = getRequiredString(membership.department_id);
  const roleId = getRequiredString(membership.role_id);
  const membershipId = getRequiredString(membership.membership_id);

  const missing = [];
  if (!cleanUserId) missing.push("identificador del usuario");
  if (!cleanEmail) missing.push("correo electrónico");
  if (!name) missing.push("nombre");
  if (!surname) missing.push("apellidos");
  if (!companyId) missing.push("empresa");
  if (!departmentId) missing.push("departamento");
  if (!roleId) missing.push("rol");

  if (missing.length > 0) {
    throw new Error(`Faltan o son inválidos estos datos: ${missing.join(", ")}.`);
  }

  if (cleanPassword && cleanPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  const authPayload = {
    email: cleanEmail,
    email_confirm: true,
    user_metadata: { name, surname },
  };
  if (cleanPassword) authPayload.password = cleanPassword;

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    cleanUserId,
    authPayload
  );

  if (authError) {
    throwError(authError, "No fue posible actualizar la cuenta de acceso.");
  }

  const now = getNow();

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: cleanUserId,
        name,
        surname,
        email: cleanEmail,
        identification: getOptionalString(profile.identification),
        phone: getOptionalString(profile.phone),
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    throwError(profileError, "No fue posible actualizar el perfil.");
  }

  const membershipData = {
    company_id: companyId,
    department_id: departmentId,
    role_id: roleId,
    updated_at: now,
  };

  let membershipUpdateError = null;

  if (membershipId) {
    const { error } = await supabaseAdmin
      .from("user_memberships")
      .update(membershipData)
      .eq("membership_id", membershipId)
      .eq("user_id", cleanUserId);
    membershipUpdateError = error;
  } else {
    const { error } = await supabaseAdmin
      .from("user_memberships")
      .insert({
        user_id: cleanUserId,
        ...membershipData,
        is_active: true,
        start_date: getToday(),
        created_at: now,
      });
    membershipUpdateError = error;
  }

  if (membershipUpdateError) {
    throwError(membershipUpdateError, "No fue posible actualizar la asignación del usuario.");
  }

  try {
    await replaceUserModuleAccess(cleanUserId, moduleIds);
  } catch (moduleAccessError) {
    throw new Error(
      `El usuario fue actualizado, pero no fue posible guardar los módulos: ${moduleAccessError.message}`
    );
  }

  return { ok: true, message: "Usuario actualizado correctamente." };
}

// ---------------------------------------------------------------------------
// setAdminUserStatus — replaces "set-user-status" action
// ---------------------------------------------------------------------------

export async function setAdminUserStatus({ userId, isActive }) {
  const cleanUserId = getRequiredString(userId);

  if (!cleanUserId || typeof isActive !== "boolean") {
    throw new Error("Datos de usuario inválidos.");
  }

  const now = getNow();

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: isActive, updated_at: now })
    .eq("user_id", cleanUserId);

  if (profileError) {
    throwError(profileError, `No fue posible ${isActive ? "activar" : "desactivar"} el usuario.`);
  }

  const { error: membershipError } = await supabaseAdmin
    .from("user_memberships")
    .update({
      is_active: isActive,
      end_date: isActive ? null : getToday(),
      updated_at: now,
    })
    .eq("user_id", cleanUserId);

  if (membershipError) {
    throwError(membershipError, "No fue posible actualizar la membresía del usuario.");
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(cleanUserId, {
    ban_duration: isActive ? "none" : "876000h",
  });

  if (authError) {
    throwError(authError, "No fue posible actualizar el acceso del usuario.");
  }

  return {
    ok: true,
    message: `Usuario ${isActive ? "activado" : "desactivado"} correctamente.`,
  };
}

// ---------------------------------------------------------------------------
// saveAdminDepartment — replaces "save-department" action
// ---------------------------------------------------------------------------

export async function saveAdminDepartment({ department = {} }) {
  const departmentId = getRequiredString(department.department_id);
  const name = getRequiredString(department.name);
  const email = getOptionalString(department.email);
  const isActive = getBoolean(department.is_active, true);

  if (!name) {
    throw new Error("El nombre del departamento es obligatorio.");
  }

  const data = { name, email, is_active: isActive, updated_at: getNow() };
  let responseError = null;

  if (departmentId) {
    const { error } = await supabaseAdmin
      .from("departments")
      .update(data)
      .eq("department_id", departmentId);
    responseError = error;
  } else {
    const { error } = await supabaseAdmin
      .from("departments")
      .insert({ ...data, created_at: getNow() });
    responseError = error;
  }

  if (responseError) {
    throwError(responseError, "No fue posible guardar el departamento.");
  }

  return { ok: true, message: "Departamento guardado correctamente." };
}

// ---------------------------------------------------------------------------
// setAdminDepartmentStatus — replaces "set-department-status" action
// ---------------------------------------------------------------------------

export async function setAdminDepartmentStatus({ departmentId, isActive }) {
  const cleanId = getRequiredString(departmentId);

  if (!cleanId || typeof isActive !== "boolean") {
    throw new Error("Datos de departamento inválidos.");
  }

  const { error } = await supabaseAdmin
    .from("departments")
    .update({ is_active: isActive, updated_at: getNow() })
    .eq("department_id", cleanId);

  if (error) {
    throwError(error, `No fue posible ${isActive ? "activar" : "desactivar"} el departamento.`);
  }

  return {
    ok: true,
    message: `Departamento ${isActive ? "activado" : "desactivado"} correctamente.`,
  };
}

// ---------------------------------------------------------------------------
// saveAdminRole — replaces "save-role" action
// ---------------------------------------------------------------------------

export async function saveAdminRole({ role = {} }) {
  const roleId = getRequiredString(role.role_id);
  const roleName = getRequiredString(role.role_name);
  const roleCode = getRequiredString(role.role_code).toUpperCase();
  const description = getOptionalString(role.description);
  const isActive = getBoolean(role.is_active, true);

  if (!roleName || !roleCode) {
    throw new Error("El nombre y código del rol son obligatorios.");
  }

  const data = {
    role_name: roleName,
    role_code: roleCode,
    description,
    is_active: isActive,
    updated_at: getNow(),
  };
  let responseError = null;

  if (roleId) {
    const { error } = await supabaseAdmin
      .from("roles")
      .update(data)
      .eq("role_id", roleId);
    responseError = error;
  } else {
    const { error } = await supabaseAdmin
      .from("roles")
      .insert({ ...data, created_at: getNow() });
    responseError = error;
  }

  if (responseError) {
    throwError(responseError, "No fue posible guardar el rol.");
  }

  return { ok: true, message: "Rol guardado correctamente." };
}

// ---------------------------------------------------------------------------
// setAdminRoleStatus — replaces "set-role-status" action
// ---------------------------------------------------------------------------

export async function setAdminRoleStatus({ roleId, isActive }) {
  const cleanId = getRequiredString(roleId);

  if (!cleanId || typeof isActive !== "boolean") {
    throw new Error("Datos de rol inválidos.");
  }

  const { error } = await supabaseAdmin
    .from("roles")
    .update({ is_active: isActive, updated_at: getNow() })
    .eq("role_id", cleanId);

  if (error) {
    throwError(error, `No fue posible ${isActive ? "activar" : "desactivar"} el rol.`);
  }

  return {
    ok: true,
    message: `Rol ${isActive ? "activado" : "desactivado"} correctamente.`,
  };
}
