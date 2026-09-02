import {
  RiAddFill,
  RiCalendarLine,
  RiDownloadFill,
  RiEyeFill,
  RiLoader4Line,
  RiMailSendFill,
} from "react-icons/ri";
import OrderDetailModal from "../clientPanel/OrderDetailModal.jsx";
import {
  getPaymentMethods,
  reportPayment,
} from "../../services/quotationService.js";
import {
  QuotationProductThumb as ProductThumb,
  formatQuotationCurrency as formatCurrency,
  formatQuotationDate as formatDate,
} from "./QuotationsViewHelpers.jsx";

export default function QuotationsDetails({
  manageProduction = false,
  drawerOpen,
  closeDrawer,
  drawerMode,
  viewQuote,
  selectedProductionOrder,
  closeProductionOrderModal,
  productionOrderDetail,
  productionOrderDetailLoading,
  productionOrderDetailError,
  showPaymentForm,
  setShowPaymentForm,
  paymentMethods,
  setPaymentMethods,
  paymentLoading,
  setPaymentLoading,
  paymentError,
  setPaymentError,
  paymentSuccess,
  setPaymentSuccess,
  selectedQuotation,
  quotationDateForm,
  onQuotationDateFieldChange,
  onSaveQuotationDates,
  quotationDatesSaving,
  quotationDatesError,
  quotationDatesSuccess,
  canManageQuotationDiscounts = false,
  quotationDiscountForm,
  onQuotationDiscountFieldChange,
  onSaveQuotationDiscount,
  quotationDiscountSaving,
  quotationDiscountError,
  quotationDiscountSuccess,
  closeQuotationModal,
  onDownloadQuotation,
  downloadingQuotationId,
  onSendQuotation,
  sendingQuotationId,
}) {
  const openNativeDatePicker = (event) => {
    const input = event.currentTarget;

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // Algunos navegadores solo permiten showPicker con gesto directo.
      }
    }
  };

  const renderSummaryRow = (label, value, align = "left") => (
    <div className="grid gap-1 border-b border-[#20314d] py-3 md:grid-cols-[180px,1fr] md:gap-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p
        className={`text-sm text-white ${
          align === "right" ? "md:text-right" : ""
        }`}
      >
        {value || "Sin definir"}
      </p>
    </div>
  );

  return (
    <>
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm"
          aria-label="Cerrar panel de cotización"
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#2a3550] bg-[#141d2e] shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
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

            <p className="mt-0.5 text-sm text-gray-400">
              {drawerMode === "create"
                ? "Completa los datos de la nueva cotización."
                : "Información completa de la cotización."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="h-8 w-8 rounded-lg text-gray-400 transition-colors hover:bg-[#1c2538] hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {drawerMode === "view" && viewQuote && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 border-b border-[#2a3550] pb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#C9A227]/15 text-lg font-bold text-[#C9A227]">
                  {viewQuote.number.slice(-3)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {viewQuote.number}
                  </h3>

                  <p className="text-sm text-gray-400">
                    {viewQuote.client}
                  </p>
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
                    className="flex items-center justify-between gap-4 border-b border-[#2a3550] py-2"
                  >
                    <span className="text-xs text-gray-500">{label}</span>

                    <span className="text-right text-sm font-medium text-white">
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
              className="action-close-cancel flex-1 cursor-pointer rounded-lg border border-[#2a3550] bg-[#1c2538] py-2.5 text-sm font-medium text-gray-300 transition-colors hover:text-white"
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
              err?.message ||
                "No fue posible reportar el pago. Intenta de nuevo.",
            );
          } finally {
            setPaymentLoading(false);
          }
        }}
      />

      {selectedQuotation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#102441] shadow-2xl">
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {(() => {
                const discountPercentage =
                  Number(selectedQuotation.discountPercentage) || 0;
                const discountAmount =
                  Number(selectedQuotation.discountAmount) || 0;
                const advancePercentage =
                  Number(selectedQuotation.advancePercentage) || 0;
                const subtotal = Number(selectedQuotation.subtotal) || 0;
                const ivaAmount = Number(selectedQuotation.ivaAmount) || 0;
                const total = Number(selectedQuotation.total) || 0;
                const subtotalWithDiscount = Math.max(
                  0,
                  subtotal - discountAmount,
                );

                return (
                  <>
                    <div className="mb-4 grid gap-3 md:grid-cols-3">
                      {[
                        {
                          label: "Fecha",
                          value: formatDate(selectedQuotation.date),
                        },
                        {
                          label: "Vigencia",
                          value: formatDate(selectedQuotation.validity),
                        },
                        { label: "Total", value: formatCurrency(total) },
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

                    <section className="mb-4 overflow-hidden rounded-xl border border-[#2a3550] bg-[#091A31]">
                      <div className="border-b border-[#2a3550] px-4 py-3">
                        <h3 className="text-sm font-bold text-white">
                          Datos del cliente
                        </h3>
                      </div>

                      <div className="px-4">
                        {renderSummaryRow("Cliente", selectedQuotation.client)}
                        {renderSummaryRow(
                          "Razón social",
                          selectedQuotation.legalName || "Sin razón social",
                        )}
                        {renderSummaryRow(
                          "Cédula jurídica",
                          selectedQuotation.legalId || "Sin cédula jurídica",
                        )}
                        {renderSummaryRow(
                          "Correo",
                          selectedQuotation.email || "Sin correo",
                        )}
                        {renderSummaryRow(
                          "Teléfono",
                          selectedQuotation.phone || "Sin teléfono",
                        )}
                        {renderSummaryRow(
                          "Provincia",
                          selectedQuotation.province || "Sin definir",
                        )}
                        {renderSummaryRow(
                          "Cantón",
                          selectedQuotation.city || "Sin definir",
                        )}
                        <div className="py-3">
                          {renderSummaryRow(
                            "Distrito",
                            selectedQuotation.district || "Sin definir",
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="mb-4 rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-white">
                          Fechas de entrega
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Administra las fechas de compromiso e imprevisto desde la cotización.
                        </p>
                      </div>

                      {manageProduction ? (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                              <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                                Fecha compromiso
                              </span>
                              <div className="relative">
                                <input
                                  type="date"
                                  value={quotationDateForm?.committedDeliveryDate || ""}
                                  onPointerDown={openNativeDatePicker}
                                  onClick={openNativeDatePicker}
                                  onFocus={openNativeDatePicker}
                                  onChange={(event) =>
                                    onQuotationDateFieldChange?.(
                                      "committedDeliveryDate",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full cursor-pointer rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2.5 pr-10 text-sm text-white outline-none transition [color-scheme:dark] focus:border-[#C9A227]"
                                />
                                <RiCalendarLine className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                              </div>
                            </label>

                            <label className="space-y-2">
                              <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                                Fecha imprevisto
                              </span>
                              <div className="relative">
                                <input
                                  type="date"
                                  value={quotationDateForm?.unexpectedDeliveryDate || ""}
                                  onPointerDown={openNativeDatePicker}
                                  onClick={openNativeDatePicker}
                                  onFocus={openNativeDatePicker}
                                  onChange={(event) =>
                                    onQuotationDateFieldChange?.(
                                      "unexpectedDeliveryDate",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full cursor-pointer rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2.5 pr-10 text-sm text-white outline-none transition [color-scheme:dark] focus:border-[#C9A227]"
                                />
                                <RiCalendarLine className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                              </div>
                            </label>
                          </div>

                          {(quotationDatesError || quotationDatesSuccess) && (
                            <div className="mt-4 space-y-2">
                              {quotationDatesError && (
                                <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                  {quotationDatesError}
                                </p>
                              )}
                              {quotationDatesSuccess && (
                                <p className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                                  {quotationDatesSuccess}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={onSaveQuotationDates}
                              disabled={quotationDatesSaving}
                              className="rounded-lg border border-[#C9A227]/50 bg-[#C9A227]/15 px-4 py-2 text-sm font-semibold text-[#F5D875] transition hover:bg-[#C9A227]/25 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {quotationDatesSaving ? "Guardando..." : "Guardar fechas"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          {renderSummaryRow(
                            "Fecha compromiso",
                            selectedQuotation.committedDeliveryDate
                              ? formatDate(selectedQuotation.committedDeliveryDate)
                              : "Sin fecha asignada",
                          )}
                          <div className="py-3">
                            {renderSummaryRow(
                              "Fecha imprevisto",
                              selectedQuotation.unexpectedDeliveryDate
                                ? formatDate(selectedQuotation.unexpectedDeliveryDate)
                                : "Sin fecha asignada",
                            )}
                          </div>
                        </div>
                      )}
                    </section>

                    {canManageQuotationDiscounts && (
                      <section className="mb-4 rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-white">
                            Descuentos a aplicar
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Ajusta el descuento de esta cotización y actualiza la proforma.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <label className="space-y-2">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                              Porcentaje de descuento
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={quotationDiscountForm?.discountPercentage || ""}
                                onChange={(event) =>
                                  onQuotationDiscountFieldChange?.(
                                    "discountPercentage",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-[#C9A227]"
                                placeholder="0"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                                %
                              </span>
                            </div>
                          </label>

                          <label className="space-y-2">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-[#9BB3D3]">
                              Monto de descuento
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={subtotal}
                              step="0.01"
                              value={quotationDiscountForm?.discountAmount || ""}
                              onChange={(event) =>
                                onQuotationDiscountFieldChange?.(
                                  "discountAmount",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-[#35547E] bg-[#0B1A2E] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#C9A227]"
                              placeholder="0"
                            />
                          </label>

                          <div className="rounded-xl border border-[#2a3550] bg-[#0B1F3A] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Subtotal disponible
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {formatCurrency(subtotal)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              El descuento no puede superar este monto.
                            </p>
                          </div>
                        </div>

                        {(quotationDiscountError || quotationDiscountSuccess) && (
                          <div className="mt-4 space-y-2">
                            {quotationDiscountError && (
                              <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                {quotationDiscountError}
                              </p>
                            )}
                            {quotationDiscountSuccess && (
                              <p className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                                {quotationDiscountSuccess}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={onSaveQuotationDiscount}
                            disabled={quotationDiscountSaving}
                            className="rounded-lg border border-[#C9A227]/50 bg-[#C9A227]/15 px-4 py-2 text-sm font-semibold text-[#F5D875] transition hover:bg-[#C9A227]/25 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {quotationDiscountSaving
                              ? "Guardando..."
                              : "Guardar descuento"}
                          </button>
                        </div>
                      </section>
                    )}

                    <div className="overflow-hidden rounded-xl border border-[#2a3550]">
                      <div className="border-b border-[#2a3550] bg-[#091A31] px-4 py-3">
                        <h3 className="text-sm font-bold text-white">
                          Articulos cotizados
                        </h3>
                      </div>

                      <div className="overflow-x-hidden">
                        <table className="w-full table-fixed text-left">
                          <thead>
                            <tr className="border-b border-[#2a3550]">
                              <th className="w-[31%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Producto
                              </th>
                              <th className="w-[12%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                GTIN
                              </th>
                              <th className="w-[12%] px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                SKU
                              </th>
                              <th className="w-[8%] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Bordado
                              </th>
                              <th className="w-[8%] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Sublimado
                              </th>
                              <th className="w-[7%] px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Cantidad
                              </th>
                              <th className="w-[8%] px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Precio
                              </th>
                              <th className="w-[7%] px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                IVA
                              </th>
                              <th className="w-[7%] px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2a3550]">
                            {selectedQuotation.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-3 align-top">
                                  <div className="flex items-center gap-3">
                                    <ProductThumb item={item} />
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-semibold leading-snug text-white">
                                        {item.name}
                                      </p>
                                      <p className="mt-1 text-xs text-[#9BB3D3]">
                                        GTIN: {item.gtin || "Sin codigo"}
                                      </p>
                                      {item.sizeName && (
                                        <span className="mt-1 inline-block rounded-md border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB3D3]">
                                          {item.sizeName}
                                        </span>
                                      )}
                                      <p className="mt-0.5 break-all text-[11px] text-gray-500">
                                        {item.productId}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="break-all px-3 py-3 align-top text-[11px] text-gray-400">
                                  {item.gtin || "-"}
                                </td>
                                <td className="break-all px-3 py-3 align-top text-[11px] text-gray-400">
                                  {item.sku}
                                </td>
                                <td className="px-2 py-3 text-center align-top">
                                  <span
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                                      item.hasEmbroidery
                                        ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
                                        : "border-red-400/35 bg-red-500/10 text-red-200"
                                    }`}
                                  >
                                    {item.hasEmbroidery ? "✓" : "×"}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-center align-top">
                                  <span
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                                      item.hasSublimation
                                        ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
                                        : "border-red-400/35 bg-red-500/10 text-red-200"
                                    }`}
                                  >
                                    {item.hasSublimation ? "✓" : "×"}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-right align-top text-[11px] text-gray-300">
                                  {item.quantity}
                                </td>
                                <td className="px-2 py-3 text-right align-top text-[11px] text-gray-300">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-2 py-3 text-right align-top text-[11px] text-gray-300">
                                  {formatCurrency(item.ivaAmount)}
                                </td>
                                <td className="px-2 py-3 text-right align-top text-[11px] font-bold text-white">
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
                          Ajustes comerciales
                        </h3>
                      </div>

                      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-7">
                        {[
                          {
                            label: "Condición de pago",
                            value: selectedQuotation.paymentCondition || "No definida",
                          },
                          {
                            label: "Regla de adelanto",
                            value: `${advancePercentage.toFixed(0)}%`,
                          },
                          {
                            label: "Porcentaje de descuento",
                            value: `${discountPercentage.toFixed(0)}%`,
                          },
                          {
                            label: "Monto del descuento",
                            value: `-${formatCurrency(discountAmount)}`,
                          },
                          {
                            label: "Monto de bordado",
                            value: formatCurrency(
                              Number(selectedQuotation.embroideryAmount) || 0,
                            ),
                          },
                          {
                            label: "Monto de sublimación",
                            value: formatCurrency(
                              Number(selectedQuotation.sublimationAmount) || 0,
                            ),
                          },
                          {
                            label: "Monto del adelanto",
                            value: formatCurrency(
                              selectedQuotation.advancePayment,
                            ),
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="rounded-xl border border-[#2a3550] bg-[#0B1F3A] p-3"
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
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-[#2a3550]">
                      <div className="border-b border-[#2a3550] bg-[#091A31] px-4 py-3">
                        <h3 className="text-sm font-bold text-white">
                          Resumen de pago
                        </h3>
                      </div>

                      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-8">
                        {[
                          {
                            label: "Subtotal productos",
                            value: formatCurrency(
                              Math.max(
                                0,
                                (Number(selectedQuotation.subtotal) || 0) -
                                  (Number(selectedQuotation.embroideryAmount) || 0) -
                                  (Number(selectedQuotation.sublimationAmount) || 0),
                              ),
                            ),
                          },
                          {
                            label: "Bordado",
                            value: formatCurrency(
                              Number(selectedQuotation.embroideryAmount) || 0,
                            ),
                          },
                          {
                            label: "Sublimación",
                            value: formatCurrency(
                              Number(selectedQuotation.sublimationAmount) || 0,
                            ),
                          },
                          {
                            label: "Subtotal",
                            value: formatCurrency(subtotal),
                          },
                          {
                            label: `Descuento (${discountPercentage.toFixed(0)}%)`,
                            value: `-${formatCurrency(discountAmount)}`,
                          },
                          {
                            label: "Subtotal con descuento",
                            value: formatCurrency(subtotalWithDiscount),
                          },
                          {
                            label: "IVA",
                            value: formatCurrency(ivaAmount),
                          },
                          {
                            label: "Total",
                            value: formatCurrency(total),
                            highlight: true,
                          },
                          {
                            label: `Adelanto automático (${advancePercentage.toFixed(0)}%)`,
                            value: formatCurrency(
                              selectedQuotation.advancePayment,
                            ),
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

                    <div className="mt-4 rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                      <h3 className="text-sm font-bold text-white">Notas</h3>
                      <p className="mt-2 text-sm text-gray-300">
                        {selectedQuotation.notes || "Sin notas registradas."}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#2a3550] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Cotizacion {selectedQuotation.number}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={
                    sendingQuotationId ===
                      (selectedQuotation.quotationId || selectedQuotation.id)
                  }
                  onClick={() => onSendQuotation?.(selectedQuotation)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9A227]/50 px-4 py-2.5 text-sm font-bold text-[#F4C542] transition hover:bg-[#C9A227]/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Enviar proforma al cliente"
                >
                  {sendingQuotationId ===
                  (selectedQuotation.quotationId || selectedQuotation.id) ? (
                    <RiLoader4Line size={17} className="animate-spin" />
                  ) : (
                    <RiMailSendFill size={17} />
                  )}
                  Enviar por correo
                </button>
                <button
                  type="button"
                  disabled={
                    downloadingQuotationId ===
                      (selectedQuotation.quotationId || selectedQuotation.id)
                  }
                  onClick={() => onDownloadQuotation?.(selectedQuotation)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-sm font-bold text-[#091A31] transition hover:bg-[#D7B538] disabled:cursor-not-allowed disabled:opacity-40"
                  title="Descargar proforma PDF"
                >
                  {downloadingQuotationId ===
                  (selectedQuotation.quotationId || selectedQuotation.id) ? (
                    <RiLoader4Line size={17} className="animate-spin" />
                  ) : (
                    <RiDownloadFill size={17} />
                  )}
                  Descargar proforma PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
