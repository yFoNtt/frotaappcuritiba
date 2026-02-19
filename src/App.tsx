import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary, RouteErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import VehicleDetails from "./pages/VehicleDetails";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HowItWorks from "./pages/HowItWorks";
import ForRenters from "./pages/ForRenters";
import NotFound from "./pages/NotFound";

// Locador Dashboard Pages
import LocadorDashboard from "./pages/locador/Dashboard";
import LocadorVehicles from "./pages/locador/Vehicles";
import LocadorDrivers from "./pages/locador/Drivers";
import LocadorPayments from "./pages/locador/Payments";
import LocadorMaintenance from "./pages/locador/Maintenance";
import LocadorMileage from "./pages/locador/Mileage";
import LocadorAlerts from "./pages/locador/Alerts";
import LocadorContracts from "./pages/locador/Contracts";
import LocadorDocuments from "./pages/locador/Documents";
import LocadorDocumentRequests from "./pages/locador/DocumentRequests";
import LocadorReports from "./pages/locador/Reports";
import LocadorSettings from "./pages/locador/Settings";
import LocadorInspections from "./pages/locador/Inspections";
import LocadorAuditLogs from "./pages/locador/AuditLogs";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminLocadores from "./pages/admin/Locadores";
import AdminVehicles from "./pages/admin/Vehicles";
import AdminPlans from "./pages/admin/Plans";
import AdminMetrics from "./pages/admin/Metrics";
import AdminSettings from "./pages/admin/Settings";
import AdminLocadorDetails from "./pages/admin/LocadorDetails";
import AdminAuditLogs from "./pages/admin/AuditLogs";

// Motorista Dashboard Pages
import MotoristaDashboard from "./pages/motorista/Dashboard";
import MotoristaVehicle from "./pages/motorista/Vehicle";
import MotoristaPagamentos from "./pages/motorista/Payments";
import MotoristaDocuments from "./pages/motorista/Documents";
import MotoristaHistorico from "./pages/motorista/History";
import MotoristaSettings from "./pages/motorista/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      onError: (error) => {
        console.error('[Mutation Error]', error);
        toast.error('Ocorreu um erro ao salvar os dados. Tente novamente.');
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/veiculos" element={<Vehicles />} />
            <Route path="/veiculos/:id" element={<VehicleDetails />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/cadastro" element={<Auth />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/como-funciona" element={<HowItWorks />} />
            <Route path="/para-locadores" element={<ForRenters />} />
            
            {/* Locador Dashboard Routes - Protected */}
            <Route path="/locador" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorDashboard /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/veiculos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorVehicles /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/motoristas" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorDrivers /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/pagamentos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorPayments /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/manutencao" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorMaintenance /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/quilometragem" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorMileage /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/alertas" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorAlerts /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/contratos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorContracts /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/vistorias" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorInspections /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/documentos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorDocuments /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/solicitacoes" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorDocumentRequests /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/relatorios" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorReports /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/configuracoes" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorSettings /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/locador/auditoria" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <RouteErrorBoundary><LocadorAuditLogs /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Admin Dashboard Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminDashboard /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminUsers /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/locadores" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminLocadores /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/locadores/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminLocadorDetails /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/veiculos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminVehicles /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/planos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminPlans /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/metricas" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminMetrics /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracoes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminSettings /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/auditoria" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RouteErrorBoundary><AdminAuditLogs /></RouteErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Motorista Dashboard Routes - Protected */}
            <Route path="/motorista" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <RouteErrorBoundary><MotoristaDashboard /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motorista/veiculo" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <RouteErrorBoundary><MotoristaVehicle /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motorista/pagamentos" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <RouteErrorBoundary><MotoristaPagamentos /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motorista/historico" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <RouteErrorBoundary><MotoristaHistorico /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motorista/documentos" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <RouteErrorBoundary><MotoristaDocuments /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motorista/configuracoes" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <RouteErrorBoundary><MotoristaSettings /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
