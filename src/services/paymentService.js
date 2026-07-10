import { supabase } from "./primarySupabaseClient.js";

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data ?? [];
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
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
        "payment_id, production_order_id, method_id, amount, payment_date, reference_number, notes, is_valid, created_by, created_at, updated_at",
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

  const [receipts, methods] = await Promise.all([
    throwIfError(
      await supabase
        .from("payment_receipts")
        .select(
          "payment_receipt_id, payment_id, bucket_name, folder_name, object_path, file_name, mime_type, file_size, is_valid, created_at",
        )
        .in("payment_id", paymentIds),
      "No fue posible cargar los comprobantes de pago",
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
  const methodsById = indexRowsByKey(methods, "method_id");

  const receiptPaths = receipts.map((receipt) => ({
    receiptId: receipt.payment_receipt_id,
    bucketName: receipt.bucket_name || "Ecommerce",
    objectPath: receipt.object_path,
  }));

  const signedUrlByReceiptId = {};

  await Promise.all(
    receiptPaths.map(async ({ receiptId, bucketName, objectPath }) => {
      if (!objectPath) {
        return;
      }

      const signedResult = await supabase.storage
        .from(bucketName)
        .createSignedUrl(objectPath, 60 * 30);

      if (!signedResult.error) {
        signedUrlByReceiptId[receiptId] = signedResult.data?.signedUrl || null;
      }
    }),
  );

  return payments.map((payment) => {
    const method = methodsById[payment.method_id] || null;

    const paymentReceipts = (receiptsByPaymentId[payment.payment_id] || []).map(
      (receipt) => ({
        receiptId: receipt.payment_receipt_id,
        fileName: receipt.file_name,
        mimeType: receipt.mime_type,
        fileSize: receipt.file_size,
        isValid: receipt.is_valid,
        createdAt: receipt.created_at,
        objectPath: receipt.object_path,
        bucketName: receipt.bucket_name,
        signedUrl: signedUrlByReceiptId[receipt.payment_receipt_id] || null,
      }),
    );

    return {
      paymentId: payment.payment_id,
      productionOrderId: payment.production_order_id,
      amount: getNumber(payment.amount, 0),
      paymentDate: payment.payment_date,
      referenceNumber: payment.reference_number,
      notes: payment.notes,
      isValid: payment.is_valid,
      methodName: method?.method_name || "Sin metodo",
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      receipts: paymentReceipts,
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

  const balance = Math.max(Math.round((total - amountPaid) * 100) / 100, 0);

  const paymentStatus =
    amountPaid <= 0 ? "pendiente" : balance <= 0 ? "pagado" : "parcial";

  throwIfError(
    await supabase
      .from("production_orders")
      .update({
        balance,
        payment_status: paymentStatus,
      })
      .eq("production_order_id", productionOrderId),
    "No fue posible actualizar el estado de pago de la orden",
  );

  return {
    productionOrderId,
    total,
    amountPaid,
    balance,
    paymentStatus,
    movedToSales: paymentStatus === "pagado",
  };
}
