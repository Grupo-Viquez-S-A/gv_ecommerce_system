import {
  RiDashboardFill,
  RiGroupFill,
  RiUserFill,
  RiClipboardFill,
  RiCalendarFill,
  RiSettings4Fill,
  RiArrowDownSFill,
  RiLogoutBoxLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiExchangeFill,
  RiStoreFill,
  RiFileListFill,
  RiBarChartFill,
  RiShoppingBagFill,
} from "react-icons/ri";
import { useAuth } from "../context/AuthContext.js";
import { Link, useLocation } from "react-router-dom";
import GVLogo from "../assets/images/0E7BFEE5-FB79-49F7-9E7D-DE47EBC12758.png";

function DashSideBar({
  sidebarCollapsed,
  sidebarOpen,
  currentCompany,
  toggleCollapse,
  toggleSidebar,
  setSidebarOpen,
}) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const NavItem = ({ icon, label, to, active = false, collapsed }) => {
    const isActive = active || (to && location.pathname === to);
    const content = (
      <div
        title={collapsed ? label : undefined}
        className={`flex items-center gap-3 py-2.5 text-sm transition-colors ${
          collapsed ? "justify-center px-0 mx-2 rounded-lg" : "px-4"
        } ${
          isActive
            ? "text-white bg-[#1e3a5f] border-r-2 border-[#C9A227]"
            : "text-gray-400 hover:text-white hover:bg-[#141a2a] " +
              (collapsed ? "rounded-lg" : "")
        }`}
      >
        <span className={isActive ? "text-[#C9A227]" : ""}>{icon}</span>
        {!collapsed && <span className="whitespace-nowrap">{label}</span>}
      </div>
    );
    if (to) {
      return (
        <Link to={to} onClick={() => setSidebarOpen(false)} className="block">
          {content}
        </Link>
      );
    }
    return (
      <button className="block w-full text-left" onClick={() => {}}>
        {content}
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0f1623] border-r border-[#1f2a40] min-h-screen flex-shrink-0 transition-all duration-300 overflow-hidden ${
          sidebarCollapsed ? "w-[64px]" : "w-64"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`flex items-center border-b border-[#1f2a40] h-14 flex-shrink-0 ${
            sidebarCollapsed ? "justify-center px-0" : "px-4 gap-3"
          }`}
        >
          <div className="w-8 h-8 rounded bg-blue-800 flex items-center justify-center flex-shrink-0">
            <img className="w-6 h-6" src={GVLogo} alt="GV" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-sm tracking-wider flex-1 whitespace-nowrap">
              Grupo Víquez
            </span>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={toggleCollapse}
              className="ml-auto text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-[#141a2a]"
              title="Colapsar menú"
            >
              <RiArrowLeftSLine size={18} />
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={toggleCollapse}
              className="text-gray-500 hover:text-white transition-colors"
              title="Expandir menú"
            >
              <RiArrowRightSLine size={18} />
            </button>
          )}
        </div>
        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* COMERCIAL */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-1 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Comercial
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="my-1 mx-3 border-t border-[#1f2a40]" />
          )}
          <NavItem
            icon={<RiDashboardFill size={18} />}
            label="Dashboard"
            to="/dashboard"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<RiBarChartFill size={18} />}
            label="Reportes"
            collapsed={sidebarCollapsed}
          />

          {/* VENTAS */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Ventas
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="my-1 mx-3 border-t border-[#1f2a40]" />
          )}
          <NavItem
            icon={<RiShoppingBagFill size={18} />}
            label="Catálogo"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<RiGroupFill size={18} />}
            label="Clientes"
            to="/clientes"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<RiUserFill size={18} />}
            label="Agentes"
            to="/agentes"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<RiClipboardFill size={18} />}
            label="Cotizaciones"
            to="/cotizaciones"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<RiStoreFill size={18} />}
            label="Ventas"
            to="/ventas"
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<RiFileListFill size={18} />}
            label="Pedidos"
            to="/pedidos"
            collapsed={sidebarCollapsed}
          />

          {/* OPERACIONES */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Operaciones
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="my-1 mx-3 border-t border-[#1f2a40]" />
          )}
          <NavItem
            icon={<RiCalendarFill size={18} />}
            label="Agenda"
            to="/agenda"
            collapsed={sidebarCollapsed}
          />

          {/* SISTEMA */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Sistema
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="my-1 mx-3 border-t border-[#1f2a40]" />
          )}
          <NavItem
            icon={<RiSettings4Fill size={18} />}
            label="Administración de Usuarios"
            to="/admin/usuarios"
            collapsed={sidebarCollapsed}
          />
        </nav>

        {/* User profile */}
        <div
          className={`border-t border-[#1f2a40] flex-shrink-0 ${
            sidebarCollapsed ? "py-3 flex flex-col items-center gap-2" : "p-4"
          }`}
        >
          {sidebarCollapsed ? (
            <>
              <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-xs font-bold">
                {user?.fullName
                  ? user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U"}
              </div>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <RiLogoutBoxLine size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user?.fullName
                    ? user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user?.fullName || "Usuario"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user?.role?.name || "Usuario"}
                    {user?.department?.name ? ` - ${user.department.name}` : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <RiLogoutBoxLine size={16} />
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar (overlay) */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#0f1623] border-r border-[#1f2a40]">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1f2a40]">
            <div className="w-8 h-8 rounded bg-[#c9a227] flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[#0B1120] text-sm">GV</span>
            </div>
            <span className="font-bold text-sm tracking-wider">
              Grupo Víquez
            </span>
            <button
              onClick={toggleSidebar}
              className="ml-auto text-gray-500 hover:text-white"
            >
              <RiArrowLeftSLine size={20} />
            </button>
          </div>
          <div className="px-4 py-3 border-b border-[#1f2a40]">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              Vista activa
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentCompany.color }}
              />
              <span>{currentCompany.name}</span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            <div className="px-4 pb-1 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Comercial
              </span>
            </div>
            <NavItem
              icon={<RiDashboardFill size={18} />}
              label="Dashboard"
              to="/dashboard"
              collapsed={false}
            />
            <NavItem
              icon={<RiBarChartFill size={18} />}
              label="Reportes"
              collapsed={false}
            />
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Ventas
              </span>
            </div>
            <NavItem
              icon={<RiGroupFill size={18} />}
              label="Clientes"
              collapsed={false}
            />
            <NavItem
              icon={<RiUserFill size={18} />}
              label="Agentes"
              collapsed={false}
            />
            <NavItem
              icon={<RiClipboardFill size={18} />}
              label="Cotizaciones"
              to="/cotizaciones"
              collapsed={false}
            />
            <NavItem
              icon={<RiStoreFill size={18} />}
              label="Ventas"
              to="/ventas"
              collapsed={false}
            />
            <NavItem
              icon={<RiFileListFill size={18} />}
              label="Pedidos"
              to="/pedidos"
              collapsed={false}
            />
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Operaciones
              </span>
            </div>
            <NavItem
              icon={<RiCalendarFill size={18} />}
              label="Agenda"
              to="/agenda"
              collapsed={false}
            />
            <NavItem
              icon={<RiExchangeFill size={18} />}
              label="Transferencias"
              collapsed={false}
            />
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Sistema
              </span>
            </div>
            <NavItem
              icon={<RiSettings4Fill size={18} />}
              label="Configuración"
              to="/admin/usuarios"
              collapsed={false}
            />
          </nav>
          <div className="p-4 border-t border-[#1f2a40]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-xs font-bold">
                {user?.fullName
                  ? user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U"}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {user?.fullName || "Usuario"}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role?.name || "Usuario"}
                  {user?.department?.name ? ` - ${user.department.name}` : ""}
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <RiLogoutBoxLine size={16} />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

export default DashSideBar;
