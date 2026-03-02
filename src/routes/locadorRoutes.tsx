import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";

const LocadorDashboard = lazy(() => import("@/pages/locador/Dashboard"));
const LocadorVehicles = lazy(() => import("@/pages/locador/Vehicles"));
const LocadorDrivers = lazy(() => import("@/pages/locador/Drivers"));
const LocadorPayments = lazy(() => import("@/pages/locador/Payments"));
const LocadorMaintenance = lazy(() => import("@/pages/locador/Maintenance"));
const LocadorMileage = lazy(() => import("@/pages/locador/Mileage"));
const LocadorAlerts = lazy(() => import("@/pages/locador/Alerts"));
const LocadorContracts = lazy(() => import("@/pages/locador/Contracts"));
const LocadorDocuments = lazy(() => import("@/pages/locador/Documents"));
const LocadorDocumentRequests = lazy(() => import("@/pages/locador/DocumentRequests"));
const LocadorReports = lazy(() => import("@/pages/locador/Reports"));
const LocadorSettings = lazy(() => import("@/pages/locador/Settings"));
const LocadorInspections = lazy(() => import("@/pages/locador/Inspections"));
const LocadorAuditLogs = lazy(() => import("@/pages/locador/AuditLogs"));
const LocadorNotifications = lazy(() => import("@/pages/locador/Notifications"));

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
    {children}
  </Suspense>
);

const locadorRoute = (path: string, Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={['locador']}>
        <RouteErrorBoundary><Lazy><Component /></Lazy></RouteErrorBoundary>
      </ProtectedRoute>
    }
  />
);

export const locadorRoutes = (
  <>
    {locadorRoute("/locador", LocadorDashboard)}
    {locadorRoute("/locador/veiculos", LocadorVehicles)}
    {locadorRoute("/locador/motoristas", LocadorDrivers)}
    {locadorRoute("/locador/pagamentos", LocadorPayments)}
    {locadorRoute("/locador/manutencao", LocadorMaintenance)}
    {locadorRoute("/locador/quilometragem", LocadorMileage)}
    {locadorRoute("/locador/alertas", LocadorAlerts)}
    {locadorRoute("/locador/contratos", LocadorContracts)}
    {locadorRoute("/locador/vistorias", LocadorInspections)}
    {locadorRoute("/locador/documentos", LocadorDocuments)}
    {locadorRoute("/locador/solicitacoes", LocadorDocumentRequests)}
    {locadorRoute("/locador/relatorios", LocadorReports)}
    {locadorRoute("/locador/configuracoes", LocadorSettings)}
    {locadorRoute("/locador/auditoria", LocadorAuditLogs)}
    {locadorRoute("/locador/notificacoes", LocadorNotifications)}
  </>
);
