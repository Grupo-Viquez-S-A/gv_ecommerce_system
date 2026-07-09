import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

const CLIENT_ALLOWED_ROUTES = [
  "/mis-pedidos",
  "/mis-cotizaciones",
  "/cliente/catalogo",
];

function isClientAccount(user) {
  const roleCode = String(user?.role?.code || "").trim().toLowerCase();
  const roleName = String(user?.role?.name || "").trim().toLowerCase();

  return roleCode === "client" || roleName === "cliente";
}

function isAllowedClientRoute(pathname) {
  return CLIENT_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0B1120] flex items-center justify-center">
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

  if (isClientAccount(user) && !isAllowedClientRoute(location.pathname)) {
    return <Navigate to="/mis-pedidos" replace />;
  }

  return children;
}

export default ProtectedRoute;

