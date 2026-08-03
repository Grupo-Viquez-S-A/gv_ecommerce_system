import { supabase } from "./primarySupabaseClient.js";
import { isQuotationApproved } from "../components/quotations/QuotationsViewHelpers.jsx";
import { createQuotationProforma } from "../utils/proformaPdf.js";

async function getFunctionErrorMessage(error, fallbackMessage) {
  const response = error?.context;

  if (response && typeof response.clone === "function") {
    try {
      const body = await response.clone().json();
      if (body?.error || body?.message) return body.error || body.message;
    } catch {
      // Preserve the original function error if its response is not JSON.
    }
  }

  return error?.message && error.message !== "{}"
    ? error.message
    : fallbackMessage;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

export async function sendQuotationProformaEmail(quotation) {
  if (!quotation || !isQuotationApproved(quotation)) {
    throw new Error("La proforma solo puede enviarse cuando la cotizacion este aprobada.");
  }

  const quotationId = quotation.quotationId || quotation.id;
  if (!quotationId) {
    throw new Error("La cotizacion no tiene un identificador valido.");
  }

  const { doc } = await createQuotationProforma(quotation);
  const pdfBase64 = arrayBufferToBase64(doc.output("arraybuffer"));
  const { data, error } = await supabase.functions.invoke(
    "send-quotation-proforma",
    {
      body: {
        quotation_id: quotationId,
        pdf_base64: pdfBase64,
      },
    },
  );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
        "No fue posible enviar la proforma por correo.",
      ),
    );
  }

  if (data?.ok === false) {
    throw new Error(data.error || "No fue posible enviar la proforma por correo.");
  }

  return data;
}
