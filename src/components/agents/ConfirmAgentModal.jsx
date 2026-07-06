import {
  RiDeleteBinFill,
  RiUserSharedFill,
} from "react-icons/ri";

export default function ConfirmAgentModal({
  action,
  agent,
  onClose,
  onConfirm,
}) {
  if (!agent) {
    return null;
  }

  const isDeleteAction = action === "delete";

  const config = isDeleteAction
    ? {
        icon: <RiDeleteBinFill size={24} className="text-red-400" />,
        iconContainerClass: "bg-red-500/20",
        title: "Eliminar agente",
        message: (
          <>
            ¿Eliminar a{" "}
            <span className="text-white font-medium">{agent.name}</span>?
            Esta acción no se puede deshacer.
          </>
        ),
        confirmLabel: "Eliminar",
        confirmButtonClass: "bg-red-500 hover:bg-red-600",
      }
    : {
        icon: <RiUserSharedFill size={24} className="text-yellow-400" />,
        iconContainerClass: "bg-yellow-500/20",
        title: "Desactivar agente",
        message: (
          <>
            ¿Desactivar a{" "}
            <span className="text-white font-medium">{agent.name}</span>?
            El agente pasará a estado inactivo y no podrá realizar ventas.
          </>
        ),
        confirmLabel: "Desactivar",
        confirmButtonClass: "bg-yellow-500 hover:bg-yellow-600",
      };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-agent-modal-title"
          className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${config.iconContainerClass}`}
          >
            {config.icon}
          </div>

          <h3
            id="confirm-agent-modal-title"
            className="text-center text-base font-bold text-white mb-1"
          >
            {config.title}
          </h3>

          <p className="text-center text-sm text-gray-400 mb-5">
            {config.message}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2a3550] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => onConfirm(agent)}
              className={`flex-1 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer ${config.confirmButtonClass}`}
            >
              {config.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}