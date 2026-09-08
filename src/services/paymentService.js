import { supabase } from "./primarySupabaseClient.js";

const PAYMENT_FILES_BUCKET = "Ecommerce";

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data ?? [];
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

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

async function notifyPaymentSuccess(productionOrderId) {
  const { data, error } = await supabase.functions.invoke(
    "notify-payment-success",
    {
      body: {
        production_order_id: productionOrderId,
      },
    },
  );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
        "No fue posible enviar el correo de confirmacion.",
      ),
    );
  }

  if (data?.ok === false) {
    throw new Error(
      data.error || "No fue posible enviar el correo de confirmacion.",
    );
  }

  return data;
}

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function indexRowsByKey(rows = [], keyName) {
  return rows.reduce((indexedRows, row) => {
    const key = row?.[keyName];

    if (key) {
      indexedRows[key] = row;
    }

    return indexedRows;
  }, {});
}

function groupRowsByKey(rows = [], keyName) {
  return rows.reduce((groupedRows, row) => {
    const key = row?.[keyName];

    if (!key) {
      return groupedRows;
    }

    if (!groupedRows[key]) {
      groupedRows[key] = [];
    }

    groupedRows[key].push(row);

    return groupedRows;
  }, {});
}

function buildDerivedPaymentState(total, amountPaid, currentStatus = "") {
  const normalizedTotal = getNumber(total, 0);
  const normalizedAmountPaid = getNumber(amountPaid, 0);
  const balance = Math.max(
    Math.round((normalizedTotal - normalizedAmountPaid) * 100) / 100,
    0,
  );
  const normalizedStatus = String(currentStatus || "").toLowerCase();

  if (["cancelado", "anulado", "rechazado"].includes(normalizedStatus)) {
    return {
      balance,
      paymentStatus: normalizedStatus,
    };
  }

  return {
    balance,
    paymentStatus:
      normalizedAmountPaid <= 0
        ? "pendiente"
        : balance <= 0
          ? "pagado"
          : "parcial",
  };
}

/**
 * Loads every payment reported for a production order (through the linked
 * quotation), together with its payment method and any uploaded receipts.
 * Used by the "Importar comprobantes de pago" drawer on Ordenes de venta.
 */
export async function getOrderPayments(productionOrderId) {
  if (!productionOrderId) {
    throw new Error("Se requiere el identificador de la orden de produccion");
  }

  const payments = throwIfError(
    await supabase
      .from("payments")
      .select(
        "payment_id, production_order_id, method_id, amount, payment_date, invoice_number, reference_number, notes, is_valid, created_by, created_at, updated_at",
      )
      .eq("production_order_id", productionOrderId)
      .order("payment_date", { ascending: false }),
    "No fue posible cargar los pagos de la orden",
  );

  if (!payments.length) {
    return [];
  }

  const paymentIds = payments.map((payment) => payment.payment_id);

  const methodIds = [
    ...new Set(payments.map((payment) => payment.method_id).filter(Boolean)),
  ];

  const [receipts, files, methods] = await Promise.all([
    throwIfError(
      await supabase
        .from("payment_receipts")
        .select(
          "payment_receipt_id, payment_id, customer_id, production_order_id, created_by, created_at, updated_at",
        )
        .in("payment_id", paymentIds),
      "No fue posible cargar los recibos de dinero",
    ),
    throwIfError(
      await supabase
        .from("files")
        .select(
          "file_id, payment_id, payment_receipt_id, file_type, file_name, file_path, public_url, file_format, file_size, created_at",
        )
        .in("payment_id", paymentIds)
        .order("created_at", { ascending: true }),
      "No fue posible cargar los archivos de pago",
    ),
    methodIds.length
      ? throwIfError(
          await supabase
            .from("payment_methods")
            .select("method_id, method_name")
            .in("method_id", methodIds),
          "No fue posible cargar los metodos de pago",
        )
      : [],
  ]);

  const receiptsByPaymentId = groupRowsByKey(receipts, "payment_id");
  const filesByPaymentId = groupRowsByKey(files, "payment_id");
  const methodsById = indexRowsByKey(methods, "method_id");

  const filePaths = files.map((file) => ({
    fileId: file.file_id,
    objectPath: file.file_path,
    publicUrl: file.public_url,
  }));

  const urlByFileId = {};

  await Promise.all(
    filePaths.map(async ({ fileId, objectPath, publicUrl }) => {
      if (publicUrl) {
        urlByFileId[fileId] = publicUrl;
        return;
      }

      if (!objectPath) {
        return;
      }

      const signedResult = await supabase.storage
        .from(PAYMENT_FILES_BUCKET)
        .createSignedUrl(objectPath, 60 * 30);

      if (!signedResult.error) {
        urlByFileId[fileId] = signedResult.data?.signedUrl || null;
      }
    }),
  );

  return payments.map((payment) => {
    const method = methodsById[payment.method_id] || null;

    const moneyReceipts = receiptsByPaymentId[payment.payment_id] || [];
    const paymentFiles = (filesByPaymentId[payment.payment_id] || []).map(
      (file) => {
        const fileFormat = file.file_format || "";

        return {
          receiptId: file.file_id,
          fileId: file.file_id,
          paymentReceiptId: file.payment_receipt_id,
          fileType: file.file_type,
          fileName: file.file_name,
          mimeType: fileFormat.includes("/")
            ? fileFormat
            : file.file_name?.toLowerCase().endsWith(".png")
              ? "image/png"
              : "",
          fileSize: file.file_size,
          isValid: true,
          createdAt: file.created_at,
          objectPath: file.file_path,
          bucketName: PAYMENT_FILES_BUCKET,
          signedUrl: urlByFileId[file.file_id] || null,
        };
      },
    );

    return {
      paymentId: payment.payment_id,
      productionOrderId: payment.production_order_id,
      amount: getNumber(payment.amount, 0),
      paymentDate: payment.payment_date,
      invoiceNumber: payment.invoice_number,
      referenceNumber: payment.reference_number,
      notes: payment.notes,
      isValid: payment.is_valid,
      methodName: method?.method_name || "Sin metodo",
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      moneyReceipts: moneyReceipts.map((receipt) => ({
        receiptId: receipt.payment_receipt_id,
        paymentReceiptId: receipt.payment_receipt_id,
        createdBy: receipt.created_by,
        customerId: receipt.customer_id,
        productionOrderId: receipt.production_order_id,
        createdAt: receipt.created_at,
        updatedAt: receipt.updated_at,
      })),
      receipts: paymentFiles,
    };
  });
}

/**
 * Marks every pending payment of a production order as valid, recalculates
 * the paid amount against the quotation total and updates the order's
 * balance/payment_status accordingly:
 *  - amountPaid < total  -> "parcial" (pago adelantado)
 *  - amountPaid >= total -> "pagado" (la orden pasa a Ventas)
 */
export async function importOrderPayments(productionOrderId) {
  if (!productionOrderId) {
    throw new Error("Se requiere el identificador de la orden de produccion");
  }

  const order = throwIfError(
    await supabase
      .from("production_orders")
      .select("production_order_id, quotation_id, payment_status, balance")
      .eq("production_order_id", productionOrderId)
      .maybeSingle(),
    "No fue posible cargar la orden de produccion",
  );

  if (!order) {
    throw new Error("No se encontro la orden de produccion");
  }

  const quotation = throwIfError(
    await supabase
      .from("quotations")
      .select("quotation_id, total")
      .eq("quotation_id", order.quotation_id)
      .maybeSingle(),
    "No fue posible cargar la cotizacion asociada",
  );

  const total = getNumber(quotation?.total, 0);

  throwIfError(
    await supabase
      .from("payments")
      .update({ is_valid: true })
      .eq("production_order_id", productionOrderId)
      .eq("is_valid", false),
    "No fue posible validar los pagos reportados",
  );

  const validPayments = throwIfError(
    await supabase
      .from("payments")
      .select("amount")
      .eq("production_order_id", productionOrderId)
      .eq("is_valid", true),
    "No fue posible recalcular los pagos validados",
  );

  const amountPaid = validPayments.reduce(
    (sum, payment) => sum + getNumber(payment.amount, 0),
    0,
  );

  const { balance, paymentStatus } = buildDerivedPaymentState(
    total,
    amountPaid,
    order.payment_status,
  );

  const updatedOrder = throwIfError(
    await supabase
      .from("production_orders")
      .update({
        balance,
        payment_status: paymentStatus,
      })
      .eq("production_order_id", productionOrderId)
      .select("production_order_id, balance, payment_status")
      .maybeSingle(),
    "No fue posible actualizar el estado de pago de la orden",
  );

  if (!updatedOrder?.production_order_id) {
    throw new Error(
      "No fue posible confirmar la actualizacion del saldo de la orden.",
    );
  }

  let emailNotification;

  try {
    const notificationResult = await notifyPaymentSuccess(productionOrderId);

    emailNotification = {
      sent: true,
      error: null,
      recipient: notificationResult?.recipient || null,
    };
  } catch (error) {
    emailNotification = {
      sent: false,
      error:
        error?.message ||
        "El pago fue importado, pero no fue posible enviar el correo.",
      recipient: null,
    };
  }

  return {
    productionOrderId,
    total,
    amountPaid,
    balance: getNumber(updatedOrder.balance, balance),
    paymentStatus:
      String(updatedOrder.payment_status || paymentStatus).toLowerCase(),
    movedToSales: paymentStatus === "pagado",
    emailNotification,
  };
}
