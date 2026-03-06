import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { LazyFallback as Lazy } from "@/components/LazyFallback";

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminLocadores = lazy(() => import("@/pages/admin/Locadores"));
const AdminLocadorDetails = lazy(() => import("@/pages/admin/LocadorDetails"));
const AdminVehicles = lazy(() => import("@/pages/admin/Vehicles"));
const AdminPlans = lazy(() => import("@/pages/admin/Plans"));
const AdminMetrics = lazy(() => import("@/pages/admin/Metrics"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));

const adminRoute = (path: string, Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <RouteErrorBoundary><Lazy><Component /></Lazy></RouteErrorBoundary>
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
