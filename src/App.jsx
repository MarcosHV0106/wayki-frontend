import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MesaPanel from './pages/Mesa';
import Comandas from './pages/Comandas';
import ComandaPreparando from './pages/ComandaPreparando';
import ComandaOcupada from './pages/ComandaOcupada';
import PrivateRoute from './components/PrivateRoute';
import AdminPanel from './pages/AdminPanel';
import GestionPlatos from "./pages/GestionPlatos";
import { AnimatePresence } from "framer-motion";
import { Toaster } from 'sonner';

function App() {
  return (
    <AnimatePresence mode='wait'>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/mesas" element={<MesaPanel />} />
        
        <Route
          path="/mesas/:id"
          element={
            <PrivateRoute allowedRoles={["Mesero", "Administradora"]}>
              <ComandaPreparando />
            </PrivateRoute>
          }
        />

        <Route
          path="/comanda-ocupada/:idMesa"
          element={
            <PrivateRoute allowedRoles={["Mesero", "Administradora"]}>
              <ComandaOcupada />
            </PrivateRoute>
          }
        />

        <Route
          path="/comandas"
          element={
            <PrivateRoute allowedRoles={["Mesero", "Administradora"]}>
              <Comandas />
            </PrivateRoute>
          }
        />

        <Route
          path="/comandas/preparando/:id"
          element={
            <PrivateRoute allowedRoles={["Mesero", "Administradora"]}>
              <ComandaPreparando />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["Administradora"]}>
              <AdminPanel />
            </PrivateRoute>
          }
        />

        <Route path="/admin/gestion-platos" element={<GestionPlatos />} />

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </AnimatePresence>
  );
}

export default App;