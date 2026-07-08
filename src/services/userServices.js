import { supabase } from "./primarySupabaseClient";

async function getFunctionErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  const response = error.context;

  if (response && typeof response.clone === "function") {
    try {
      const body = await response.clone().json();
      const message = body?.error || body?.message;

      if (message) {
        return typeof message === "string"
          ? message
          : JSON.stringify(message);
      }
    } catch {
      try {
        const text = await response.clone().text();

        if (text) {
          return text;
        }
      } catch {
        // Keep Supabase's original error if the response body is not readable.
      }
    }
  }

  if (typeof error.message === "string" && error.message !== "{}") {
    return error.message;
  }

  return fallbackMessage;
}

export async function getUserFormCatalogs() {
  const [companiesResponse, departmentsResponse, rolesResponse] =
    await Promise.all([
      supabase
        .from("companies")
        .select("company_id, company_name, is_active")
        .eq("is_active", true)
        .order("company_name", { ascending: true }),
      supabase
        .from("departments")
        .select("department_id, name, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("roles")
        .select("role_id, role_name, role_code, is_active")
        .eq("is_active", true)
        .order("role_name", { ascending: true }),
    ]);

  const firstError = [
    companiesResponse.error,
    departmentsResponse.error,
    rolesResponse.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(
      firstError.message ||
        "No fue posible cargar empresas, departamentos y roles.",
    );
  }

  return {
    companies: companiesResponse.data || [],
    departments: departmentsResponse.data || [],
    roles: rolesResponse.data || [],
  };
}

export async function createEcommerceUser(payload) {
  const { data, error } = await supabase.functions.invoke(
    "create-ecommerce-user",
    {
      body: payload,
    },
  );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
        "No fue posible crear el usuario del e-commerce.",
      ),
    );
  }

  if (data?.ok === false) {
    throw new Error(
      data.error || "No fue posible crear el usuario del e-commerce.",
    );
  }

  return data;
}
