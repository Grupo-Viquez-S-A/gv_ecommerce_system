import formatCurrency from "../../utils/formatCurrency.js";
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

export default function MyQuotationsList({ quotations, onSelectQuotation }) {
  if (!quotations.length) {
    return (
      <EmptyClientState
        title="No tienes cotizaciones registradas"
        description="Cuando una cotizacion quede asociada a tu usuario, aparecera aqui para que puedas revisar su estado y resumen."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#2a3550] bg-[#1b2538]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-[#2a3550]">
          <thead className="bg-[#141d2e]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Cotizacion</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Productos</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Total aprox.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3550]">
            {quotations.map((quotation) => (
              <tr
                key={quotation.id}
                className="cursor-pointer transition-colors hover:bg-[#202b40]"
                onClick={() => onSelectQuotation?.(quotation)}
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{quotation.number}</p>
                  {quotation.notes && <p className="mt-1 max-w-lg text-xs text-gray-400">{quotation.notes}</p>}
                </td>
                <td className="px-5 py-4"><StatusBadge status={quotation.status} /></td>
                <td className="px-5 py-4 text-sm text-gray-300">{formatDate(quotation.createdAt)}</td>
                <td className="px-5 py-4 text-sm text-gray-300">{quotation.itemsCount}</td>
                <td className="px-5 py-4 text-right text-sm font-bold text-white">{formatCurrency(quotation.total, "CRC 0")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
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
            {quotation.notes && <p className="mt-3 text-sm text-gray-300">{quotation.notes}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Productos</p>
                <p className="mt-1 font-semibold text-white">{quotation.itemsCount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500">Total aprox.</p>
                <p className="mt-1 font-bold text-white">{formatCurrency(quotation.total, "CRC 0")}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
