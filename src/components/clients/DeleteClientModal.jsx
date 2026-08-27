import {
  RiAlertFill,
  RiCloseLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
} from "react-icons/ri";

export default function DeleteClientModal({
  client,
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  if (!client) {
    return null;
  }

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
        className="fixed inset-0 z-50 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-delete-modal-title"
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-red-400/30 bg-[#141d2e] shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#2a3550] px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                <RiAlertFill size={20} />
              </div>

              <div>
                <h3
                  id="client-delete-modal-title"
                  className="text-base font-bold text-white"
                >
                  Eliminar cliente
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Esta acción elimina el cliente de forma permanente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RiCloseLine size={20} />
            </button>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center gap-3 rounded-xl border border-[#2a3550] bg-[#1c2538] p-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: client.color || "#C9A227" }}
              >
                {client.initials || "CL"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {client.name}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {client.company || "Empresa no asignada"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <div className="flex items-start gap-2">
                <RiErrorWarningLine size={18} className="mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">
                  Si el cliente ya tiene cotizaciones asociadas, la eliminación
                  se bloqueará para proteger el historial comercial. En ese caso
                  debes usar la opción de desactivar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-[#2a3550] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="action-close-cancel flex-1 rounded-lg border border-[#2a3550] bg-[#222e44] py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[#2a3550] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RiDeleteBinLine size={16} />
              {isProcessing ? "Eliminando..." : "Eliminar cliente"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
