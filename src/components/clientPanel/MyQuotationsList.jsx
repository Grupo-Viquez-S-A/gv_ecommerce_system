import { RiCheckLine, RiEyeFill } from "react-icons/ri";

import formatCurrency from "../../utils/formatCurrency.js";
import EmptyClientState from "./EmptyClientState.jsx";
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

export default function MyQuotationsList({
  quotations,
  onSelectQuotation,
  onAcceptQuotation,
  acceptingId,
}) {
  if (!quotations.length) {
    return (
      <EmptyClientState
        title="No tienes cotizaciones aprobadas"
        description="Cuando una de tus cotizaciones sea aprobada, aparecera aqui para que puedas revisar su estado y resumen."
      />
    );
  }

  return (
    <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
      <table className="w-full text-left hidden md:table">
        <thead>
          <tr className="border-b border-[#2a3550]">
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Vigencia
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Productos
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#2a3550]">
          {quotations.map((quotation) => (
            <tr
              key={quotation.id}
              onClick={() => onSelectQuotation?.(quotation)}
              className="hover:bg-[#1c2538]/50 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                {quotation.number}
              </td>

              <td className="px-4 py-3 text-sm text-gray-400">
                {formatDate(quotation.createdAt)}
              </td>

              <td className="px-4 py-3 text-sm text-gray-400">
                {formatDate(quotation.validUntil)}
              </td>

              <td className="px-4 py-3 text-sm text-gray-300">
                {quotation.itemsCount}
              </td>

              <td className="px-4 py-3 text-sm text-white font-semibold">
                {formatCurrency(quotation.total, "CRC 0")}
              </td>

              <td className="px-4 py-3">
                <StatusBadge status={quotation.status} />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  {canAcceptQuotation(quotation.status) && (
                    <button
                      type="button"
                      disabled={acceptingId === quotation.quotationId}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAcceptQuotation?.(quotation.quotationId);
                      }}
                      className="flex h-7 items-center gap-1 rounded-lg border border-green-500/40 bg-green-500/10 px-2 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      title="Aceptar cotizacion"
                    >
                      <RiCheckLine size={13} />
                      {acceptingId === quotation.quotationId ? "Procesando..." : "Aceptar"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectQuotation?.(quotation);
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
        {quotations.map((quotation) => (
          <article
            key={quotation.id}
            className="cursor-pointer rounded-lg border border-[#2a3550] bg-[#141d2e] p-4 transition-colors hover:border-[#C9A227]/45 hover:bg-[#182235]"
            onClick={() => onSelectQuotation?.(quotation)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{quotation.number}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(quotation.createdAt)}</p>
              </div>
              <StatusBadge status={quotation.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Vigencia</p>
                <p className="mt-1 font-semibold text-white">{formatDate(quotation.validUntil)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Productos</p>
                <p className="mt-1 font-semibold text-white">{quotation.itemsCount}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500">Total</p>
                <p className="mt-1 font-bold text-white">{formatCurrency(quotation.total, "CRC 0")}</p>
              </div>
            </div>
            {canAcceptQuotation(quotation.status) && (
              <button
                type="button"
                disabled={acceptingId === quotation.quotationId}
                onClick={(event) => {
                  event.stopPropagation();
                  onAcceptQuotation?.(quotation.quotationId);
                }}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-green-500/40 bg-green-500/10 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <RiCheckLine size={14} />
                {acceptingId === quotation.quotationId ? "Procesando..." : "Aceptar cotizacion"}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
