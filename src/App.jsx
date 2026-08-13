import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import VisitRoutes from "./pages/VisitRoutes";
import Catalog from "./pages/Catalog";
import PublicClientCatalog from "./pages/PublicClientCatalog";
import AdminConfig from "./pages/adminConfig";
import Agents from "./pages/Agents";
import Quotations from "./pages/Quotations";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import MyOrders from "./pages/MyOrders";
import MyQuotations from "./pages/MyQuotations";
import ITSupportTickets from "./pages/ITSupportTickets";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminUsersRoute from "./components/AdminUsersRoute.jsx";
import MainLayout from "./components/layouts/MainLayout.jsx";

const routerBaseName =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <BrowserRouter basename={routerBaseName}>
      <Routes>
        {/* Pantallas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
        <Route path="/cliente/catalogo" element={<PublicClientCatalog />} />
        
        {/* Todas las vistas internas usan el mismo sidebar y AppTopBar */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/catalogo"
            element={
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rutas-visita"
            element={
              <ProtectedRoute>
                <VisitRoutes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agentes"
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cotizaciones"
            element={
              <ProtectedRoute>
                <Quotations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ventas"
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pedidos"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mis-cotizaciones"
            element={
              <ProtectedRoute>
                <MyQuotations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets-ti"
            element={
              <ProtectedRoute>
                <ITSupportTickets />
              </ProtectedRoute>
            }
          />

          <Route
            path="/soporte-ti"
            element={
              <ProtectedRoute>
                <ITSupportTickets />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute>
                <AdminUsersRoute>
                  <AdminConfig />
                </AdminUsersRoute>
              </ProtectedRoute>
            }
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

