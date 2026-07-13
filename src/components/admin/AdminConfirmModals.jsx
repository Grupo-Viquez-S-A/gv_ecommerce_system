import { RiDeleteBinFill, RiUserSharedFill } from "react-icons/ri";

export default function AdminConfirmModals({ deleteModal, setDeleteModal, deactivateModal, setDeactivateModal }) {
  return <>
      {deleteModal && (
        <>
          <button
            type="button"
            onClick={() => setDeleteModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
            aria-label="Cerrar confirmación de eliminación"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <RiDeleteBinFill
                  size={24}
                  className="text-red-400"
                />
              </div>

              <h3 className="text-center text-base font-bold text-white mb-1">
                Eliminar usuario
              </h3>

              <p className="text-center text-sm text-gray-400 mb-5">
                Estas seguro de que deseas eliminar a{" "}
                <span className="text-white font-medium">
                  {deleteModal.name}
                </span>
                ? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 bg-[#1c2538] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deactivateModal && (
        <>
          <button
            type="button"
            onClick={() => setDeactivateModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
            aria-label="Cerrar confirmación de desactivación"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <RiUserSharedFill
                  size={24}
                  className="text-yellow-400"
                />
              </div>

              <h3 className="text-center text-base font-bold text-white mb-1">
                Desactivar usuario
              </h3>

              <p className="text-center text-sm text-gray-400 mb-5">
                Desactivar a{" "}
                <span className="text-white font-medium">
                  {deactivateModal.name}
                </span>
                ? El usuario perderá acceso al sistema de inmediato.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeactivateModal(null)}
                  className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => setDeactivateModal(null)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
  </>;
}

