/* eslint-disable react-refresh/only-export-components */
export const QUOTATION_STATUS_CONFIG = {
  Pendiente: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  "En revisión": { bg: "bg-[#C9A227]/10", text: "text-[#C9A227]", border: "border-[#C9A227]/20" },
  Aprobada: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  Rechazada: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  Vencida: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  Convertida: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
};
export const QUOTATION_STATUS_COLORS = { Pendiente: "#f59e0b", "En revisión": "#C9A227", Aprobada: "#22c55e", Rechazada: "#ef4444", Vencida: "#ec4899", Convertida: "#14b8a6" };
export const QUOTATION_STATUSES = ["Pendiente", "En revision", "Aprobada", "Rechazada", "Vencida", "Convertida"];
export const QUOTATION_AREA_DATA = [{ name: "Ene", value: 45 }, { name: "Feb", value: 52 }, { name: "Mar", value: 48 }, { name: "Abr", value: 60 }, { name: "May", value: 55 }, { name: "Jun", value: 70 }, { name: "Jul", value: 65 }, { name: "Ago", value: 80 }, { name: "Sep", value: 75 }, { name: "Oct", value: 90 }, { name: "Nov", value: 85 }, { name: "Dic", value: 100 }];
export const QUOTATION_LINE_DATA = [{ name: "Ene", value: 35 }, { name: "Feb", value: 38 }, { name: "Mar", value: 42 }, { name: "Abr", value: 40 }, { name: "May", value: 45 }, { name: "Jun", value: 43 }, { name: "Jul", value: 48 }, { name: "Ago", value: 50 }, { name: "Sep", value: 47 }, { name: "Oct", value: 52 }, { name: "Nov", value: 55 }, { name: "Dic", value: 58 }];

const currencyFormatter = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric" });
export function formatQuotationCurrency(value) { return currencyFormatter.format(Number(value) || 0); }
export function formatQuotationDate(value) {
  if (!value) return "-";
  const stringValue = String(value).trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stringValue);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(stringValue);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}
export function normalizeQuotationSearch(value) { return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
export function isQuotationApproved(quotation) {
  const status = normalizeQuotationSearch(quotation?.dbStatus || quotation?.status);
  return status === "approved" || status === "aprobada";
}
export function QuotationPaginationButton({ icon, label, active = false }) { return <button type="button" className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${active ? "bg-[#C9A227] text-white" : "text-gray-500 hover:bg-[#C9A227]/15 hover:text-white"}`}>{icon || label}</button>; }
export function QuotationProductThumb({ item }) { return item.imageUrl ? <img src={item.imageUrl} alt={item.name || "Producto"} className="h-20 w-20 rounded-lg border border-[#2a3550] bg-[#0B1120] object-cover" loading="lazy" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[#2a3550] bg-[#10192b] text-xs font-bold text-[#C9A227]">IMG</div>; }
export function QuotationStatusBadge({ status }) { const config = QUOTATION_STATUS_CONFIG[status] || QUOTATION_STATUS_CONFIG.Pendiente; return <span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>{status}</span>; }
