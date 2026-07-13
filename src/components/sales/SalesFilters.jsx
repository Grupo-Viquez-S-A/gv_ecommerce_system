import { RiArrowDownSFill, RiCalendarLine, RiSearchLine } from "react-icons/ri";

export default function SalesFilters({ filters, representatives, onChange, onClear }) {
  return (
    <section className="mb-6 rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2"><span className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">Buscar</span><span className="relative block"><RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Buscar por código, cotización o cliente..." className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-400 focus:border-[#C9A227]" /></span></label>
        {[["dateFrom", "Fecha de venta (desde)"], ["dateTo", "Fecha de venta (hasta)"]].map(([field, label]) => <label key={field}><span className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">{label}</span><span className="relative block"><RiCalendarLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="date" value={filters[field]} onChange={(event) => onChange(field, event.target.value)} className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2 pl-9 pr-3 text-sm text-white outline-none [color-scheme:dark] focus:border-[#C9A227]" /></span></label>)}
        <label><span className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">Representante</span><span className="relative block"><select value={filters.representative} onChange={(event) => onChange("representative", event.target.value)} className="w-full appearance-none rounded-lg border border-[#2a3550] bg-[#222e44] py-2 pl-3 pr-8 text-sm text-white outline-none focus:border-[#C9A227]">{representatives.map((representative) => <option key={representative}>{representative}</option>)}</select><RiArrowDownSFill size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" /></span></label>
        <div className="flex items-end lg:col-span-6"><button type="button" onClick={onClear} className="w-full rounded-lg border border-[#2a3550] bg-[#1c2538] py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white sm:w-auto sm:px-6">Limpiar filtros</button></div>
      </div>
    </section>
  );
}
