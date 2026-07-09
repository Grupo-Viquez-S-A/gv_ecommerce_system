import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  RiBarChartBoxFill,
  RiClipboardFill,
  RiGroupFill,
  RiShoppingBagFill,
} from "react-icons/ri";

import { useAuth } from "../context/AuthContext.js";

import { getDashboardOverview } from "../services/dashboardService.js";

import DashboardGreeting from "../components/dashboard/DashboardGreeting.jsx";
import DashboardDateSelector from "../components/dashboard/DashboardDateSelector.jsx";
import DashboardStats from "../components/dashboard/DashboardStats.jsx";
import ConsolidatedSalesChart from "../components/dashboard/ConsolidatedSalesChart.jsx";
import SalesDistributionChart from "../components/dashboard/SalesDistributionChart.jsx";
import TopClients from "../components/dashboard/TopClients.jsx";
import CompanyPerformance from "../components/dashboard/CompanyPerformance.jsx";
import AdvisorRanking from "../components/dashboard/AdvisorRanking.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";
import DashboardFooter from "../components/dashboard/DashboardFooter.jsx";

const RI_ICONS = {
  clients: <RiGroupFill size={20} />,
  sales: <RiBarChartBoxFill size={20} />,
  quotes: <RiClipboardFill size={20} />,
  orders: <RiShoppingBagFill size={20} />,
};

export default function Dashboard() {
  const { user } = useAuth();

  const { currentCompany } = useOutletContext() || {};

  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handlePlaceholderAction = () => {
    // Aquí se conectarán filtros, reportes y navegaciones futuras.
    // NOTA: El selector de fechas (DashboardDateSelector) sigue siendo un
    // placeholder visual; el filtrado por rango de fechas queda pendiente.
  };

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      setIsLoading(true);

      const data = await getDashboardOverview();

      if (isMounted) {
        setOverview(data);
        setIsLoading(false);
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = overview?.stats?.data;
  const statsCards = stats
    ? [
        {
          id: "clients",
          icon: RI_ICONS.clients,
          label: "Clientes Totales",
          value: stats.totalClients.toLocaleString("es-CR"),
          colorClass: "bg-[#C9A227]",
        },
        {
          id: "sales",
          icon: RI_ICONS.sales,
          label: "Ventas Consolidadas",
          value: stats.totalSalesLabel,
          colorClass: "bg-[#f59e0b]",
        },
        {
          id: "quotes",
          icon: RI_ICONS.quotes,
          label: "Cotizaciones Activas",
          value: stats.activeQuotations.toLocaleString("es-CR"),
          colorClass: "bg-[#6366f1]",
        },
        {
          id: "orders",
          icon: RI_ICONS.orders,
          label: "Pedidos Activos",
          value: stats.activeOrders.toLocaleString("es-CR"),
          colorClass: "bg-[#22c55e]",
        },
      ]
    : null;

  return (
    <div className="p-4 lg:p-6">
      <DashboardGreeting
        user={user}
        currentCompany={currentCompany}
      />

      <DashboardDateSelector
        label="1 - 30 de junio, 2024"
        onClick={handlePlaceholderAction}
      />

      <DashboardStats
        stats={statsCards}
        isLoading={isLoading}
        error={overview?.stats?.error}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ConsolidatedSalesChart
          data={overview?.salesChart?.data?.data || []}
          legendItems={overview?.salesChart?.data?.legendItems}
          totalLabel={overview?.salesChart?.data?.totalLabel}
          periodLabel="Este año"
          onPeriodClick={handlePlaceholderAction}
          isLoading={isLoading}
          error={overview?.salesChart?.error}
        />

        <SalesDistributionChart
          data={overview?.distribution?.data?.data || []}
          totalLabel={overview?.distribution?.data?.totalLabel}
          onViewDetails={handlePlaceholderAction}
          isLoading={isLoading}
          error={overview?.distribution?.error}
        />
      </div>

      <TopClients
        clients={overview?.topClients?.data || []}
        periodLabel="Este mes"
        onPeriodClick={handlePlaceholderAction}
        onViewAll={handlePlaceholderAction}
        isLoading={isLoading}
        error={overview?.topClients?.error}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <CompanyPerformance
          performance={overview?.companyPerformance?.data || []}
          onViewReport={handlePlaceholderAction}
          isLoading={isLoading}
          error={overview?.companyPerformance?.error}
        />

        <AdvisorRanking
          advisors={overview?.advisorRanking?.data || []}
          periodLabel="Este mes"
          onPeriodClick={handlePlaceholderAction}
          onViewRanking={handlePlaceholderAction}
          isLoading={isLoading}
          error={overview?.advisorRanking?.error}
        />

        <RecentActivity
          activities={overview?.recentActivity?.data || []}
          onViewAll={handlePlaceholderAction}
          isLoading={isLoading}
          error={overview?.recentActivity?.error}
        />
      </div>

      <DashboardFooter />
    </div>
  );
}
