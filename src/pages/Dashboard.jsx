import { useOutletContext } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";

import {
  ADVISORS,
  BAR_DATA,
  COMPANY_PERFORMANCE,
  DONUT_DATA,
  RECENT_ACTIVITIES,
  TOP_CLIENTS,
} from "../data/dashboardMockData.js";

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

export default function Dashboard() {
  const { user } = useAuth();

  const { currentCompany } = useOutletContext() || {};

  const handlePlaceholderAction = () => {
    // Aquí se conectarán filtros, reportes y navegaciones futuras.
  };

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

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ConsolidatedSalesChart
          data={BAR_DATA}
          totalLabel="₡1,050 M"
          periodLabel="Este año"
          onPeriodClick={handlePlaceholderAction}
        />

        <SalesDistributionChart
          data={DONUT_DATA}
          totalLabel="₡185 M"
          onViewDetails={handlePlaceholderAction}
        />
      </div>

      <TopClients
        clients={TOP_CLIENTS}
        periodLabel="Este mes"
        onPeriodClick={handlePlaceholderAction}
        onViewAll={handlePlaceholderAction}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <CompanyPerformance
          performance={COMPANY_PERFORMANCE}
          onViewReport={handlePlaceholderAction}
        />

        <AdvisorRanking
          advisors={ADVISORS}
          periodLabel="Este mes"
          onPeriodClick={handlePlaceholderAction}
          onViewRanking={handlePlaceholderAction}
        />

        <RecentActivity
          activities={RECENT_ACTIVITIES}
          onViewAll={handlePlaceholderAction}
        />
      </div>

      <DashboardFooter />
    </div>
  );
}
