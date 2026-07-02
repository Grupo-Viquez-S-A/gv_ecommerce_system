import { useEffect, useState } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiMailFill,
  RiMapPinFill,
  RiPhoneFill,
  RiStoreFill,
} from "react-icons/ri";

import ClientStatusBadge from "./ClientStatusBadge";

export default function RepresentativesModal({ client, onClose }) {
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    setSelectedBranch(null);
  }, [client]);

  if (!client) {
    return null;
  }

  const branches = client.branches || [];
  const representatives = selectedBranch?.representatives || [];

  const handleClose = () => {
    setSelectedBranch(null);
    onClose();
  };

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || "RP"
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar modal de representantes"
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4 py-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="representatives-modal-title"
          className="pointer-events-auto bg-[#141d2e] border border-[#2a3550] rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#2a3550] sticky top-0 bg-[#141d2e] z-10 rounded-t-2xl">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: client.color || "#C9A227" }}
              >
                {client.initials || "CL"}
              </div>

              <div className="min-w-0">
                <h3
                  id="representatives-modal-title"
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
              onClick={handleClose}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <RiCloseLine size={20} />
            </button>
          </div>

          {!selectedBranch ? (
            <div className="px-6 py-5">
              <div className="mb-4">
                <h4 className="text-base font-bold text-white">Sucursales</h4>

                <p className="text-sm text-gray-500">
                  Selecciona una sucursal para ver sus representantes.
                </p>
              </div>

              {branches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((branch, index) => (
                    <button
                      key={`${branch.name || "sucursal"}-${index}`}
                      type="button"
                      onClick={() => setSelectedBranch(branch)}
                      className="text-left bg-[#1c2538] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/50 focus:outline-none focus:border-[#C9A227] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[#C9A227] flex-shrink-0">
                          <RiMapPinFill size={14} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {branch.name || `Sucursal ${index + 1}`}
                          </div>

                          <div className="text-xs text-gray-500">
                            {branch.representatives?.length || 0} representante
                            {branch.representatives?.length === 1 ? "" : "s"}
                          </div>
                        </div>

                        <RiArrowRightSLine
                          size={16}
                          className="text-gray-500 flex-shrink-0"
                        />
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
                    </button>
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
          ) : (
            <div className="px-6 py-5">
              {/* Encabezado de sucursal seleccionada */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedBranch(null)}
                  aria-label="Volver a sucursales"
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors"
                >
                  <RiArrowLeftSLine size={18} />
                </button>

                <div className="min-w-0">
                  <h4 className="text-base font-bold text-white truncate">
                    Sucursal {selectedBranch.name || "sin nombre"}
                  </h4>

                  <p className="text-sm text-gray-500">
                    Personas de contacto en esta sucursal.
                  </p>
                </div>
              </div>

              {representatives.length > 0 ? (
                <>
                  {/* Tabla para escritorio */}
                  <div className="hidden md:block bg-[#1c2538] border border-[#2a3550] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a3550]">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Puesto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Teléfono
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Correo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Estado
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#2a3550]">
                          {representatives.map((representative, index) => (
                            <tr
                              key={`${representative.email || representative.name}-${index}`}
                              className="hover:bg-[#222e44]/60 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[#C9A227] flex-shrink-0 text-xs font-bold">
                                    {getInitials(representative.name)}
                                  </div>

                                  <span className="text-sm font-medium text-white">
                                    {representative.name || "Sin nombre"}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-300">
                                {representative.role || "No asignado"}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-300">
                                {representative.phone || "No registrado"}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-300">
                                {representative.email || "No registrado"}
                              </td>

                              <td className="px-4 py-3">
                                <ClientStatusBadge
                                  status={representative.status}
                                  compact
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tarjetas para móvil */}
                  <div className="md:hidden space-y-3">
                    {representatives.map((representative, index) => (
                      <article
                        key={`${representative.email || representative.name}-${index}`}
                        className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[#C9A227] flex-shrink-0 text-xs font-bold">
                              {getInitials(representative.name)}
                            </div>

                            <div className="min-w-0">
                              <h5 className="text-sm font-semibold text-white truncate">
                                {representative.name || "Sin nombre"}
                              </h5>

                              <p className="text-xs text-gray-500 truncate">
                                {representative.role || "Puesto no asignado"}
                              </p>
                            </div>
                          </div>

                          <ClientStatusBadge
                            status={representative.status}
                            compact
                          />
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#2a3550] space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            <RiPhoneFill
                              size={12}
                              className="text-gray-500 flex-shrink-0"
                            />
                            {representative.phone || "Teléfono no registrado"}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            <RiMailFill
                              size={12}
                              className="text-gray-500 flex-shrink-0"
                            />
                            <span className="break-all">
                              {representative.email || "Correo no registrado"}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 bg-[#1c2538] border border-[#2a3550] rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
                    <RiStoreFill size={22} />
                  </div>

                  <p className="text-sm text-gray-500">
                    Esta sucursal no tiene representantes registrados.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pie */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-[#2a3550] sticky bottom-0 bg-[#141d2e] rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
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