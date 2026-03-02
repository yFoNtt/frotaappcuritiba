import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";

const MotoristaDashboard = lazy(() => import("@/pages/motorista/Dashboard"));
const MotoristaVehicle = lazy(() => import("@/pages/motorista/Vehicle"));
const MotoristaPagamentos = lazy(() => import("@/pages/motorista/Payments"));
const MotoristaDocuments = lazy(() => import("@/pages/motorista/Documents"));
const MotoristaHistorico = lazy(() => import("@/pages/motorista/History"));
const MotoristaSettings = lazy(() => import("@/pages/motorista/Settings"));

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
    {children}
  </Suspense>
);

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
  </>
);
