import { RiArrowDownSFill, RiCheckboxCircleFill, RiDownloadFill, RiFileTextLine } from "react-icons/ri";
import { OrderDetailRow as DetailRow, formatOrderCurrency as formatCurrency, formatOrderDate as formatDate, formatOrderFileSize as formatFileSize } from "./OrdersViewHelpers.jsx";

export default function OrderPaymentsDrawer({ paymentsDrawerOpen, closePaymentsDrawer, viewOrder, paymentSummary, paymentsLoading, paymentsError, orderPayments, expandedPaymentId, setExpandedPaymentId, setPreviewReceipt, importing, importResult, handleImportPayments, previewReceipt }) {
  return <>
      {/* Fondo del drawer de pagos */}
      {paymentsDrawerOpen && (
        <button
          type="button"
          onClick={closePaymentsDrawer}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default xl:hidden"
          aria-label="Cerrar panel de comprobantes"
        />
      )}

      {/* Drawer de comprobantes de pago */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[32rem] bg-[#141d2e] border-l border-[#2a3550] z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          paymentsDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RiFileTextLine size={20} className="text-[#C9A227]" />
              Comprobantes de pago
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Revision de pagos reportados para esta orden de venta.
            </p>
          </div>

          <button
            type="button"
            onClick={closePaymentsDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {viewOrder && (
            <div className="space-y-5">
              <div className="pb-5 border-b border-[#2a3550]">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {viewOrder.quotationNumber}
                  </h3>

                  <p className="text-sm text-gray-400">
                    {paymentSummary.receiptCount} archivo
                    {paymentSummary.receiptCount === 1 ? "" : "s"} adjunto
                    {paymentSummary.receiptCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <DetailRow label="Orden" value={viewOrder.code} />
                <DetailRow label="Cliente" value={viewOrder.client} />
                <DetailRow label="Total de la orden">
                  {formatCurrency(viewOrder.total)}
                </DetailRow>
                <DetailRow label="Saldo actual">
                  {formatCurrency(viewOrder.balance)}
                </DetailRow>
                <DetailRow label="Monto reportado">
                  {formatCurrency(paymentSummary.amountReported)}
                </DetailRow>
                <DetailRow label="Monto validado">
                  {formatCurrency(paymentSummary.amountValidated)}
                </DetailRow>
                <DetailRow label="Pendientes de validar">
                  {paymentSummary.pendingPayments}
                </DetailRow>
              </div>
            </div>
          )}

          {paymentsLoading && (
            <p className="text-sm text-gray-400">Cargando comprobantes...</p>
          )}

          {!paymentsLoading && paymentsError && (
            <p className="text-sm text-red-400">{paymentsError}</p>
          )}

          {!paymentsLoading && !paymentsError && orderPayments.length === 0 && (
            <p className="text-sm text-gray-400">
              Esta orden no tiene pagos reportados todavia.
            </p>
          )}

          {importResult && (
            <div className="rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-3 space-y-1">
              <p className="text-sm text-white font-medium flex items-center gap-2">
                <RiCheckboxCircleFill className="text-[#C9A227]" size={16} />
                Comprobantes importados correctamente
              </p>

              <p className="text-xs text-gray-300">
                Pagado: {formatCurrency(importResult.amountPaid)} de{" "}
                {formatCurrency(importResult.total)}
              </p>

              <p className="text-xs text-gray-300">
                {importResult.movedToSales
                  ? "El pago cubre el total, la orden se movio a Ventas."
                  : "Pago parcial registrado, la orden quedo en Pago adelantado."}
              </p>

              {importResult.emailNotification?.sent ? (
                <p className="text-xs text-green-300">
                  Correo enviado a {importResult.emailNotification.recipient}.
                </p>
              ) : (
                <p className="text-xs text-yellow-300">
                  El pago se importo, pero no se pudo enviar el correo:{" "}
                  {importResult.emailNotification?.error || "error no indicado"}
                </p>
              )}
            </div>
          )}

          {!paymentsLoading &&
            orderPayments.map((payment) => {
              const isExpanded = expandedPaymentId === payment.paymentId;

              return (
                <div
                  key={payment.paymentId}
                  className="rounded-xl border border-[#2a3550] bg-[#1c2538] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPaymentId(
                        isExpanded ? null : payment.paymentId,
                      )
                    }
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-[#22304a] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <RiArrowDownSFill
                        size={20}
                        className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />

                      <div className="min-w-0">
                        <span className="block text-xs text-gray-500">
                          Pago reportado
                        </span>
                        <span className="text-xl font-semibold text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-md border ${
                        payment.isValid
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {payment.isValid ? "Validado" : "Pendiente de validar"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#2a3550]">
                      <div className="space-y-3 pt-4">
                        <DetailRow label="Metodo" value={payment.methodName} />
                        <DetailRow label="Fecha reportada">
                          {formatDate(payment.paymentDate)}
                        </DetailRow>

                        {payment.referenceNumber && (
                          <DetailRow label="Referencia">
                            {payment.referenceNumber}
                          </DetailRow>
                        )}

                        <DetailRow label="Archivos adjuntos">
                          {payment.receipts.length}
                        </DetailRow>

                        {payment.notes && (
                          <div className="rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-2">
                            <span className="block text-xs text-gray-500 mb-1">
                              Notas del pago
                            </span>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {payment.receipts.length > 0 && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <span className="text-xs font-medium uppercase tracking-widest text-[#C9A227]/80">
                              Comprobantes
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Puedes abrir una imagen para revisarla en
                              pantalla completa o descargar el archivo
                              original.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {payment.receipts.map((receipt) => {
                              const isImage = (
                                receipt.mimeType || ""
                              ).startsWith("image/");

                              if (isImage && receipt.signedUrl) {
                                return (
                                  <button
                                    key={receipt.receiptId}
                                    type="button"
                                    onClick={() => setPreviewReceipt(receipt)}
                                    className="group relative aspect-[4/3] min-h-36 rounded-lg overflow-hidden border border-[#2a3550] hover:border-[#C9A227] transition-colors cursor-pointer bg-black/20"
                                    title={receipt.fileName || "Comprobante"}
                                  >
                                    <img
                                      src={receipt.signedUrl}
                                      alt={
                                        receipt.fileName ||
                                        "Comprobante de pago"
                                      }
                                      className="w-full h-full object-contain"
                                    />

                                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-left text-[11px] text-white truncate">
                                      {receipt.fileName || "Comprobante"}
                                    </span>
                                  </button>
                                );
                              }

                              return (
                                <a
                                  key={receipt.receiptId}
                                  href={receipt.signedUrl || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="min-h-24 rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-2 text-xs text-[#C9A227] hover:border-[#C9A227] transition-colors flex flex-col justify-between"
                                >
                                  <span className="inline-flex items-center gap-1">
                                    <RiDownloadFill size={12} />
                                    Descargar archivo
                                  </span>
                                  <span className="text-gray-300 break-all">
                                    {receipt.fileName || "Comprobante"}
                                  </span>
                                  <span className="text-gray-500">
                                    {formatFileSize(receipt.fileSize)}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={closePaymentsDrawer}
            className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            disabled={
              importing ||
              paymentsLoading ||
              !orderPayments.some((payment) => !payment.isValid)
            }
            onClick={handleImportPayments}
            className="flex-1 bg-[#C9A227] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#b8931f] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importando..." : "Importar comprobantes"}
          </button>
        </div>
      </div>

      {/* Lightbox de previsualizacion del comprobante */}
      {previewReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-3 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setPreviewReceipt(null)}
            className="fixed inset-0 cursor-default"
            aria-label="Cerrar previsualizacion"
          />

          <div className="relative z-[71] max-w-2xl w-full max-h-[85vh] bg-[#141d2e] border border-[#2a3550] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550] flex-shrink-0">
              <p className="text-sm text-white font-medium truncate pr-3">
                {previewReceipt.fileName || "Comprobante de pago"}
              </p>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={previewReceipt.signedUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-[#C9A227] transition-colors"
                  title="Descargar"
                >
                  <RiDownloadFill size={18} />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-black/30 flex items-center justify-center p-4">
              <img
                src={previewReceipt.signedUrl}
                alt={previewReceipt.fileName || "Comprobante de pago"}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
  </>;
}

