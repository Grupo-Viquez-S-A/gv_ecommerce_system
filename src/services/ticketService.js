import { supabase } from "./primarySupabaseClient.js";

const SUPPORT_BUCKET = "System_Files";
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

function assertNoError(error) {
  if (error) throw error;
}
function safeFileName(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function addSignedUrls(items) {
  return Promise.all((items || []).map(async (item) => {
    if (!item?.objectPath) return item;
    const { data } = await supabase.storage
      .from(SUPPORT_BUCKET)
      .createSignedUrl(item.objectPath, 3600);
    return { ...item, url: data?.signedUrl || null };
  }));
}

async function uploadAttachments(ticketId, commentId, files, isInternal = false) {
  const uploaded = [];

  for (const file of files || []) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`El archivo ${file.name} supera el límite de 50 MB.`);
    }

    const objectPath = `tickets/${ticketId}/${commentId || "opening"}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const uploadResponse = await supabase.storage
      .from(SUPPORT_BUCKET)
      .upload(objectPath, file, { upsert: false, contentType: file.type || undefined });

    assertNoError(uploadResponse.error);

    const attachmentResponse = await supabase
      .from("it_ticket_attachments")
      .insert({
        ticket_id: ticketId,
        comment_id: commentId || null,
        bucket_name: SUPPORT_BUCKET,
        folder_name: "tickets",
        object_path: objectPath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        is_internal: isInternal,
      })
      .select("attachment_id")
      .single();

    if (attachmentResponse.error) {
      await supabase.storage.from(SUPPORT_BUCKET).remove([objectPath]);
      throw attachmentResponse.error;
    }

    uploaded.push(attachmentResponse.data);
  }

  return uploaded;
}

export async function isCurrentUserITAgent() {
  const { data, error } = await supabase.rpc("support_is_it_agent");
  assertNoError(error);
  return Boolean(data);
}

export async function getTicketCategories() {
  const { data, error } = await supabase
    .from("it_ticket_categories")
    .select("category_id, category_code, category_name, description, default_priority")
    .eq("is_active", true)
    .order("category_name", { ascending: true });
  assertNoError(error);
  return (data || []).map((category) => ({
    id: category.category_id,
    value: category.category_code,
    label: category.category_name,
    description: category.description,
    defaultPriority: category.default_priority,
  }));
}

export async function getUserTickets(_userId, options = {}) {
  const { data, error } = await supabase.rpc("support_list_tickets", {
    p_all: Boolean(options.all),
  });
  assertNoError(error);
  return Promise.all((data || []).map(async (ticket) => ({
    ...ticket,
    openingAttachments: await addSignedUrls(ticket.openingAttachments),
  })));
}

export async function createTicket(ticketData) {
  const { attachments = [], ...ticket } = ticketData;
  const { data: ticketId, error } = await supabase.rpc("support_create_ticket", {
    p_category_code: ticket.category,
    p_title: ticket.title,
    p_description: ticket.description,
    p_impact: ticket.impact,
    p_urgency: ticket.urgency,
    p_origin_application: ticket.originApplication || "ecommerce",
    p_company_id: ticket.companyId || null,
  });
  assertNoError(error);

  await uploadAttachments(ticketId, null, attachments, false);
  const tickets = await getUserTickets(ticket.requesterId, { all: false });
  return tickets.find((item) => item.id === ticketId) || { id: ticketId, ...ticket };
}

export async function getTicketMessages(ticketId) {
  const { data, error } = await supabase.rpc("support_list_messages", {
    p_ticket_id: ticketId,
  });
  assertNoError(error);

  return Promise.all((data || []).map(async (message) => ({
    ...message,
    attachments: await addSignedUrls(message.attachments),
  })));
}

export async function sendTicketMessage(ticketId, body, options = {}) {
  const { data: commentId, error } = await supabase.rpc("support_add_message", {
    p_ticket_id: ticketId,
    p_body: body,
    p_is_internal: Boolean(options.isInternal),
  });
  assertNoError(error);

  await uploadAttachments(
    ticketId,
    commentId,
    options.attachments || [],
    Boolean(options.isInternal),
  );
  return commentId;
}

export async function updateTicket(ticketId, changes = {}) {
  const { error } = await supabase.rpc("support_update_ticket", {
    p_ticket_id: ticketId,
    p_status: changes.status || null,
    p_assign_to_self: Boolean(changes.assignToSelf),
  });
  assertNoError(error);
}

export async function markTicketRead(ticketId) {
  const { error } = await supabase.rpc("support_mark_read", {
    p_ticket_id: ticketId,
  });
  assertNoError(error);
}

export function subscribeToSupport(callback, ticketId = null) {
  const suffix = ticketId || "all";
  const channel = supabase.channel(`it-support-${suffix}-${crypto.randomUUID()}`);

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "it_ticket_comments",
      ...(ticketId ? { filter: `ticket_id=eq.${ticketId}` } : {}),
    },
    callback,
  );

  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "it_tickets",
      ...(ticketId ? { filter: `ticket_id=eq.${ticketId}` } : {}),
    },
    callback,
  );

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
