import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import { EMPTY_TICKET_FORM } from "../constants/tickets.constants.js";
import { createTicket, getUserTickets } from "../services/ticketService.js";

import TicketRequestForm from "../components/tickets/TicketRequestForm.jsx";
import TicketsList from "../components/tickets/TicketsList.jsx";
import TicketsPageHeader from "../components/tickets/TicketsPageHeader.jsx";
import TicketSummary from "../components/tickets/TicketSummary.jsx";

export default function ITSupportTickets() {
  const { user, session } = useAuth();
  const { currentCompany } = useOutletContext() || {};
  const requesterId = user?.id || user?.userId || session?.user?.id || "anonymous";
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(EMPTY_TICKET_FORM);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getUserTickets(requesterId).then((storedTickets) => {
      if (isMounted) setTickets(storedTickets);
    });
    return () => { isMounted = false; };
  }, [requesterId]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesSearch = !normalizedSearch || `${ticket.ticketNumber} ${ticket.title} ${ticket.description}`.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tickets]);

  const handleFormChange = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const description = form.description.trim();
    if (!form.category || !form.title.trim() || description.length < 15) {
      setFormError("Completa la categoría, el asunto y una descripción de al menos 15 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      const newTicket = await createTicket({
        ...form,
        attachments,
        title: form.title.trim(),
        description,
        companyId: currentCompany?.id || user?.activeCompany?.id || null,
        requesterId,
        requesterName: user?.fullName || session?.user?.email || "Usuario",
        requesterEmail: user?.email || session?.user?.email || "",
      });
      setTickets((currentTickets) => [newTicket, ...currentTickets]);
      setForm(EMPTY_TICKET_FORM);
      setAttachments([]);
      setAttachmentError("");
      setSuccessMessage(`Solicitud ${newTicket.ticketNumber} creada correctamente.`);
    } catch (error) {
      console.error("IT ticket creation error:", error);
      setFormError("No fue posible guardar la solicitud. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <TicketsPageHeader
        requesterName={user?.fullName || session?.user?.email}
        companyName={currentCompany?.name || user?.activeCompany?.name}
      />
      <TicketSummary tickets={tickets} />

      {successMessage && <div role="status" className="mb-5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{successMessage}</div>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <TicketRequestForm
          form={form}
          attachments={attachments}
          attachmentError={attachmentError}
          error={formError}
          isSubmitting={isSubmitting}
          onAttachmentsChange={setAttachments}
          onAttachmentError={setAttachmentError}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
        <TicketsList tickets={filteredTickets} search={search} statusFilter={statusFilter} onSearchChange={setSearch} onStatusChange={setStatusFilter} />
      </div>
    </div>
  );
}
