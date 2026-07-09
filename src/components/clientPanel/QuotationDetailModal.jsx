import {
  RiBuilding2Fill,
  RiCalendarEventFill,
  RiCheckLine,
  RiFileList3Fill,
  RiMapPin2Fill,
  RiMoneyDollarCircleFill,
  RiUser3Fill,
} from "react-icons/ri";

import formatCurrency from "../../utils/formatCurrency.js";
import ClientDetailModal from "./ClientDetailModal.jsx";
import DetailInfoCard from "./DetailInfoCard.jsx";
import DetailProductsTable from "./DetailProductsTable.jsx";
import StatusBadge from "./StatusBadge.jsx";

const ACCEPTABLE_STATES = ["approved", "aprobada"];

function canAcceptQuotation(status) {
  return ACCEPTABLE_STATES.includes(String(status || "").toLowerCase());
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getBranchText(branch) {
  if (!branch) {
    return "No disponible";
  }

  return [branch.province, branch.district, branch.address]
    .filter(Boolean)
    .join(" - ");
}

export default function QuotationDetailModal({
  isOpen,
  quotation,
  loading,
  error,
  onClose,
  onAccept,
  accepting,
}) {
  return (
    <ClientDetailModal
      isOpen={isOpen}
      title={quotation?.number || "Cotizacion"}
      subtitle="Resumen completo de la cotizacion seleccionada."
      icon={<RiFileList3Fill size={24} />}
      badges={quotation && <StatusBadge status={quotation.status} />}
      loading={loading}
      error={error}
      onClose={onClose}
    >
      {quotation && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailInfoCard
              label="Estado"
              value={<StatusBadge status={quotation.status} />}
              icon={<RiFileList3Fill size={20} />}
            />
            <DetailInfoCard
              label="Fecha"
              value={formatDate(quotation.createdAt)}
              icon={<RiCalendarEventFill size={20} />}
            />
            <DetailInfoCard
              label="Total"
              value={formatCurrency(quotation.total, "CRC 0")}
              icon={<RiMoneyDollarCircleFill size={20} />}
            />
            <DetailInfoCard
              label="Articulos"
              value={quotation.itemsCount}
              icon={<RiFileList3Fill size={20} />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailInfoCard
              label="Cliente"
              value={quotation.business?.name}
              helper={quotation.business?.legalId}
              icon={<RiBuilding2Fill size={20} />}
            />
            <DetailInfoCard
              label="Sucursal"
              value={getBranchText(quotation.branch)}
              icon={<RiMapPin2Fill size={20} />}
            />
            <DetailInfoCard
              label="Representante"
              value={quotation.representative?.name}
              helper={quotation.representative?.email}
              icon={<RiUser3Fill size={20} />}
            />
          </div>

          <section>
            <div className="mb-3">
              <h3 className="text-base font-bold text-white">Articulos cotizados</h3>
              <p className="text-sm text-gray-500">
                Productos relacionados a esta cotizacion.
              </p>
            </div>
            <DetailProductsTable
              items={quotation.items}
              emptyMessage="Esta cotizacion no tiene productos relacionados."
            />
          </section>

          <section className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Resumen de pago
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#2a3550] bg-[#10192b] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Subtotal
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {formatCurrency(quotation.subtotal, "CRC 0")}
                </p>
              </div>
              <div className="rounded-lg border border-[#2a3550] bg-[#10192b] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  IVA
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {formatCurrency(quotation.ivaAmount, "CRC 0")}
                </p>
              </div>
              <div className="rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Total
                </p>
                <p className="mt-1 text-sm font-bold text-[#C9A227]">
                  {formatCurrency(quotation.total, "CRC 0")}
                </p>
              </div>
              <div className="rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Adelanto (50%)
                </p>
                <p className="mt-1 text-sm font-bold text-[#C9A227]">
                  {formatCurrency(quotation.advancePayment, "CRC 0")}
                </p>
              </div>
            </div>
          </section>

          {canAcceptQuotation(quotation.status) && (
            <section className="flex flex-col items-start justify-between gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-white">Aceptar esta cotizacion</p>
                <p className="text-sm text-gray-400">
                  Al aceptarla se creara tu orden de produccion asociada.
                </p>
              </div>
              <button
                type="button"
                disabled={accepting}
                onClick={() => onAccept?.(quotation.quotationId)}
                className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <RiCheckLine size={16} />
                {accepting ? "Procesando..." : "Aceptar cotizacion"}
              </button>
            </section>
          )}

          {quotation.notes && (
            <section className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notas
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
                {quotation.notes}
              </p>
            </section>
          )}
        </div>
      )}
    </ClientDetailModal>
  );
}
