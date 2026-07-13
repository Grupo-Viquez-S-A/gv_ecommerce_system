/* eslint-disable react-refresh/only-export-components */
import { formatDateShortCR, formatDateTimeCR } from "../../utils/dateUtils.js";

export const ORDER_STATUS_CONFIG = {
  pendiente: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  en_proceso: { bg: "bg-[#C9A227]/10", text: "text-[#C9A227]", border: "border-[#C9A227]/20" },
  pausada: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  finalizada: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  cancelada: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
};

export const ORDER_PAYMENT_CONFIG = {
  pendiente: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  parcial: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  pagado: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  vencido: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  cancelado: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
};

export function formatOrderCurrency(amount) { return `₡${(Number(amount) || 0).toLocaleString("es-CR", { maximumFractionDigits: 0 })}`; }
export function formatOrderDate(value) { if (!value) return "Sin fecha"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Sin fecha" : formatDateTimeCR(date) || "Sin fecha"; }
export function formatOrderFileSize(value) { const size = Number(value); if (!Number.isFinite(size) || size <= 0) return "Tamaño no disponible"; return size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`; }
export function buildDailyOrdersData(orders) { const counts = orders.reduce((result, order) => { const date = order.createdAt ? new Date(order.createdAt) : null; if (!date || Number.isNaN(date.getTime())) return result; const key = formatDateShortCR(date); result[key] = (result[key] || 0) + 1; return result; }, {}); return Object.entries(counts).map(([name, value]) => ({ name, value })); }

export function OrderDetailRow({ label, value, children }) { return <div className="flex items-start justify-between gap-4 border-b border-[#2a3550] py-2"><span className="text-xs text-gray-500">{label}</span><div className="text-right text-sm font-medium text-white">{children || value || "No indicado"}</div></div>; }
export function OrderPaginationButton({ icon, label, active = false }) { return <button type="button" className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${active ? "bg-[#C9A227] text-white" : "text-gray-500 hover:bg-[#C9A227]/15 hover:text-white"}`}>{icon || label}</button>; }
export function OrderStatusBadge({ status, label, config }) { const selected = config[status] || config.pendiente; return <span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${selected.bg} ${selected.text} ${selected.border}`}>{label || status}</span>; }
