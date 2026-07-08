import { useEffect, useMemo, useState } from "react";

import {
  RiAddFill,
  RiArrowDownSFill,
  RiArrowLeftSLine,
  RiArrowRightSFill,
  RiCalendarLine,
  RiDownloadFill,
  RiEditFill,
  RiExportFill,
  RiEyeFill,
  RiFileCopyFill,
  RiMailSendFill,
  RiMoreFill,
  RiSearchLine,
} from "react-icons/ri";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getQuotations,
  updateQuotationStatus,
} from "../services/quotationService.js";

/* ─── MOCK DATA: COTIZACIONES ─────────────────────────────── */
const MOCK_QUOTATIONS = [
  {
    id: 1,
    number: "COT-000172",
    client: "María Fernández",
    company: "Textiles de Occidente",
    date: "30/06/2024",
    validity: "15/07/2024",
    total: "€45.200,000",
    status: "Pendiente",
    agent: "Ana Gómez",
    avatar: "AG",
  },
  {
    id: 2,
    number: "COT-000171",
    client: "Constructora Solís",
    company: "Constructora Solís S.A.",
    date: "29/06/2024",
    validity: "14/07/2024",
    total: "€28.750,000",
    status: "En revisión",
    agent: "Manuel Rojas",
    avatar: "MR",
  },
  {
    id: 3,
    number: "COT-000170",
    client: "Hotel Los Laureles",
    company: "Hotel Los Laureles",
    date: "28/06/2024",
    validity: "13/07/2024",
    total: "€32.100,000",
    status: "Aprobada",
    agent: "Ana Gómez",
    avatar: "AG",
  },
  {
    id: 4,
    number: "COT-000169",
    client: "Pacific Pet Food",
    company: "Pacific Pet Food",
    date: "27/06/2024",
    validity: "12/07/2024",
    total: "€15.600,000",
    status: "Aprobada",
    agent: "Ana Gómez",
    avatar: "AG",
  },
  {
    id: 5,
    number: "COT-000168",
    client: "Distribuidora del Norte",
    company: "Distribuidora del Norte S.A.",
    date: "26/06/2024",
    validity: "11/07/2024",
    total: "€9.850,000",
    status: "Rechazada",
    agent: "Laura Gómez",
    avatar: "LG",
  },
  {
    id: 6,
    number: "COT-000167",
    client: "Farmacia La Salud",
    company: "Farmacia La Salud",
    date: "25/06/2024",
    validity: "10/07/2024",
    total: "€6.450,000",
    status: "Vencida",
    agent: "Laura Gómez",
    avatar: "LG",
  },
  {
    id: 7,
    number: "COT-000166",
    client: "Grupo Alimenticio S.A.",
    company: "Grupo Alimenticio S.A.",
    date: "24/06/2024",
    validity: "09/07/2024",
    total: "€18.500,000",
    status: "Convertida",
    agent: "Ana Gómez",
    avatar: "AG",
  },
  {
    id: 8,
    number: "COT-000165",
    client: "Constructora Víquez",
    company: "Constructora Víquez",
    date: "23/06/2024",
    validity: "08/07/2024",
    total: "€22.300,000",
    status: "Pendiente",
    agent: "Carlos Pérez",
    avatar: "CP",
  },
  {
    id: 9,
    number: "COT-000164",
    client: "Agro Occidente",
    company: "Agro Occidente Group",
    date: "22/06/2024",
    validity: "07/07/2024",
    total: "€11.800,000",
    status: "En revisión",
    agent: "Sofía Gómez",
    avatar: "SG",
  },
  {
    id: 10,
    number: "COT-000163",
    client: "Occidente Lab",
    company: "Occidente Lab",
    date: "21/06/2024",
    validity: "06/07/2024",
    total: "€7.200,000",
    status: "Aprobada",
    agent: "Diego Hernández",
    avatar: "DH",
  },
];

/* ─── CONFIGURACIÓN DE ESTADOS ────────────────────────────── */
const STATUS_CONFIG = {
  Pendiente: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  "En revisión": {
    bg: "bg-[#C9A227]/10",
    text: "text-[#C9A227]",
    border: "border-[#C9A227]/20",
  },
  Aprobada: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  Rechazada: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  Vencida: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
  Convertida: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/20",
  },
};

const STATUS_COLORS = {
  Pendiente: "#f59e0b",
  "En revisión": "#C9A227",
  Aprobada: "#22c55e",
  Rechazada: "#ef4444",
  Vencida: "#ec4899",
  Convertida: "#14b8a6",
};

const QUOTATION_STATUSES = [
  "Pendiente",
  "En revision",
  "Aprobada",
  "Rechazada",
  "Vencida",
  "Convertida",
];

const currencyFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateFormatter.format(date);
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ─── DATOS PARA GRÁFICOS ─────────────────────────────────── */
const donutData = [
  { name: "Pendientes", value: 28, count: 28 },
  { name: "En revisión", value: 16, count: 16 },
  { name: "Aprobadas", value: 82, count: 82 },
  { name: "Rechazadas", value: 12, count: 12 },
  { name: "Vencidas", value: 22, count: 22 },
  { name: "Convertidas", value: 12, count: 12 },
];

const areaData = [
  { name: "Ene", value: 45 },
  { name: "Feb", value: 52 },
  { name: "Mar", value: 48 },
  { name: "Abr", value: 60 },
  { name: "May", value: 55 },
  { name: "Jun", value: 70 },
  { name: "Jul", value: 65 },
  { name: "Ago", value: 80 },
  { name: "Sep", value: 75 },
  { name: "Oct", value: 90 },
  { name: "Nov", value: 85 },
  { name: "Dic", value: 100 },
];

const lineData = [
  { name: "Ene", value: 35 },
  { name: "Feb", value: 38 },
  { name: "Mar", value: 42 },
  { name: "Abr", value: 40 },
  { name: "May", value: 45 },
  { name: "Jun", value: 43 },
  { name: "Jul", value: 48 },
  { name: "Ago", value: 50 },
  { name: "Sep", value: 47 },
  { name: "Oct", value: 52 },
  { name: "Nov", value: 55 },
  { name: "Dic", value: 58 },
];

/* ─── COMPONENTES AUXILIARES ──────────────────────────────── */
function PagBtn({ icon, label, active = false }) {
  return (
    <button
      type="button"
      className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors cursor-pointer ${
        active
          ? "bg-[#C9A227] text-white"
          : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"
      }`}
    >
      {icon || label}
    </button>
  );
}

function ProductThumb({ item }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.name || "Producto"}
        className="h-20 w-20 rounded-lg border border-[#2a3550] bg-[#0B1120] object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[#2a3550] bg-[#10192b] text-xs font-bold text-[#C9A227]">
      IMG
    </div>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pendiente;

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${config.bg} ${config.text} ${config.border}`}
    >
      {status}
    </span>
  );
}

/* ─── PÁGINA PRINCIPAL ────────────────────────────────────── */
export default function Quotations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [companyFilter, setCompanyFilter] = useState("Todas");
  const [agentFilter, setAgentFilter] = useState("Todos");
  const [clientFilter, setClientFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError("");
      setQuotations(await getQuotations());
    } catch (loadError) {
      console.error("Quotations loading error:", loadError);
      setError(
        loadError?.message || "No fue posible cargar las cotizaciones.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadQuotations();
    });
  }, []);

  const companyOptions = useMemo(
    () => [
      "Todas",
      ...new Set(quotations.map((quotation) => quotation.company).filter(Boolean)),
    ],
    [quotations],
  );

  const agentOptions = useMemo(
    () => [
      "Todos",
      ...new Set(quotations.map((quotation) => quotation.agent).filter(Boolean)),
    ],
    [quotations],
  );

  const clientOptions = useMemo(
    () => [
      "Todos",
      ...new Set(quotations.map((quotation) => quotation.client).filter(Boolean)),
    ],
    [quotations],
  );

  const statusCounts = useMemo(
    () =>
      quotations.reduce((counts, quotation) => {
        const status = quotation.status || "Pendiente";

        counts[status] = (counts[status] || 0) + 1;

        return counts;
      }, {}),
    [quotations],
  );

  const totalQuotedValue = useMemo(
    () =>
      quotations.reduce(
        (total, quotation) => total + (Number(quotation.total) || 0),
        0,
      ),
    [quotations],
  );

  const companies = [
    "Todas",
    "Textiles de Occidente",
    "Constructora Solís S.A.",
    "Hotel Los Laureles",
    "Pacific Pet Food",
    "Distribuidora del Norte S.A.",
    "Farmacia La Salud",
    "Grupo Alimenticio S.A.",
    "Constructora Víquez",
    "Agro Occidente Group",
    "Occidente Lab",
  ];

  const agents = [
    "Todos",
    "Ana Gómez",
    "Manuel Rojas",
    "Carlos Pérez",
    "Sofía Gómez",
    "Diego Hernández",
    "Laura Gómez",
  ];

  const clients = [
    "Todos",
    "María Fernández",
    "Constructora Solís",
    "Hotel Los Laureles",
    "Pacific Pet Food",
    "Distribuidora del Norte",
    "Farmacia La Salud",
    "Grupo Alimenticio S.A.",
    "Constructora Víquez",
    "Agro Occidente",
    "Occidente Lab",
  ];

  void MOCK_QUOTATIONS;
  void donutData;
  void companies;
  void agents;
  void clients;

  const metrics = [
    {
      label: "COTIZACIONES TOTALES",
      value: String(quotations.length),
      growth: "Base real",
      growthColor: "text-green-400",
      color: "#8b5cf6",
      iconColor: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
    },
    {
      label: "PENDIENTES",
      value: String(statusCounts.Pendiente || 0),
      growth: "Por revisar",
      growthColor: "text-red-400",
      color: "#f59e0b",
      iconColor: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10",
    },
    {
      label: "EN REVISIÓN",
      value: String(statusCounts["En revision"] || statusCounts["En revisiÃ³n"] || 0),
      growth: "En seguimiento",
      growthColor: "text-green-400",
      color: "#C9A227",
      iconColor: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
    },
    {
      label: "APROBADAS",
      value: String(statusCounts.Aprobada || 0),
      growth: "Confirmadas",
      growthColor: "text-green-400",
      color: "#22c55e",
      iconColor: "text-[#22c55e]",
      bg: "bg-[#22c55e]/10",
    },
    {
      label: "RECHAZADAS",
      value: String(statusCounts.Rechazada || 0),
      growth: "No aceptadas",
      growthColor: "text-red-400",
      color: "#ef4444",
      iconColor: "text-[#ef4444]",
      bg: "bg-[#ef4444]/10",
    },
    {
      label: "VENCIDAS",
      value: String(statusCounts.Vencida || 0),
      growth: "Fuera de vigencia",
      growthColor: "text-green-400",
      color: "#ec4899",
      iconColor: "text-[#ec4899]",
      bg: "bg-[#ec4899]/10",
    },
  ];

  const filtered = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return quotations.filter((quotation) => {
      const quotationDate = quotation.date ? new Date(quotation.date) : null;

      const matchesSearch =
        !normalizedSearch ||
        normalizeSearchText(quotation.number).includes(normalizedSearch) ||
        normalizeSearchText(quotation.client).includes(normalizedSearch) ||
        normalizeSearchText(quotation.company).includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "Todos" || quotation.status === statusFilter;

      const matchesCompany =
        companyFilter === "Todas" || quotation.company === companyFilter;

      const matchesAgent =
        agentFilter === "Todos" || quotation.agent === agentFilter;

      const matchesClient =
        clientFilter === "Todos" || quotation.client === clientFilter;

      const matchesFrom =
        !fromDate ||
        (quotationDate &&
          !Number.isNaN(quotationDate.getTime()) &&
          quotationDate >= fromDate);

      const matchesTo =
        !toDate ||
        (quotationDate &&
          !Number.isNaN(quotationDate.getTime()) &&
          quotationDate <= toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCompany &&
        matchesAgent &&
        matchesClient &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    agentFilter,
    clientFilter,
    companyFilter,
    dateFrom,
    dateTo,
    quotations,
    search,
    statusFilter,
  ]);

  const openQuotationModal = (quotation) => {
    setSelectedQuotation(quotation);
  };

  const closeQuotationModal = () => {
    setSelectedQuotation(null);
  };

  const handleQuotationStatus = async (status) => {
    if (!selectedQuotation) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await updateQuotationStatus(selectedQuotation.quotationId, status);
      await loadQuotations();
      setSelectedQuotation((currentQuotation) => ({
        ...currentQuotation,
        status,
      }));
    } catch (statusError) {
      console.error("Quotation status update error:", statusError);
      setError(
        statusError?.message ||
          "No fue posible actualizar el estado de la cotizacion.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setCompanyFilter("Todas");
    setAgentFilter("Todos");
    setClientFilter("Todos");
    setDateFrom("");
    setDateTo("");
  };

  const dynamicDonutData = QUOTATION_STATUSES.map((status) => ({
    name: status,
    value: statusCounts[status] || 0,
    count: statusCounts[status] || 0,
  }));
  const drawerOpen = false;
  const drawerMode = "view";
  const viewQuote = selectedQuotation;
  const closeDrawer = closeQuotationModal;

  return (
    <>
      <div className="p-4 lg:p-6">
        {/* Encabezado de la página */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>Comercial</span>
              <span>/</span>
              <span className="text-gray-300">Cotizaciones</span>
            </div>

            <h1 className="text-xl font-bold text-white">
              Cotizaciones
            </h1>

            <p className="text-sm text-gray-400 mt-0.5">
              Gestiona y da seguimiento a todas las cotizaciones del grupo.
            </p>
          </div>

          <button
            type="button"
            onClick={loadQuotations}
            className="flex items-center justify-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20 cursor-pointer"
          >
            <RiDownloadFill size={16} />
            Actualizar cotizaciones
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center ${metric.iconColor}`}
                >
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: metric.color }}
                  />
                </div>
              </div>

              <div className="text-xl font-bold text-white">
                {metric.value}
              </div>

              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
                {metric.label}
              </div>

              <div
                className={`text-xs font-medium mt-1 ${metric.growthColor}`}
              >
                {metric.growth} vs. mes anterior
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <RiSearchLine
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                Cliente
              </label>

              <div className="relative">
                <select
                  value={clientFilter}
                  onChange={(event) =>
                    setClientFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {clientOptions.map((client) => (
                    <option key={client}>{client}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                Empresa
              </label>

              <div className="relative">
                <select
                  value={companyFilter}
                  onChange={(event) =>
                    setCompanyFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {companyOptions.map((company) => (
                    <option key={company}>{company}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                Estado
              </label>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                  <option value="Vencida">Vencida</option>
                  <option value="Convertida">Convertida</option>
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                Vendedor
              </label>

              <div className="relative">
                <select
                  value={agentFilter}
                  onChange={(event) =>
                    setAgentFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {agentOptions.map((agent) => (
                    <option key={agent}>{agent}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                Fecha desde
              </label>

              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                Fecha hasta
              </label>

              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>

              <button
                type="button"
                className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* Tabla de cotizaciones */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a3550]">
            <h3 className="text-sm font-semibold text-white">
              Listado de Cotizaciones
            </h3>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RiExportFill size={13} />
              Exportar
              <RiArrowDownSFill size={12} />
            </button>
          </div>

          <table className="w-full text-left hidden md:table">
            <thead>
              <tr className="border-b border-[#2a3550]">
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2a3550]">
              {filtered.map((quotation) => (
                <tr
                  key={quotation.id}
                  onClick={() => openQuotationModal(quotation)}
                  className="hover:bg-[#1c2538]/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {quotation.number}
                  </td>

                  <td className="px-4 py-3 text-sm text-white">
                    {quotation.client}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-300">
                    {quotation.company}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(quotation.date)}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(quotation.validity)}
                  </td>

                  <td className="px-4 py-3 text-sm text-white font-semibold">
                    {formatCurrency(quotation.total)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={quotation.status} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                        {quotation.avatar}
                      </div>

                      <span className="text-sm text-gray-300">
                        {quotation.agent}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openQuotationModal(quotation);
                        }}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Ver"
                      >
                        <RiEyeFill size={13} />
                      </button>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <RiEditFill size={13} />
                      </button>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Descargar"
                      >
                        <RiDownloadFill size={13} />
                      </button>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Enviar"
                      >
                        <RiMailSendFill size={13} />
                      </button>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Clonar"
                      >
                        <RiFileCopyFill size={13} />
                      </button>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Más opciones"
                      >
                        <RiMoreFill size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <RiSearchLine size={28} className="text-gray-600 animate-pulse" />

              <p className="text-sm text-gray-500">
                Cargando cotizaciones...
              </p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <RiSearchLine size={28} className="text-gray-600" />

              <p className="text-sm text-gray-500">
                No se encontraron cotizaciones
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#C9A227] hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
            <span className="text-xs text-gray-500">
              Mostrando {filtered.length === 0 ? 0 : 1} a {filtered.length} de{" "}
              {quotations.length} cotizaciones
            </span>

            <div className="flex items-center gap-1">
              <PagBtn icon={<RiArrowLeftSLine size={14} />} />

              {[1, 2, 3, 4, 5].map((page) => (
                <PagBtn
                  key={page}
                  label={page}
                  active={page === 1}
                />
              ))}

              <PagBtn icon={<RiArrowRightSFill size={14} />} />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">
              Cotizaciones por estado
            </h3>

            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {dynamicDonutData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={Object.values(STATUS_COLORS)[index]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {quotations.length}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Total
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {dynamicDonutData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{
                          backgroundColor:
                            Object.values(STATUS_COLORS)[index],
                        }}
                      />

                      <span className="text-gray-300">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {item.count}
                      </span>

                      <span className="text-gray-500">
                        (
                        {quotations.length
                          ? Math.round((item.count / quotations.length) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              Valor total de cotizaciones
            </h3>

            <div className="text-xl font-bold text-white mb-1">
              {formatCurrency(totalQuotedValue)}
            </div>

            <div className="text-xs text-green-400 mb-4">
              +14% vs. mes anterior
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient
                      id="colorValue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#C9A227"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#C9A227"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3550"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis hide />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141d2e",
                      border: "1px solid #2a3550",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#C9A227"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              Tasa de conversión
            </h3>

            <div className="text-xl font-bold text-white mb-1">
              47.7%
            </div>

            <div className="text-xs text-green-400 mb-4">
              +6% vs. mes anterior
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3550"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis hide />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141d2e",
                      border: "1px solid #2a3550",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#22c55e" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Fondo del drawer */}
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel de cotización"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#2a3550] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && (
                <>
                  <RiAddFill size={20} className="text-[#C9A227]" />
                  Nueva Cotización
                </>
              )}

              {drawerMode === "view" && (
                <>
                  <RiEyeFill size={20} className="text-[#C9A227]" />
                  Detalle de Cotización
                </>
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create"
                ? "Completa los datos de la nueva cotización."
                : "Información completa de la cotización."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {drawerMode === "view" && viewQuote && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div className="w-14 h-14 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-lg font-bold text-[#C9A227]">
                  {viewQuote.number.slice(-3)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {viewQuote.number}
                  </h3>

                  <StatusBadge status={viewQuote.status} />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Cliente", value: viewQuote.client },
                  { label: "Empresa", value: viewQuote.company },
                  { label: "Fecha", value: viewQuote.date },
                  { label: "Vigencia", value: viewQuote.validity },
                  { label: "Total", value: viewQuote.total },
                  { label: "Vendedor", value: viewQuote.agent },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550]"
                  >
                    <span className="text-xs text-gray-500">
                      {label}
                    </span>

                    <span className="text-sm text-white font-medium text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {drawerMode === "create" && (
            <div className="text-sm text-gray-400">
              El formulario de creación se incorporará en el siguiente paso.
            </div>
          )}
        </div>

        {drawerMode === "view" && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#2a3550] flex-shrink-0">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {selectedQuotation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#102441] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#2a3550] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#35547E] bg-[#091A31] text-[#C9A227]">
                  <RiEyeFill size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-white">
                    {selectedQuotation.number}
                  </h2>
                  <p className="truncate text-sm text-gray-400">
                    {selectedQuotation.client} - {selectedQuotation.agent}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeQuotationModal}
                className="h-10 w-10 flex-shrink-0 rounded-xl border border-[#35547E] text-xl text-white transition hover:border-[#C9A227] hover:bg-[#1c2538]"
                aria-label="Cerrar detalle"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                {[
                  { label: "Estado", value: selectedQuotation.status },
                  { label: "Fecha", value: formatDate(selectedQuotation.date) },
                  {
                    label: "Vigencia",
                    value: formatDate(selectedQuotation.validity),
                  },
                  {
                    label: "Total",
                    value: formatCurrency(selectedQuotation.total),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#2a3550] bg-[#091A31] p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">
                    Cliente
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.company}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedQuotation.legalName || "Sin razon social"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedQuotation.legalId || "Sin cedula juridica"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">
                    Sucursal
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.branch?.address || "Sin direccion"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {[selectedQuotation.branch?.province, selectedQuotation.branch?.district]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicacion"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">
                    Representante
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.representative?.name ||
                      "Sin representante"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedQuotation.representative?.email || "Sin correo"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#2a3550]">
                <div className="border-b border-[#2a3550] bg-[#091A31] px-4 py-3">
                  <h3 className="text-sm font-bold text-white">
                    Articulos cotizados
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-[#2a3550]">
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Precio
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          IVA
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3550]">
                      {selectedQuotation.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductThumb item={item} />
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold text-white">
                                  {item.name}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {item.productId}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {formatCurrency(item.ivaAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-white">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="mt-4 rounded-xl border border-[#2a3550] bg-[#091A31] p-4">
                  <h3 className="text-sm font-bold text-white">Notas</h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {selectedQuotation.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#2a3550] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleQuotationStatus("Rechazada")}
                disabled={updatingStatus}
                className="rounded-xl border border-red-400/40 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Rechazar
              </button>

              <button
                type="button"
                onClick={() => handleQuotationStatus("Aprobada")}
                disabled={updatingStatus}
                className="rounded-xl border border-green-400/40 bg-green-500/15 px-5 py-2.5 text-sm font-bold text-green-100 transition hover:bg-green-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus ? "Guardando..." : "Aprobar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
