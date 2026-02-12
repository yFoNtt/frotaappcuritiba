import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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

// Motorista Dashboard Pages
import MotoristaDashboard from "./pages/motorista/Dashboard";
import MotoristaVehicle from "./pages/motorista/Vehicle";
import MotoristaPagamentos from "./pages/motorista/Payments";
import MotoristaDocuments from "./pages/motorista/Documents";
import MotoristaHistorico from "./pages/motorista/History";
import MotoristaSettings from "./pages/motorista/Settings";

const queryClient = new QueryClient();

const App = () => (
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
                <LocadorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/locador/veiculos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorVehicles />
              </ProtectedRoute>
            } />
            <Route path="/locador/motoristas" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorDrivers />
              </ProtectedRoute>
            } />
            <Route path="/locador/pagamentos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorPayments />
              </ProtectedRoute>
            } />
            <Route path="/locador/manutencao" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorMaintenance />
              </ProtectedRoute>
            } />
            <Route path="/locador/quilometragem" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorMileage />
              </ProtectedRoute>
            } />
            <Route path="/locador/alertas" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorAlerts />
              </ProtectedRoute>
            } />
            <Route path="/locador/contratos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorContracts />
              </ProtectedRoute>
            } />
            <Route path="/locador/vistorias" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorInspections />
              </ProtectedRoute>
            } />
            <Route path="/locador/documentos" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorDocuments />
              </ProtectedRoute>
            } />
            <Route path="/locador/solicitacoes" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorDocumentRequests />
              </ProtectedRoute>
            } />
            <Route path="/locador/relatorios" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorReports />
              </ProtectedRoute>
            } />
            <Route path="/locador/configuracoes" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorSettings />
              </ProtectedRoute>
            } />
            <Route path="/locador/auditoria" element={
              <ProtectedRoute allowedRoles={['locador']}>
                <LocadorAuditLogs />
              </ProtectedRoute>
            } />
            
            {/* Admin Dashboard Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/locadores" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLocadores />
              </ProtectedRoute>
            } />
            <Route path="/admin/locadores/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLocadorDetails />
              </ProtectedRoute>
            } />
            <Route path="/admin/veiculos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminVehicles />
              </ProtectedRoute>
            } />
            <Route path="/admin/planos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPlans />
              </ProtectedRoute>
            } />
            <Route path="/admin/metricas" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMetrics />
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracoes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } />

            {/* Motorista Dashboard Routes - Protected */}
            <Route path="/motorista" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <MotoristaDashboard />
              </ProtectedRoute>
            } />
            <Route path="/motorista/veiculo" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <MotoristaVehicle />
              </ProtectedRoute>
            } />
            <Route path="/motorista/pagamentos" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <MotoristaPagamentos />
              </ProtectedRoute>
            } />
            <Route path="/motorista/historico" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <MotoristaHistorico />
              </ProtectedRoute>
            } />
            <Route path="/motorista/documentos" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <MotoristaDocuments />
              </ProtectedRoute>
            } />
            <Route path="/motorista/configuracoes" element={
              <ProtectedRoute allowedRoles={['motorista']}>
                <MotoristaSettings />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
