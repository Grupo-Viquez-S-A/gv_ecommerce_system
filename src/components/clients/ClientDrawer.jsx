import {
  RiAddFill,
  RiCloseLine,
  RiEditFill,
  RiEyeFill,
} from "react-icons/ri";

import ClientDetails from "./ClientDetails";
import ClientForm from "./ClientForm";

const drawerContent = {
  create: {
    title: "Nuevo Cliente",
    description: "Completa la información del nuevo cliente.",
    icon: RiAddFill,
    saveLabel: "Guardar Cliente",
  },
  edit: {
    title: "Editar Cliente",
    description: "Modifica la información del cliente.",
    icon: RiEditFill,
    saveLabel: "Guardar Cambios",
  },
  view: {
    title: "Detalle del Cliente",
    description: "Información completa del cliente.",
    icon: RiEyeFill,
    saveLabel: "",
  },
};

export default function ClientDrawer({
  isOpen = false,
  mode = "create",
  form,
  client,
  allowLocationOnlyEdit = false,
  onFormChange,
  onClose,
  onSave,
  isSaving = false,
}) {
  const content = drawerContent[mode] || drawerContent.create;
  const HeaderIcon = content.icon;
  const isViewMode = mode === "view";
  const isLocationOnlyEdit =
    mode === "edit" && allowLocationOnlyEdit;

  const handleSave = () => {
    if (isViewMode || isSaving || !onSave) {
      return;
    }

    onSave(form);
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar panel de cliente"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-labelledby="client-drawer-title"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Encabezado */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2
              id="client-drawer-title"
              className="text-lg font-bold text-white flex items-center gap-2"
            >
              <HeaderIcon size={20} className="text-[#C9A227]" />
              {isLocationOnlyEdit ? "Actualizar ubicación" : content.title}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {isLocationOnlyEdit
                ? "Actualiza únicamente el pin del mapa para esta sucursal."
                : content.description}
            </p>
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {isViewMode ? (
            <ClientDetails client={client} />
          ) : (
            <ClientForm
              form={form}
              onChange={onFormChange}
              mode={mode}
              allowLocationOnlyEdit={allowLocationOnlyEdit}
            />
          )}
        </div>

        {/* Pie del drawer */}
        <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-[#FF0303] hover:bg-red-700 border border-[#2a3550] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isViewMode ? "Cerrar" : "Cancelar"}
          </button>

          {!isViewMode && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isSaving
                ? "Guardando..."
                : isLocationOnlyEdit
                  ? "Guardar ubicación"
                  : content.saveLabel}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
