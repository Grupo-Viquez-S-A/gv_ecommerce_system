import {
  RiCalendarCheckFill,
  RiFileList3Fill,
  RiMoneyDollarCircleFill,
  RiStore2Fill,
  RiTruckFill,
  RiWallet3Fill,
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

export default function OrderDetailModal({
  isOpen,
  order,
  loading,
  error,
  onClose,
}) {
  return (
    <ClientDetailModal
      isOpen={isOpen}
      title={order?.code || "Pedido"}
      subtitle={order ? `Cotizacion relacionada: ${order.quotationNumber}` : ""}
      icon={<RiTruckFill size={24} />}
      badges={
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
    >
      {order && (
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
          </div>

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
