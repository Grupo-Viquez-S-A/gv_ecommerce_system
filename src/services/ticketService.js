import { CATEGORY_DEFAULT_PRIORITY } from "../constants/tickets.constants.js";

const STORAGE_KEY = "gv_it_support_tickets_v2";
const SLA_MINUTES = {
  low: { response: 480, resolution: 4320 },
  normal: { response: 240, resolution: 1440 },
  high: { response: 60, resolution: 480 },
  critical: { response: 15, resolution: 120 },
};

function readStoredTickets() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeStoredTickets(tickets) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function buildTicketCode() {
  const year = new Date().getFullYear();
  const sequence = String(Date.now()).slice(-6);
  return `TKT-${year}-${sequence}`;
}

export async function getUserTickets(userId) {
  return readStoredTickets()
    .filter((ticket) => ticket.requesterId === userId)
    .sort((firstTicket, secondTicket) =>
      secondTicket.createdAt.localeCompare(firstTicket.createdAt),
    );
}

export async function createTicket(ticketData) {
  const now = new Date().toISOString();
  const ticketId = crypto.randomUUID();
  const { attachments = [], ...ticketFields } = ticketData;
  const priority = CATEGORY_DEFAULT_PRIORITY[ticketData.category] || "normal";
  const sla = SLA_MINUTES[priority];
  const attachmentRecords = attachments.map((file) => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    return {
      id: crypto.randomUUID(),
      bucketName: "Ecommerce",
      folderName: "tickets",
      objectPath: `tickets/${ticketId}/${crypto.randomUUID()}-${safeFileName}`,
      fileName: file.name,
      mimeType: file.type || null,
      fileSize: file.size,
      isInternal: false,
      isValid: true,
    };
  });
  const ticket = {
    id: ticketId,
    ticketNumber: buildTicketCode(),
    status: "new",
    priority,
    source: "web",
    responseDueAt: new Date(Date.now() + sla.response * 60_000).toISOString(),
    resolutionDueAt: new Date(Date.now() + sla.resolution * 60_000).toISOString(),
    createdAt: now,
    updatedAt: now,
    ...ticketFields,
    attachments: attachmentRecords,
  };

  const tickets = readStoredTickets();
  writeStoredTickets([ticket, ...tickets]);
  return ticket;
}
