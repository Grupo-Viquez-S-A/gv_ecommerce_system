import { supabase } from "./primarySupabaseClient";

const APPLICATION_AUDIENCES = {
  saas: ["saas", "both"],
  ecommerce: ["ecommerce", "both"],
};

function getAudiences(application) {
  return APPLICATION_AUDIENCES[application] || ["both"];
}

async function requireCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user?.id) {
    throw new Error("No hay una sesión activa para cargar notificaciones.");
  }

  return user.id;
}

export function notificationBelongsToApplication(notification, application) {
  return getAudiences(application).includes(
    notification?.audience_application,
  );
}

export async function loadNotifications(application, limit = 40) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      "notification_id, user_id, event_type, title, message, entity_type, entity_id, source_application, audience_application, target_path_saas, target_path_ecommerce, metadata, read_at, created_at",
    )
    .eq("user_id", userId)
    .in("audience_application", getAudiences(application))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return {
    userId,
    notifications: data || [],
  };
}

export async function markNotificationRead(notificationId, userId) {
  const resolvedUserId = userId || (await requireCurrentUserId());
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: readAt })
    .eq("notification_id", notificationId)
    .eq("user_id", resolvedUserId);

  if (error) throw error;
  return readAt;
}

export async function markAllNotificationsRead(application, userId) {
  const resolvedUserId = userId || (await requireCurrentUserId());
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: readAt })
    .eq("user_id", resolvedUserId)
    .is("read_at", null)
    .in("audience_application", getAudiences(application));

  if (error) throw error;
  return readAt;
}

export function subscribeToNotifications({
  application,
  userId,
  onInsert,
  onUpdate,
}) {
  const channel = supabase
    .channel(`user-notifications:${application}:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "user_notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (notificationBelongsToApplication(payload.new, application)) {
          onInsert?.(payload.new);
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "user_notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (notificationBelongsToApplication(payload.new, application)) {
          onUpdate?.(payload.new);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

