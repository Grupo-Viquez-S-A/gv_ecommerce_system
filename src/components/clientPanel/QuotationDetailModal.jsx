import {
  RiBuilding2Line,
  RiCalendarEventLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiFileList3Line,
  RiMapPin2Line,
  RiPriceTag3Line,
  RiUser3Line,
} from "react-icons/ri";

import formatCurrency from "../../utils/formatCurrency.js";
import { formatDateCR } from "../../utils/dateUtils.js";
import ClientDetailModal from "./ClientDetailModal.jsx";
import StatusBadge from "./StatusBadge.jsx";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const formatted = formatDateCR(dateValue);

  return formatted || "Sin fecha";
}

function getBranchText(branch) {
  if (!branch) {
    return "No disponible";
  }

  return [branch.province, branch.district].filter(Boolean).join(", ");
}

function ProductThumb({ item }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.name || "Producto"}
        className="h-16 w-16 rounded-xl border border-[#35547E] bg-[#0f1728] object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#35547E] bg-[#10192b] text-xs font-bold text-[#C9A227]">
      IMG
    </div>
  );
}

function ReadonlyCard({ label, value, icon = null, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[#C9A227]/40 bg-[#C9A227]/10"
          : "border-[#35547E] bg-[#020D21]"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8BA4C8]">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {icon}
        <p className={`text-sm font-bold ${highlight ? "text-[#C9A227]" : "text-white"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ServiceIndicator({ enabled, label }) {
  return (
    <div className="flex items-center justify-center">
      <span
        title={label}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
          enabled
            ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
            : "border-red-400/35 bg-red-500/10 text-red-200"
        }`}
      >
        {enabled ? <RiCheckboxCircleLine size={15} /> : <RiCloseLine size={15} />}
      </span>
    </div>
  );
}

export default function QuotationDetailModal({
  isOpen,
  quotation,
  loading,
  error,
  onClose,
}) {
  const discountPercentage = Number(quotation?.discountPercentage) || 0;
  const discountAmount = Number(quotation?.discountAmount) || 0;
  const advancePercentage = Number(quotation?.advancePercentage) || 0;
  const subtotal = Number(quotation?.subtotal) || 0;
  const ivaAmount = Number(quotation?.ivaAmount) || 0;
  const total = Number(quotation?.total) || 0;
  const embroideryAmount = Number(quotation?.embroideryAmount) || 0;
  const sublimationAmount = Number(quotation?.sublimationAmount) || 0;
  const subtotalWithDiscount = Math.max(0, subtotal - discountAmount);

  return (
    <ClientDetailModal
      isOpen={isOpen}
      title={quotation?.number || "Cotizacion"}
      subtitle="Resumen completo de la cotizacion seleccionada."
      icon={<RiFileList3Line size={24} />}
      badges={quotation && <StatusBadge status={quotation.status} />}
      loading={loading}
      error={error}
      onClose={onClose}
    >
      {quotation && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReadonlyCard
              label="Estado"
              value={quotation.status}
              icon={<StatusBadge status={quotation.status} />}
            />
            <ReadonlyCard
              label="Fecha"
              value={formatDate(quotation.createdAt)}
              icon={<RiCalendarEventLine size={16} className="text-[#B7C8E6]" />}
            />
            <ReadonlyCard
              label="Vigencia"
              value={formatDate(quotation.validUntil)}
              icon={<RiCalendarEventLine size={16} className="text-[#B7C8E6]" />}
            />
            <ReadonlyCard
              label="Total"
              value={formatCurrency(total, "CRC 0")}
              highlight
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ReadonlyCard
              label="Cliente"
              value={quotation.business?.name || "Sin cliente"}
              icon={<RiBuilding2Line size={16} className="text-[#D9A72A]" />}
            />
            <ReadonlyCard
              label="Sucursal"
              value={quotation.branch?.address || "Sin direccion"}
              icon={<RiMapPin2Line size={16} className="text-[#D9A72A]" />}
            />
            <ReadonlyCard
              label="Representante"
              value={quotation.representative?.name || "Sin representante"}
              icon={<RiUser3Line size={16} className="text-[#D9A72A]" />}
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#35547E] bg-[#182235]">
            <div className="border-b border-[#35547E] bg-[#10192b] px-4 py-3">
              <h3 className="text-base font-bold text-white">Articulos cotizados</h3>
            </div>

            {!quotation.items?.length ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Esta cotizacion no tiene productos relacionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1080px] w-full divide-y divide-[#2a3550]">
                  <thead className="bg-[#10192b]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        GTIN
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Bordado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Sublimado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                        IVA
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a3550]">
                    {quotation.items.map((item) => (
                      <tr key={item.id || item.quoteProductId} className="hover:bg-[#202b40]">
                        <td className="max-w-[320px] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb item={item} />
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-white">
                                {item.name || item.productId || "Producto sin nombre"}
                              </p>
                              <p className="mt-1 text-xs text-[#9BB3D3]">
                                GTIN: {item.gtin || "Sin codigo"}
                              </p>
                              {item.sizeName && (
                                <span className="mt-1 inline-block rounded-md border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB3D3]">
                                  {item.sizeName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {item.gtin || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {item.sku || item.productId || "Sin codigo"}
                        </td>
                        <td className="px-4 py-3">
                          <ServiceIndicator enabled={item.hasEmbroidery} label="Bordado" />
                        </td>
                        <td className="px-4 py-3">
                          <ServiceIndicator enabled={item.hasSublimation} label="Sublimado" />
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {formatCurrency(item.unitPrice, "CRC 0")}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {formatCurrency(item.ivaAmount, "CRC 0")}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-white">
                          {formatCurrency(item.total, "CRC 0")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
            <div className="mb-3 flex items-center gap-2">
              <RiPriceTag3Line size={16} className="text-[#D9A72A]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ajustes comerciales
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              <ReadonlyCard
                label="Porcentaje de adelanto"
                value={`${advancePercentage.toFixed(0)}%`}
              />
              <ReadonlyCard
                label="Aplicar adelanto"
                value={advancePercentage > 0 ? "Sí" : "No"}
              />
              <ReadonlyCard
                label="Porcentaje de descuento"
                value={`${discountPercentage.toFixed(0)}%`}
              />
              <ReadonlyCard
                label="Monto del descuento"
                value={`-${formatCurrency(discountAmount, "CRC 0")}`}
              />
              <ReadonlyCard
                label="Monto de bordado"
                value={formatCurrency(embroideryAmount, "CRC 0")}
              />
              <ReadonlyCard
                label="Monto de sublimación"
                value={formatCurrency(sublimationAmount, "CRC 0")}
              />
              <ReadonlyCard
                label="Monto del adelanto"
                value={formatCurrency(quotation.advancePayment, "CRC 0")}
              />
            </div>
          </section>

          <section className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Resumen de pago
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
              <ReadonlyCard
                label="Subtotal productos"
                value={formatCurrency(Math.max(0, subtotal - embroideryAmount - sublimationAmount), "CRC 0")}
              />
              <ReadonlyCard
                label="Bordado"
                value={formatCurrency(embroideryAmount, "CRC 0")}
              />
              <ReadonlyCard
                label="Sublimación"
                value={formatCurrency(sublimationAmount, "CRC 0")}
              />
              <ReadonlyCard
                label="Subtotal"
                value={formatCurrency(subtotal, "CRC 0")}
              />
              <ReadonlyCard
                label={`Descuento (${discountPercentage.toFixed(0)}%)`}
                value={`-${formatCurrency(discountAmount, "CRC 0")}`}
              />
              <ReadonlyCard
                label="Subtotal con descuento"
                value={formatCurrency(subtotalWithDiscount, "CRC 0")}
              />
              <ReadonlyCard
                label="IVA"
                value={formatCurrency(ivaAmount, "CRC 0")}
              />
              <ReadonlyCard
                label="Total"
                value={formatCurrency(total, "CRC 0")}
                highlight
              />
              <ReadonlyCard
                label={`Adelanto (${advancePercentage.toFixed(0)}%)`}
                value={formatCurrency(quotation.advancePayment, "CRC 0")}
                highlight
              />
            </div>
          </section>

          <section className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Notas
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
              {quotation.notes || "Sin notas registradas."}
            </p>
          </section>
        </div>
      )}
    </ClientDetailModal>
  );
}
