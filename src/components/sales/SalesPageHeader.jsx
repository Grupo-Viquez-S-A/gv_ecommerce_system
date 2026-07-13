import { RiExportFill, RiRefreshLine } from "react-icons/ri";

export default function SalesPageHeader({ onRefresh }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500"><span>Comercial</span><span>/</span><span className="text-gray-300">Ventas</span></div>
        <h1 className="text-xl font-bold text-white">Ventas</h1>
        <p className="mt-0.5 text-sm text-gray-400">Órdenes de producción pagadas al 100%.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onRefresh} className="flex items-center gap-2 rounded-lg border border-[#2a3550] bg-[#1c2538] px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[#C9A227]/15 hover:text-white"><RiRefreshLine size={15} />Actualizar</button>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#C9A227]/20 transition-colors hover:bg-[#B8921F]"><RiExportFill size={16} />Exportar</button>
      </div>
    </header>
  );
}
