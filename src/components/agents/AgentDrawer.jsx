import {
  RiAddFill,
  RiEditFill,
  RiEyeFill,
} from "react-icons/ri";

import { AGENT_DRAWER_MODES } from "../../constants/agents.constants.js";
import AgentDetails from "./AgentDetails.jsx";
import AgentForm from "./AgentForm.jsx";

export default function AgentDrawer({
  isOpen,
  mode,
  agent,
  form,
  onFormChange,
  onClose,
  onSave,
}) {
  const isCreateMode = mode === AGENT_DRAWER_MODES.CREATE;
  const isEditMode = mode === AGENT_DRAWER_MODES.EDIT;
  const isViewMode = mode === AGENT_DRAWER_MODES.VIEW;
  const canRenderForm = isOpen && (isCreateMode || isEditMode) && form && onFormChange;

  const drawerTitle = isCreateMode
    ? "Nuevo Agente"
    : isEditMode
      ? "Editar Agente"
      : "Detalle del Agente";

  const drawerDescription = isCreateMode
    ? "Completa la información del nuevo agente."
    : isEditMode
      ? "Modifica la información del agente."
      : "Información completa del agente.";

  const handleSave = () => {
    onSave?.(form);
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar panel lateral"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
        />
      )}

      <aside
        aria-hidden={!isOpen}
        className={`
          fixed top-0 right-0 h-full w-full max-w-md
          bg-[#141d2e] border-l border-[#2a3550]
          z-50 flex flex-col shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Encabezado */}
        <header className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isCreateMode && (
                <>
                  <RiAddFill size={20} className="text-[#C9A227]" />
                  {drawerTitle}
                </>
              )}

              {isEditMode && (
                <>
                  <RiEditFill size={20} className="text-[#C9A227]" />
                  {drawerTitle}
                </>
              )}

              {isViewMode && (
                <>
                  <RiEyeFill size={20} className="text-[#C9A227]" />
                  {drawerTitle}
                </>
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {drawerDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#222e44] flex items-center justify-center transition-colors"
            aria-label="Cerrar drawer"
            title="Cerrar"
          >
            ×
          </button>
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {canRenderForm && (
            <AgentForm
              form={form}
              onChange={onFormChange}
            />
          )}

          {isOpen && isViewMode && (
            <AgentDetails agent={agent} />
          )}
        </div>

        {/* Pie del drawer */}
        <footer className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
          {isViewMode ? (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#FF0303] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#FF0303] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {isCreateMode ? "Guardar Agente" : "Guardar Cambios"}
              </button>
            </>
          )}
        </footer>
      </aside>
    </>
  );
}
