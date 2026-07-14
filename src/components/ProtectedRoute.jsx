import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { isClientAccount, hasSystemAccess } from "../utils/roles.js";

const CLIENT_ALLOWED_ROUTES = [
  "/mis-pedidos",
  "/mis-cotizaciones",
  "/cliente/catalogo",
  "/tickets-ti",
  "/soporte-ti",
];

const SYSTEM_ONLY_ROUTES = ["/admin/usuarios"];

function isSystemOnlyRoute(pathname) {
  return SYSTEM_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAllowedClientRoute(pathname) {
  return CLIENT_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, loading, user, mustChangePassword } = useAuth();

  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Cargando sesión...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/restablecer-contrasena" replace />;
  }

  if (isClientAccount(user) && !isAllowedClientRoute(location.pathname)) {
    return <Navigate to="/mis-pedidos" replace />;
  }

  if (
    !isClientAccount(user) &&
    isSystemOnlyRoute(location.pathname) &&
    !hasSystemAccess(user)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

