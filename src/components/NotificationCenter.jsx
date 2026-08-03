import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Factory,
  FileText,
  LoaderCircle,
  RefreshCcw,
  WalletCards,
} from "lucide-react";

import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "../services/notificationService";

const EVENT_ICONS = {
  "quotation.created": FileText,
  "quotation.approved": ClipboardCheck,
  "production_order.created": Factory,
  "production_order.status_changed": RefreshCcw,
  "production_order.payment_status_changed": WalletCards,
};

function formatRelativeTime(value) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Ahora";
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} d`;

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getTargetPath(notification, application) {
  return application === "saas"
    ? notification.target_path_saas
    : notification.target_path_ecommerce;
}

export default function NotificationCenter({
  application,
  userId: providedUserId,
  className = "",
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [userId, setUserId] = useState(providedUserId || null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const initialize = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await loadNotifications(application);
        if (!active) return;

        setUserId(result.userId);
        setNotifications(result.notifications);

        unsubscribe = subscribeToNotifications({
          application,
          userId: result.userId,
          onInsert: (notification) => {
            setNotifications((current) => {
              if (
                current.some(
                  (item) =>
                    item.notification_id === notification.notification_id,
                )
              ) {
                return current;
              }

              return [notification, ...current].slice(0, 40);
            });
          },
          onUpdate: (notification) => {
            setNotifications((current) =>
              current.map((item) =>
                item.notification_id === notification.notification_id
                  ? notification
                  : item,
              ),
            );
          },
        });
      } catch (loadError) {
        if (active) {
          console.error("No fue posible cargar las notificaciones:", loadError);
          setError("No fue posible cargar las notificaciones.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (providedUserId !== null) {
      initialize();
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [application, providedUserId]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );

  const visibleNotifications = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((notification) => !notification.read_at)
        : notifications,
    [filter, notifications],
  );

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      try {
        const readAt = await markNotificationRead(
          notification.notification_id,
          userId,
        );
        setNotifications((current) =>
          current.map((item) =>
            item.notification_id === notification.notification_id
              ? { ...item, read_at: readAt }
              : item,
          ),
        );
      } catch (readError) {
        console.error("No fue posible marcar la notificación:", readError);
      }
    }

    const targetPath = getTargetPath(notification, application);
    if (targetPath) {
      setOpen(false);
      navigate(targetPath);
    }
  };

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;

    try {
      const readAt = await markAllNotificationsRead(application, userId);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at || readAt,
        })),
      );
    } catch (readError) {
      console.error("No fue posible marcar las notificaciones:", readError);
      setError("No fue posible actualizar las notificaciones.");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9A72A]/30 bg-[#071A3B] text-[#D9A72A] shadow-lg transition hover:border-[#D9A72A]/60 hover:bg-[#0B2548] focus:outline-none focus:ring-2 focus:ring-[#D9A72A]/40"
        aria-label={`Notificaciones: ${unreadCount} sin leer`}
        aria-expanded={open}
        title="Notificaciones"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#071A3B] bg-[#E5484D] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          className="absolute right-0 top-full z-[100] mt-2 flex max-h-[min(620px,calc(100vh-90px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#071A3B] text-white shadow-[0_24px_70px_rgba(2,13,33,0.45)]"
          aria-label="Centro de notificaciones"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[#294263] px-4 py-4">
            <div>
              <h2 className="text-sm font-bold">Notificaciones</h2>
              <p className="mt-0.5 text-[11px] text-[#8BA4C8]">
                {unreadCount
                  ? `${unreadCount} pendiente${unreadCount === 1 ? "" : "s"} de leer`
                  : "Todo está al día"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!unreadCount}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[#D9A72A] transition hover:bg-[#D9A72A]/10 disabled:cursor-default disabled:opacity-40"
            >
              <CheckCheck size={15} />
              Marcar todas
            </button>
          </header>

          <div className="flex gap-2 border-b border-[#294263] px-4 py-2.5">
            {[
              ["all", "Todas"],
              ["unread", "Sin leer"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  filter === value
                    ? "bg-[#D9A72A] text-[#07162F]"
                    : "text-[#8BA4C8] hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="custom-sidebar-scroll min-h-0 flex-1 overflow-y-auto">
            {loading && (
              <div className="flex min-h-44 items-center justify-center">
                <LoaderCircle
                  size={24}
                  className="animate-spin text-[#D9A72A]"
                />
              </div>
            )}

            {!loading && error && (
              <p className="px-6 py-12 text-center text-sm text-[#FF9999]">
                {error}
              </p>
            )}

            {!loading && !error && visibleNotifications.length === 0 && (
              <div className="px-6 py-14 text-center">
                <Bell size={25} className="mx-auto text-[#617DAB]" />
                <p className="mt-3 text-sm font-semibold text-white">
                  No hay notificaciones
                </p>
                <p className="mt-1 text-xs text-[#8BA4C8]">
                  Los nuevos eventos aparecerán aquí en tiempo real.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              visibleNotifications.map((notification) => {
                const Icon = EVENT_ICONS[notification.event_type] || Bell;
                const unread = !notification.read_at;

                return (
                  <button
                    key={notification.notification_id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full gap-3 border-b border-[#20395D] px-4 py-4 text-left transition last:border-b-0 hover:bg-[#0B2548] ${
                      unread ? "bg-[#D9A72A]/[0.06]" : "bg-transparent"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                        unread
                          ? "border-[#D9A72A]/30 bg-[#D9A72A]/10 text-[#D9A72A]"
                          : "border-[#294263] bg-[#0B1A33] text-[#8BA4C8]"
                      }`}
                    >
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span
                          className={`min-w-0 flex-1 text-xs font-semibold leading-5 ${
                            unread ? "text-white" : "text-[#C9D7EC]"
                          }`}
                        >
                          {notification.title}
                        </span>
                        {unread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D9A72A]" />
                        )}
                      </span>

                      <span className="mt-1 block text-[11px] leading-4 text-[#8BA4C8]">
                        {notification.message}
                      </span>

                      <span className="mt-2 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#617DAB]">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
