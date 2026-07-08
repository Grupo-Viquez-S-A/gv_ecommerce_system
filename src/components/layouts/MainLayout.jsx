import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.js";
import DashSideBar from "../dashSideBar.jsx";
import AppTopBar from "../AppTopBar.jsx";

const DEFAULT_COMPANY = {
  name: "Grupo Víquez S.A.",
  color: "#C9A227",
};

const COMPANY_COLORS = [
  "#C9A227",
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
];

function normalizeCompany(company, index = 0) {
  if (typeof company === "string") {
    return {
      name: company,
      color: COMPANY_COLORS[index % COMPANY_COLORS.length],
    };
  }

  return {
    name: company?.name || DEFAULT_COMPANY.name,
    color:
      company?.color ||
      COMPANY_COLORS[index % COMPANY_COLORS.length],
    ...company,
  };
}

export default function MainLayout() {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [currentCompany, setCurrentCompany] = useState(DEFAULT_COMPANY);

  useEffect(() => {
    const userCompany =
      user?.activeCompany || user?.companies?.[0];

    if (userCompany) {
      setCurrentCompany(normalizeCompany(userCompany));
    }
  }, [user]);

  const availableCompanies =
    user?.companies?.length > 0
      ? user.companies
      : [DEFAULT_COMPANY];

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed((isCollapsed) => !isCollapsed);
  };

  const handleCompanyChange = (company) => {
    setCurrentCompany(normalizeCompany(company));
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
        <AppTopBar
          currentCompany={currentCompany}
          companies={availableCompanies}
          onCompanyChange={handleCompanyChange}
          onOpenSidebar={toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ currentCompany }} />
        </main>
      </div>
    </div>
  );
}