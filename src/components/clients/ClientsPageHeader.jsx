import {
  RiAddFill,
  RiArrowRightSLine,
} from "react-icons/ri";

export default function ClientsPageHeader({ onCreateClient }) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Comercial</span>
        <RiArrowRightSLine size={14} />
        <span className="text-gray-300">Clientes</span>
      </div>

      {/* Título y acción principal */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>

          <p className="text-sm text-gray-400 mt-1">
            Administra todos los clientes del grupo.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateClient}
          className="flex items-center justify-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer flex-shrink-0"
        >
          <RiAddFill size={18} />
          Nuevo cliente
        </button>
      </div>
    </>
  );
}