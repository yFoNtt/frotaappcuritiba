import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { LazyFallback as Lazy } from "@/components/LazyFallback";

const MotoristaDashboard = lazy(() => import("@/pages/motorista/Dashboard"));
const MotoristaVehicle = lazy(() => import("@/pages/motorista/Vehicle"));
const MotoristaPagamentos = lazy(() => import("@/pages/motorista/Payments"));
const MotoristaDocuments = lazy(() => import("@/pages/motorista/Documents"));
const MotoristaHistorico = lazy(() => import("@/pages/motorista/History"));
const MotoristaSettings = lazy(() => import("@/pages/motorista/Settings"));
const MotoristaMessages = lazy(() => import("@/pages/motorista/Messages"));

const motoristaRoute = (path: string, Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={['motorista']}>
        <RouteErrorBoundary><Lazy><Component /></Lazy></RouteErrorBoundary>
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
    {motoristaRoute("/motorista/mensagens", MotoristaMessages)}
  </>
);
