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
  showPaymentActions = false,
  showPaymentForm = false,
  paymentMethods = [],
  paymentLoading = false,
  paymentError = "",
  paymentSuccess = "",
  onOpenPaymentForm,
  onBackFromPaymentForm,
  onSubmitPayment,
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
