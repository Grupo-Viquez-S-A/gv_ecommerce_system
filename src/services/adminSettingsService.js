import { supabase } from "./primarySupabaseClient";

function assertEdgeResponse(data, error, fallbackMessage) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
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

  return assertEdgeResponse(
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
