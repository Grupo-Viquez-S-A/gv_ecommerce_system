import {
  RiDashboardFill,
  RiGroupFill,
  RiUserFill,
  RiClipboardFill,
  RiSettings4Fill,
  RiLogoutBoxLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiStoreFill,
  RiFileListFill,
  RiShoppingBagFill,
  RiMapPinLine,
  RiCustomerService2Fill,
} from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { isClientAccount, hasSystemAccess, isSalesAgent } from "../utils/roles.js";

import GVLogo from "../assets/images/0E7BFEE5-FB79-49F7-9E7D-DE47EBC12758.png";

const DEFAULT_COMPANY = {
  name: "Grupo Víquez S.A",
  color: "#C9A227",
};

function getUserInitials(fullName) {
  if (!fullName) {
    return "U";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isRouteActive(pathname, route) {
  if (!route) {
    return false;
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

function NavItem({
  icon,
  label,
  to,
  active = false,
  collapsed = false,
  onNavigate,
}) {
  const location = useLocation();
  const isActive = active || isRouteActive(location.pathname, to);

  const itemContent = (
    <div
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 py-2.5 text-sm transition-colors ${
        collapsed ? "justify-center mx-2 rounded-lg px-0" : "px-4"
      } ${
        isActive
          ? "border-r-2 border-[#C9A227] bg-[#C9A227]/15 text-white"
          : `text-gray-300 hover:bg-[#1c2538] hover:text-white ${
              collapsed ? "rounded-lg" : ""
            }`
      }`}
    >
      <span className={isActive ? "text-[#C9A227]" : ""}>
        {icon}
      </span>

      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} onClick={onNavigate} className="block">
        {itemContent}
      </Link>
    );
  }

  return (
    <button type="button" className="block w-full text-left">
      {itemContent}
    </button>
  );
}

function UserAvatar({ compact = false }) {
  const { user } = useAuth();

  return (
    <div
      className={`rounded-full bg-[#C9A227] flex items-center justify-center text-xs font-bold text-[#0B1120] ${
        compact ? "h-8 w-8" : "h-8 w-8"
      }`}
    >
      {getUserInitials(user?.fullName)}
    </div>
  );
}

function DashSideBar({
  sidebarCollapsed,
  sidebarOpen,
  currentCompany,
  toggleCollapse,
  toggleSidebar,
  setSidebarOpen,
}) {
  const { user, signOut } = useAuth();

  const activeCompany = currentCompany || DEFAULT_COMPANY;
  const isClientUser = isClientAccount(user);
  const isSalesAgentUser = isSalesAgent(user);
  const canAccessUserAdministration = !isClientUser && hasSystemAccess(user);

  const handleCloseMobileSidebar = () => {
    setSidebarOpen?.(false);
  };

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside
        className={`hidden h-screen flex-shrink-0 flex-col overflow-hidden border-r border-[#2a3550] bg-[#141d2e] transition-all duration-300 lg:flex ${
          sidebarCollapsed ? "w-[64px]" : "w-64"
        }`}
      >
        <div
          className={`flex h-14 flex-shrink-0 items-center border-b border-[#2a3550] ${
            sidebarCollapsed
              ? "justify-center px-0"
              : "gap-3 px-4"
          }`}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#C9A227]">
            <img
              className="h-6 w-6 object-contain"
              src={GVLogo}
              alt="Grupo Víquez"
            />
          </div>

          {!sidebarCollapsed && (
            <span className="flex-1 whitespace-nowrap text-sm font-bold tracking-wider text-white">
              Grupo Víquez
            </span>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            className={`text-gray-400 transition-colors hover:text-white ${
              sidebarCollapsed
                ? "p-1"
                : "ml-auto rounded p-1 hover:bg-[#1c2538]"
            }`}
            title={
              sidebarCollapsed
                ? "Expandir menú"
                : "Colapsar menú"
            }
            aria-label={
              sidebarCollapsed
                ? "Expandir menú"
                : "Colapsar menú"
            }
          >
            {sidebarCollapsed ? (
              <RiArrowRightSLine size={18} />
            ) : (
              <RiArrowLeftSLine size={18} />
            )}
          </button>
        </div>

        <nav className="scrollbar-hidden flex-1 overflow-y-auto py-3">
          {!isClientUser && (
            <>
          {/* COMERCIAL */}
          {!sidebarCollapsed ? (
            <div className="px-4 pb-1 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                Comercial
              </span>
            </div>
          ) : (
            <div className="mx-3 my-1 border-t border-[#2a3550]" />
          )}

          <NavItem
            icon={<RiDashboardFill size={18} />}
            label="Dashboard"
            to="/dashboard"
            collapsed={sidebarCollapsed}
          />

          {/* Reportes: oculto del sidebar por pedido del usuario, ruta y componente intactos
          <NavItem
            icon={<RiBarChartFill size={18} />}
            label="Reportes"
            to="/reportes"
            collapsed={sidebarCollapsed}
          />
          */}

          {/* VENTAS */}
          {!sidebarCollapsed ? (
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                Ventas
              </span>
            </div>
          ) : (
            <div className="mx-3 my-1 border-t border-[#2a3550]" />
          )}

          <NavItem
            icon={<RiShoppingBagFill size={18} />}
            label="Catálogo"
            to="/catalogo"
            collapsed={sidebarCollapsed}
          />

          <NavItem
            icon={<RiGroupFill size={18} />}
            label="Clientes"
            to="/clientes"
            collapsed={sidebarCollapsed}
          />

          <NavItem
            icon={<RiMapPinLine size={18} />}
            label="Rutas de visita"
            to="/rutas-visita"
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
            label="Producción"
            to="/cotizaciones"
            collapsed={sidebarCollapsed}
          />

          {!isSalesAgentUser && (
            <>
              <NavItem
                icon={<RiStoreFill size={18} />}
                label="Ventas"
                to="/ventas"
                collapsed={sidebarCollapsed}
              />

              <NavItem
                icon={<RiFileListFill size={18} />}
                label="Ordenes de venta"
                to="/pedidos"
                collapsed={sidebarCollapsed}
              />
            </>
          )}

            </>
          )}
          {isClientUser && (
            <>
              {/* CLIENTE */}
              {!sidebarCollapsed ? (
                <div className="px-4 pb-1 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                    Mi cuenta
                  </span>
                </div>
              ) : (
                <div className="mx-3 my-1 border-t border-[#2a3550]" />
              )}

              <NavItem
                icon={<RiDashboardFill size={18} />}
                label="Mis pedidos"
                to="/mis-pedidos"
                collapsed={sidebarCollapsed}
              />

              <NavItem
                icon={<RiDashboardFill size={18} />}
                label="Mis cotizaciones"
                to="/mis-cotizaciones"
                collapsed={sidebarCollapsed}
              />

              <NavItem
                icon={<RiShoppingBagFill size={18} />}
                label="Catálogo"
                to="/cliente/catalogo"
                collapsed={sidebarCollapsed}
              />
            </>
          )}

          {!sidebarCollapsed ? (
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                Ayuda
              </span>
            </div>
          ) : (
            <div className="mx-3 my-1 border-t border-[#2a3550]" />
          )}

          <NavItem
            icon={<RiCustomerService2Fill size={18} />}
            label="Soporte TI"
            to="/tickets-ti"
            collapsed={sidebarCollapsed}
          />

          {canAccessUserAdministration && (
            <>
              {/* SISTEMA */}
              {!sidebarCollapsed ? (
                <div className="px-4 pb-1 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                    Sistema
                  </span>
                </div>
              ) : (
                <div className="mx-3 my-1 border-t border-[#2a3550]" />
              )}

              <NavItem
                icon={<RiSettings4Fill size={18} />}
                label="Administración de Usuarios"
                to="/admin/usuarios"
                collapsed={sidebarCollapsed}
              />
            </>
          )}
        </nav>

        <div
          className={`flex-shrink-0 border-t border-[#2a3550] ${
            sidebarCollapsed
              ? "flex flex-col items-center gap-2 py-3"
              : "p-4"
          }`}
        >
          {sidebarCollapsed ? (
            <>
              <UserAvatar compact />

              <button
                type="button"
                onClick={signOut}
                className="text-gray-400 transition-colors hover:text-red-400"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <RiLogoutBoxLine size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3">
                <UserAvatar />

                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {user?.fullName || "Usuario"}
                  </div>

                  <div className="truncate text-xs text-gray-400">
                    {user?.department?.name || "Sin departamento"}
                    {user?.role?.name ? ` - ${user.role.name}` : ""}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-red-400"
              >
                <RiLogoutBoxLine size={16} />
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Sidebar para tablet y móvil */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-[#2a3550] bg-[#141d2e] shadow-2xl lg:hidden">
          <div className="flex h-14 items-center gap-3 border-b border-[#2a3550] px-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#C9A227]">
              <img
                className="h-6 w-6 object-contain"
                src={GVLogo}
                alt="Grupo Víquez"
              />
            </div>

            <span className="text-sm font-bold tracking-wider text-white">
              Grupo Víquez
            </span>

            <button
              type="button"
              onClick={toggleSidebar}
              className="ml-auto text-gray-400 transition-colors hover:text-white"
              aria-label="Cerrar menú lateral"
            >
              <RiArrowLeftSLine size={20} />
            </button>
          </div>

          <div className="border-b border-[#2a3550] px-4 py-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">
              Vista activa
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-200">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    activeCompany.color || DEFAULT_COMPANY.color,
                }}
              />

              <span className="truncate">
                {activeCompany.name || DEFAULT_COMPANY.name}
              </span>
            </div>
          </div>

          <nav className="scrollbar-hidden flex-1 overflow-y-auto py-3">
            {!isClientUser && (
              <>
            {/* COMERCIAL */}
            <div className="px-4 pb-1 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                Comercial
              </span>
            </div>

            <NavItem
              icon={<RiDashboardFill size={18} />}
              label="Dashboard"
              to="/dashboard"
              collapsed={false}
            />

            {/* Reportes: oculto del sidebar por pedido del usuario, ruta y componente intactos
            <NavItem
              icon={<RiBarChartFill size={18} />}
              label="Reportes"
              to="/reportes"
              collapsed={false}
            />
            */}

            {/* VENTAS */}
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                Ventas
              </span>
            </div>

            <NavItem
              icon={<RiShoppingBagFill size={18} />}
              label="Catálogo"
              to="/catalogo"
              collapsed={false}
            />

            <NavItem
              icon={<RiGroupFill size={18} />}
              label="Clientes"
              to="/clientes"
              collapsed={false}
            />

            <NavItem
              icon={<RiMapPinLine size={18} />}
              label="Rutas de visita"
              to="/rutas-visita"
              collapsed={false}
            />

            <NavItem
              icon={<RiUserFill size={18} />}
              label="Agentes"
              to="/agentes"
              collapsed={false}
            />

            <NavItem
              icon={<RiClipboardFill size={18} />}
              label="Producción"
              to="/cotizaciones"
              collapsed={false}
            />

            {!isSalesAgentUser && (
              <>
                <NavItem
                  icon={<RiStoreFill size={18} />}
                  label="Ventas"
                  to="/ventas"
                  collapsed={false}
                />

                <NavItem
                  icon={<RiFileListFill size={18} />}
                  label="Ordenes de venta"
                  to="/pedidos"
                  collapsed={false}
                />
              </>
            )}

              </>
            )}
            {isClientUser && (
              <>
                {/* CLIENTE */}
                <div className="px-4 pb-1 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                    Mi cuenta
                  </span>
                </div>

                <NavItem
                  icon={<RiDashboardFill size={18} />}
                  label="Mis pedidos"
                  to="/mis-pedidos"
                  collapsed={false}
                  onNavigate={handleCloseMobileSidebar}
                />

                <NavItem
                  icon={<RiDashboardFill size={18} />}
                  label="Mis cotizaciones"
                  to="/mis-cotizaciones"
                  collapsed={false}
                  onNavigate={handleCloseMobileSidebar}
                />

                <NavItem
                  icon={<RiShoppingBagFill size={18} />}
                  label="Catálogo"
                  to="/cliente/catalogo"
                  collapsed={false}
                  onNavigate={handleCloseMobileSidebar}
                />
              </>
            )}
            <div className="px-4 pb-1 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                Ayuda
              </span>
            </div>

            <NavItem
              icon={<RiCustomerService2Fill size={18} />}
              label="Soporte TI"
              to="/tickets-ti"
              collapsed={false}
              onNavigate={handleCloseMobileSidebar}
            />

            {canAccessUserAdministration && (
              <>
                {/* SISTEMA */}
                <div className="px-4 pb-1 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]/70">
                    Sistema
                  </span>
                </div>

                <NavItem
                  icon={<RiSettings4Fill size={18} />}
                  label="Administración de Usuarios"
                  to="/admin/usuarios"
                  collapsed={false}
                />
              </>
            )}
          </nav>

          <div className="border-t border-[#2a3550] p-4">
            <div className="mb-3 flex items-center gap-3">
              <UserAvatar />

              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">
                  {user?.fullName || "Usuario"}
                </div>

                <div className="truncate text-xs text-gray-400">
                  {user?.department?.name || "Sin departamento"}
                  {user?.role?.name ? ` - ${user.role.name}` : ""}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-red-400"
            >
              <RiLogoutBoxLine size={16} />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* Fondo al abrir menú en tablet o móvil */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleCloseMobileSidebar}
          aria-label="Cerrar menú lateral"
        />
      )}
    </>
  );
}

export default DashSideBar;
