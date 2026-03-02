import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminLocadores from "@/pages/admin/Locadores";
import AdminLocadorDetails from "@/pages/admin/LocadorDetails";
import AdminVehicles from "@/pages/admin/Vehicles";
import AdminPlans from "@/pages/admin/Plans";
import AdminMetrics from "@/pages/admin/Metrics";
import AdminSettings from "@/pages/admin/Settings";
import AdminAuditLogs from "@/pages/admin/AuditLogs";

const adminRoute = (path: string, Component: React.ComponentType) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <RouteErrorBoundary><Component /></RouteErrorBoundary>
      </ProtectedRoute>
    }
  />
);

export const adminRoutes = (
  <>
    {adminRoute("/admin", AdminDashboard)}
    {adminRoute("/admin/usuarios", AdminUsers)}
    {adminRoute("/admin/locadores", AdminLocadores)}
    {adminRoute("/admin/locadores/:id", AdminLocadorDetails)}
    {adminRoute("/admin/veiculos", AdminVehicles)}
    {adminRoute("/admin/planos", AdminPlans)}
    {adminRoute("/admin/metricas", AdminMetrics)}
    {adminRoute("/admin/configuracoes", AdminSettings)}
    {adminRoute("/admin/auditoria", AdminAuditLogs)}
  </>
);
