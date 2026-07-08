import {
  RiBuilding2Fill,
  RiCalendarEventFill,
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
