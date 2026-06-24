import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0a0e1a] flex items-center justify-center">
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

  return children;
}

export default ProtectedRoute;
