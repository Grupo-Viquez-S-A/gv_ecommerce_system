import { RiFileLine, RiTimeLine, RiUserLine } from "react-icons/ri";

import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUS } from "../../constants/tickets.constants.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TicketCard({ ticket }) {
  const status = TICKET_STATUS[ticket.status] || TICKET_STATUS.new;
  const category = ticket.categoryName || TICKET_CATEGORIES.find((item) => item.value === ticket.category)?.label || "Otro";
  const priority = TICKET_PRIORITIES.find((item) => item.value === ticket.priority)?.label || "Media";

  return (
    <article className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4 transition-colors hover:border-[#3a4868]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#C9A227]">{ticket.ticketNumber}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <h3 className="mt-2 break-words text-base font-semibold text-white">{ticket.title}</h3>
        </div>
        <span className="shrink-0 rounded-md bg-[#202c43] px-2.5 py-1 text-xs text-gray-300">Prioridad {priority}</span>
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-gray-400">{ticket.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#2a3550] pt-3 text-xs text-gray-500">
        <span>{category}</span>
        <span>Impacto {ticket.impact === "high" ? "alto" : ticket.impact === "low" ? "bajo" : "medio"}</span>
        <span>Urgencia {ticket.urgency === "high" ? "alta" : ticket.urgency === "low" ? "baja" : "media"}</span>
        {ticket.assignedToName && <span className="inline-flex items-center gap-1"><RiUserLine />{ticket.assignedToName}</span>}
        {ticket.attachments?.length > 0 && (
          <span className="inline-flex items-center gap-1"><RiFileLine />{ticket.attachments.length} archivo{ticket.attachments.length === 1 ? "" : "s"}</span>
        )}
        {ticket.responseDueAt && !status.isClosed && ticket.status !== "resolved" && (
          <span className="inline-flex items-center gap-1 text-amber-300/80"><RiTimeLine />Respuesta antes de {formatDate(ticket.responseDueAt)}</span>
        )}
        <span className="sm:ml-auto">{formatDate(ticket.createdAt)}</span>
      </div>
    </article>
  );
}
