import { useState } from "react";
import {
  RiArrowDownSFill,
  RiMenuFill,
  RiNotification3Fill,
  RiSettings4Fill,
} from "react-icons/ri";

const DEFAULT_COMPANY = {
  name: "Grupo Víquez S.A.",
  color: "#C9A227",
};

export default function CommercialTopBar({
  currentCompany = DEFAULT_COMPANY,
  companies = [],
  onCompanyChange,
  onOpenSidebar,
  sectionLabel = "Comercial",
  pageLabel = "Agentes",
  onNotificationsClick,
  onSettingsClick,
}) {
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const availableCompanies = companies.filter(
    (company) => company !== "Todas"
  );

  const companyName = currentCompany?.name || DEFAULT_COMPANY.name;
  const companyColor = currentCompany?.color || DEFAULT_COMPANY.color;

  const handleCompanyChange = (company) => {
    onCompanyChange?.({
      name: company,
      color: "#C9A227",
    });

    setIsCompanyDropdownOpen(false);
  };

  return (
    <header className="h-14 border-b border-[#2a3550] flex items-center justify-between px-5 flex-shrink-0 bg-[#0B1120]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
          aria-label="Abrir menú lateral"
        >
          <RiMenuFill size={20} />
        </button>

        <span className="text-xs text-gray-500">{sectionLabel}</span>
        <span className="text-gray-600">/</span>
        <span className="text-xs text-white font-medium">{pageLabel}</span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Selector de empresa */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setIsCompanyDropdownOpen((isOpen) => !isOpen)
            }
            className="flex items-center gap-2 text-sm text-white hover:bg-[#1c2538] px-3 py-1.5 rounded-lg transition-colors"
            aria-expanded={isCompanyDropdownOpen}
            aria-haspopup="menu"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: companyColor }}
            />

            <span className="hidden sm:inline">{companyName}</span>

            <RiArrowDownSFill size={14} className="text-gray-500" />
          </button>

          {isCompanyDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-[#141d2e] border border-[#2a3550] rounded-xl shadow-xl z-50 py-1"
            >
              {availableCompanies.map((company) => (
                <button
                  key={company}
                  type="button"
                  role="menuitem"
                  onClick={() => handleCompanyChange(company)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    company === companyName
                      ? "text-white bg-[#C9A227]/15"
                      : "text-gray-300 hover:text-white hover:bg-[#C9A227]/15"
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative text-gray-400 hover:text-white transition-colors"
          aria-label="Ver notificaciones"
          title="Notificaciones"
        >
          <RiNotification3Fill size={18} />

          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Configuración */}
        <button
          type="button"
          onClick={onSettingsClick}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Abrir configuración"
          title="Configuración"
        >
          <RiSettings4Fill size={18} />
        </button>
      </div>
    </header>
  );
}