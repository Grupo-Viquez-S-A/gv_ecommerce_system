import EmptyClientState from "./EmptyClientState.jsx";
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
    month: "short",
    year: "numeric",
  }).format(date);
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-200">{value || "No definido"}</p>
    </div>
  );
}

export default function MyOrdersList({ orders }) {
  if (!orders.length) {
    return (
      <EmptyClientState
        title="No tienes pedidos de produccion"
        description="Cuando una cotizacion tuya pase a produccion, el pedido aparecera aqui con fechas y estado de pago."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <article key={order.id} className="rounded-lg border border-[#2a3550] bg-[#1b2538] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]">Orden de produccion</p>
              <h3 className="mt-1 text-xl font-black text-white">{order.code}</h3>
              <p className="mt-1 text-sm text-gray-400">Cotizacion relacionada: {order.quotationNumber}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.productionStatus} />
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-[#2a3550] pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <Detail label="Metodo de pago" value={order.paymentMethod} />
            <Detail label="Entrega compromiso" value={formatDate(order.committedDeliveryDate)} />
            {order.unexpectedDeliveryDate && (
              <Detail label="Entrega imprevista" value={formatDate(order.unexpectedDeliveryDate)} />
            )}
            {order.nextPaymentDate && (
              <Detail label="Proximo pago" value={formatDate(order.nextPaymentDate)} />
            )}
            <Detail label="Creado" value={formatDate(order.createdAt)} />
          </div>
        </article>
      ))}
    </div>
  );
}
