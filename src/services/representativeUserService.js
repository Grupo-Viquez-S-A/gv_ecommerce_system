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
        return typeof message === "string" ? message : JSON.stringify(message);
      }
    } catch {
      try {
        const text = await response.clone().text();

        if (text) {
          return text;
        }
      } catch {
        // Keep Supabase's original error when the body is not readable.
      }
    }
  }

  if (typeof error.message === "string" && error.message !== "{}") {
    return error.message;
  }

  return fallbackMessage;
}

export async function createRepresentativeUser(payload) {
  const { data, error } = await supabase.functions.invoke(
    "create-representative-user",
    {
      body: payload,
    },
  );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
        "No fue posible crear el acceso del representante.",
      ),
    );
  }

  if (data?.ok === false) {
    throw new Error(
      data.error || "No fue posible crear el acceso del representante.",
    );
  }

  return data;
}
