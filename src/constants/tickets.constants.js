export const TICKET_CATEGORIES = [
  { value: "access", label: "Accesos y contraseñas" },
  { value: "permissions", label: "Permisos y roles" },
  { value: "email", label: "Correo corporativo" },
  { value: "functional_error", label: "Error funcional" },
  { value: "data", label: "Datos e información" },
  { value: "device", label: "Equipo o dispositivo" },
  { value: "security", label: "Seguridad" },
  { value: "improvement", label: "Mejora o solicitud" },
  { value: "other", label: "Otro" },
];

export const TICKET_PRIORITIES = [
  { value: "low", label: "Baja", description: "No impide continuar trabajando" },
  { value: "normal", label: "Normal", description: "Impacto moderado" },
  { value: "high", label: "Alta", description: "Impide realizar una tarea importante" },
  { value: "critical", label: "Crítica", description: "Operación detenida o riesgo de seguridad" },
];

export const TICKET_STATUS = {
  new: { label: "Nuevo", className: "border-sky-400/30 bg-sky-500/10 text-sky-200", isClosed: false },
  assigned: { label: "Asignado", className: "border-violet-400/30 bg-violet-500/10 text-violet-200", isClosed: false },
  in_progress: { label: "En proceso", className: "border-amber-400/30 bg-amber-500/10 text-amber-200" },
  pending_user: { label: "Pendiente del solicitante", className: "border-orange-400/30 bg-orange-500/10 text-orange-200", isClosed: false },
  resolved: { label: "Resuelto", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200", isClosed: false },
  closed: { label: "Cerrado", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200", isClosed: true },
  reopened: { label: "Reabierto", className: "border-sky-400/30 bg-sky-500/10 text-sky-200", isClosed: false },
  cancelled: { label: "Cancelado", className: "border-gray-400/30 bg-gray-500/10 text-gray-300", isClosed: true },
};

export const TICKET_LEVELS = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
];

export const TICKET_MAX_FILES = 5;
export const TICKET_MAX_FILE_SIZE = 50 * 1024 * 1024;
export const TICKET_ACCEPTED_FILE_TYPES = ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";

export const CATEGORY_DEFAULT_PRIORITY = {
  access: "normal", permissions: "normal", email: "high",
  functional_error: "high", data: "normal", device: "normal",
  security: "critical", improvement: "low", other: "normal",
};

export const EMPTY_TICKET_FORM = {
  category: "",
  impact: "medium",
  urgency: "medium",
  title: "",
  description: "",
};
