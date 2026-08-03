import {
  RiBankCardFill,
  RiCalendarCheckFill,
  RiFileList3Fill,
  RiMoneyDollarCircleFill,
  RiStore2Fill,
  RiTruckFill,
  RiWallet3Fill,
} from "react-icons/ri";

import PaymentForm from "../PaymentForm.jsx";
import formatCurrency from "../../utils/formatCurrency.js";
import { formatDateCR } from "../../utils/dateUtils.js";
import ClientDetailModal from "./ClientDetailModal.jsx";
import DetailInfoCard from "./DetailInfoCard.jsx";
import DetailProductsTable from "./DetailProductsTable.jsx";
import StatusBadge from "./StatusBadge.jsx";

const PRODUCTION_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "pausada", label: "Pausada" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

function openNativeDatePicker(event) {
  const input = event.currentTarget;

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers only allow showPicker from a direct pointer action.
    }
  }
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const formatted = formatDateCR(dateValue);

  return formatted || "Sin fecha";
}

function formatStatusLabel(status) {
  return PRODUCTION_STATUS_OPTIONS.find((option) => option.value === status)?.label
    || String(status || "Sin estado").replaceAll("_", " ");
}

export default function OrderDetailModal({
  isOpen,
  order,
  loading,
  error,
  onClose,
  showPaymentActions = false,
  showPaymentForm = false,
  paymentMethods = [],
  paymentLoading = false,
  paymentError = "",
  paymentSuccess = "",
  onOpenPaymentForm,
  onBackFromPaymentForm,
  onSubmitPayment,
  manageProduction = false,
  productionOrderForm = {},
  onProductionOrderFieldChange,
  onSaveProductionOrder,
  productionOrderSaving = false,
  productionOrderSaveError = "",
  productionOrderSaveSuccess = "",
}) {
  return (
    <ClientDetailModal
      isOpen={isOpen}
      title={
        showPaymentForm
          ? "Reportar pago"
          : order?.code || "Pedido"
      }
      subtitle={
        showPaymentForm
          ? order
            ? `Orden ${order.code}`
            : ""
          : order
          ? `Cotizacion relacionada: ${order.quotationNumber}`
          : ""
      }
      icon={
        showPaymentForm ? (
          <RiBankCardFill size={24} />
        ) : (
          <RiTruckFill size={24} />
        )
      }
      badges={
        !showPaymentForm &&
        order && (
          <>
            <StatusBadge status={order.productionStatus} />
            <StatusBadge status={order.paymentStatus} />
          </>
        )
      }
      loading={loading}
      error={error}
      onClose={onClose}
      footer={
        order &&
        showPaymentActions &&
        !showPaymentForm && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Orden {order.code} — {order.paymentStatus}
            </p>
            <button
              type="button"
              onClick={onOpenPaymentForm}
              className="flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B8921F] cursor-pointer"
            >
              <RiBankCardFill size={16} />
              Reportar pago
            </button>
          </div>
        )
      }
    >
      {order && showPaymentForm && (
        <PaymentForm
          quotation={{ quotationId: order.quotationId }}
          paymentMethods={paymentMethods}
          loading={paymentLoading}
          error={paymentError}
          success={paymentSuccess}
          onBack={onBackFromPaymentForm}
          onSubmit={onSubmitPayment}
        />
      )}

      {order && !showPaymentForm && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailInfoCard
              label="Estado produccion"
              value={<StatusBadge status={order.productionStatus} />}
              icon={<RiTruckFill size={20} />}
            />
            <DetailInfoCard
              label="Estado pago"
              value={<StatusBadge status={order.paymentStatus} />}
              icon={<RiWallet3Fill size={20} />}
            />
            <DetailInfoCard
              label="Entrega compromiso"
              value={formatDate(order.committedDeliveryDate)}
              icon={<RiCalendarCheckFill size={20} />}
            />
            <DetailInfoCard
              label="Total"
              value={formatCurrency(order.total, "CRC 0")}
              icon={<RiMoneyDollarCircleFill size={20} />}
            />
            <DetailInfoCard
              label="Entrega anticipada"
              value={
                order.earlyDelivery
                  ? `Si${order.earlyDeliveryDate ? ` - ${formatDate(order.earlyDeliveryDate)}` : ""}`
                  : "No"
              }
              icon={<RiCalendarCheckFill size={20} />}
            />
          </div>

          {(order.paymentStatus === "parcial" ||
            order.paymentStatus === "pagado") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailInfoCard
                label="Total pagado"
                value={formatCurrency(order.amountPaid, "CRC 0")}
                icon={<RiWallet3Fill size={20} />}
              />
              <DetailInfoCard
                label="Saldo pendiente"
                value={formatCurrency(order.balance, "CRC 0")}
                icon={<RiMoneyDollarCircleFill size={20} />}
              />
            </div>
          )}

          {order.overdueDays > 0 && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Pedido en mora
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-400">Dias de atraso</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {order.overdueDays}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Penalizacion</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatCurrency(order.penaltyAmount, "CRC 0")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total adeudado</p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {formatCurrency(order.totalOwed, "CRC 0")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailInfoCard
              label="Cotizacion"
              value={order.quotationNumber}
              icon={<RiFileList3Fill size={20} />}
            />
            <DetailInfoCard
              label="Metodo de pago"
              value={order.paymentMethod}
              icon={<RiWallet3Fill size={20} />}
            />
            {order.nextPaymentDate && (
              <DetailInfoCard
                label="Proximo pago"
                value={formatDate(order.nextPaymentDate)}
                icon={<RiCalendarCheckFill size={20} />}
              />
            )}
            {order.unexpectedDeliveryDate && (
              <DetailInfoCard
                label="Entrega imprevista"
                value={formatDate(order.unexpectedDeliveryDate)}
                icon={<RiCalendarCheckFill size={20} />}
              />
            )}
            <DetailInfoCard
              label="Creado"
              value={formatDate(order.createdAt)}
              icon={<RiStore2Fill size={20} />}
            />
          </div>

          <section className="rounded-lg border border-[#2a3550] bg-[#10192b] p-4">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">
                  Fechas y estado de la orden
                </h3>
                <p className="text-sm text-gray-500">
                  {manageProduction
                    ? "Actualiza las fechas operativas y el estado de produccion."
                    : "Información operativa de solo lectura."}
                </p>
              </div>

              {manageProduction &&
                productionOrderForm.productionStatus !== order.productionStatus && (
                  <label className="mt-4 block space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                      Nota del cambio de estado *
                    </span>
                    <textarea
                      value={productionOrderForm.statusChangeNote || ""}
                      onChange={(event) =>
                        onProductionOrderFieldChange?.(
                          "statusChangeNote",
                          event.target.value,
                        )
                      }
                      maxLength={1000}
                      rows={3}
                      required
                      placeholder="Explica el motivo o contexto del cambio de estado..."
                      className="w-full resize-y rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#C9A227]"
                    />
                  </label>
                )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                    Fecha compromiso
                  </span>
                  <input
                    type="date"
                    disabled={!manageProduction}
                    value={productionOrderForm.committedDeliveryDate || ""}
                    onPointerDown={openNativeDatePicker}
                    onClick={openNativeDatePicker}
                    onFocus={openNativeDatePicker}
                    onChange={(event) =>
                      onProductionOrderFieldChange?.(
                        "committedDeliveryDate",
                        event.target.value,
                      )
                    }
                    className="w-full cursor-pointer rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2 text-sm text-white outline-none transition [color-scheme:dark] focus:border-[#C9A227] disabled:cursor-default disabled:opacity-75"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                    Fecha imprevisto
                  </span>
                  <input
                    type="date"
                    disabled={!manageProduction}
                    value={productionOrderForm.unexpectedDeliveryDate || ""}
                    onPointerDown={openNativeDatePicker}
                    onClick={openNativeDatePicker}
                    onFocus={openNativeDatePicker}
                    onChange={(event) =>
                      onProductionOrderFieldChange?.(
                        "unexpectedDeliveryDate",
                        event.target.value,
                      )
                    }
                    className="w-full cursor-pointer rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2 text-sm text-white outline-none transition [color-scheme:dark] focus:border-[#C9A227] disabled:cursor-default disabled:opacity-75"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                    Proxima fecha de pago
                  </span>
                  <input
                    type="date"
                    disabled={!manageProduction}
                    value={productionOrderForm.nextPaymentDate || ""}
                    onPointerDown={openNativeDatePicker}
                    onClick={openNativeDatePicker}
                    onFocus={openNativeDatePicker}
                    onChange={(event) =>
                      onProductionOrderFieldChange?.(
                        "nextPaymentDate",
                        event.target.value,
                      )
                    }
                    className="w-full cursor-pointer rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2 text-sm text-white outline-none transition [color-scheme:dark] focus:border-[#C9A227] disabled:cursor-default disabled:opacity-75"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                    Estado de la orden
                  </span>
                  <select
                    disabled={!manageProduction}
                    value={productionOrderForm.productionStatus || "pendiente"}
                    onChange={(event) =>
                      onProductionOrderFieldChange?.(
                        "productionStatus",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2 text-sm text-white outline-none transition focus:border-[#C9A227] disabled:cursor-default disabled:opacity-75"
                  >
                    {PRODUCTION_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                    Penalizacion (%)
                  </span>
                  <input
                    type="number"
                    disabled={!manageProduction}
                    min="0"
                    max="100"
                    step="0.01"
                    value={productionOrderForm.penaltyPercentage || ""}
                    onChange={(event) =>
                      onProductionOrderFieldChange?.(
                        "penaltyPercentage",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2 text-sm text-white outline-none transition focus:border-[#C9A227] disabled:cursor-default disabled:opacity-75"
                  />
                </label>
              </div>

              {(productionOrderSaveError || productionOrderSaveSuccess) && (
                <div className="mt-4">
                  {productionOrderSaveError && (
                    <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {productionOrderSaveError}
                    </p>
                  )}
                  {productionOrderSaveSuccess && (
                    <p className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                      {productionOrderSaveSuccess}
                    </p>
                  )}
                </div>
              )}

              {manageProduction && <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onSaveProductionOrder}
                  disabled={
                    productionOrderSaving ||
                    (productionOrderForm.productionStatus !== order.productionStatus &&
                      !productionOrderForm.statusChangeNote?.trim())
                  }
                  className="rounded-lg border border-[#C9A227]/50 bg-[#C9A227]/15 px-4 py-2 text-sm font-semibold text-[#F5D875] transition hover:bg-[#C9A227]/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {productionOrderSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>}
            </section>

          {order.statusHistory?.length > 0 && (
            <section className="rounded-lg border border-[#2a3550] bg-[#10192b] p-4">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">
                  Historial de cambios de estado
                </h3>
                <p className="text-sm text-gray-500">
                  Notas registradas durante el seguimiento de producción.
                </p>
              </div>

              <div className="space-y-3">
                {order.statusHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-lg border border-[#2a3550] bg-[#182235] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {formatStatusLabel(entry.previousStatus)} → {formatStatusLabel(entry.newStatus)}
                      </p>
                      <time className="text-xs text-gray-500">
                        {formatDate(entry.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
                      {entry.note}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3">
              <h3 className="text-base font-bold text-white">Articulos del pedido</h3>
              <p className="text-sm text-gray-500">
                Productos tomados de la cotizacion relacionada.
              </p>
            </div>
            <DetailProductsTable
              items={order.items}
              emptyMessage="Este pedido no tiene productos relacionados."
            />
          </section>

          {order.notes && (
            <section className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notas de la cotizacion
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
                {order.notes}
              </p>
            </section>
          )}
        </div>
      )}
    </ClientDetailModal>
  );
}
