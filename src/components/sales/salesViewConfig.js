import { formatDateShortCR, formatDateTimeCR } from "../../utils/dateUtils.js";

export const SALES_STATUS_CONFIG = {
  pendiente: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  en_proceso: { bg: "bg-[#C9A227]/10", text: "text-[#C9A227]", border: "border-[#C9A227]/20" },
  pausada: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  finalizada: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  cancelada: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
};

export const SALES_PAYMENT_CONFIG = {
  pagado: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
};

export function formatSalesCurrency(amount) {
  return `₡${(Number(amount) || 0).toLocaleString("es-CR", { maximumFractionDigits: 0 })}`;
}

export function formatSalesDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin fecha" : formatDateTimeCR(date) || "Sin fecha";
}

export function buildDailySalesData(sales) {
  const totalsByDay = sales.reduce((totals, sale) => {
    const date = sale.saleDate ? new Date(sale.saleDate) : null;
    if (!date || Number.isNaN(date.getTime())) return totals;
    const label = formatDateShortCR(date);
    totals[label] = (totals[label] || 0) + sale.total;
    return totals;
  }, {});
  return Object.entries(totalsByDay).map(([name, value]) => ({ name, value })).slice(-16);
}
