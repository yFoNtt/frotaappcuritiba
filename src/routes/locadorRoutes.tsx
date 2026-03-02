import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";

import LocadorDashboard from "@/pages/locador/Dashboard";
import LocadorVehicles from "@/pages/locador/Vehicles";
import LocadorDrivers from "@/pages/locador/Drivers";
import LocadorPayments from "@/pages/locador/Payments";
import LocadorMaintenance from "@/pages/locador/Maintenance";
import LocadorMileage from "@/pages/locador/Mileage";
import LocadorAlerts from "@/pages/locador/Alerts";
import LocadorContracts from "@/pages/locador/Contracts";
import LocadorDocuments from "@/pages/locador/Documents";
import LocadorDocumentRequests from "@/pages/locador/DocumentRequests";
import LocadorReports from "@/pages/locador/Reports";
import LocadorSettings from "@/pages/locador/Settings";
import LocadorInspections from "@/pages/locador/Inspections";
import LocadorAuditLogs from "@/pages/locador/AuditLogs";
import LocadorNotifications from "@/pages/locador/Notifications";

const locadorRoute = (path: string, Component: React.ComponentType) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={['locador']}>
        <RouteErrorBoundary><Component /></RouteErrorBoundary>
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
