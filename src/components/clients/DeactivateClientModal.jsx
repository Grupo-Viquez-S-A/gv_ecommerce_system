import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiCloseLine,
  RiUserSharedFill,
} from "react-icons/ri";

export default function DeactivateClientModal({
  client,
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  if (!client) {
    return null;
  }

  const isActive = client.status === "Activo";
  const actionLabel = isActive ? "Desactivar cliente" : "Activar cliente";
  const actionDescription = isActive
    ? "El cliente dejará de estar disponible para nuevas operaciones hasta que sea activado nuevamente."
    : "El cliente volverá a estar disponible para nuevas operaciones.";
  const ActionIcon = isActive ? RiUserSharedFill : RiCheckboxCircleFill;

  const handleConfirm = () => {
    if (isProcessing || !onConfirm) {
      return;
    }

    onConfirm(client);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-status-modal-title"
          className="pointer-events-auto w-full max-w-md bg-[#141d2e] border border-[#2a3550] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#2a3550]">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-green-400/10 text-green-400"
                }`}
              >
                {isActive ? (
                  <RiAlertFill size={20} />
                ) : (
                  <RiCheckboxCircleFill size={20} />
                )}
              </div>

              <div>
                <h3
                  id="client-status-modal-title"
                  className="text-base font-bold text-white"
                >
                  {actionLabel}
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  Esta acción actualizará el estado del cliente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RiCloseLine size={20} />
            </button>
          </div>

          {/* Contenido */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 bg-[#1c2538] border border-[#2a3550] rounded-xl p-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: client.color || "#C9A227" }}
              >
                {client.initials || "CL"}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {client.name}
                </p>

                <p className="text-xs text-gray-500 truncate">
                  {client.company || "Empresa no asignada"}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-300 mt-4 leading-relaxed">
              {actionDescription}
            </p>

            <div
              className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                isActive
                  ? "bg-yellow-500/10 text-yellow-300"
                  : "bg-green-400/10 text-green-300"
              }`}
            >
              {isActive ? (
                <RiCloseCircleFill size={15} />
              ) : (
                <RiCheckboxCircleFill size={15} />
              )}

              Estado actual:{" "}
              <span className="font-semibold">{client.status}</span>
            </div>
          </div>

          {/* Pie */}
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 bg-[#222e44] hover:bg-[#2a3550] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`flex-1 flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? "bg-yellow-600 hover:bg-yellow-500"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              <ActionIcon size={16} />
              {isProcessing ? "Actualizando..." : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}