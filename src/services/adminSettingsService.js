import { supabase } from "./primarySupabaseClient";

const ROLE_COLUMNS =
  "role_id, role_name, role_code, description, is_active, created_at, updated_at";

function normalizeRoleCode(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildRolePayload({ name, code, description, isActive }) {
  const roleName = name.trim();
  const roleCode = normalizeRoleCode(code || roleName);

  return {
    role_name: roleName,
    role_code: roleCode,
    description: description?.trim() || null,
    is_active: Boolean(isActive),
  };
}

export async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_COLUMNS)
    .order("role_name", { ascending: true });

  if (error) {
    throw new Error(error.message || "No fue posible cargar los roles.");
  }

  return data || [];
}

export async function createRole(role) {
  const payload = buildRolePayload(role);

  if (!payload.role_name) {
    throw new Error("Ingresa el nombre del rol.");
  }

  if (!payload.role_code) {
    throw new Error("Ingresa un codigo valido para el rol.");
  }

  const { data, error } = await supabase
    .from("roles")
    .insert(payload)
    .select(ROLE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message || "No fue posible crear el rol.");
  }

  return data;
}

export async function updateRole(roleId, role) {
  const payload = {
    ...buildRolePayload(role),
    updated_at: new Date().toISOString(),
  };

  if (!roleId) {
    throw new Error("No se encontro el rol a actualizar.");
  }

  if (!payload.role_name) {
    throw new Error("Ingresa el nombre del rol.");
  }

  if (!payload.role_code) {
    throw new Error("Ingresa un codigo valido para el rol.");
  }

  const { data, error } = await supabase
    .from("roles")
    .update(payload)
    .eq("role_id", roleId)
    .select(ROLE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message || "No fue posible actualizar el rol.");
  }

  return data;
}

export async function deleteRole(roleId) {
  if (!roleId) {
    throw new Error("No se encontro el rol a eliminar.");
  }

  const { error } = await supabase
    .from("roles")
    .delete()
    .eq("role_id", roleId);

  if (error) {
    throw new Error(error.message || "No fue posible eliminar el rol.");
  }
}
