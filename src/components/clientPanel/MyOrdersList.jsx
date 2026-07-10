import { RiEyeFill } from "react-icons/ri";

import formatCurrency from "../../utils/formatCurrency.js";
import { formatDateCR } from "../../utils/dateUtils.js";
import EmptyClientState from "./EmptyClientState.jsx";
import StatusBadge from "./StatusBadge.jsx";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const formatted = formatDateCR(dateValue);

  return formatted || "Sin fecha";
}

export default function MyOrdersList({ orders, onSelectOrder }) {
  if (!orders.length) {
    return (
      <EmptyClientState
        title="No tienes pedidos de produccion"
        description="Cuando una cotizacion tuya pase a produccion, el pedido aparecera aqui con fechas y estado de pago."
      />
    );
  }

  return (
    <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
      <table className="w-full text-left hidden md:table">
        <thead>
          <tr className="border-b border-[#2a3550]">
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Pedido
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Cotizacion
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Creado
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Entrega compromiso
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Proximo pago
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Saldo
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Produccion
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Pago
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#2a3550]">
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onSelectOrder?.(order)}
              className="hover:bg-[#1c2538]/50 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                {order.code}
              </td>

              <td className="px-4 py-3 text-sm text-gray-400">
                {order.quotationNumber}
              </td>

              <td className="px-4 py-3 text-sm text-gray-400">
                {formatDate(order.createdAt)}
              </td>

              <td className="px-4 py-3 text-sm text-gray-400">
                {formatDate(order.committedDeliveryDate)}
              </td>

              <td className="px-4 py-3 text-sm text-gray-400">
                {formatDate(order.nextPaymentDate)}
              </td>

              <td className="px-4 py-3 text-sm text-white font-semibold">
                {formatCurrency(order.balance, "CRC 0")}
              </td>

              <td className="px-4 py-3">
                <StatusBadge status={order.productionStatus} />
              </td>

              <td className="px-4 py-3">
                <StatusBadge status={order.paymentStatus} />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectOrder?.(order);
                    }}
                    className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                    title="Ver"
                  >
                    <RiEyeFill size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-3 p-4 md:hidden">
        {orders.map((order) => (
          <article
            key={order.id}
            className="cursor-pointer rounded-lg border border-[#2a3550] bg-[#141d2e] p-4 transition-colors hover:border-[#C9A227]/45 hover:bg-[#182235]"
            onClick={() => onSelectOrder?.(order)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{order.code}</p>
                <p className="mt-1 text-xs text-gray-400">Cotizacion: {order.quotationNumber}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={order.productionStatus} />
                <StatusBadge status={order.paymentStatus} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Entrega compromiso</p>
                <p className="mt-1 font-semibold text-white">{formatDate(order.committedDeliveryDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Proximo pago</p>
                <p className="mt-1 font-semibold text-white">{formatDate(order.nextPaymentDate)}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500">Saldo</p>
                <p className="mt-1 font-bold text-white">{formatCurrency(order.balance, "CRC 0")}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
