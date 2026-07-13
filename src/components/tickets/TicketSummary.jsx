import { RiCheckboxCircleLine, RiTicket2Line, RiTimeLine } from "react-icons/ri";
import { TICKET_STATUS } from "../../constants/tickets.constants.js";

export default function TicketSummary({ tickets }) {
  const cards = [
    { label: "Solicitudes", value: tickets.length, icon: RiTicket2Line, color: "text-[#C9A227]" },
    { label: "Pendientes", value: tickets.filter((ticket) => !TICKET_STATUS[ticket.status]?.isClosed && ticket.status !== "resolved").length, icon: RiTimeLine, color: "text-amber-300" },
    { label: "Finalizadas", value: tickets.filter((ticket) => TICKET_STATUS[ticket.status]?.isClosed || ticket.status === "resolved").length, icon: RiCheckboxCircleLine, color: "text-emerald-300" },
  ];

  return (
    <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen de tickets">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <article key={label} className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            </div>
            <div className={`rounded-lg bg-[#0B1120] p-2.5 ${color}`}><Icon size={21} /></div>
          </div>
        </article>
      ))}
    </section>
  );
}
