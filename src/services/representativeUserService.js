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

export async function notifyNewQuotation({ quotationId, representativeId } = {}) {
  const { data, error } = await supabase.functions.invoke(
    "notify-new-quotation",
    {
      body: {
        quotation_id: quotationId,
        representative_id: representativeId,
      },
    },
  );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
        "No fue posible notificar la nueva cotizacion al representante.",
      ),
    );
  }

  if (data?.ok === false) {
    throw new Error(
      data.error || "No fue posible notificar la nueva cotizacion al representante.",
    );
  }

  return data;
}

export async function deleteRepresentativeUser({ representativeId, userId } = {}) {
  if (!representativeId && !userId) {
    return { ok: true, skipped: true };
  }

  const { data, error } = await supabase.functions.invoke(
    "delete-representative-user",
    {
      body: {
        representative_id: representativeId || null,
        user_id: userId || null,
      },
    },
  );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
        "No fue posible eliminar el acceso del representante.",
      ),
    );
  }

  if (data?.ok === false) {
    throw new Error(
      data.error || "No fue posible eliminar el acceso del representante.",
    );
  }

  return data;
}

export async function deleteRepresentativeUsers(representatives = []) {
  const candidates = representatives.filter(
    (representative) => representative?.representative_id || representative?.user_id,
  );

  for (const representative of candidates) {
    try {
      await deleteRepresentativeUser({
        representativeId: representative.representative_id,
        userId: representative.user_id,
      });
    } catch (error) {
      console.error(
        `No fue posible eliminar la cuenta de acceso del representante ${
          representative.representative_id || representative.user_id
        }:`,
        error,
      );
    }
  }
}
