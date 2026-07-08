import { supabase } from "./primarySupabaseClient";

async function getFunctionErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  const response = error.context;

  if (response && typeof response.json === "function") {
    try {
      const body = await response.json();
      const message = body?.error || body?.message;

      if (message) {
        return message;
      }
    } catch {
      // If the response body is not JSON, keep the original error message.
    }
  }

  return error.message || fallbackMessage;
}

async function assertEdgeResponse(data, error, fallbackMessage) {
  if (error) {
    throw new Error(await getFunctionErrorMessage(error, fallbackMessage));
  }

  if (data?.ok === false) {
    throw new Error(data.error || fallbackMessage);
  }

  return data || {};
}

async function invokeAdminUsers(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: {
      action,
      ...payload,
    },
  });

  return await assertEdgeResponse(
    data,
    error,
    "No fue posible completar la accion administrativa.",
  );
}

export async function getAdminFormCatalogs() {
  return invokeAdminUsers("list-catalogs");
}

export async function getAdminSettingsCatalogs() {
  return invokeAdminUsers("list");
}

export async function createAdminUser({
  email,
  password,
  profile,
  membership,
  moduleIds = [],
}) {
  return invokeAdminUsers("create-user", {
    email,
    password,
    profile,
    membership,
    moduleIds,
  });
}
