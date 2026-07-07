import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { canManageSystemUsers } from "../utils/adminAccess.js";

export default function AdminUsersRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">
            Validando permisos...
          </span>
        </div>
      </div>
    );
  }

  if (!canManageSystemUsers(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
