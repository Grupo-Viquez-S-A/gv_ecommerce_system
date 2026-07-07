import { supabase } from "./primarySupabaseClient";

const SUPABASE_FUNCTIONS_URL =
  `${import.meta.env.VITE_SUPABASE_API_URL?.replace(/\/+$/, "")}/functions/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function getFunctionAuthHeader() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      `No fue posible obtener la sesión de Supabase: ${error.message || "error desconocido"}`,
    );
  }

  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    throw new Error(
      "No hay una sesión activa. Inicia sesión nuevamente para usar la administración de usuarios.",
    );
  }

  return `Bearer ${accessToken}`;
}

function getFunctionErrorMessage(data, rawText, fallbackMessage) {
  if (data && typeof data === "object") {
    const message =
      data.error || data.message || data.msg || data.details || data.hint;

    if (message && typeof message === "string" && message.trim()) {
      return message.trim();
    }

    if (message && typeof message !== "string") {
      const stringified = JSON.stringify(message);
      if (stringified && stringified !== "{}") {
        return stringified;
      }
    }
  }

  if (typeof data === "string" && data.trim() && data !== "{}") {
    return data.trim();
  }

  if (rawText && rawText.trim() && rawText !== "{}") {
    return rawText.trim();
  }

  return fallbackMessage;
}

function assertAdminSettingsResponse(data, error, fallbackMessage) {
  if (error) {
    console.error("adminSettingsService error response:", { data, error });
    throw new Error(getFunctionErrorMessage(error, "", fallbackMessage));
  }

  if (data?.ok === false) {
    const msg =
      typeof data.error === "string" && data.error.trim()
        ? data.error.trim()
        : fallbackMessage;
    throw new Error(msg);
  }

  return data || {};
}

async function invokeAdminSettingsFunction(body) {
  if (!SUPABASE_FUNCTIONS_URL) {
    throw new Error("La variable de entorno VITE_SUPABASE_API_URL no está configurada.");
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error("La variable de entorno VITE_SUPABASE_ANON_KEY no está configurada.");
  }

  const authHeader = await getFunctionAuthHeader();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/admin-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const fallback = `Error ${response.status} al llamar la función admin-settings.`;
    const message = getFunctionErrorMessage(data, text, fallback);
    console.error("adminSettingsService failed function call", {
      url: `${SUPABASE_FUNCTIONS_URL}/admin-settings`,
      status: response.status,
      statusText: response.statusText,
      requestBody: body,
      responseText: text,
      responseBody: data,
    });
    throw new Error(message);
  }

  return data;
}

export async function getAdminSettingsCatalogs() {
  const data = await invokeAdminSettingsFunction({
    action: "list",
  });

  return assertAdminSettingsResponse(
    data,
    null,
    "No fue posible cargar la configuracion administrativa.",
  );
}

export async function createAdminUser({
  email,
  password,
  profile,
  membership,
  moduleIds = [],
}) {
  const data = await invokeAdminSettingsFunction({
    action: "create-user",
    email,
    password,
    profile,
    membership,
    moduleIds,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    "No fue posible crear el usuario.",
  );
}

export async function updateAdminUser({
  userId,
  email,
  password,
  profile,
  membership,
  moduleIds = [],
}) {
  const data = await invokeAdminSettingsFunction({
    action: "update-user",
    userId,
    email,
    password,
    profile,
    membership,
    moduleIds,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    "No fue posible actualizar el usuario.",
  );
}

export async function setAdminUserStatus({ userId, isActive }) {
  const data = await invokeAdminSettingsFunction({
    action: "set-user-status",
    userId,
    isActive,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    `No fue posible ${isActive ? "activar" : "desactivar"} el usuario.`,
  );
}

export async function saveAdminDepartment({ department }) {
  const data = await invokeAdminSettingsFunction({
    action: "save-department",
    department,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    "No fue posible guardar el departamento.",
  );
}

export async function setAdminDepartmentStatus({ departmentId, isActive }) {
  const data = await invokeAdminSettingsFunction({
    action: "set-department-status",
    departmentId,
    isActive,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    `No fue posible ${isActive ? "activar" : "desactivar"} el departamento.`,
  );
}

export async function saveAdminRole({ role }) {
  const data = await invokeAdminSettingsFunction({
    action: "save-role",
    role,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    "No fue posible guardar el rol.",
  );
}

export async function setAdminRoleStatus({ roleId, isActive }) {
  const data = await invokeAdminSettingsFunction({
    action: "set-role-status",
    roleId,
    isActive,
  });

  return assertAdminSettingsResponse(
    data,
    null,
    `No fue posible ${isActive ? "activar" : "desactivar"} el rol.`,
  );
}
