const STATUS_STYLES = {
  pending: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  pendiente: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  review: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  revision: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  approved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  aprobada: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  accepted: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/25 bg-red-500/10 text-red-300",
  rechazada: "border-red-500/25 bg-red-500/10 text-red-300",
  declined: "border-red-500/25 bg-red-500/10 text-red-300",
  cancelled: "border-red-500/25 bg-red-500/10 text-red-300",
  cancelado: "border-red-500/25 bg-red-500/10 text-red-300",
  expired: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  vencida: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  converted: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  convertida: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  process: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  processing: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  "en proceso": "border-blue-500/25 bg-blue-500/10 text-blue-300",
  progress: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  finalizado: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  entregado: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  paid: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  pagado: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  partial: "border-orange-500/25 bg-orange-500/10 text-orange-300",
  parcial: "border-orange-500/25 bg-orange-500/10 text-orange-300",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  review: "En revision",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
  converted: "Convertida",
  process: "En proceso",
  processing: "En proceso",
  progress: "En proceso",
  completed: "Finalizado",
  paid: "Pagado",
  partial: "Pago parcial",
};

function normalizeStatus(status) {
  return String(status || "pending").trim().toLowerCase();
}

function getStatusLabel(status) {
  const normalizedStatus = normalizeStatus(status);

  return STATUS_LABELS[normalizedStatus] || String(status || "Pendiente").trim();
}

export default function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);
  const className = STATUS_STYLES[normalizedStatus] || "border-gray-500/25 bg-gray-500/10 text-gray-300";

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
}

