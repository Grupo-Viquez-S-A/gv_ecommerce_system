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

function getFunctionErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return String(error.message);
  }

  if (error.error) {
    return String(error.error);
  }

  if (error.details) {
    return String(error.details);
  }

  if (error.hint) {
    return String(error.hint);
  }

  if (error.status && error.statusText) {
    return `Status ${error.status} ${String(error.statusText)}`;
  }

  try {
    const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // ignore
  }

  return fallbackMessage;
}

function assertAdminSettingsResponse(data, error, fallbackMessage) {
  if (error) {
    console.error("adminSettingsService error response:", { data, error });
    throw new Error(getFunctionErrorMessage(error, fallbackMessage));
  }

  if (data?.ok === false) {
    throw new Error(data.error || fallbackMessage);
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
    const message = getFunctionErrorMessage(
      data,
      `Edge Function returned ${response.status} ${response.statusText}`,
    );
    console.error("adminSettingsService failed function call", {
      url: `${SUPABASE_FUNCTIONS_URL}/admin-settings`,
      status: response.status,
      statusText: response.statusText,
      requestBody: body,
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
