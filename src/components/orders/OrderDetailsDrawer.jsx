import { RiEyeFill, RiFileTextLine } from "react-icons/ri";
import { ORDER_PAYMENT_CONFIG as PAYMENT_CONFIG, ORDER_STATUS_CONFIG as STATUS_CONFIG, OrderStatusBadge as StatusBadge, formatOrderCurrency as formatCurrency, formatOrderDate as formatDate } from "./OrdersViewHelpers.jsx";

export default function OrderDetailsDrawer({ drawerOpen, paymentsDrawerOpen, closeDrawer, viewOrder, canManagePenalty, penaltyPercentageInput, setPenaltyPercentageInput, handleSavePenaltyPercentage, penaltySaving, penaltyError, penaltySuccess, openPaymentsDrawer }) {
  return <>
      {/* Fondo del drawer */}
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel de orden"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen
            ? paymentsDrawerOpen
              ? "translate-x-0 xl:-translate-x-[32rem]"
              : "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RiEyeFill size={20} className="text-[#C9A227]" />
              Detalle de la orden
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Informacion completa de la orden de venta.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {viewOrder && (
            <div className="space-y-5">
              <div className="pb-5 border-b border-[#2a3550]">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">
                    {viewOrder.code}
                  </h3>

                  <StatusBadge
                    status={viewOrder.paymentStatus}
                    label={viewOrder.paymentStatusLabel}
                    config={PAYMENT_CONFIG}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Cliente</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.client}
                  </span>
                </div>

                {viewOrder.branchLabel && (
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">Sucursal</span>
                    <span className="text-sm text-white font-medium text-right">
                      {viewOrder.branchLabel}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Cotizacion</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.quotationNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Fecha</span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatDate(viewOrder.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatCurrency(viewOrder.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Saldo pendiente</span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatCurrency(viewOrder.balance)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Produccion</span>
                  <StatusBadge
                    status={viewOrder.productionStatus}
                    label={viewOrder.productionStatusLabel}
                    config={STATUS_CONFIG}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Pago</span>
                  <StatusBadge
                    status={viewOrder.paymentStatus}
                    label={viewOrder.paymentStatusLabel}
                    config={PAYMENT_CONFIG}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Vendedor</span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.agent}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Fecha de entrega comprometida
                  </span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatDate(viewOrder.committedDeliveryDate)}
                  </span>
                </div>

                {viewOrder.unexpectedDeliveryDate && (
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">
                      Fecha de entrega inesperada
                    </span>
                    <span className="text-sm text-white font-medium text-right">
                      {formatDate(viewOrder.unexpectedDeliveryDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Proxima fecha de pago
                  </span>
                  <span className="text-sm text-white font-medium text-right">
                    {formatDate(viewOrder.nextPaymentDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Dias de atraso
                  </span>
                  <span
                    className={`text-sm font-medium text-right ${
                      viewOrder.overdueDays > 0
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {viewOrder.overdueDays}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">Estado de mora</span>
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${
                      viewOrder.overdueDays > 0
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                    }`}
                  >
                    {viewOrder.overdueDays > 0 ? "En mora" : "Al dia"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Porcentaje de penalizacion
                  </span>
                  <span className="text-sm text-white font-medium text-right">
                    {viewOrder.penaltyPercentage}%
                  </span>
                </div>

                {canManagePenalty && (
                  <div className="flex flex-col gap-2 py-2 border-b border-[#2a3550]">
                    <span className="text-xs text-gray-500">
                      Configurar porcentaje de penalizacion (solo interno)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={penaltyPercentageInput}
                        onChange={(event) =>
                          setPenaltyPercentageInput(event.target.value)
                        }
                        className="w-full bg-[#0f1626] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227]"
                      />
                      <button
                        type="button"
                        onClick={handleSavePenaltyPercentage}
                        disabled={penaltySaving}
                        className="whitespace-nowrap bg-[#C9A227] hover:bg-[#B8921F] disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        {penaltySaving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                    {penaltyError && (
                      <p className="text-xs text-red-400">{penaltyError}</p>
                    )}
                    {penaltySuccess && (
                      <p className="text-xs text-green-400">
                        {penaltySuccess}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]">
                  <span className="text-xs text-gray-500">
                    Monto de penalizacion
                  </span>
                  <span
                    className={`text-sm font-medium text-right ${
                      viewOrder.penaltyAmount > 0
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {formatCurrency(viewOrder.penaltyAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-xs text-gray-500 font-semibold">
                    Total adeudado (saldo + penalizacion)
                  </span>
                  <span className="text-sm text-white font-bold text-right">
                    {formatCurrency(viewOrder.totalOwed)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {viewOrder && (
            <button
              type="button"
              onClick={() => openPaymentsDrawer(viewOrder)}
              className="flex-1 bg-[#C9A227] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#b8931f] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RiFileTextLine size={16} />
              Comprobantes de pago
            </button>
          )}
        </div>
      </div>
  </>;
}

