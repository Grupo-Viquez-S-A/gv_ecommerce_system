import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import AdminConfig from "./pages/adminConfig";
import Agents from "./pages/Agents";
import Quotations from "./pages/Quotations";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import Agenda from "./pages/Agenda";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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
        <Route path="/clientes-dev" element={<Clients />} />
        <Route
          path="/agentes"
          element={
            <ProtectedRoute>
              <Agents />
            </ProtectedRoute>
          }
        />
        <Route path="/agentes-dev" element={<Agents />} />
        <Route
          path="/cotizaciones"
          element={
            <ProtectedRoute>
              <Quotations />
            </ProtectedRoute>
          }
        />
        <Route path="/cotizaciones-dev" element={<Quotations />} />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route path="/ventas-dev" element={<Sales />} />
        <Route
          path="/pedidos"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route path="/pedidos-dev" element={<Orders />} />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          }
        />
        <Route path="/agenda-dev" element={<Agenda />} />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute>
              <AdminConfig />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
