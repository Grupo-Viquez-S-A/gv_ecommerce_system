import { RiAddFill, RiArrowRightSLine, RiShieldStarFill } from "react-icons/ri";

export default function AdminOverview({ activeTab, setActiveTab, openRoleDrawer, openCreateDrawer, metrics, tabs }) {
  const TABS = tabs;
  return <>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <span>Configuración</span>
          <RiArrowRightSLine size={14} />
          <span className="text-gray-300">Gestión de Usuarios</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Gestión de Usuarios
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Administra los usuarios asignados al e-commerce, sus accesos,
              roles y empresas relacionadas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {activeTab === "usuarios" && (
              <>
                <button
                  type="button"
                  onClick={openRoleDrawer}
                  className="flex items-center gap-2 bg-[#141d2e] hover:bg-[#C9A227]/15 border border-[#2a3550] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RiShieldStarFill
                    size={16}
                    className="text-[#f59e0b]"
                  />
                  Nuevo Rol
                </button>

                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RiAddFill size={18} />
                  Nuevo Usuario
                </button>
              </>
            )}

            {activeTab === "roles" && (
              <button
                type="button"
                onClick={openRoleDrawer}
                className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RiAddFill size={18} />
                Nuevo Rol
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/40 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg ${metric.color} flex items-center justify-center ${metric.iconColor} mb-2`}
              >
                {metric.icon}
              </div>

              <div className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">
                {metric.label}
              </div>

              <div className="text-2xl font-bold text-white">
                {metric.value}
              </div>

              <div className="text-xs text-gray-500 mt-0.5">
                {metric.detail}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-[#2a3550] mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${activeTab === tab.key
                ? "border-[#C9A227] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
  </>;
}

