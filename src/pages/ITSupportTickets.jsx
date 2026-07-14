import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import { EMPTY_TICKET_FORM } from "../constants/tickets.constants.js";
import {
  createTicket,
  getTicketCategories,
  getUserTickets,
  subscribeToSupport,
} from "../services/ticketService.js";

import TicketConversation from "../components/tickets/TicketConversation.jsx";
import TicketRequestForm from "../components/tickets/TicketRequestForm.jsx";
import TicketsList from "../components/tickets/TicketsList.jsx";
import TicketsPageHeader from "../components/tickets/TicketsPageHeader.jsx";
import TicketSummary from "../components/tickets/TicketSummary.jsx";

export default function ITSupportTickets() {
  const { user, session } = useAuth();
  const { currentCompany } = useOutletContext() || {};
  const requesterId = user?.id || user?.userId || session?.user?.id || null;
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState(EMPTY_TICKET_FORM);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadTickets = useCallback(async () => {
    if (!requesterId) return;
    try {
      const nextTickets = await getUserTickets(requesterId, { all: false });
      setTickets(nextTickets);
      setSelectedTicket((current) =>
        current ? nextTickets.find((ticket) => ticket.id === current.id) || current : null,
      );
      setLoadError("");
    } catch (error) {
      console.error("Support tickets load error:", error);
      setLoadError("No fue posible cargar los tickets desde Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, [requesterId]);

  useEffect(() => {
    let active = true;
    getTicketCategories()
      .then((availableCategories) => {
        if (active) setCategories(availableCategories);
      })
      .catch((error) => {
        console.error("Ticket categories load error:", error);
        if (active) setLoadError("No fue posible cargar las categorías de soporte.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!requesterId) {
      const unauthenticatedState = window.setTimeout(() => {
        setLoadError("Debes iniciar sesión para consultar y crear tickets.");
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(unauthenticatedState);
    }
    const initialLoad = window.setTimeout(loadTickets, 0);
    const unsubscribe = subscribeToSupport(loadTickets);
    return () => {
      window.clearTimeout(initialLoad);
      unsubscribe();
    };
  }, [loadTickets, requesterId]);

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

    const companyId = currentCompany?.id || user?.activeCompany?.id || null;
    if (!requesterId || !companyId) {
      setFormError("No se encontró un usuario autenticado o una empresa activa.");
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
        companyId,
        requesterId,
        originApplication: "ecommerce",
      });
      setForm(EMPTY_TICKET_FORM);
      setAttachments([]);
      setAttachmentError("");
      setSuccessMessage(`Solicitud ${newTicket.ticketNumber || ""} creada correctamente.`);
      await loadTickets();
      setSelectedTicket(newTicket);
    } catch (error) {
      console.error("IT ticket creation error:", error);
      setFormError(error?.message || "No fue posible guardar la solicitud.");
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
      {loadError && <div role="alert" className="mb-5 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{loadError}</div>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <TicketRequestForm
          form={form}
          categories={categories}
          attachments={attachments}
          attachmentError={attachmentError}
          error={formError}
          isSubmitting={isSubmitting}
          isLoadingCategories={isLoading && categories.length === 0}
          onAttachmentsChange={setAttachments}
          onAttachmentError={setAttachmentError}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
        <TicketsList
          tickets={filteredTickets}
          search={search}
          statusFilter={statusFilter}
          isLoading={isLoading}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          onSelect={setSelectedTicket}
        />
      </div>

      {selectedTicket && (
        <TicketConversation
          ticket={selectedTicket}
          currentUserId={requesterId}
          onClose={() => setSelectedTicket(null)}
          onChanged={loadTickets}
        />
      )}
    </div>
  );
}
