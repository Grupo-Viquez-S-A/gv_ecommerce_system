import { supabase } from "./primarySupabaseClient.js";

const TICKET_BUCKET = "System_Files";
const TICKET_FOLDER = "tickets";
const TICKET_SELECT = `
  ticket_id,
  ticket_number,
  company_id,
  requester_user_id,
  category_id,
  status,
  priority,
  title,
  description,
  source,
  impact,
  urgency,
  assigned_to_user_id,
  response_due_at,
  resolution_due_at,
  created_at,
  updated_at,
  category:it_ticket_categories!it_tickets_category_fkey(
    category_code,
    category_name
  ),
  assigned_to:profiles!it_tickets_assigned_to_fkey(
    name,
    surname
  ),
  attachments:it_ticket_attachments(
    attachment_id,
    bucket_name,
    object_path,
    file_name,
    mime_type,
    file_size,
    created_at
  )
`;

function unwrapRelation(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function mapAttachment(row) {
  return {
    id: row.attachment_id,
    bucketName: row.bucket_name,
    objectPath: row.object_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  };
}

function mapTicket(row) {
  const category = unwrapRelation(row.category);
  const assignedTo = unwrapRelation(row.assigned_to);
  return {
    id: row.ticket_id,
    ticketNumber: row.ticket_number,
    companyId: row.company_id,
    requesterId: row.requester_user_id,
    categoryId: row.category_id,
    category: category?.category_code || "other",
    categoryName: category?.category_name || "Otro",
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    source: row.source,
    impact: row.impact,
    urgency: row.urgency,
    assignedToId: row.assigned_to_user_id,
    assignedToName: assignedTo
      ? [assignedTo.name, assignedTo.surname].filter(Boolean).join(" ")
      : "",
    responseDueAt: row.response_due_at,
    resolutionDueAt: row.resolution_due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: (row.attachments || []).map(mapAttachment),
  };
}

function safeFileName(fileName) {
  return String(fileName || "archivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

function createObjectPath(ticketId, fileName) {
  return `${TICKET_FOLDER}/${ticketId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

async function rollbackTicket(ticketId, uploadedPaths) {
  if (uploadedPaths.length > 0) {
    await supabase.storage.from(TICKET_BUCKET).remove(uploadedPaths);
  }
  await supabase.from("it_tickets").delete().eq("ticket_id", ticketId);
}

export async function getTicketCategories() {
  const { data, error } = await supabase
    .from("it_ticket_categories")
    .select("category_id, category_code, category_name, description, default_priority")
    .eq("is_active", true)
    .order("category_name", { ascending: true });

  if (error) throw error;
  return (data || []).map((category) => ({
    id: category.category_id,
    value: category.category_code,
    label: category.category_name,
    description: category.description,
    defaultPriority: category.default_priority,
  }));
}

export async function getUserTickets(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("it_tickets")
    .select(TICKET_SELECT)
    .eq("requester_user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapTicket);
}

export async function createTicket(ticketData) {
  const {
    attachments = [],
    category,
    companyId,
    requesterId,
    title,
    description,
    impact,
    urgency,
  } = ticketData;

  if (!requesterId) throw new Error("Debes iniciar sesión para crear un ticket.");
  if (!companyId) throw new Error("Selecciona una empresa antes de crear el ticket.");

  const { data: categoryRow, error: categoryError } = await supabase
    .from("it_ticket_categories")
    .select("category_id")
    .eq("category_code", category)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError) throw categoryError;
  if (!categoryRow) throw new Error("La categoría seleccionada ya no está disponible.");

  const ticketId = crypto.randomUUID();
  const { error: ticketError } = await supabase
    .from("it_tickets")
    .insert({
      ticket_id: ticketId,
      company_id: companyId,
      category_id: categoryRow.category_id,
      title,
      description,
      source: "web",
      impact,
      urgency,
    });

  if (ticketError) {
    throw new Error(`No se pudo crear el ticket: ${ticketError.message}`);
  }

  const uploadedPaths = [];
  try {
    for (const file of attachments) {
      const objectPath = createObjectPath(ticketId, file.name);
      const { error: uploadError } = await supabase.storage
        .from(TICKET_BUCKET)
        .upload(objectPath, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`No se pudo subir ${file.name}: ${uploadError.message}`);
      }
      uploadedPaths.push(objectPath);

      const { error: attachmentError } = await supabase
        .from("it_ticket_attachments")
        .insert({
          ticket_id: ticketId,
          bucket_name: TICKET_BUCKET,
          folder_name: TICKET_FOLDER,
          object_path: objectPath,
          file_name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          uploaded_by: requesterId,
          is_internal: false,
          is_valid: true,
        });

      if (attachmentError) {
        throw new Error(
          `El archivo ${file.name} se subió, pero no se pudo registrar: ${attachmentError.message}`,
        );
      }
    }

    const { data: completedTicket, error: fetchError } = await supabase
      .from("it_tickets")
      .select(TICKET_SELECT)
      .eq("ticket_id", ticketId)
      .single();

    if (fetchError) throw fetchError;
    return mapTicket(completedTicket);
  } catch (error) {
    await rollbackTicket(ticketId, uploadedPaths);
    throw error;
  }
}
