import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  LoaderCircle,
  Paperclip,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { TICKET_STATUS } from "../../constants/tickets.constants.js";
import {
  getTicketMessages,
  markTicketRead,
  sendTicketMessage,
  subscribeToSupport,
  updateTicket,
} from "../../services/ticketService.js";

const STATUS_OPTIONS = Object.entries(TICKET_STATUS);

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSize(size) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketConversation({
  ticket,
  currentUserId,
  isAgent = false,
  onClose,
  onChanged,
}) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const nextMessages = await getTicketMessages(ticket.id);
      setMessages(nextMessages);
      await markTicketRead(ticket.id);
      setError("");
    } catch (loadError) {
      console.error("Support chat load error:", loadError);
      setError("No fue posible cargar la conversación.");
    } finally {
      setLoading(false);
    }
  }, [ticket.id]);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadMessages, 0);
    const unsubscribe = subscribeToSupport(() => {
      loadMessages();
      onChanged?.();
    }, ticket.id);
    return () => {
      window.clearTimeout(initialLoad);
      unsubscribe();
    };
  }, [loadMessages, onChanged, ticket.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!body.trim() || sending) return;

    try {
      setSending(true);
      setError("");
      await sendTicketMessage(ticket.id, body.trim(), {
        isInternal: isAgent && isInternal,
        attachments: files,
      });
      setBody("");
      setFiles([]);
      setIsInternal(false);
      await loadMessages();
      await onChanged?.();
    } catch (sendError) {
      console.error("Support chat send error:", sendError);
      setError("No fue posible enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    try {
      setUpdating(true);
      await updateTicket(ticket.id, { status });
      await onChanged?.();
    } catch (updateError) {
      console.error("Ticket status update error:", updateError);
      setError("No fue posible actualizar el estado.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    try {
      setUpdating(true);
      await updateTicket(ticket.id, { assignToSelf: true });
      await onChanged?.();
    } catch (updateError) {
      console.error("Ticket assignment error:", updateError);
      setError("No fue posible asignar el ticket.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <section className="flex h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[#33405D] bg-[#07142A] shadow-2xl sm:h-[88vh] sm:rounded-2xl">
        <header className="border-b border-[#263A5D] bg-[#0B1A33] px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#D9A72A]">
                  {ticket.ticketNumber}
                </span>
                <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-200">
                  {TICKET_STATUS[ticket.status]?.label || ticket.status}
                </span>
                {ticket.originApplication && (
                  <span className="rounded-full bg-[#13233E] px-2 py-0.5 text-[11px] text-[#8BA4C8]">
                    {ticket.originApplication === "ecommerce" ? "E-commerce" : "SaaS"}
                  </span>
                )}
              </div>
              <h2 className="mt-2 truncate text-lg font-bold text-white">{ticket.title}</h2>
              {isAgent && (
                <p className="mt-1 text-xs text-[#8BA4C8]">
                  {ticket.requesterName || "Solicitante"} · {ticket.companyName || "Empresa"}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#8BA4C8] hover:bg-white/5 hover:text-white" aria-label="Cerrar conversación">
              <X size={20} />
            </button>
          </div>

          {isAgent && (
            <div className="mt-4 flex flex-col gap-2 border-t border-[#263A5D] pt-3 sm:flex-row">
              <select
                value={ticket.status}
                disabled={updating}
                onChange={(event) => handleStatus(event.target.value)}
                className="rounded-lg border border-[#33405D] bg-[#13233E] px-3 py-2 text-xs text-white outline-none focus:border-[#D9A72A]"
              >
                {STATUS_OPTIONS.map(([value, item]) => (
                  <option key={value} value={value}>{item.label}</option>
                ))}
              </select>
              <button type="button" disabled={updating} onClick={handleAssign} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D9A72A]/40 bg-[#D9A72A]/10 px-3 py-2 text-xs font-semibold text-[#F3C94D] hover:bg-[#D9A72A]/20 disabled:opacity-50">
                <UserRound size={15} />
                {ticket.assignedToId === currentUserId ? "Asignado a mí" : "Asignarme ticket"}
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <article className="mb-5 rounded-xl border border-[#33405D] bg-[#0B1A33] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D9A72A]">
              <UserRound size={15} /> Mensaje inicial
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#C4D2E8]">{ticket.description}</p>
            {ticket.openingAttachments?.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {ticket.openingAttachments.map((attachment) => (
                  <a key={attachment.id} href={attachment.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs text-sky-200 hover:bg-black/25">
                    <FileText size={15} />
                    <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
                    <span className="text-[#7188AF]">{formatSize(attachment.fileSize)}</span>
                  </a>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-[#7188AF]">{formatDate(ticket.createdAt)}</p>
          </article>

          {loading ? (
            <div className="flex justify-center py-10 text-[#8BA4C8]"><LoaderCircle className="animate-spin" /></div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#7188AF]">
              Aún no hay respuestas. Escribe el primer mensaje de la conversación.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const ownMessage = message.authorId === currentUserId;
                return (
                  <article
                    key={message.id}
                    className={`max-w-[88%] rounded-xl border px-4 py-3 ${
                      message.isInternal
                        ? "ml-auto border-amber-400/30 bg-amber-500/10"
                        : ownMessage
                          ? "ml-auto border-[#D9A72A]/30 bg-[#D9A72A]/10"
                          : "mr-auto border-[#33405D] bg-[#0B1A33]"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[#9FB4D4]">
                      {message.isInternal && <ShieldCheck size={14} className="text-amber-300" />}
                      {message.isInternal ? "Nota interna · " : ""}{message.authorName}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white">{message.body}</p>
                    {message.attachments?.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {message.attachments.map((attachment) => (
                          <a key={attachment.id} href={attachment.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs text-sky-200 hover:bg-black/25">
                            <FileText size={15} />
                            <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
                            <span className="text-[#7188AF]">{formatSize(attachment.fileSize)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-right text-[10px] text-[#7188AF]">{formatDate(message.createdAt)}</p>
                  </article>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-[#263A5D] bg-[#0B1A33] p-4 sm:px-6">
          {error && <p className="mb-2 text-xs text-red-300">{error}</p>}
          {isAgent && (
            <label className="mb-2 inline-flex items-center gap-2 text-xs text-[#9FB4D4]">
              <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} className="accent-[#D9A72A]" />
              Nota interna (solo visible para Informática)
            </label>
          )}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`} className="rounded-full bg-[#13233E] px-3 py-1 text-[11px] text-[#B9C9E4]">
                  {file.name}
                </span>
              ))}
              <button type="button" onClick={() => setFiles([])} className="text-[11px] text-red-300">Quitar archivos</button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="cursor-pointer rounded-lg border border-[#33405D] p-3 text-[#8BA4C8] hover:border-[#D9A72A]/60 hover:text-[#D9A72A]" title="Adjuntar archivos">
              <Paperclip size={18} />
              <input type="file" multiple className="sr-only" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 5))} />
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={2}
              maxLength={3000}
              placeholder={isInternal ? "Escribe una nota interna..." : "Escribe un mensaje..."}
              className="min-h-[46px] flex-1 resize-none rounded-lg border border-[#33405D] bg-[#13233E] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#60789F] focus:border-[#D9A72A]"
            />
            <button type="submit" disabled={sending || !body.trim()} className="inline-flex h-[46px] items-center justify-center rounded-lg bg-[#D9A72A] px-4 text-[#020D21] hover:bg-[#E5B936] disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensaje">
              {sending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


