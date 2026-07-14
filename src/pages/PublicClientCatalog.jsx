import { Link } from "react-router-dom";

import ClientCatalog from "./ClientCatalog.jsx";
import { useAuth } from "../context/AuthContext.js";
import { isClientAccount } from "../utils/roles.js";
import logoImage from "../assets/images/0E7BFEE5-FB79-49F7-9E7D-DE47EBC12758.png";

export default function PublicClientCatalog() {
  const { isAuthenticated, user } = useAuth();
  const systemRoute = isClientAccount(user) ? "/mis-cotizaciones" : "/dashboard";

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0B1120] text-white">
      <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-[#2A3853] bg-[#141D2E] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logoImage}
            alt="Logo Grupo Víquez"
            className="h-9 w-9 flex-shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold sm:text-base">Grupo Víquez</p>
            <p className="truncate text-xs text-slate-400">Catálogo público de productos</p>
          </div>
        </div>

        <Link
          to={isAuthenticated ? systemRoute : "/"}
          className="flex-shrink-0 rounded-xl border border-[#D7A91D]/50 bg-[#D7A91D]/10 px-3 py-2 text-xs font-bold text-[#E9BC2D] transition hover:bg-[#D7A91D] hover:text-[#071426] sm:px-4 sm:text-sm"
        >
          {isAuthenticated ? "Volver al sistema" : "Iniciar sesión"}
        </Link>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <ClientCatalog />
      </main>
    </div>
  );
}
