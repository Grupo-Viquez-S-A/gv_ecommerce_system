import {
  RiArrowDownSFill,
  RiBankCardFill,
  RiCalendarCheckFill,
  RiCloseLine,
  RiDownloadFill,
  RiFileList3Fill,
  RiImage2Line,
  RiInformationLine,
  RiMapPin2Fill,
  RiMoneyDollarCircleFill,
  RiStore2Fill,
  RiTruckFill,
  RiUser3Fill,
  RiWallet3Fill,
} from "react-icons/ri";

import SalesStatusBadge from "./SalesStatusBadge.jsx";
import {
  SALES_PAYMENT_CONFIG,
  SALES_STATUS_CONFIG,
  formatSalesCurrency,
  formatSalesDate,
} from "./salesViewConfig.js";
import { formatOrderFileSize } from "../orders/OrdersViewHelpers.jsx";

function SaleInfoCard({ icon, label, value }) {
  return (
    <article className="rounded-xl border border-[#2a3550] bg-[#182235] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 text-[#C9A227]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <div className="mt-1 text-sm font-semibold text-white">
            {value || "No indicado"}
          </div>
        </div>
      </div>
    </article>
  );
}

function PaymentSummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#2a3550] bg-[#141d2e] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function SaleDetailsDrawer({
  open,
  sale,
  payments = [],
  paymentsLoading = false,
  paymentsError = null,
  previewReceipt,
  setPreviewReceipt,
  canApprovePayments = false,
  approvalLoading = false,
  approvalError = null,
  approvalSuccess = null,
  expandedPaymentId = null,
  setExpandedPaymentId,
  onApprovePayments,
  onClose,
}) {
  if (!open || !sale) {
    return null;
  }

  const amountReported = payments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0,
  );
  const validatedPayments = payments.filter((payment) => payment.isValid);
  const amountValidated = validatedPayments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0,
  );
  const pendingPayments = payments.filter((payment) => !payment.isValid).length;
  const receiptCount = payments.reduce(
    (sum, payment) => sum + (payment.receipts?.length || 0),
    0,
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
        role="dialog"
        aria-modal="true"
        onMouseDown={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#33415f] bg-[#0f1728] shadow-2xl"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-[#2a3550] bg-[#141d2e] p-5">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/15 text-[#C9A227]">
                <RiMoneyDollarCircleFill size={24} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
                  Detalle de venta
                </p>
                <h2 className="mt-1 break-words text-xl font-black text-white sm:text-2xl">
                  {sale.code}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Cotizacion relacionada: {sale.quotationNumber}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SalesStatusBadge
                    status={sale.productionStatus}
                    label={sale.productionStatusLabel}
                    config={SALES_STATUS_CONFIG}
                  />
                  <SalesStatusBadge
                    status={sale.paymentStatus}
                    label={sale.paymentStatusLabel}
                    config={SALES_PAYMENT_CONFIG}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2a3550] bg-[#1c2538] text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              aria-label="Cerrar detalle de venta"
            >
              <RiCloseLine size={20} />
            </button>
          </header>

          <div className="overflow-y-auto p-4 sm:p-5">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SaleInfoCard
                  label="Cliente"
                  value={sale.client}
                  icon={<RiStore2Fill size={20} />}
                />
                <SaleInfoCard
                  label="Responsable"
                  value={sale.representative}
                  icon={<RiUser3Fill size={20} />}
                />
                <SaleInfoCard
                  label="Metodo de pago"
                  value={sale.paymentMethod}
                  icon={<RiWallet3Fill size={20} />}
                />
                <SaleInfoCard
                  label="Condicion de pago"
                  value={sale.paymentCondition}
                  icon={<RiBankCardFill size={20} />}
                />
                <SaleInfoCard
                  label="Fecha de venta"
                  value={formatSalesDate(sale.saleDate)}
                  icon={<RiCalendarCheckFill size={20} />}
                />
                <SaleInfoCard
                  label="Total vendido"
                  value={formatSalesCurrency(sale.total)}
                  icon={<RiMoneyDollarCircleFill size={20} />}
                />
                <SaleInfoCard
                  label="Monto pagado"
                  value={formatSalesCurrency(sale.amountPaid)}
                  icon={<RiWallet3Fill size={20} />}
                />
                <SaleInfoCard
                  label="Saldo pendiente"
                  value={formatSalesCurrency(sale.balance)}
                  icon={<RiInformationLine size={20} />}
                />
                <SaleInfoCard
                  label="Estado de produccion"
                  value={sale.productionStatusLabel}
                  icon={<RiTruckFill size={20} />}
                />
                <SaleInfoCard
                  label="Sucursal"
                  value={sale.branchLabel || "No indicada"}
                  icon={<RiMapPin2Fill size={20} />}
                />
                <SaleInfoCard
                  label="Cedula juridica"
                  value={sale.legalId || "No indicada"}
                  icon={<RiFileList3Fill size={20} />}
                />
                <SaleInfoCard
                  label="Creada"
                  value={formatSalesDate(sale.createdAt)}
                  icon={<RiCalendarCheckFill size={20} />}
                />
              </div>

              <section className="rounded-xl border border-[#2a3550] bg-[#10192b] p-4">
                <div className="flex flex-col gap-2 border-b border-[#2a3550] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Reportes de pagos
                    </h3>
                    <p className="text-sm text-gray-500">
                      Pagos reportados por los agentes para esta orden de producción.
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    {paymentsLoading
                      ? "Cargando pagos..."
                      : `${payments.length} pago${payments.length === 1 ? "" : "s"} registrado${payments.length === 1 ? "" : "s"}`}
                  </div>
                </div>

                {!paymentsLoading && !paymentsError && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <PaymentSummaryCard
                      label="Monto reportado"
                      value={formatSalesCurrency(amountReported)}
                    />
                    <PaymentSummaryCard
                      label="Monto validado"
                      value={formatSalesCurrency(amountValidated)}
                    />
                    <PaymentSummaryCard
                      label="Pendientes de validar"
                      value={String(pendingPayments)}
                    />
                    <PaymentSummaryCard
                      label="Comprobantes"
                      value={String(receiptCount)}
                    />
                  </div>
                )}

                {paymentsLoading && (
                  <div className="mt-4 rounded-lg border border-[#2a3550] bg-[#141d2e] px-5 py-6 text-sm text-gray-400">
                    Cargando reportes de pago...
                  </div>
                )}

                {!paymentsLoading && paymentsError && (
                  <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                    {paymentsError}
                  </div>
                )}

                {!paymentsLoading && !paymentsError && payments.length === 0 && (
                  <div className="mt-4 rounded-lg border border-[#2a3550] bg-[#141d2e] px-5 py-6 text-sm text-gray-400">
                    Esta venta todavia no tiene pagos reportados.
                  </div>
                )}

                {!paymentsLoading && !paymentsError && payments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {payments.map((payment) => (
                      <article
                        key={payment.paymentId}
                        className="overflow-hidden rounded-xl border border-[#2a3550] bg-[#182235]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPaymentId?.(
                              expandedPaymentId === payment.paymentId
                                ? null
                                : payment.paymentId,
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[#1d2940]"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <RiArrowDownSFill
                              size={20}
                              className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                                expandedPaymentId === payment.paymentId
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />

                            <div className="grid min-w-0 gap-2 sm:grid-cols-4 sm:gap-4">
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                  Pago reportado
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">
                                  {formatSalesCurrency(payment.amount)}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                  Fecha
                                </p>
                                <p className="mt-1 truncate text-sm text-gray-300">
                                  {formatSalesDate(payment.paymentDate || payment.createdAt)}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                  Referencia
                                </p>
                                <p className="mt-1 truncate text-sm text-gray-300">
                                  {payment.referenceNumber || "No indicada"}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                  Adjuntos
                                </p>
                                <p className="mt-1 text-sm text-gray-300">
                                  {payment.receipts.length}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <span className="rounded-md border border-[#2a3550] bg-[#141d2e] px-2.5 py-1 text-xs font-medium text-gray-300">
                              {payment.methodName}
                            </span>
                            <span
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                                payment.isValid
                                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                              }`}
                            >
                              {payment.isValid ? "Validado" : "Pendiente de validar"}
                            </span>
                          </div>
                        </button>

                        {expandedPaymentId === payment.paymentId && (
                          <div className="border-t border-[#2a3550] px-4 pb-4 pt-4">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <PaymentSummaryCard
                                label="Fecha reportada"
                                value={formatSalesDate(payment.paymentDate || payment.createdAt)}
                              />
                              <PaymentSummaryCard
                                label="Referencia"
                                value={payment.referenceNumber || "No indicada"}
                              />
                              <PaymentSummaryCard
                                label="Adjuntos"
                                value={String(payment.receipts.length)}
                              />
                              <PaymentSummaryCard
                                label="Actualizado"
                                value={formatSalesDate(payment.updatedAt || payment.createdAt)}
                              />
                            </div>

                            {payment.notes && (
                              <div className="mt-4 rounded-lg border border-[#2a3550] bg-[#141d2e] px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                  Notas del pago
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                                  {payment.notes}
                                </p>
                              </div>
                            )}

                            {payment.receipts.length > 0 && (
                              <div className="mt-4 space-y-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
                                    Comprobantes adjuntos
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Puedes abrir una imagen o descargar el archivo original.
                                  </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                  {payment.receipts.map((receipt) => {
                                    const isImage = (receipt.mimeType || "").startsWith("image/");

                                    if (isImage && receipt.signedUrl) {
                                      return (
                                        <button
                                          key={receipt.receiptId}
                                          type="button"
                                          onClick={() => setPreviewReceipt(receipt)}
                                          className="group relative aspect-[4/3] min-h-36 overflow-hidden rounded-lg border border-[#2a3550] bg-black/20 transition-colors hover:border-[#C9A227]"
                                          title={receipt.fileName || "Comprobante"}
                                        >
                                          <img
                                            src={receipt.signedUrl}
                                            alt={receipt.fileName || "Comprobante de pago"}
                                            className="h-full w-full object-contain"
                                          />

                                          <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                                          <span className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-black/75 px-2 py-1 text-left text-[11px] text-white">
                                            <RiImage2Line size={12} />
                                            <span className="truncate">
                                              {receipt.fileName || "Comprobante"}
                                            </span>
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
                                        className="flex min-h-24 flex-col justify-between rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-3 text-xs text-[#C9A227] transition-colors hover:border-[#C9A227]"
                                      >
                                        <span className="inline-flex items-center gap-1">
                                          <RiDownloadFill size={12} />
                                          Descargar archivo
                                        </span>
                                        <span className="break-all text-gray-300">
                                          {receipt.fileName || "Comprobante"}
                                        </span>
                                        <span className="text-gray-500">
                                          {formatOrderFileSize(receipt.fileSize)}
                                        </span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                {!paymentsLoading && !paymentsError && pendingPayments > 0 && (
                  <div className="mt-4 border-t border-[#2a3550] pt-4">
                    {approvalError && (
                      <div className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {approvalError}
                      </div>
                    )}

                    {approvalSuccess && (
                      <div className="mb-3 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                        {approvalSuccess}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-500">
                        Solo los usuarios con rol Contador/ACCOUNTANT o
                        Presidente/PRESIDENT pueden aprobar reportes de pago.
                      </p>

                      {canApprovePayments && (
                        <button
                          type="button"
                          onClick={onApprovePayments}
                          disabled={approvalLoading}
                          className="rounded-lg bg-[#C9A227] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B8921F] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approvalLoading
                            ? "Aprobando..."
                            : "Aprobar reportes de pago"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          <footer className="border-t border-[#2a3550] bg-[#141d2e] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Venta {sale.code} — {sale.paymentStatusLabel}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#2a3550] bg-[#1c2538] px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </footer>
        </div>
      </div>

      {previewReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-3 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setPreviewReceipt(null)}
            className="fixed inset-0 cursor-default"
            aria-label="Cerrar previsualizacion"
          />

          <div className="relative z-[71] flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#2a3550] bg-[#141d2e] shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2a3550] px-5 py-3">
              <p className="truncate pr-3 text-sm font-medium text-white">
                {previewReceipt.fileName || "Comprobante de pago"}
              </p>

              <div className="flex flex-shrink-0 items-center gap-2">
                <a
                  href={previewReceipt.signedUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 transition-colors hover:text-[#C9A227]"
                  title="Descargar"
                >
                  <RiDownloadFill size={18} />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="h-8 w-8 rounded-lg text-gray-400 transition-colors hover:bg-[#1c2538] hover:text-white"
                  aria-label="Cerrar"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-black/30 p-4">
              <img
                src={previewReceipt.signedUrl}
                alt={previewReceipt.fileName || "Comprobante de pago"}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
