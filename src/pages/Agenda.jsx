import { useState } from "react";

import {
  RiAddFill,
  RiArrowDownSFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
  RiDeleteBinFill,
  RiEditFill,
  RiEyeFill,
  RiFilterLine,
  RiMapPinFill,
  RiTimeLine,
} from "react-icons/ri";

const TYPE_CONFIG = {
  Visita: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    label: "Visita",
  },
  Llamada: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    label: "Llamada",
  },
  Reunion: {
    color: "#C9A227",
    bg: "rgba(37,99,235,0.15)",
    label: "Reunión",
  },
  Capacitacion: {
    color: "#a855f7",
    bg: "rgba(168,85,247,0.15)",
    label: "Capacitación",
  },
  Cumpleanos: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    label: "Cumpleaños",
  },
  Seguimiento: {
    color: "#a855f7",
    bg: "rgba(168,85,247,0.15)",
    label: "Seguimiento",
  },
  Viaje: {
    color: "#C9A227",
    bg: "rgba(37,99,235,0.15)",
    label: "Viaje",
  },
};

const STATUS_CONFIG = {
  Confirmado: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    label: "Confirmado",
  },
  Pendiente: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    label: "Pendiente",
  },
  Cancelado: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    label: "Cancelado",
  },
  Completado: {
    color: "#C9A227",
    bg: "rgba(37,99,235,0.15)",
    label: "Completado",
  },
};

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function parseTime(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours + minutes / 60;
}

function getWeekDays(date) {
  const dateCopy = new Date(date);
  const currentDay = dateCopy.getDay();
  const firstDate = dateCopy.getDate() - currentDay;

  const weekStart = new Date(dateCopy.setDate(firstDate));
  const days = [];

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(weekStart);

    day.setDate(weekStart.getDate() + index);

    days.push(day);
  }

  return days;
}

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
}

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let index = 0; index < startDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

const INITIAL_EVENTS = [
  {
    id: 1,
    title: "Reunión de equipo",
    type: "Reunion",
    start: "09:00",
    end: "10:00",
    date: "2024-06-27",
    location: "Sala de juntas",
    participants: "Equipo comercial",
    status: "Confirmado",
  },
  {
    id: 2,
    title: "Llamada con cliente",
    type: "Llamada",
    start: "10:00",
    end: "11:00",
    date: "2024-06-25",
    location: "Constructura Solis",
    participants: "Juan Pérez",
    status: "Confirmado",
  },
  {
    id: 3,
    title: "Visita a cliente",
    type: "Visita",
    start: "09:00",
    end: "11:00",
    date: "2024-06-27",
    location: "Textiles de Occidente",
    participants: "María Fernández",
    status: "Confirmado",
  },
  {
    id: 4,
    title: "Llamada comercial",
    type: "Llamada",
    start: "10:00",
    end: "11:00",
    date: "2024-06-28",
    location: "Pacific Pet Food",
    participants: "Carlos Ruiz",
    status: "Pendiente",
  },
  {
    id: 5,
    title: "Seguimiento cotización",
    type: "Seguimiento",
    start: "11:00",
    end: "12:00",
    date: "2024-06-26",
    location: "Textiles de Occidente",
    participants: "María Fernández",
    status: "Confirmado",
  },
  {
    id: 6,
    title: "Revisión de pedidos",
    type: "Reunion",
    start: "14:00",
    end: "15:00",
    date: "2024-06-25",
    location: "Sala de juntas",
    participants: "Equipo operaciones",
    status: "Confirmado",
  },
  {
    id: 7,
    title: "Reunión de proyecto",
    type: "Reunion",
    start: "15:00",
    end: "16:30",
    date: "2024-06-27",
    location: "Sala de juntas",
    participants: "Equipo desarrollo",
    status: "Confirmado",
  },
  {
    id: 8,
    title: "Capacitación producto",
    type: "Capacitacion",
    start: "16:00",
    end: "17:30",
    date: "2024-06-28",
    location: "Virtual",
    participants: "Equipo completo",
    status: "Pendiente",
  },
  {
    id: 9,
    title: "Cumpleaños - Ana",
    type: "Cumpleanos",
    start: "00:00",
    end: "23:59",
    date: "2024-06-25",
    location: "Oficina",
    participants: "Todos",
    status: "Confirmado",
  },
  {
    id: 10,
    title: "Viaje de trabajo",
    type: "Viaje",
    start: "00:00",
    end: "23:59",
    date: "2024-06-27",
    location: "Guanacaste",
    participants: "Equipo ventas",
    status: "Confirmado",
  },
  {
    id: 11,
    title: "Capacitación",
    type: "Capacitacion",
    start: "00:00",
    end: "23:59",
    date: "2024-06-29",
    location: "Sala principal",
    participants: "Nuevos agentes",
    status: "Confirmado",
  },
  {
    id: 12,
    title: "Reunión con proveedor",
    type: "Reunion",
    start: "08:00",
    end: "09:00",
    date: "2024-06-24",
    location: "Sala de juntas",
    participants: "Departamento compras",
    status: "Completado",
  },
  {
    id: 13,
    title: "Llamada seguimiento",
    type: "Llamada",
    start: "11:00",
    end: "12:00",
    date: "2024-06-27",
    location: "Grupo Alimentos S.A.",
    participants: "Luis Castro",
    status: "Pendiente",
  },
  {
    id: 14,
    title: "Visita planta",
    type: "Visita",
    start: "13:00",
    end: "15:00",
    date: "2024-06-28",
    location: "Planta Puntarenas",
    participants: "Equipo técnico",
    status: "Confirmado",
  },
];

const INITIAL_TASKS = [
  {
    id: 1,
    title: "Enviar propuesta comercial",
    priority: "Alta",
    done: false,
  },
  {
    id: 2,
    title: "Dar seguimiento a cotización",
    priority: "Media",
    done: true,
  },
  {
    id: 3,
    title: "Revisar pedidos pendientes",
    priority: "Baja",
    done: false,
  },
  {
    id: 4,
    title: "Actualizar base de clientes",
    priority: "Media",
    done: false,
  },
  {
    id: 5,
    title: "Preparar reporte mensual",
    priority: "Alta",
    done: true,
  },
  {
    id: 6,
    title: "Llamar a nuevos leads",
    priority: "Alta",
    done: false,
  },
];

export default function Agenda() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const [currentDate, setCurrentDate] = useState(
    new Date(2024, 5, 27),
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "Reunion",
    start: "09:00",
    end: "10:00",
    date: "",
    location: "",
    participants: "",
    status: "Confirmado",
  });

  const [filterType, setFilterType] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [nextId, setNextId] = useState(15);

  const weekDays = getWeekDays(currentDate);
  const today = new Date(2024, 5, 27);

  const eventsToday = events.filter((event) =>
    isSameDay(new Date(event.date), today),
  );

  const pendingTasks = tasks.filter((task) => !task.done);

  const meetingsToday = events.filter(
    (event) =>
      event.type === "Reunion" &&
      isSameDay(new Date(event.date), today),
  );

  const eventsThisWeek = events.filter((event) => {
    const eventDate = new Date(event.date);

    return eventDate >= weekDays[0] && eventDate <= weekDays[6];
  });

  const scheduledHours = eventsThisWeek.reduce((total, event) => {
    const duration = parseTime(event.end) - parseTime(event.start);

    return total + (duration > 0 ? duration : 0);
  }, 0);

  const metrics = [
    {
      label: "EVENTOS HOY",
      value: eventsToday.length,
      change: "+14% vs. ayer",
      icon: RiCalendarLine,
      color: "#C9A227",
    },
    {
      label: "TAREAS PENDIENTES",
      value: pendingTasks.length,
      change: "+12% vs. ayer",
      icon: RiCheckboxBlankCircleLine,
      color: "#22c55e",
    },
    {
      label: "REUNIONES",
      value: meetingsToday.length,
      change: "+25% vs. ayer",
      icon: RiCalendarLine,
      color: "#a855f7",
    },
    {
      label: "VENCEN HOY",
      value: pendingTasks.length,
      change: "-50% vs. ayer",
      icon: RiTimeLine,
      color: "#f59e0b",
    },
    {
      label: "EVENTOS ESTA SEMANA",
      value: eventsThisWeek.length,
      change: "+8% vs. semana anterior",
      icon: RiCalendarLine,
      color: "#ec4899",
    },
    {
      label: "HORAS PROGRAMADAS",
      value: `${scheduledHours.toFixed(1)} h`,
      change: "+10% vs. semana anterior",
      icon: RiTimeLine,
      color: "#C9A227",
    },
  ];

  const types = ["Todos", ...Object.keys(TYPE_CONFIG)];
  const statuses = ["Todos", ...Object.keys(STATUS_CONFIG)];

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);

    const isDuringWeek =
      eventDate >= weekDays[0] && eventDate <= weekDays[6];

    const matchesType =
      filterType === "Todos" || event.type === filterType;

    const matchesStatus =
      filterStatus === "Todos" || event.status === filterStatus;

    return isDuringWeek && matchesType && matchesStatus;
  });

  const todaysEventsList = events.filter((event) =>
    isSameDay(new Date(event.date), today),
  );

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= today)
    .sort(
      (firstEvent, secondEvent) =>
        new Date(
          `${firstEvent.date}T${firstEvent.start}`,
        ) -
        new Date(
          `${secondEvent.date}T${secondEvent.start}`,
        ),
    )
    .slice(0, 5);

  function openCreate() {
    const selectedDate = currentDate.toISOString().split("T")[0];

    setForm({
      title: "",
      type: "Reunion",
      start: "09:00",
      end: "10:00",
      date: selectedDate,
      location: "",
      participants: "",
      status: "Confirmado",
    });

    setDrawerMode("create");
    setSelectedEvent(null);
    setDrawerOpen(true);
  }

  function openView(event) {
    setSelectedEvent(event);
    setDrawerMode("view");
    setDrawerOpen(true);
  }

  function openEdit(event) {
    setForm({ ...event });
    setDrawerMode("edit");
    setSelectedEvent(event);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);

    window.setTimeout(() => {
      setDrawerMode("create");
      setSelectedEvent(null);
    }, 200);
  }

  function saveEvent() {
    if (!form.title.trim()) {
      window.alert("Ingresa un título para el evento.");
      return;
    }

    if (!form.date) {
      window.alert("Selecciona una fecha para el evento.");
      return;
    }

    if (drawerMode === "create") {
      setEvents((previousEvents) => [
        ...previousEvents,
        {
          ...form,
          id: nextId,
        },
      ]);

      setNextId((previousId) => previousId + 1);
    }

    if (drawerMode === "edit" && selectedEvent) {
      setEvents((previousEvents) =>
        previousEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...form,
                id: selectedEvent.id,
              }
            : event,
        ),
      );
    }

    closeDrawer();
  }

  function deleteEvent(eventId) {
    setEvents((previousEvents) =>
      previousEvents.filter((event) => event.id !== eventId),
    );

    closeDrawer();
  }

  function toggleTask(taskId) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              done: !task.done,
            }
          : task,
      ),
    );
  }

  function previousWeek() {
    const nextDate = new Date(currentDate);

    nextDate.setDate(nextDate.getDate() - 7);

    setCurrentDate(nextDate);
  }

  function nextWeek() {
    const nextDate = new Date(currentDate);

    nextDate.setDate(nextDate.getDate() + 7);

    setCurrentDate(nextDate);
  }

  function goToday() {
    setCurrentDate(new Date(2024, 5, 27));
  }

  function clearFilters() {
    setFilterType("Todos");
    setFilterStatus("Todos");
  }

  return (
    <>
      <div className="p-4 lg:p-6">
        {/* Breadcrumb y encabezado */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>Operaciones</span>
              <span>/</span>
              <span className="text-gray-300">Agenda</span>
            </div>

            <h1 className="text-2xl font-bold">Agenda</h1>

            <p className="text-gray-400 text-sm mt-1">
              Gestiona tus tareas, reuniones y actividades programadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="px-4 py-2 bg-[#141d2e] border border-[#2a3550] rounded-lg text-sm hover:bg-[#2a3550] transition-colors cursor-pointer"
            >
              Hoy
            </button>

            <div className="flex items-center bg-[#141d2e] border border-[#2a3550] rounded-lg">
              <button
                type="button"
                onClick={previousWeek}
                className="p-2 hover:bg-[#2a3550] rounded-l-lg transition-colors cursor-pointer"
                aria-label="Semana anterior"
              >
                <RiArrowLeftSLine size={18} />
              </button>

              <button
                type="button"
                onClick={nextWeek}
                className="p-2 hover:bg-[#2a3550] rounded-r-lg transition-colors cursor-pointer"
                aria-label="Semana siguiente"
              >
                <RiArrowRightSLine size={18} />
              </button>
            </div>

            <div className="px-4 py-2 bg-[#141d2e] border border-[#2a3550] rounded-lg text-sm flex items-center gap-2">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              <RiArrowDownSFill size={14} />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters((previousValue) => !previousValue)
              }
              className="px-4 py-2 bg-[#141d2e] border border-[#2a3550] rounded-lg text-sm flex items-center gap-2 hover:bg-[#2a3550] transition-colors cursor-pointer"
            >
              <RiFilterLine size={16} />
              Filtros
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 bg-[#C9A227] hover:bg-[#B8921F] rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RiAddFill size={16} />
              Nuevo evento
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mb-4 p-4 bg-[#141d2e] border border-[#2a3550] rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === "Todos"
                    ? "Todos los tipos"
                    : TYPE_CONFIG[type]?.label || type}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "Todos"
                    ? "Todos los estados"
                    : STATUS_CONFIG[status]?.label || status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-[#2a3550] rounded-lg text-sm hover:bg-[#2a3550] transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      background: `${metric.color}20`,
                    }}
                  >
                    <Icon size={16} style={{ color: metric.color }} />
                  </div>
                </div>

                <div className="text-2xl font-bold text-[#C9A227]">
                  {metric.value}
                </div>

                <div className="text-xs text-gray-400 mt-1">
                  {metric.label}
                </div>

                <div
                  className={`text-xs mt-1 ${
                    metric.change.startsWith("+")
                      ? "text-green-400"
                      : metric.change.startsWith("-")
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {metric.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendario + panel lateral */}
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden min-w-0">
            {/* Encabezado del calendario */}
            <div className="flex border-b border-[#2a3550] w-full min-w-[760px]">
              <div
                className="shrink-0 border-r border-[#2a3550]"
                style={{ width: 64 }}
              />

              {weekDays.map((day, index) => {
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={index}
                    className={`py-3 text-center border-r border-[#2a3550] last:border-r-0 ${
                      isToday ? "bg-[#C9A227]/10" : ""
                    }`}
                    style={{
                      width: `calc((100% - 64px) / ${weekDays.length})`,
                    }}
                  >
                    <div className="text-xs text-gray-400">
                      {DAYS[day.getDay()]}
                    </div>

                    <div
                      className={`text-lg font-semibold mt-0.5 ${
                        isToday ? "text-[#C9A227]" : ""
                      }`}
                    >
                      {day.getDate()}
                    </div>

                    {isToday && (
                      <div className="w-6 h-6 bg-[#C9A227] rounded-full text-white text-xs flex items-center justify-center mx-auto mt-1">
                        {day.getDate()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cuerpo del calendario */}
            <div className="overflow-x-auto">
              <div
                className="relative min-w-[760px]"
                style={{ height: HOURS.length * 40 }}
              >
                <div className="absolute left-0 top-0 w-16 h-full border-r border-[#2a3550]">
                  {HOURS.map((hour, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-500 text-right pr-2"
                      style={{
                        height: 40,
                        lineHeight: "40px",
                      }}
                    >
                      {hour}
                    </div>
                  ))}
                </div>

                <div
                  className="absolute right-0 top-0 h-full"
                  style={{ left: 64 }}
                >
                  {HOURS.map((_, index) => (
                    <div
                      key={index}
                      className="border-b border-[#2a3550]"
                      style={{ height: 40 }}
                    />
                  ))}

                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                    style={{ top: 320 }}
                  >
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                </div>

                <div
                  className="absolute top-0 h-full flex"
                  style={{
                    left: 64,
                    width: "calc(100% - 64px)",
                  }}
                >
                  {weekDays.map((day, dayIndex) => {
                    const dayEvents = filteredEvents.filter((event) =>
                      isSameDay(new Date(event.date), day),
                    );

                    return (
                      <div
                        key={dayIndex}
                        className="relative border-r border-[#2a3550] last:border-r-0"
                        style={{
                          width: `calc(100% / ${weekDays.length})`,
                        }}
                      >
                        {dayEvents
                          .filter((event) => event.start === "00:00")
                          .map((event) => {
                            const config =
                              TYPE_CONFIG[event.type] ||
                              TYPE_CONFIG.Reunion;

                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openView(event)}
                                className="block w-[calc(100%-8px)] mx-1 mt-1 px-2 py-1 rounded text-xs text-left truncate cursor-pointer"
                                style={{
                                  background: config.bg,
                                  color: config.color,
                                  borderLeft: `3px solid ${config.color}`,
                                }}
                              >
                                {event.title}
                              </button>
                            );
                          })}

                        {dayEvents
                          .filter((event) => event.start !== "00:00")
                          .map((event) => {
                            const config =
                              TYPE_CONFIG[event.type] ||
                              TYPE_CONFIG.Reunion;

                            const top =
                              (parseTime(event.start) - 8) * 40;

                            const height =
                              (parseTime(event.end) -
                                parseTime(event.start)) *
                              40;

                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openView(event)}
                                className="absolute left-1 right-1 px-2 py-1 rounded text-xs text-left cursor-pointer overflow-hidden"
                                style={{
                                  top: Math.max(top, 0),
                                  height: Math.max(height, 20),
                                  background: config.bg,
                                  color: config.color,
                                  borderLeft: `3px solid ${config.color}`,
                                }}
                              >
                                <div className="font-medium truncate">
                                  {event.title}
                                </div>

                                <div className="text-[10px] opacity-80">
                                  {event.start} - {event.end}
                                </div>

                                <div className="text-[10px] opacity-80 truncate">
                                  {event.location}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho */}
          <div className="w-full xl:w-72 space-y-4">
            {/* Calendario pequeño */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {MONTHS[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </span>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={previousWeek}
                    className="p-1 hover:bg-[#2a3550] rounded cursor-pointer"
                    aria-label="Mes anterior"
                  >
                    <RiArrowLeftSLine size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={nextWeek}
                    className="p-1 hover:bg-[#2a3550] rounded cursor-pointer"
                    aria-label="Mes siguiente"
                  >
                    <RiArrowRightSLine size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center text-xs">
                {getMonthDays(currentDate).map((day, index) => {
                  if (!day) {
                    return <div key={index} />;
                  }

                  const isToday = isSameDay(day, today);

                  const hasEvent = events.some((event) =>
                    isSameDay(new Date(event.date), day),
                  );

                  const dayClass = isToday
                    ? "py-1 cursor-pointer bg-[#C9A227] text-white rounded-full"
                    : hasEvent
                      ? "py-1 cursor-pointer text-[#C9A227] font-medium hover:bg-[#2a3550] rounded"
                      : "py-1 cursor-pointer text-gray-300 hover:bg-[#2a3550] rounded";

                  return (
                    <button
                      key={index}
                      type="button"
                      className={dayClass}
                      onClick={() => setCurrentDate(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Próximos eventos */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">
                Próximos eventos
              </h3>

              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const config =
                    TYPE_CONFIG[event.type] || TYPE_CONFIG.Reunion;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openView(event)}
                      className="w-full flex items-start gap-2 text-left hover:bg-[#2a3550] rounded-lg p-1.5 -mx-1.5 transition-colors cursor-pointer"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: config.color }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {event.title}
                        </div>

                        <div className="text-[10px] text-gray-400">
                          {event.location}
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-400 shrink-0">
                        {event.start}
                        <br />
                        {event.end}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="text-xs text-[#C9A227] mt-3 hover:underline cursor-pointer"
              >
                Ver todos los eventos
              </button>
            </div>

            {/* Tareas */}
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">
                Tareas pendientes
              </h3>

              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 shrink-0 cursor-pointer"
                      aria-label={
                        task.done
                          ? "Marcar tarea como pendiente"
                          : "Marcar tarea como completada"
                      }
                    >
                      {task.done ? (
                        <RiCheckboxCircleFill
                          size={16}
                          className="text-green-500"
                        />
                      ) : (
                        <RiCheckboxBlankCircleLine
                          size={16}
                          className="text-gray-500"
                        />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs ${
                          task.done
                            ? "line-through text-gray-500"
                            : ""
                        }`}
                      >
                        {task.title}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        task.priority === "Alta"
                          ? "bg-red-500/15 text-red-400"
                          : task.priority === "Media"
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-green-500/15 text-green-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="text-xs text-[#C9A227] mt-3 hover:underline cursor-pointer"
              >
                Ver todas las tareas
              </button>
            </div>
          </div>
        </div>

        {/* Eventos del día */}
        <div className="mt-6 bg-[#141d2e] border border-[#2a3550] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3550]">
            <h3 className="font-medium">
              Eventos de hoy - Jueves 27 junio
            </h3>

            <button
              type="button"
              className="text-xs text-[#C9A227] hover:underline cursor-pointer"
            >
              Ver agenda completa
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#2a3550]">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                    Hora
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                    Tipo
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                    Evento
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                    Participantes / Ubicación
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">
                    Estado
                  </th>
                  <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {todaysEventsList
                  .sort(
                    (firstEvent, secondEvent) =>
                      parseTime(firstEvent.start) -
                      parseTime(secondEvent.start),
                  )
                  .map((event) => {
                    const typeConfig =
                      TYPE_CONFIG[event.type] || TYPE_CONFIG.Reunion;

                    const statusConfig =
                      STATUS_CONFIG[event.status] ||
                      STATUS_CONFIG.Pendiente;

                    return (
                      <tr
                        key={event.id}
                        className="border-b border-[#2a3550] hover:bg-[#2a355030] transition-colors"
                      >
                        <td className="px-5 py-3 text-gray-300">
                          {event.start} - {event.end}
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: typeConfig.bg,
                              color: typeConfig.color,
                            }}
                          >
                            {typeConfig.label}
                          </span>
                        </td>

                        <td className="px-5 py-3 font-medium">
                          {event.title}
                        </td>

                        <td className="px-5 py-3 text-gray-300">
                          <div className="flex items-center gap-1 text-xs">
                            <RiMapPinFill
                              size={12}
                              className="text-gray-500"
                            />
                            {event.location}
                          </div>

                          <div className="text-xs text-gray-500 mt-0.5">
                            {event.participants}
                          </div>
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: statusConfig.bg,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openView(event)}
                              className="p-1.5 hover:bg-[#2a3550] rounded-lg transition-colors text-gray-400 hover:text-[#C9A227] cursor-pointer"
                              title="Ver"
                            >
                              <RiEyeFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(event)}
                              className="p-1.5 hover:bg-[#2a3550] rounded-lg transition-colors text-gray-400 hover:text-green-400 cursor-pointer"
                              title="Editar"
                            >
                              <RiEditFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteEvent(event.id)}
                              className="p-1.5 hover:bg-[#2a3550] rounded-lg transition-colors text-gray-400 hover:text-red-400 cursor-pointer"
                              title="Eliminar"
                            >
                              <RiDeleteBinFill size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {todaysEventsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-gray-500"
                    >
                      No hay eventos para hoy
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fondo del drawer */}
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 z-40 bg-black/50 cursor-default"
          aria-label="Cerrar panel de agenda"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-[#141d2e] border-l border-[#2a3550] overflow-y-auto transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#2a3550] bg-[#141d2e]">
          <h2 className="text-lg font-semibold">
            {drawerMode === "create"
              ? "Nuevo Evento"
              : drawerMode === "edit"
                ? "Editar Evento"
                : "Detalles del Evento"}
          </h2>

          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a3550] transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {drawerMode === "view" && selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    background:
                      TYPE_CONFIG[selectedEvent.type]?.bg ||
                      "rgba(37,99,235,0.15)",
                    color:
                      TYPE_CONFIG[selectedEvent.type]?.color ||
                      "#C9A227",
                  }}
                >
                  {selectedEvent.title.charAt(0)}
                </div>

                <div>
                  <div className="font-medium">
                    {selectedEvent.title}
                  </div>

                  <div className="text-xs text-gray-400">
                    {TYPE_CONFIG[selectedEvent.type]?.label ||
                      selectedEvent.type}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0B1120] border border-[#2a3550] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">
                    Hora
                  </div>

                  <div className="text-sm flex items-center gap-1">
                    <RiTimeLine
                      size={14}
                      className="text-gray-500"
                    />
                    {selectedEvent.start} - {selectedEvent.end}
                  </div>
                </div>

                <div className="bg-[#0B1120] border border-[#2a3550] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">
                    Fecha
                  </div>

                  <div className="text-sm flex items-center gap-1">
                    <RiCalendarLine
                      size={14}
                      className="text-gray-500"
                    />
                    {selectedEvent.date}
                  </div>
                </div>

                <div className="bg-[#0B1120] border border-[#2a3550] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">
                    Ubicación
                  </div>

                  <div className="text-sm flex items-center gap-1">
                    <RiMapPinFill
                      size={14}
                      className="text-gray-500"
                    />
                    {selectedEvent.location}
                  </div>
                </div>

                <div className="bg-[#0B1120] border border-[#2a3550] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">
                    Estado
                  </div>

                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background:
                        STATUS_CONFIG[selectedEvent.status]?.bg ||
                        "rgba(245,158,11,0.15)",
                      color:
                        STATUS_CONFIG[selectedEvent.status]?.color ||
                        "#f59e0b",
                    }}
                  >
                    {STATUS_CONFIG[selectedEvent.status]?.label ||
                      selectedEvent.status}
                  </span>
                </div>
              </div>

              <div className="bg-[#0B1120] border border-[#2a3550] rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">
                  Participantes
                </div>

                <div className="text-sm">
                  {selectedEvent.participants}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => openEdit(selectedEvent)}
                  className="flex-1 py-2.5 bg-[#C9A227] hover:bg-[#B8921F] rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Editar evento
                </button>

                <button
                  type="button"
                  onClick={() => deleteEvent(selectedEvent.id)}
                  className="px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Título del evento
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  placeholder="Ej: Reunión con cliente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Tipo
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  >
                    {Object.keys(TYPE_CONFIG).map((type) => (
                      <option key={type} value={type}>
                        {TYPE_CONFIG[type].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Estado
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  >
                    {Object.keys(STATUS_CONFIG).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Hora inicio
                  </label>

                  <input
                    type="time"
                    value={form.start}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        start: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">
                    Hora fin
                  </label>

                  <input
                    type="time"
                    value={form.end}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        end: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Fecha
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Ubicación
                </label>

                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      location: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  placeholder="Ej: Sala de juntas"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Participantes
                </label>

                <input
                  type="text"
                  value={form.participants}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      participants: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0B1120] border border-[#2a3550] rounded-lg text-sm focus:outline-none focus:border-[#C9A227]"
                  placeholder="Ej: Equipo comercial"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveEvent}
                  className="flex-1 py-2.5 bg-[#C9A227] hover:bg-[#B8921F] rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {drawerMode === "create"
                    ? "Crear evento"
                    : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-4 py-2.5 border border-[#2a3550] rounded-lg text-sm hover:bg-[#2a3550] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}