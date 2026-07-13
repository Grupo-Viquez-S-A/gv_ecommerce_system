import { RiAddFill, RiArrowDownSFill, RiCalendarLine, RiExportFill } from "react-icons/ri";

export default function ReportsHeader({ onNewReport }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
          <span>Comercial</span><RiArrowDownSFill size={14} className="-rotate-90 text-gray-500" /><span className="text-gray-300">Reportes</span>
        </div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="mt-0.5 text-sm text-gray-400">Analiza el desempeño de tu negocio con reportes detallados y personalizados.</p>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <button type="button" className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2a3550] bg-[#141d2e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C9A227]/15"><RiExportFill size={14} /> Exportar</button>
        <button type="button" className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2a3550] bg-[#141d2e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C9A227]/15"><RiCalendarLine size={14} /> Programar reporte</button>
        <button type="button" onClick={onNewReport} className="flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#C9A227]/20 transition-colors hover:bg-[#B8921F]"><RiAddFill size={14} /> Nuevo reporte <RiArrowDownSFill size={14} /></button>
      </div>
    </div>
  );
}
