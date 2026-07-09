import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Catalog from "./pages/Catalog";
import ClientCatalog from "./pages/ClientCatalog";
import AdminConfig from "./pages/adminConfig";
import Agents from "./pages/Agents";
import Quotations from "./pages/Quotations";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import MyOrders from "./pages/MyOrders";
import MyQuotations from "./pages/MyQuotations";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminUsersRoute from "./components/AdminUsersRoute.jsx";
import MainLayout from "./components/layouts/MainLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pantallas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
        
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
            path="/cliente/catalogo"
            element={
              <ProtectedRoute>
                <ClientCatalog />
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
            path="/admin/usuarios"
            element={
              <ProtectedRoute>
                <AdminUsersRoute>
                  <AdminConfig />
                </AdminUsersRoute>
              </ProtectedRoute>
            }
          />

          {/* Rutas de pruebas sin ProtectedRoute */}
          <Route path="/catalogo-dev" element={<Catalog />} />
          <Route
            path="/cliente/catalogo-dev"
            element={<ClientCatalog />}
          />
          <Route path="/clientes-dev" element={<Clients />} />
          <Route path="/agentes-dev" element={<Agents />} />
          <Route path="/cotizaciones-dev" element={<Quotations />} />
          <Route path="/ventas-dev" element={<Sales />} />
          <Route path="/pedidos-dev" element={<Orders />} />
          <Route path="/reportes-dev" element={<Reports />} />
          <Route path="/mis-pedidos-dev" element={<MyOrders />} />
          <Route path="/mis-cotizaciones-dev" element={<MyQuotations />} />
          <Route path="/admin/usuarios-dev" element={<AdminConfig />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

