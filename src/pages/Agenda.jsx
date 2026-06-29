import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import {
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
  RiArrowDownSFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiAddFill,
  RiCloseLine,
  RiCalendarLine,
  RiTimeLine,
  RiMapPinFill,
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
  RiFilterLine,
  RiEyeFill,
  RiEditFill,
  RiDeleteBinFill,
} from "react-icons/ri";

const TYPE_CONFIG = {
  Visita:       { color: "#ef4444", bg: "rgba(239,68,68,0.15)",  label: "Visita" },
  Llamada:      { color: "#22c55e", bg: "rgba(34,197,94,0.15)",  label: "Llamada" },
  Reunion:      { color: "#2563eb", bg: "rgba(37,99,235,0.15)",  label: "Reunión" },
  Capacitacion: { color: "#a855f7", bg: "rgba(168,85,247,0.15)", label: "Capacitación" },
  Cumpleanos:   { color: "#22c55e", bg: "rgba(34,197,94,0.15)",  label: "Cumpleaños" },
  Seguimiento:  { color: "#a855f7", bg: "rgba(168,85,247,0.15)", label: "Seguimiento" },
  Viaje:        { color: "#2563eb", bg: "rgba(37,99,235,0.15)",  label: "Viaje" },
};

const STATUS_CONFIG = {
  Confirmado: { color: "#22c55e", bg: "rgba(34,197,94,0.15)", label: "Confirmado" },
  Pendiente:  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "Pendiente" },
  Cancelado:  { color: "#ef4444", bg: "rgba(239,68,68,0.15)",  label: "Cancelado" },
  Completado: { color: "#2563eb", bg: "rgba(37,99,235,0.15)",  label: "Completado" },
};

const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function getWeekDays(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(start);
    curr.setDate(start.getDate() + i);
    days.push(curr);
  }
  return days;
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const INITIAL_EVENTS = [
  { id: 1, title: "Reunión de equipo",       type: "Reunion",      start: "09:00", end: "10:00", date: "2024-06-27", location: "Sala de juntas",     participants: "Equipo comercial", status: "Confirmado" },
  { id: 2, title: "Llamada con cliente",     type: "Llamada",      start: "10:00", end: "11:00", date: "2024-06-25", location: "Constructura Solis", participants: "Juan Pérez",       status: "Confirmado" },
  { id: 3, title: "Visita a cliente",        type: "Visita",       start: "09:00", end: "11:00", date: "2024-06-27", location: "Textiles de Occidente", participants: "María Fernández",  status: "Confirmado" },
  { id: 4, title: "Llamada comercial",       type: "Llamada",      start: "10:00", end: "11:00", date: "2024-06-28", location: "Pacific Pet Food",   participants: "Carlos Ruiz",      status: "Pendiente" },
  { id: 5, title: "Seguimiento cotización",  type: "Seguimiento",  start: "11:00", end: "12:00", date: "2024-06-26", location: "Textiles de Occidente", participants: "María Fernández",  status: "Confirmado" },
  { id: 6, title: "Revisión de pedidos",     type: "Reunion",      start: "14:00", end: "15:00", date: "2024-06-25", location: "Sala de juntas",     participants: "Equipo operaciones", status: "Confirmado" },
  { id: 7, title: "Reunión de proyecto",     type: "Reunion",      start: "15:00", end: "16:30", date: "2024-06-27", location: "Sala de juntas",     participants: "Equipo desarrollo", status: "Confirmado" },
  { id: 8, title: "Capacitación producto",   type: "Capacitacion", start: "16:00", end: "17:30", date: "2024-06-28", location: "Virtual",            participants: "Equipo completo",  status: "Pendiente" },
  { id: 9, title: "Cumpleaños - Ana",       type: "Cumpleanos",   start: "00:00", end: "23:59", date: "2024-06-25", location: "Oficina",            participants: "Todos",            status: "Confirmado" },
  { id: 10, title: "Viaje de trabajo",       type: "Viaje",        start: "00:00", end: "23:59", date: "2024-06-27", location: "Guanacaste",         participants: "Equipo ventas",    status: "Confirmado" },
  { id: 11, title: "Capacitación",           type: "Capacitacion", start: "00:00", end: "23:59", date: "2024-06-29", location: "Sala principal",     participants: "Nuevos agentes",   status: "Confirmado" },
  { id: 12, title: "Reunión con proveedor",  type: "Reunion",      start: "08:00", end: "09:00", date: "2024-06-24", location: "Sala de juntas",     participants: "Departamento compras", status: "Completado" },
  { id: 13, title: "Llamada seguimiento",    type: "Llamada",      start: "11:00", end: "12:00", date: "2024-06-27", location: "Grupo Alimentos S.A.", participants: "Luis Castro",      status: "Pendiente" },
  { id: 14, title: "Visita planta",          type: "Visita",       start: "13:00", end: "15:00", date: "2024-06-28", location: "Planta Puntarenas",  participants: "Equipo técnico",   status: "Confirmado" },
];

const INITIAL_TASKS = [
  { id: 1, title: "Enviar propuesta comercial",   priority: "Alta",   done: false },
  { id: 2, title: "Dar seguimiento a cotización", priority: "Media",  done: true },
  { id: 3, title: "Revisar pedidos pendientes",   priority: "Baja",   done: false },
  { id: 4, title: "Actualizar base de clientes",  priority: "Media",  done: false },
  { id: 5, title: "Preparar reporte mensual",     priority: "Alta",   done: true },
  { id: 6, title: "Llamar a nuevos leads",        priority: "Alta",   done: false },
];

export default function Agenda() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 27));
  const [viewMode, setViewMode] = useState("semana");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ title: "", type: "Reunion", start: "09:00", end: "10:00", date: "", location: "", participants: "", status: "Confirmado" });
  const [filterType, setFilterType] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [nextId, setNextId] = useState(15);

  const weekDays = getWeekDays(currentDate);
  const today = new Date(2024, 5, 27);

  const eventsToday = events.filter(e => isSameDay(new Date(e.date), today));
  const tasksPending = tasks.filter(t => !t.done);
  const meetings = events.filter(e => e.type === "Reunion" && isSameDay(new Date(e.date), today));
  const dueToday = tasks.filter(t => !t.done);
  const eventsThisWeek = events.filter(e => {
    const d = new Date(e.date);
    return d >= weekDays[0] && d <= weekDays[6];
  });
  const hoursScheduled = eventsThisWeek.reduce((sum, e) => {
    const dur = parseTime(e.end) - parseTime(e.start);
    return sum + (dur > 0 ? dur : 0);
  }, 0);

  const metrics = [
    { label: "EVENTOS HOY", value: eventsToday.length, change: "+14% vs. ayer", icon: RiCalendarLine, color: "#2563eb" },
    { label: "TAREAS PENDIENTES", value: tasksPending.length, change: "+12% vs. ayer", icon: RiCheckboxBlankCircleLine, color: "#22c55e" },
    { label: "REUNIONES", value: meetings.length, change: "+25% vs. ayer", icon: RiCalendarLine, color: "#a855f7" },
    { label: "VENCEN HOY", value: dueToday.length, change: "-50% vs. ayer", icon: RiTimeLine, color: "#f59e0b" },
    { label: "EVENTOS ESTA SEMANA", value: eventsThisWeek.length, change: "+8% vs. semana anterior", icon: RiCalendarLine, color: "#ec4899" },
    { label: "HORAS PROGRAMADAS", value: hoursScheduled.toFixed(1) + " h", change: "+10% vs. semana anterior", icon: RiTimeLine, color: "#3b82f6" },
  ];

  function openCreate() {
    const d = currentDate.toISOString().split("T")[0];
    setForm({ title: "", type: "Reunion", start: "09:00", end: "10:00", date: d, location: "", participants: "", status: "Confirmado" });
    setDrawerMode("create");
    setSelectedEvent(null);
    setDrawerOpen(true);
  }

  function openView(ev) {
    setSelectedEvent(ev);
    setDrawerMode("view");
    setDrawerOpen(true);
  }

  function openEdit(ev) {
    setForm({ ...ev });
    setDrawerMode("edit");
    setSelectedEvent(ev);
    setDrawerOpen(true);
  }

  function saveEvent() {
    if (!form.title.trim()) return;
    if (drawerMode === "create") {
      setEvents(prev => [...prev, { ...form, id: nextId }]);
      setNextId(n => n + 1);
    } else {
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...form, id: selectedEvent.id } : e));
    }
    setDrawerOpen(false);
  }

  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDrawerOpen(false);
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function prevWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date(2024, 5, 27));
  }

  const types = ["Todos", ...Object.keys(TYPE_CONFIG)];
  const statuses = ["Todos", ...Object.keys(STATUS_CONFIG)];

  const filteredEvents = events.filter(e => {
    const d = new Date(e.date);
    const inWeek = d >= weekDays[0] && d <= weekDays[6];
    const typeOk = filterType === "Todos" || e.type === filterType;
    const statusOk = filterStatus === "Todos" || e.status === filterStatus;
    return inWeek && typeOk && statusOk;
  });

  const todaysEventsList = events.filter(e => isSameDay(new Date(e.date), today));

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date + "T" + a.start) - new Date(b.date + "T" + b.start))
    .slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#0a0e1a] text-[#F8FAFC]">
      <DashSideBar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={"flex-1 transition-all " + (sidebarCollapsed ? "ml-16" : "ml-64")}>
        {/* Top bar */}
        <div className="h-16 bg-[#111827] border-b border-[#1f2a40] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-[#1f2a40] rounded-lg transition-colors">
              <RiMenuFill size={20} />
            </button>
            <span className="text-sm text-gray-400">Operaciones</span>
            <span className="text-sm text-gray-500">/</span>
            <span className="text-sm font-medium">Agenda</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-300">Grupo Víquez S.A</span>
              <RiArrowDownSFill size={16} className="text-gray-500" />
            </div>
            <button className="p-2 hover:bg-[#1f2a40] rounded-lg transition-colors relative">
              <RiNotification3Fill size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 hover:bg-[#1f2a40] rounded-lg transition-colors">
              <RiSettings4Fill size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Agenda</h1>
              <p className="text-gray-400 text-sm mt-1">Gestiona tus tareas, reuniones y actividades programadas.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={goToday} className="px-4 py-2 bg-[#111827] border border-[#1f2a40] rounded-lg text-sm hover:bg-[#1f2a40] transition-colors">
                Hoy
              </button>
              <div className="flex items-center bg-[#111827] border border-[#1f2a40] rounded-lg">
                <button onClick={prevWeek} className="p-2 hover:bg-[#1f2a40] rounded-l-lg transition-colors">
                  <RiArrowLeftSLine size={18} />
                </button>
                <button onClick={nextWeek} className="p-2 hover:bg-[#1f2a40] rounded-r-lg transition-colors">
                  <RiArrowRightSLine size={18} />
                </button>
              </div>
              <div className="px-4 py-2 bg-[#111827] border border-[#1f2a40] rounded-lg text-sm flex items-center gap-2">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                <RiArrowDownSFill size={14} />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 bg-[#111827] border border-[#1f2a40] rounded-lg text-sm flex items-center gap-2 hover:bg-[#1f2a40] transition-colors">
                <RiFilterLine size={16} />
                Filtros
              </button>
              <button onClick={openCreate} className="px-4 py-2 bg-[#2563eb] hover:bg-blue-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <RiAddFill size={16} />
                Nuevo evento
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-4 p-4 bg-[#111827] border border-[#1f2a40] rounded-xl flex items-center gap-4">
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm">
                {types.map(t => <option key={t} value={t}>{t === "Todos" ? "Todos los tipos" : TYPE_CONFIG[t]?.label || t}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm">
                {statuses.map(s => <option key={s} value={s}>{s === "Todos" ? "Todos los estados" : STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
              <button onClick={() => { setFilterType("Todos"); setFilterStatus("Todos"); }} className="px-4 py-2 border border-[#1f2a40] rounded-lg text-sm hover:bg-[#1f2a40] transition-colors">
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ background: m.color + "20" }}>
                    <m.icon size={16} style={{ color: m.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{m.value}</div>
                <div className="text-xs text-gray-400 mt-1">{m.label}</div>
                <div className={"text-xs mt-1 " + (m.change.startsWith("+") ? "text-green-400" : m.change.startsWith("-") ? "text-red-400" : "text-gray-400")}>
                  {m.change}
                </div>
              </div>
            ))}
          </div>

          {/* Main content: Calendar + Sidebar */}
          <div className="flex gap-4">
            {/* Calendar */}
            <div className="flex-1 bg-[#111827] border border-[#1f2a40] rounded-xl overflow-hidden">
              {/* Calendar header */}
              <div className="flex border-b border-[#1f2a40]">
                <div className="w-16 border-r border-[#1f2a40]" />
                {weekDays.map((d, i) => {
                  const isToday = isSameDay(d, today);
                  return (
                    <div key={i} className={"flex-1 py-3 text-center border-r border-[#1f2a40] last:border-r-0 " + (isToday ? "bg-[#2563eb15]" : "")}>
                      <div className="text-xs text-gray-400">{DAYS[d.getDay()]}</div>
                      <div className={"text-lg font-semibold mt-0.5 " + (isToday ? "text-[#2563eb]" : "")}>{d.getDate()}</div>
                      {isToday && <div className="w-6 h-6 bg-[#2563eb] rounded-full text-white text-xs flex items-center justify-center mx-auto mt-1">{d.getDate()}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Calendar body */}
              <div className="relative" style={{ height: 480 }}>
                {/* Time column */}
                <div className="absolute left-0 top-0 w-16 h-full border-r border-[#1f2a40]">
                  {HOURS.map((h, i) => (
                    <div key={i} className="text-xs text-gray-500 text-right pr-2" style={{ height: 40, lineHeight: "40px" }}>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Grid lines */}
                <div className="absolute left-16 right-0 top-0 h-full">
                  {HOURS.map((_, i) => (
                    <div key={i} className="border-b border-[#1f2a40]" style={{ height: 40 }} />
                  ))}
                  {/* Current time line */}
                  <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10" style={{ top: 320 }}>
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                </div>

                {/* Day columns */}
                <div className="absolute left-16 right-0 top-0 h-full flex">
                  {weekDays.map((day, dayIdx) => {
                    const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.date), day));
                    return (
                      <div key={dayIdx} className="flex-1 relative border-r border-[#1f2a40] last:border-r-0">
                        {/* All-day events */}
                        {dayEvents.filter(e => e.start === "00:00").map(ev => {
                          const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Reunion;
                          return (
                            <div key={ev.id} className="mx-1 mt-1 px-2 py-1 rounded text-xs cursor-pointer truncate" style={{ background: cfg.bg, color: cfg.color, borderLeft: "3px solid " + cfg.color }} onClick={() => openView(ev)}>
                              {ev.title}
                            </div>
                          );
                        })}
                        {/* Timed events */}
                        {dayEvents.filter(e => e.start !== "00:00").map(ev => {
                          const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Reunion;
                          const top = (parseTime(ev.start) - 8) * 40;
                          const height = (parseTime(ev.end) - parseTime(ev.start)) * 40;
                          return (
                            <div key={ev.id} className="absolute left-1 right-1 px-2 py-1 rounded text-xs cursor-pointer overflow-hidden" style={{ top: Math.max(top, 0), height: Math.max(height, 20), background: cfg.bg, color: cfg.color, borderLeft: "3px solid " + cfg.color }} onClick={() => openView(ev)}>
                              <div className="font-medium truncate">{ev.title}</div>
                              <div className="text-[10px] opacity-80">{ev.start} - {ev.end}</div>
                              <div className="text-[10px] opacity-80 truncate">{ev.location}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="w-72 space-y-4">
              {/* Mini calendar */}
              <div className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                  <div className="flex gap-1">
                    <button onClick={prevWeek} className="p-1 hover:bg-[#1f2a40] rounded"><RiArrowLeftSLine size={14} /></button>
                    <button onClick={nextWeek} className="p-1 hover:bg-[#1f2a40] rounded"><RiArrowRightSLine size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                  {["L","M","X","J","V","S","D"].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 text-center text-xs">
                  {getMonthDays(currentDate).map((d, i) => {
                    if (!d) return <div key={i} />;
                    const isToday = isSameDay(d, today);
                    const hasEvent = events.some(e => isSameDay(new Date(e.date), d));
                    const dayClass = isToday ? "py-1 cursor-pointer bg-[#2563eb] text-white rounded-full" : hasEvent ? "py-1 cursor-pointer text-[#2563eb] font-medium hover:bg-[#1f2a40] rounded" : "py-1 cursor-pointer text-gray-300 hover:bg-[#1f2a40] rounded";
                    return (
                      <div key={i} className={dayClass}>
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming events */}
              <div className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Próximos eventos</h3>
                <div className="space-y-3">
                  {upcomingEvents.map(ev => {
                    const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Reunion;
                    return (
                      <div key={ev.id} className="flex items-start gap-2 cursor-pointer hover:bg-[#1f2a40] rounded-lg p-1.5 -mx-1.5 transition-colors" onClick={() => openView(ev)}>
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{ev.title}</div>
                          <div className="text-[10px] text-gray-400">{ev.location}</div>
                        </div>
                        <div className="text-[10px] text-gray-400 shrink-0">{ev.start}<br />{ev.end}</div>
                      </div>
                    );
                  })}
                </div>
                <button className="text-xs text-[#2563eb] mt-3 hover:underline">Ver todos los eventos</button>
              </div>

              {/* Pending tasks */}
              <div className="bg-[#111827] border border-[#1f2a40] rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Tareas pendientes</h3>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-start gap-2">
                      <button onClick={() => toggleTask(t.id)} className="mt-0.5 shrink-0">
                        {t.done ? <RiCheckboxCircleFill size={16} className="text-green-500" /> : <RiCheckboxBlankCircleLine size={16} className="text-gray-500" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={"text-xs " + (t.done ? "line-through text-gray-500" : "")}>{t.title}</div>
                      </div>
                      <span className={"text-[10px] px-1.5 py-0.5 rounded " + (t.priority === "Alta" ? "bg-red-500/15 text-red-400" : t.priority === "Media" ? "bg-yellow-500/15 text-yellow-400" : "bg-green-500/15 text-green-400")}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="text-xs text-[#2563eb] mt-3 hover:underline">Ver todas las tareas</button>
              </div>
            </div>
          </div>

          {/* Today's events table */}
          <div className="mt-6 bg-[#111827] border border-[#1f2a40] rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2a40]">
              <h3 className="font-medium">Eventos de hoy - Jueves 27 junio</h3>
              <button className="text-xs text-[#2563eb] hover:underline">Ver agenda completa</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2a40]">
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Hora</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Evento</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Participantes / Ubicación</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Estado</th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysEventsList.sort((a, b) => parseTime(a.start) - parseTime(b.start)).map(ev => {
                    const tcfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Reunion;
                    const scfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.Pendiente;
                    return (
                      <tr key={ev.id} className="border-b border-[#1f2a40] hover:bg-[#1f2a4030] transition-colors">
                        <td className="px-5 py-3 text-gray-300">{ev.start} - {ev.end}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: tcfg.bg, color: tcfg.color }}>
                            {tcfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium">{ev.title}</td>
                        <td className="px-5 py-3 text-gray-300">
                          <div className="flex items-center gap-1 text-xs">
                            <RiMapPinFill size={12} className="text-gray-500" />
                            {ev.location}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{ev.participants}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: scfg.bg, color: scfg.color }}>
                            {scfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openView(ev)} className="p-1.5 hover:bg-[#1f2a40] rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                              <RiEyeFill size={14} />
                            </button>
                            <button onClick={() => openEdit(ev)} className="p-1.5 hover:bg-[#1f2a40] rounded-lg transition-colors text-gray-400 hover:text-green-400">
                              <RiEditFill size={14} />
                            </button>
                            <button onClick={() => deleteEvent(ev.id)} className="p-1.5 hover:bg-[#1f2a40] rounded-lg transition-colors text-gray-400 hover:text-red-400">
                              <RiDeleteBinFill size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {todaysEventsList.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No hay eventos para hoy</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-[480px] bg-[#111827] border-l border-[#1f2a40] h-full overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2a40]">
              <h2 className="text-lg font-semibold">
                {drawerMode === "create" ? "Nuevo Evento" : drawerMode === "edit" ? "Editar Evento" : "Detalles del Evento"}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-[#1f2a40] rounded-lg transition-colors">
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {drawerMode === "view" && selectedEvent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: (TYPE_CONFIG[selectedEvent.type]?.bg || "rgba(37,99,235,0.15)"), color: (TYPE_CONFIG[selectedEvent.type]?.color || "#2563eb") }}>
                      {selectedEvent.title.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{selectedEvent.title}</div>
                      <div className="text-xs text-gray-400">{TYPE_CONFIG[selectedEvent.type]?.label || selectedEvent.type}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0e1a] border border-[#1f2a40] rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Hora</div>
                      <div className="text-sm flex items-center gap-1"><RiTimeLine size={14} className="text-gray-500" />{selectedEvent.start} - {selectedEvent.end}</div>
                    </div>
                    <div className="bg-[#0a0e1a] border border-[#1f2a40] rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Fecha</div>
                      <div className="text-sm flex items-center gap-1"><RiCalendarLine size={14} className="text-gray-500" />{selectedEvent.date}</div>
                    </div>
                    <div className="bg-[#0a0e1a] border border-[#1f2a40] rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Ubicación</div>
                      <div className="text-sm flex items-center gap-1"><RiMapPinFill size={14} className="text-gray-500" />{selectedEvent.location}</div>
                    </div>
                    <div className="bg-[#0a0e1a] border border-[#1f2a40] rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Estado</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (STATUS_CONFIG[selectedEvent.status]?.bg || "rgba(245,158,11,0.15)"), color: (STATUS_CONFIG[selectedEvent.status]?.color || "#f59e0b") }}>
                        {STATUS_CONFIG[selectedEvent.status]?.label || selectedEvent.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#0a0e1a] border border-[#1f2a40] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Participantes</div>
                    <div className="text-sm">{selectedEvent.participants}</div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => openEdit(selectedEvent)} className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                      Editar evento
                    </button>
                    <button onClick={() => deleteEvent(selectedEvent.id)} className="px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Título del evento</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" placeholder="Ej: Reunión con cliente" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Tipo</label>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]">
                        {Object.keys(TYPE_CONFIG).map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Estado</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]">
                        {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Hora inicio</label>
                      <input type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Hora fin</label>
                      <input type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Fecha</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Ubicación</label>
                    <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" placeholder="Ej: Sala de juntas" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Participantes</label>
                    <input type="text" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" placeholder="Ej: Equipo comercial" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveEvent} className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                      {drawerMode === "create" ? "Crear evento" : "Guardar cambios"}
                    </button>
                    <button onClick={() => setDrawerOpen(false)} className="px-4 py-2.5 border border-[#1f2a40] rounded-lg text-sm hover:bg-[#1f2a40] transition-colors">
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
