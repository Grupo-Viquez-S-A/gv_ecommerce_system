import { useState } from "react";
import {
  RiArrowDownSFill,
  RiMenuFill,
  RiNotification3Fill,
} from "react-icons/ri";

const FALLBACK_COMPANY = {
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
    name: company?.name || FALLBACK_COMPANY.name,
    color:
      company?.color ||
      COMPANY_COLORS[index % COMPANY_COLORS.length],
    ...company,
  };
}

export default function AppTopBar({
  currentCompany = FALLBACK_COMPANY,
  companies = [],
  onCompanyChange,
  onOpenSidebar,
  onNotificationsClick,
}) {
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  const normalizedCurrentCompany = normalizeCompany(currentCompany);

  const availableCompanies =
    companies.length > 0
      ? companies.map((company, index) =>
          normalizeCompany(company, index)
        )
      : [FALLBACK_COMPANY];

  const handleCompanyChange = (company) => {
    onCompanyChange?.(company);
    setCompanyDropdownOpen(false);
  };

  return (
    <header className="h-14 bg-[#1c2538] border-b border-[#2a3550] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden text-gray-400 hover:text-white cursor-pointer transition-colors"
          aria-label="Abrir menú lateral"
        >
          <RiMenuFill size={22} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setCompanyDropdownOpen((isOpen) => !isOpen)
            }
            className="flex items-center gap-2 text-sm font-medium text-white hover:bg-[#222e44] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            aria-expanded={companyDropdownOpen}
            aria-haspopup="menu"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: normalizedCurrentCompany.color,
              }}
            />

            <span className="hidden sm:inline">
              {normalizedCurrentCompany.name}
            </span>

            <RiArrowDownSFill
              size={16}
              className="text-gray-400"
            />
          </button>

          {companyDropdownOpen && (
            <div
              role="menu"
              className="absolute top-full left-0 mt-1 w-56 bg-[#1c2538] border border-[#2a3550] rounded-lg shadow-xl z-50 py-1"
            >
              {availableCompanies.map((company, index) => (
                <button
                  key={company.id || `${company.name}-${index}`}
                  type="button"
                  role="menuitem"
                  onClick={() => handleCompanyChange(company)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    company.name === normalizedCurrentCompany.name
                      ? "text-white bg-[#C9A227]/15"
                      : "text-gray-300 hover:text-white hover:bg-[#C9A227]/15"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: company.color }}
                  />

                  {company.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="invisible pointer-events-none relative w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <RiNotification3Fill size={16} />

          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
