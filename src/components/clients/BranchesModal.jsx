import {
  RiCloseLine,
  RiMailFill,
  RiMapPinFill,
  RiPhoneFill,
  RiStoreFill,
} from "react-icons/ri";

export default function BranchesModal({ client, onClose }) {
  if (!client) {
    return null;
  }

  const stats = [
    {
      label: "Ventas acumuladas",
      value: client.sales || "₡0",
    },
    {
      label: "Cotizaciones activas",
      value: client.totalQuotes ?? 0,
    },
    {
      label: "Pedidos activos",
      value: client.totalOrders ?? 0,
    },
    {
      label: "Sucursales",
      value: client.branches?.length || 0,
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar modal de sucursales"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="branches-modal-title"
          className="pointer-events-auto max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#2a3550] bg-[#141d2e] shadow-2xl sm:max-h-[90dvh]"
        >
          {/* Encabezado */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl border-b border-[#2a3550] bg-[#141d2e] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: client.color || "#C9A227" }}
              >
                {client.initials || "CL"}
              </div>

              <div className="min-w-0">
                <h3
                  id="branches-modal-title"
                  className="text-base font-bold text-white truncate"
                >
                  {client.name}
                </h3>

                <p className="text-sm text-gray-400 truncate">
                  {client.company || "Empresa no asignada"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <RiCloseLine size={20} />
            </button>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 gap-4 border-b border-[#2a3550] px-4 py-4 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-3"
              >
                <div className="text-xs text-gray-500 mb-1">{stat.label}</div>

                <div className="text-base font-bold text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Sucursales */}
          <div className="px-4 py-5 sm:px-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Sucursales</h4>

              <p className="text-sm text-gray-500">
                Todas las sucursales registradas para este cliente.
              </p>
            </div>

            {client.branches?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {client.branches.map((branch, index) => (
                  <article
                    key={`${branch.name || "sucursal"}-${index}`}
                    className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[#C9A227] flex-shrink-0">
                        <RiMapPinFill size={14} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {branch.name || `Sucursal ${index + 1}`}
                        </div>

                        <div className="text-xs text-gray-500">
                          {branch.representatives?.length || 0} representante
                          {branch.representatives?.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {branch.address && (
                        <div className="flex items-start gap-2">
                          <RiMapPinFill
                            size={12}
                            className="text-gray-500 mt-0.5 flex-shrink-0"
                          />

                          <span className="text-xs text-gray-300 break-words">
                            {branch.address}
                          </span>
                        </div>
                      )}

                      {branch.phone && (
                        <div className="flex items-center gap-2">
                          <RiPhoneFill
                            size={12}
                            className="text-gray-500 flex-shrink-0"
                          />

                          <span className="text-xs text-gray-300">
                            {branch.phone}
                          </span>
                        </div>
                      )}

                      {branch.email && (
                        <div className="flex items-center gap-2">
                          <RiMailFill
                            size={12}
                            className="text-gray-500 flex-shrink-0"
                          />

                          <span className="text-xs text-gray-300 break-all">
                            {branch.email}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#2a3550] flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">
                        Ventas:{" "}
                        <span className="text-white font-medium">
                          {branch.sales || "N/A"}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 text-right">
                        {branch.lastPurchase || "Sin compras"}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
                  <RiStoreFill size={24} />
                </div>

                <p className="text-sm text-gray-500">
                  Este cliente no tiene sucursales registradas.
                </p>
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="sticky bottom-0 flex items-center justify-end rounded-b-2xl border-t border-[#2a3550] bg-[#141d2e] px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#FF0303] hover:bg-red-700 border border-[#2a3550] text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
