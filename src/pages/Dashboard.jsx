import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";

import {
  RiArrowDownSFill,
  RiLogoutBoxLine,
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
} from "react-icons/ri";

import {
  ADVISORS,
  BAR_DATA,
  COMPANY_PERFORMANCE,
  DASHBOARD_AVATAR_COLORS,
  DASHBOARD_COMPANIES,
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

const DEFAULT_COMPANY = DASHBOARD_COMPANIES[0];

function normalizeCompany(company, index = 0) {
  return {
    ...DEFAULT_COMPANY,
    ...(company || {}),
    name: company?.name || DEFAULT_COMPANY.name,
    color:
      company?.color ||
      DASHBOARD_AVATAR_COLORS[
        index % DASHBOARD_AVATAR_COLORS.length
      ] ||
      DEFAULT_COMPANY.color,
  };
}

export default function Dashboard() {
  const { user, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);

  const [currentCompany, setCurrentCompany] = useState(() =>
    normalizeCompany(
      user?.activeCompany ||
        user?.companies?.[0] ||
        DEFAULT_COMPANY,
    ),
  );

  const availableCompanies = useMemo(() => {
    const userCompanies =
      Array.isArray(user?.companies) && user.companies.length > 0
        ? user.companies
        : DASHBOARD_COMPANIES;

    return userCompanies.map((company, index) =>
      normalizeCompany(company, index),
    );
  }, [user]);

  useEffect(() => {
    const preferredCompany =
      user?.activeCompany || user?.companies?.[0];

    if (preferredCompany) {
      setCurrentCompany(normalizeCompany(preferredCompany));
    }
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen((previousValue) => !previousValue);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed((previousValue) => !previousValue);
  };

  const handlePlaceholderAction = () => {
    // Aquí se conectarán los filtros, reportes y navegaciones futuras.
  };

  return (
    <div className="w-full h-screen bg-[#0B1120] text-white flex overflow-hidden">
      <DashSideBar
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        currentCompany={currentCompany}
        toggleCollapse={toggleCollapse}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-[#1c2538] border-b border-[#2a3550] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="lg:hidden text-gray-400 hover:text-white cursor-pointer"
              aria-label="Abrir menú lateral"
            >
              <RiMenuFill size={22} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setCompanyDropdown((previousValue) => !previousValue)
                }
                className="flex items-center gap-2 text-sm font-medium text-white hover:bg-[#222e44] px-3 py-1.5 rounded-lg transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      currentCompany?.color || DEFAULT_COMPANY.color,
                  }}
                />

                <span>{currentCompany?.name || DEFAULT_COMPANY.name}</span>

                <RiArrowDownSFill
                  size={16}
                  className="text-gray-400"
                />
              </button>

              {companyDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#1c2538] border border-[#2a3550] rounded-lg shadow-xl z-50 py-1">
                  {availableCompanies.map((company, index) => (
                    <button
                      key={company.id || `${company.name}-${index}`}
                      type="button"
                      onClick={() => {
                        setCurrentCompany(company);
                        setCompanyDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#C9A227]/15 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            company.color ||
                            DASHBOARD_AVATAR_COLORS[
                              index % DASHBOARD_AVATAR_COLORS.length
                            ],
                        }}
                      />

                      <span className="truncate">{company.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer"
              aria-label="Notificaciones"
            >
              <RiNotification3Fill size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer"
              aria-label="Configuración"
            >
              <RiSettings4Fill size={16} />
            </button>

            <button
              type="button"
              onClick={signOut}
              className="w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors cursor-pointer"
              aria-label="Cerrar sesión"
            >
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
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
        </main>
      </div>
    </div>
  );
}