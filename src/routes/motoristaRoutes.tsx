import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";

import MotoristaDashboard from "@/pages/motorista/Dashboard";
import MotoristaVehicle from "@/pages/motorista/Vehicle";
import MotoristaPagamentos from "@/pages/motorista/Payments";
import MotoristaDocuments from "@/pages/motorista/Documents";
import MotoristaHistorico from "@/pages/motorista/History";
import MotoristaSettings from "@/pages/motorista/Settings";

const motoristaRoute = (path: string, Component: React.ComponentType) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={['motorista']}>
        <RouteErrorBoundary><Component /></RouteErrorBoundary>
      </ProtectedRoute>
    }
  />
);

export const motoristaRoutes = (
  <>
    {motoristaRoute("/motorista", MotoristaDashboard)}
    {motoristaRoute("/motorista/veiculo", MotoristaVehicle)}
    {motoristaRoute("/motorista/pagamentos", MotoristaPagamentos)}
    {motoristaRoute("/motorista/historico", MotoristaHistorico)}
    {motoristaRoute("/motorista/documentos", MotoristaDocuments)}
    {motoristaRoute("/motorista/configuracoes", MotoristaSettings)}
  </>
);
