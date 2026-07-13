import { RiArrowDownSFill, RiSearchLine } from "react-icons/ri";

const Field = ({ label, children, className = "" }) => <div className={className}><label className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">{label}</label>{children}</div>;
const inputClass = "w-full rounded-lg border border-[#2a3550] bg-[#222e44] px-3 py-2 text-sm text-white transition-colors focus:border-[#C9A227] focus:outline-none";

export default function OrdersFilters({ search, payment, agent, agents, dateFrom, dateTo, onSearch, onPayment, onAgent, onDateFrom, onDateTo, onClear }) {
  return <div className="mb-6 rounded-xl border border-[#2a3550] bg-[#141d2e] p-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
    <Field label="Buscar" className="lg:col-span-2"><div className="relative"><RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/><input value={search} onChange={(e)=>onSearch(e.target.value)} placeholder="Buscar por codigo, cotizacion o cliente..." className={`${inputClass} pl-9`}/></div></Field>
    <Field label="Estado de pago"><div className="relative"><select value={payment} onChange={(e)=>onPayment(e.target.value)} className={`${inputClass} appearance-none pr-8`}><option value="Todos">Todos los pagos</option><option value="pendiente">Pendiente de pago</option><option value="parcial">Pago adelantado</option></select><RiArrowDownSFill size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"/></div></Field>
    <Field label="Vendedor"><div className="relative"><select value={agent} onChange={(e)=>onAgent(e.target.value)} className={`${inputClass} appearance-none pr-8`}>{agents.map(value=><option key={value}>{value}</option>)}</select><RiArrowDownSFill size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"/></div></Field>
    <Field label="Proxima fecha de pago (desde)"><input type="date" value={dateFrom} onChange={(e)=>onDateFrom(e.target.value)} className={`${inputClass} [color-scheme:dark]`}/></Field>
    <Field label="Proxima fecha de pago (hasta)"><input type="date" value={dateTo} onChange={(e)=>onDateTo(e.target.value)} className={`${inputClass} [color-scheme:dark]`}/></Field>
    <div className="flex items-end lg:col-span-6"><button type="button" onClick={onClear} className="w-full cursor-pointer rounded-lg border border-[#2a3550] bg-[#1c2538] py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white sm:w-auto sm:px-6">Limpiar filtros</button></div>
  </div></div>;
}
