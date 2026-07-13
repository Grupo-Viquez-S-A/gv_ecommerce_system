import { RiAddFill, RiEyeFill } from "react-icons/ri";
import OrderDetailModal from "../clientPanel/OrderDetailModal.jsx";
import { getPaymentMethods, reportPayment } from "../../services/quotationService.js";
import { QuotationProductThumb as ProductThumb, QuotationStatusBadge as StatusBadge, formatQuotationCurrency as formatCurrency, formatQuotationDate as formatDate } from "./QuotationsViewHelpers.jsx";

export default function QuotationsDetails({ drawerOpen, closeDrawer, drawerMode, viewQuote, selectedProductionOrder, closeProductionOrderModal, productionOrderDetail, productionOrderDetailLoading, productionOrderDetailError, showPaymentForm, setShowPaymentForm, paymentMethods, setPaymentMethods, paymentLoading, setPaymentLoading, paymentError, setPaymentError, paymentSuccess, setPaymentSuccess, selectedQuotation, closeQuotationModal }) {
  return <>
      {/* Fondo del drawer */}
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel de cotización"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && (
                <>
                  <RiAddFill size={20} className="text-[#C9A227]" />
                  Nueva Cotización
                </>
              )}

              {drawerMode === "view" && (
                <>
                  <RiEyeFill size={20} className="text-[#C9A227]" />
                  Detalle de Cotización
                </>
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create"
                ? "Completa los datos de la nueva cotización."
                : "Información completa de la cotización."}
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
          {drawerMode === "view" && viewQuote && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">
                  {viewQuote.number.slice(-3)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {viewQuote.number}
                  </h3>

                  <StatusBadge status={viewQuote.status} />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Cliente", value: viewQuote.client },
                  { label: "Empresa", value: viewQuote.company },
                  { label: "Fecha", value: viewQuote.date },
                  { label: "Vigencia", value: viewQuote.validity },
                  { label: "Total", value: viewQuote.total },
                  { label: "Vendedor", value: viewQuote.agent },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]"
                  >
                    <span className="text-xs text-gray-500">
                      {label}
                    </span>

                    <span className="text-sm text-white font-medium text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {drawerMode === "create" && (
            <div className="text-sm text-gray-400">
              El formulario de creación se incorporará en el siguiente paso.
            </div>
          )}
        </div>

        {drawerMode === "view" && (
          <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
            <button
              type="button"
              onClick={closeDrawer}
              className="action-close-cancel flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      <OrderDetailModal
        isOpen={Boolean(selectedProductionOrder)}
        order={productionOrderDetail}
        loading={productionOrderDetailLoading}
        error={productionOrderDetailError}
        onClose={closeProductionOrderModal}
        showPaymentActions
        showPaymentForm={showPaymentForm}
        paymentMethods={paymentMethods}
        paymentLoading={paymentLoading}
        paymentError={paymentError}
        paymentSuccess={paymentSuccess}
        onOpenPaymentForm={async () => {
          setPaymentError("");
          setPaymentSuccess("");
          setShowPaymentForm(true);
          try {
            const methods = await getPaymentMethods();
            setPaymentMethods(methods);
          } catch (e) {
            console.error(e);
            setPaymentError("No fue posible cargar los metodos de pago");
          }
        }}
        onBackFromPaymentForm={() => {
          setShowPaymentForm(false);
          setPaymentError("");
          setPaymentSuccess("");
        }}
        onSubmitPayment={async (payload) => {
          setPaymentLoading(true);
          setPaymentError("");
          setPaymentSuccess("");
          try {
            await reportPayment(payload);
            setPaymentSuccess(
              "Pago reportado correctamente. Queda pendiente de validacion.",
            );
            setTimeout(() => {
              closeProductionOrderModal();
            }, 1800);
          } catch (err) {
            console.error(err);
            setPaymentError(
              err?.message || "No fue posible reportar el pago. Intenta de nuevo.",
            );
          } finally {
            setPaymentLoading(false);
          }
        }}
      />

      {selectedQuotation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#102441] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#2a3550] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#35547E] bg-[#091A31] text-[#C9A227]">
                  <RiEyeFill size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-white">
                    {selectedQuotation.number}
                  </h2>
                  <p className="truncate text-sm text-gray-400">
                    {selectedQuotation.client} - {selectedQuotation.agent}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeQuotationModal}
                className="h-10 w-10 flex-shrink-0 rounded-xl border border-[#35547E] text-xl text-white transition hover:border-[#C9A227] hover:bg-[#1c2538]"
                aria-label="Cerrar detalle"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="mb-4 grid gap-3 md:grid-cols-4">
                {[
                  { label: "Estado", value: selectedQuotation.status },
                  { label: "Fecha", value: formatDate(selectedQuotation.date) },
                  {
                    label: "Vigencia",
                    value: formatDate(selectedQuotation.validity),
                  },
                  {
                    label: "Total",
                    value: formatCurrency(selectedQuotation.total),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#2a3550] bg-[#091A31] p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">
                    Cliente
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.company}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedQuotation.legalName || "Sin razon social"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedQuotation.legalId || "Sin cedula juridica"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">
                    Sucursal
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.branch?.address || "Sin direccion"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {[selectedQuotation.branch?.province, selectedQuotation.branch?.district]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicacion"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">
                    Representante
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.representative?.name ||
                      "Sin representante"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedQuotation.representative?.email || "Sin correo"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#2a3550]">
                <div className="border-b border-[#2a3550] bg-[#091A31] px-4 py-3">
                  <h3 className="text-sm font-bold text-white">
                    Articulos cotizados
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-[#2a3550]">
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Precio
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          IVA
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3550]">
                      {selectedQuotation.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductThumb item={item} />
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold text-white">
                                  {item.name}
                                </p>
                                {item.sizeName && (
                                  <span className="mt-1 inline-block rounded-md border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB3D3]">
                                    {item.sizeName}
                                  </span>
                                )}
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {item.productId}
                                </p>
                              </div>

                                {(item.hasSublimation || item.hasEmbroidery) && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {item.hasSublimation && (
                                      <span className="rounded-md border border-[#D7A91D]/25 bg-[#D7A91D]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#D7A91D]">
                                        Sublimación
                                        {item.sublimationPrice > 0
                                          ? ` · ${formatCurrency(item.sublimationPrice)}`
                                          : ""}
                                      </span>
                                    )}
                                    {item.hasEmbroidery && (
                                      <span className="rounded-md border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB3D3]">
                                        Bordado
                                        {item.embroideryPrice > 0
                                          ? ` · ${formatCurrency(item.embroideryPrice)}`
                                          : ""}
                                      </span>
                                    )}
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {formatCurrency(item.ivaAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-white">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#2a3550]">
                <div className="border-b border-[#2a3550] bg-[#091A31] px-4 py-3">
                  <h3 className="text-sm font-bold text-white">
                    Resumen de pago
                  </h3>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-4">
                  {[
                    {
                      label: "Subtotal",
                      value: formatCurrency(selectedQuotation.subtotal),
                    },
                    {
                      label: "IVA",
                      value: formatCurrency(selectedQuotation.ivaAmount),
                    },
                    {
                      label: "Total",
                      value: formatCurrency(selectedQuotation.total),
                      highlight: true,
                    },
                    {
                      label: "Adelanto (50%)",
                      value: formatCurrency(selectedQuotation.advancePayment),
                      highlight: true,
                    },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      className={`rounded-xl border p-3 ${
                        highlight
                          ? "border-[#C9A227]/40 bg-[#C9A227]/10"
                          : "border-[#2a3550] bg-[#0B1F3A]"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {label}
                      </p>
                      <p
                        className={`mt-1 text-sm font-bold ${
                          highlight ? "text-[#C9A227]" : "text-white"
                        }`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="mt-4 rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">Notas</h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer del modal */}
            <div className="border-t border-[#2a3550] px-5 py-4">
              <p className="text-xs text-gray-500">
                Cotizacion {selectedQuotation.number} —{" "}
                {selectedQuotation.status}
              </p>
            </div>
          </div>
        </div>
      )}
  </>;
}
