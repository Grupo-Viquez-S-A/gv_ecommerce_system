import { RiDownloadFill } from "react-icons/ri";

export default function QuotationsPageHeader({ onRefresh }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <span>Comercial</span><span>/</span>
          <span className="text-gray-300">Producción</span>
        </div>
        <h1 className="text-xl font-bold text-white">Producción</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Gestiona cotizaciones y órdenes de producción del e-commerce.
        </p>
      </div>
      <button type="button" onClick={onRefresh} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#C9A227]/20 transition-colors hover:bg-[#B8921F]">
        <RiDownloadFill size={16} /> Actualizar producción
      </button>
    </div>
  );
}
